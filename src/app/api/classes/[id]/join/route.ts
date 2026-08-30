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
    const userSession = await getSession();
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

    // 2. If not found by ObjectId, search by meetingId or livekitRoomId matching this class level
    if (!liveClass) {
      liveClass = await LiveSession.findOne({
        $or: [{ meetingId: id }, { livekitRoomId: id }],
        ...(userSession.role === "STUDENT" ? { classLevel: studentClass } : {}),
      })
        .populate("batchId")
        .populate("teacherId", "name email avatarUrl");
    }

    // 3. If still not found, handle slug/room alias by creating or linking today's live session
    if (!liveClass) {
      const now = new Date();
      const todayDateStr = now.toISOString().split("T")[0];

      let subjectName = "General Live Session";
      if (id.toLowerCase().includes("math")) subjectName = "Mathematics";
      else if (id.toLowerCase().includes("science")) subjectName = "Science";
      else if (id.toLowerCase().includes("english")) subjectName = "English";
      else if (id.toLowerCase().includes("social")) subjectName = "Social Science";
      else if (id.toLowerCase().includes("revision")) subjectName = "Revision & Doubts";

      // Look for existing session today with this subject and class level
      liveClass = await LiveSession.findOne({
        date: todayDateStr,
        subject: subjectName,
        classLevel: studentClass,
      })
        .populate("batchId")
        .populate("teacherId", "name email avatarUrl");

      if (!liveClass) {
        const teacherUser = await User.findOne({ role: "TEACHER" }).lean();
        const newSession = await LiveSession.create({
          title: `${studentClass} ${subjectName} Live Class`,
          topic: `${subjectName} Daily Lecture & Interactive Problem Solving`,
          subject: subjectName,
          classLevel: studentClass,
          batchId: studentProfile?.batchId?._id || studentProfile?.batchId,
          teacherId: teacherUser?._id || userSession.userId,
          date: todayDateStr,
          startTime: (studentProfile?.batchId as any)?.startTime || "19:00",
          endTime: (studentProfile?.batchId as any)?.endTime || "20:00",
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

    if (liveClass.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This class has been cancelled by the teacher." },
        { status: 400 }
      );
    }

    const teacherObj = liveClass.teacherId as any;
    const isTeacher =
      userSession.role === "TEACHER" &&
      teacherObj &&
      (teacherObj._id?.toString() === userSession.userId ||
        teacherObj.id?.toString() === userSession.userId ||
        teacherObj.toString() === userSession.userId);
    const isAdmin = userSession.role === "ADMIN";

    // 4. STUDENT 5-MINUTE EARLY JOIN & AUTHORIZATION VALIDATION
    if (userSession.role === "STUDENT") {
      if (liveClass.status === "DRAFT") {
        return NextResponse.json(
          { error: "This class is currently in draft and not yet available to students." },
          { status: 403 }
        );
      }

      // Check class level if specified (and if it wasn't opened via generic room slug)
      if (
        mongoose.Types.ObjectId.isValid(id) &&
        liveClass.classLevel &&
        studentProfile?.currentClass &&
        studentProfile.currentClass !== liveClass.classLevel
      ) {
        return NextResponse.json(
          {
            error: `Class Access Denied: This session is reserved for ${liveClass.classLevel}. You are enrolled in ${studentProfile.currentClass}.`,
          },
          { status: 403 }
        );
      }

      // Check 5-minute early window & session timing
      const now = new Date();
      let canEnterEarly = true;

      if (liveClass.startTime && liveClass.date) {
        const [startH, startM] = liveClass.startTime.split(":").map(Number);
        const classDate = new Date(liveClass.date);
        const scheduledStartDate = new Date(classDate);
        scheduledStartDate.setHours(startH, startM, 0, 0);

        // 5 minutes before scheduled start time
        const fiveMinsBefore = new Date(scheduledStartDate.getTime() - 5 * 60 * 1000);

        // End time
        const [endH, endM] = (liveClass.endTime || "23:59").split(":").map(Number);
        const scheduledEndDate = new Date(classDate);
        scheduledEndDate.setHours(endH, endM + (liveClass.gracePeriodMinutes || 30), 0, 0);

        // If today and within or after the 5-min mark, allow joining
        if (now < fiveMinsBefore && liveClass.status !== "LIVE") {
          canEnterEarly = false;
        }
      }

      if (!canEnterEarly && liveClass.status !== "LIVE") {
        return NextResponse.json(
          {
            error: `Classroom opens 5 minutes before scheduled start time (${liveClass.startTime}). Please join 5 mins before.`,
            scheduledStartTime: liveClass.startTime,
          },
          { status: 400 }
        );
      }

      if (liveClass.status === "COMPLETED") {
        return NextResponse.json(
          {
            error: "This class session has already concluded. You can review the recording and study materials.",
            completed: true,
          },
          { status: 400 }
        );
      }
    }

    // If teacher joins and session was SCHEDULED/PUBLISHED, update to LIVE
    if ((isTeacher || isAdmin) && (liveClass.status === "PUBLISHED" || liveClass.status === "SCHEDULED")) {
      liveClass.status = "LIVE";
      if (!liveClass.actualStartTime) {
        liveClass.actualStartTime = new Date();
      }
      await liveClass.save();
    }

    const roomName = liveClass.meetingId || liveClass.livekitRoomId || `ACUITY-CLASS-${liveClass._id}`;
    const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";

    await recordAuditLog({
      actorId: userSession.userId,
      action: "CLASS_ROOM_ENTERED",
      entityType: "LIVE_SESSION",
      entityId: liveClass._id.toString(),
      details: { role: userSession.role, roomName },
    });

    return NextResponse.json({
      success: true,
      roomName,
      meetingId: roomName,
      jitsiDomain,
      user: {
        id: userSession.userId,
        name: userSession.name,
        email: userSession.email,
        role: userSession.role,
        isTeacher: Boolean(isTeacher || isAdmin),
      },
      class: {
        id: liveClass._id,
        title: liveClass.title,
        subject: liveClass.subject,
        topic: liveClass.topic,
        description: liveClass.description,
        classLevel: liveClass.classLevel,
        date: liveClass.date,
        startTime: liveClass.startTime,
        endTime: liveClass.endTime,
        status: liveClass.status,
        teacher: liveClass.teacherId,
        materials: liveClass.materials,
        gracePeriodMinutes: liveClass.gracePeriodMinutes,
        attendanceThresholdPercent: liveClass.attendanceThresholdPercent || 75,
      },
    });
  } catch (error: any) {
    console.error("POST /api/classes/[id]/join error:", error);
    return NextResponse.json({ error: error.message || "Failed to enter classroom." }, { status: 500 });
  }
}
