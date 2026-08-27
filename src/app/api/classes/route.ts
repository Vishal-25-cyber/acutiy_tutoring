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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const batchId = searchParams.get("batchId");

    const query: any = {};

    if (session.role === "TEACHER") {
      query.teacherId = session.userId;
      if (status) {
        query.status = status.toUpperCase();
      }
    } else if (session.role === "STUDENT") {
      const studentProfile = await StudentProfile.findOne({ userId: session.userId });
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
      }
      query.batchId = studentProfile.batchId;
      query.classLevel = studentProfile.currentClass;
      // Students should only see published, live or completed classes (never drafts)
      if (status) {
        query.status = status.toUpperCase();
      } else {
        query.status = { $in: ["PUBLISHED", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"] };
      }
    } else if (session.role === "ADMIN") {
      if (status) query.status = status.toUpperCase();
      if (batchId) query.batchId = batchId;
    }

    if (date) {
      query.date = date;
    }

    const classes = await LiveSession.find(query)
      .populate("batchId")
      .populate("teacherId", "name email avatarUrl")
      .sort({ date: -1, startTime: 1 })
      .lean();

    return NextResponse.json({ classes });
  } catch (error: any) {
    console.error("GET /api/classes error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch classes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Only staff can create classes." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      subject,
      topic,
      description,
      classLevel,
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
      return NextResponse.json(
        { error: "Subject, topic, batch, date, start time, and end time are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const cleanSubject = subject.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanTopic = topic.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
    const uniqueMeetingId = `ACUITY-${cleanSubject || "CLASS"}-${cleanTopic || "SESSION"}-${Date.now()}`;
    const generatedTitle = title?.trim() || `${classLevel || "Class 10"} ${subject} — ${topic}`;

    const normalizedStatus = status.toUpperCase() === "DRAFT" ? "DRAFT" : "PUBLISHED";

    const newClass = await LiveSession.create({
      title: generatedTitle,
      subject,
      topic,
      description: description || "",
      classLevel: classLevel || "Class 10",
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
        const notifications = eligibleStudents.map((student) => ({
          userId: student.userId,
          title: `New Class: ${subject} — ${topic}`,
          message: `${subject} class on ${topic} is scheduled for ${date} at ${startTime}.`,
          type: "CLASS_REMINDER",
          linkUrl: `/student/classes`,
          read: false,
        }));
        await Notification.insertMany(notifications);
        notifiedCount = eligibleStudents.length;
      }
    }

    await recordAuditLog({
      actorId: session.userId,
      action: normalizedStatus === "DRAFT" ? "CLASS_DRAFTED" : "CLASS_PUBLISHED",
      entityType: "LIVE_SESSION",
      entityId: newClass._id.toString(),
      details: { subject, topic, date, startTime, batchId, status: normalizedStatus, notifiedCount },
    });

    return NextResponse.json({
      success: true,
      message:
        normalizedStatus === "DRAFT"
          ? "Class saved as draft successfully."
          : `Class published successfully! ${notifiedCount} students notified.`,
      class: newClass,
    });
  } catch (error: any) {
    console.error("POST /api/classes error:", error);
    return NextResponse.json({ error: error.message || "Failed to create class" }, { status: 500 });
  }
}
