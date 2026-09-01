import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import Notification from "@/models/Notification";
import { recordAuditLog } from "@/lib/audit";
import { sortClassesByPriority } from "@/lib/class-timing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0];
    const currentHourMin = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // Auto-conclude any stale LIVE sessions where date < today or active for >60 mins
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await LiveSession.updateMany(
        {
          status: "LIVE",
          $or: [
            { actualStartTime: { $lt: oneHourAgo } },
            { updatedAt: { $lt: oneHourAgo } },
            { date: { $lt: todayDateStr } },
            { title: /General Live Session/i },
          ],
        },
        {
          $set: { status: "COMPLETED", actualEndTime: now },
        }
      );
    } catch (cleanErr) {
      console.warn("Auto-conclude stale classes error:", cleanErr);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const batchId = searchParams.get("batchId");

    const query: any = {};

    if (session.role === "TEACHER" || session.role === "ADMIN") {
      if (status) {
        if (status.toUpperCase() === "UPCOMING") {
          query.status = { $in: ["PUBLISHED", "SCHEDULED"] };
          query.date = { $gte: todayDateStr };
        } else {
          query.status = status.toUpperCase();
        }
      }
      if (batchId) query.batchId = batchId;
    } else if (session.role === "STUDENT") {
      const studentProfile = await StudentProfile.findOne({ userId: session.userId });
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
      }
      query.batchId = studentProfile.batchId;
      query.classLevel = studentProfile.currentClass;
      // Students should only see published, live or completed classes (never drafts)
      if (status) {
        if (status.toUpperCase() === "UPCOMING") {
          query.status = { $in: ["PUBLISHED", "SCHEDULED"] };
          query.date = { $gte: todayDateStr };
        } else {
          query.status = status.toUpperCase();
        }
      } else {
        query.status = { $in: ["PUBLISHED", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"] };
      }
    }

    if (date) {
      query.date = date;
    }

    const rawClasses = await LiveSession.find(query)
      .populate("batchId")
      .populate("teacherId", "name email avatarUrl")
      .lean();

    const classes = sortClassesByPriority(rawClasses as any[]);

    return NextResponse.json({ classes });
  } catch (error: any) {
    console.error("GET /api/classes error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch classes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
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
      isLiveNow = false,
      materials = [],
      gracePeriodMinutes = 10,
      attendanceThresholdPercent = 75,
    } = body;

    if (!title || !subject || !topic || !classLevel || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields (title, subject, topic, classLevel, date, startTime, endTime)." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let resolvedBatchId = batchId;
    if (!resolvedBatchId) {
      const Batch = (await import("@/models/Batch")).default;
      const fallbackBatch = await Batch.findOne({ classLevel });
      resolvedBatchId = fallbackBatch?._id;
    }

    // Generate unique livekit room id
    const cleanSubject = subject.toLowerCase().replace(/[^a-z0-9]/g, "");
    const randomHex = Math.random().toString(16).substring(2, 8);
    const livekitRoomId = `acuity-${cleanSubject}-${Date.now().toString().slice(-4)}-${randomHex}`;

    const newClass = await LiveSession.create({
      title,
      subject,
      topic,
      description,
      classLevel,
      batchId: resolvedBatchId,
      teacherId: session.userId,
      date,
      startTime,
      endTime,
      meetingId: livekitRoomId,
      livekitRoomId,
      status: isLiveNow ? "LIVE" : "PUBLISHED",
      materials,
      gracePeriodMinutes: Number(gracePeriodMinutes),
      attendanceThresholdPercent: Number(attendanceThresholdPercent),
      actualStartTime: isLiveNow ? new Date() : undefined,
    });

    // Notify enrolled students in this batch
    try {
      const eligibleStudents = await StudentProfile.find({
        $or: [
          { batchId: resolvedBatchId },
          { currentClass: classLevel },
        ],
      });

      if (eligibleStudents.length > 0) {
        const notifications = eligibleStudents.map((student) => ({
          userId: student.userId,
          title: isLiveNow ? `Class is Live: ${subject}` : `New Class Scheduled: ${subject}`,
          message: `${title} (${topic}) on ${date} from ${startTime} to ${endTime}.`,
          type: "CLASS_REMINDER",
          linkUrl: `/student/classes`,
          read: false,
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn("Notification creation failed:", notifErr);
    }

    await recordAuditLog({
      actorId: session.userId,
      action: "CLASS_CREATED",
      entityType: "LIVE_SESSION",
      entityId: newClass._id.toString(),
      details: { title, subject, date, startTime, status: newClass.status },
    });

    return NextResponse.json({
      success: true,
      message: "Class session created successfully.",
      class: newClass,
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/classes error:", error);
    return NextResponse.json({ error: error.message || "Failed to create class." }, { status: 500 });
  }
}
