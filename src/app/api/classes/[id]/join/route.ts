import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import Batch from "@/models/Batch";
import User from "@/models/User";
import { recordAuditLog } from "@/lib/audit";
import { getStudentFeeAccessStatus } from "@/lib/fee-guard";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = await getSession(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized. Please log in to join the class." }, { status: 401 });
    }

    // 0. Tuition Fee Gate: Student cannot join live classes if monthly tuition fee is unpaid
    if (userSession.role === "STUDENT") {
      const feeStatus = await getStudentFeeAccessStatus(userSession.userId);
      if (feeStatus.isLocked && feeStatus.unpaidFee) {
        return NextResponse.json(
          {
            error: `Class Access Denied: Monthly tuition fee for ${feeStatus.unpaidFee.billingMonth} (₹${feeStatus.unpaidFee.amount}) is unpaid. Please complete fee payment at /student/fees to enter live sessions.`,
            feeLocked: true,
            unpaidFee: feeStatus.unpaidFee,
          },
          { status: 403 }
        );
      }
    }

    const { id } = await params;
    await connectToDatabase();

    const studentProfile: any =
      userSession.role === "STUDENT"
        ? await StudentProfile.findOne({ userId: userSession.userId }).populate("batchId").lean()
        : null;
    const studentClass = studentProfile?.currentClass || "Class 10";

    let liveClass: any = null;

    // 1. Try finding by MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      liveClass = await LiveSession.findById(id)
        .populate("batchId")
        .populate("teacherId", "name email avatarUrl");
    }

    // 2. Search by meetingId or livekitRoomId
    if (!liveClass) {
      liveClass = await LiveSession.findOne({
        $or: [{ meetingId: id }, { livekitRoomId: id }],
      })
        .populate("batchId")
        .populate("teacherId", "name email avatarUrl");
    }

    // 3. Fallback search / creation for batch alias
    if (!liveClass) {
      const now = new Date();
      const todayDateStr = now.toISOString().split("T")[0];

      let subjectName = "Mathematics";
      if (id.toLowerCase().includes("math")) subjectName = "Mathematics";
      else if (id.toLowerCase().includes("science")) subjectName = "Science";
      else if (id.toLowerCase().includes("english")) subjectName = "English";
      else if (id.toLowerCase().includes("social")) subjectName = "Social Science";
      else if (id.toLowerCase().includes("revision")) subjectName = "Revision & Doubts";

      liveClass = await LiveSession.findOne({
        date: todayDateStr,
        classLevel: studentClass,
        status: { $ne: "CANCELLED" },
      })
        .populate("batchId")
        .populate("teacherId", "name email avatarUrl");

      if (!liveClass) {
        let fallbackBatch: any = await Batch.findOne().lean();
        if (!fallbackBatch) {
          fallbackBatch = await Batch.create({
            name: "7:00 PM – 8:00 PM (Batch 2)",
            startTime: "19:00",
            endTime: "20:00",
            capacity: 50,
            activeCount: 1,
            isLocked: false,
          });
        }
        const resolvedBatchId =
          studentProfile?.batchId?._id ||
          studentProfile?.batchId ||
          fallbackBatch?._id;

        const teacherUser = await User.findOne({ role: { $in: ["TEACHER", "ADMIN"] } }).lean();
        const newSession = await LiveSession.create({
          title: `${studentClass} ${subjectName} Live Class`,
          topic: `${subjectName} Daily Lecture & Interactive Problem Solving`,
          subject: subjectName,
          classLevel: studentClass,
          batchId: resolvedBatchId,
          teacherId: userSession.role === "TEACHER" ? userSession.userId : (teacherUser?._id || userSession.userId),
          date: todayDateStr,
          startTime: (studentProfile?.batchId as any)?.startTime || fallbackBatch?.startTime || "18:00",
          endTime: (studentProfile?.batchId as any)?.endTime || fallbackBatch?.endTime || "23:59",
          meetingId: id,
          livekitRoomId: id,
          status: "LIVE",
          actualStartTime: new Date(),
        });

        liveClass = await LiveSession.findById(newSession._id)
          .populate("batchId")
          .populate("teacherId", "name email avatarUrl");
      }
    }

    if (!liveClass) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }

    const isTeacher = userSession.role === "TEACHER" || userSession.role === "ADMIN";

    // Re-open if teacher or active session today
    if (liveClass.status === "COMPLETED") {
      if (isTeacher) {
        liveClass.status = "LIVE";
        liveClass.actualStartTime = new Date();
        await liveClass.save();
      } else {
        const now = new Date();
        const todayDateStr = now.toISOString().split("T")[0];
        if (liveClass.date === todayDateStr) {
          liveClass.status = "LIVE";
          await liveClass.save();
        }
      }
    }

    if (liveClass.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This class has been cancelled by the faculty instructor." },
        { status: 403 }
      );
    }

    // Teacher joining automatically starts live class
    if (isTeacher && (liveClass.status === "PUBLISHED" || liveClass.status === "SCHEDULED")) {
      liveClass.status = "LIVE";
      if (!liveClass.actualStartTime) {
        liveClass.actualStartTime = new Date();
      }
      await liveClass.save();
    }

    // Student early entry validation (IST-aware)
    if (userSession.role === "STUDENT" && liveClass.status !== "LIVE") {
      const now = new Date();
      const istFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });
      const istParts = istFormatter.formatToParts(now);
      const istHour = parseInt(istParts.find((p) => p.type === "hour")?.value || "0", 10);
      const istMinute = parseInt(istParts.find((p) => p.type === "minute")?.value || "0", 10);
      const currentMinutes = istHour * 60 + istMinute;

      const [sh = "0", sm = "0"] = (liveClass.startTime || "00:00").split(":");
      const [eh = "23", em = "59"] = (liveClass.endTime || "23:59").split(":");
      const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10);
      const endMin = parseInt(eh, 10) * 60 + parseInt(em, 10);

      // If scheduled time hasn't started yet and more than 15 mins away:
      if (currentMinutes < (startMin - 15)) {
        return NextResponse.json(
          {
            error: `Classroom opens 15 minutes before scheduled start time (${liveClass.startTime} IST). Please join during session window.`,
            scheduledStartTime: liveClass.startTime,
          },
          { status: 400 }
        );
      }
    }

    try {
      await recordAuditLog({
        actorId: userSession.userId,
        action: "CLASS_ENTERED",
        entityType: "LIVE_SESSION",
        entityId: liveClass._id.toString(),
        details: { role: userSession.role, name: userSession.name },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      class: {
        id: liveClass._id.toString(),
        title: liveClass.title,
        subject: liveClass.subject,
        topic: liveClass.topic,
        classLevel: liveClass.classLevel,
        startTime: liveClass.startTime,
        endTime: liveClass.endTime,
        meetingId: liveClass.meetingId,
        livekitRoomId: liveClass.livekitRoomId || liveClass.meetingId,
        status: liveClass.status,
        teacher: liveClass.teacherId,
        materials: liveClass.materials || [],
      },
      isAdmitted: (liveClass.admittedStudents || []).some(
        (s: any) => String(s.userId) === String(userSession.userId)
      ),
      user: {
        id: userSession.userId,
        name: userSession.name,
        email: userSession.email,
        role: userSession.role,
        isTeacher,
      },
    });
  } catch (error: any) {
    console.error("Join Class API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to join class." }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return POST(req, ctx);
}
