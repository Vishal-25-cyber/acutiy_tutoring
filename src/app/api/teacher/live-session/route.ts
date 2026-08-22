import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import Notification from "@/models/Notification";
import StaffAttendance from "@/models/StaffAttendance";
import { liveClassCreateSchema } from "@/lib/validations/auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const sessions = await LiveSession.find({ teacherId: session.userId })
      .populate("batchId")
      .sort({ date: -1, startTime: 1 });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Get Live Sessions Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = liveClassCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;
    await connectToDatabase();

    const roomId = `acuity-${data.classLevel.toLowerCase().replace(" ", "-")}-${Date.now()}`;

    const newSession = await LiveSession.create({
      title: data.title,
      subject: data.subject,
      classLevel: data.classLevel,
      batchId: data.batchId,
      teacherId: session.userId,
      topic: data.topic,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      gracePeriodMinutes: data.gracePeriodMinutes || 5,
      livekitRoomId: roomId,
      status: "SCHEDULED",
    });

    // Notify all eligible students in that class & batch
    const eligibleStudents = await StudentProfile.find({
      currentClass: data.classLevel,
      batchId: data.batchId,
    });

    if (eligibleStudents.length > 0) {
      const notificationDocs = eligibleStudents.map((st) => ({
        userId: st.userId,
        title: `New Live Class Scheduled: ${data.subject}`,
        message: `Topic: ${data.topic} on ${data.date} at ${data.startTime}. Be ready on time!`,
        type: "CLASS_REMINDER",
        linkUrl: `/student/classes`,
      }));
      await Notification.insertMany(notificationDocs);
    }

    await recordAuditLog({
      actorId: session.userId,
      action: "LIVE_CLASS_CREATED",
      entityType: "LIVE_SESSION",
      entityId: newSession._id.toString(),
      details: { classLevel: data.classLevel, topic: data.topic, eligibleStudentsCount: eligibleStudents.length },
    });

    return NextResponse.json({
      success: true,
      message: `Live class created successfully! ${eligibleStudents.length} eligible students have been notified.`,
      session: newSession,
    });
  } catch (error: any) {
    console.error("Create Live Session Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, action, allowLateJoin } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const liveSession = await LiveSession.findById(sessionId);
    if (!liveSession) {
      return NextResponse.json({ error: "Live session not found" }, { status: 404 });
    }

    // Toggle late join allowance manually
    if (typeof allowLateJoin === "boolean") {
      liveSession.allowLateJoinManually = allowLateJoin;
      await liveSession.save();
      return NextResponse.json({
        success: true,
        message: allowLateJoin ? "Late entry unlocked for students." : "Late entry locked according to grace period.",
        liveSession,
      });
    }

    // End class
    if (action === "END_CLASS") {
      liveSession.status = "COMPLETED";
      liveSession.actualEndTime = new Date();
      await liveSession.save();

      // Log teacher staff attendance
      const todayStr = new Date().toISOString().split("T")[0];
      await StaffAttendance.findOneAndUpdate(
        { teacherId: session.userId, date: todayStr },
        {
          $inc: { classesConducted: 1, workingHours: 1 },
          $setOnInsert: { loginTime: new Date(), status: "PRESENT" },
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, message: "Class ended successfully.", liveSession });
    }

    return NextResponse.json({ success: true, liveSession });
  } catch (error: any) {
    console.error("Patch Live Session Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
