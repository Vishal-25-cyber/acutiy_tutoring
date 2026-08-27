import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import Notification from "@/models/Notification";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const query: any = session.role === "TEACHER" ? { teacherId: session.userId } : {};

    const sessions = await LiveSession.find(query)
      .populate("batchId")
      .sort({ date: -1, startTime: 1 })
      .lean();

    return NextResponse.json({ sessions, classes: sessions });
  } catch (error: any) {
    console.error("GET /api/teacher/classes error:", error);
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
    const {
      title,
      subject,
      topic,
      description,
      classLevel = "Class 10",
      batchId,
      date,
      startTime,
      endTime,
      status = "PUBLISHED",
      materials = [],
      gracePeriodMinutes = 5,
      attendanceThresholdPercent = 75,
    } = body;

    if (!subject || !topic || !batchId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "All required fields must be filled." }, { status: 400 });
    }

    await connectToDatabase();

    const cleanSubject = subject.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanTopic = topic.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
    const uniqueMeetingId = `ACUITY-${cleanSubject || "CLASS"}-${cleanTopic || "SESSION"}-${Date.now()}`;
    const generatedTitle = title?.trim() || `${classLevel} ${subject} — ${topic}`;
    const normalizedStatus = status.toUpperCase() === "DRAFT" ? "DRAFT" : "PUBLISHED";

    const newSession = await LiveSession.create({
      title: generatedTitle,
      subject,
      topic,
      description: description || "",
      classLevel,
      batchId,
      teacherId: session.userId,
      date,
      startTime,
      endTime,
      meetingId: uniqueMeetingId,
      livekitRoomId: uniqueMeetingId,
      status: normalizedStatus,
      materials: Array.isArray(materials) ? materials : [],
      gracePeriodMinutes: Number(gracePeriodMinutes) || 5,
      attendanceThresholdPercent: Number(attendanceThresholdPercent) || 75,
    });

    let notifiedCount = 0;
    if (normalizedStatus === "PUBLISHED") {
      const eligibleStudents = await StudentProfile.find({
        batchId,
        ...(classLevel ? { currentClass: classLevel } : {}),
      });

      if (eligibleStudents.length > 0) {
        const notificationDocs = eligibleStudents.map((st) => ({
          userId: st.userId,
          title: `New Live Class: ${subject}`,
          message: `Topic: ${topic} on ${date} at ${startTime}.`,
          type: "CLASS_REMINDER",
          linkUrl: `/student/classes`,
          read: false,
        }));
        await Notification.insertMany(notificationDocs);
        notifiedCount = eligibleStudents.length;
      }
    }

    await recordAuditLog({
      actorId: session.userId,
      action: normalizedStatus === "DRAFT" ? "CLASS_DRAFTED" : "LIVE_CLASS_CREATED",
      entityType: "LIVE_SESSION",
      entityId: newSession._id.toString(),
      details: { classLevel, topic, notifiedCount },
    });

    return NextResponse.json({
      success: true,
      message:
        normalizedStatus === "DRAFT"
          ? "Class saved as draft successfully."
          : `Live class scheduled and published! ${notifiedCount} students notified.`,
      session: newSession,
      class: newSession,
    });
  } catch (error: any) {
    console.error("POST /api/teacher/classes error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
