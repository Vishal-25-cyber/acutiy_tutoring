import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import Batch from "@/models/Batch";
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

    // Auto-normalize any afternoon classes entered in 12h AM format (e.g. 03:51 -> 15:51)
    try {
      const activeSlotsToFix = await LiveSession.find({
        date: todayDateStr,
        status: { $in: ["PUBLISHED", "SCHEDULED", "UPCOMING"] },
        startTime: { $regex: /^0[1-6]:/ },
      });
      for (const slot of activeSlotsToFix) {
        if (slot.startTime) {
          const [sh, sm] = slot.startTime.split(":");
          const nh = parseInt(sh, 10);
          if (nh >= 1 && nh <= 6) {
            slot.startTime = `${String(nh + 12).padStart(2, "0")}:${sm || "00"}`;
          }
        }
        if (slot.endTime) {
          const [eh, em] = slot.endTime.split(":");
          const neh = parseInt(eh, 10);
          if (neh >= 1 && neh <= 6) {
            slot.endTime = `${String(neh + 12).padStart(2, "0")}:${em || "00"}`;
          }
        }
        await slot.save();
      }
    } catch (normErr) {
      console.warn("Time normalization error:", normErr);
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
      let studentProfile = await StudentProfile.findOne({ userId: session.userId });
      if (!studentProfile) {
        studentProfile = await StudentProfile.create({
          userId: session.userId,
          currentClass: "Class 10",
          board: "State Board",
          schoolName: "SSVS",
        });
      }
      const currentClass = studentProfile?.currentClass || "Class 10";
      const studentBatchId = studentProfile?.batchId;

      query.$or = [
        { status: "LIVE" },
        {
          $or: [
            { classLevel: currentClass },
            { classLevel: null },
            { classLevel: { $exists: false } },
            { batchId: studentBatchId || null },
            { batchId: null },
            { batchId: { $exists: false } },
            { date: todayDateStr },
          ],
        },
      ];

      // Students should see live, published, scheduled or completed classes
      if (status) {
        if (status.toUpperCase() === "UPCOMING") {
          query.status = { $in: ["PUBLISHED", "SCHEDULED", "LIVE"] };
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

    const sortedClasses = sortClassesByPriority(rawClasses as any[]);

    // Deduplicate identical class records
    const seenClassKeys = new Set<string>();
    const classes = sortedClasses.filter((c: any) => {
      const normSub = (c.subject || "").trim().toLowerCase();
      const normLvl = (c.classLevel || "").trim().toLowerCase();
      const normTop = (c.topic || "").trim().toLowerCase();
      const key = `${c.date}_${c.startTime}_${normSub}_${normLvl || normTop}`;
      if (seenClassKeys.has(key)) return false;
      seenClassKeys.add(key);
      return true;
    });

    return NextResponse.json({ classes });
  } catch (error: any) {
    console.error("GET /api/classes error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch classes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req).catch(() => null);
    let teacherUserId = session?.userId;
    if (!teacherUserId || teacherUserId === "staff") {
      const User = (await import("@/models/User")).default;
      const staffUser = await User.findOne({
        $or: [
          { role: { $in: ["TEACHER", "ADMIN"] }, status: "ACTIVE" },
          { email: "sudeepk.23cse@kongu.edu" },
          { name: /sudeep/i },
        ],
      });
      teacherUserId = staffUser?._id?.toString() || session?.userId || "staff";
    }

    const body = await req.json();
    const {
      title,
      subject,
      topic,
      description = "",
      classLevel,
      batchId,
      date,
      startTime,
      endTime,
      isLiveNow = false,
      status = "PUBLISHED",
      materials = [],
      gracePeriodMinutes = 10,
      attendanceThresholdPercent = 75,
    } = body;

    const resolvedTitle =
      (title || "").trim() ||
      `${classLevel || "Class 10"} ${subject || "Live Session"} — ${(topic || "").trim()}`;

    if (!subject || !topic || !classLevel || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields (subject, topic, classLevel, date, startTime, endTime)." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizeTutoringHour = (t: string) => {
      if (!t) return t;
      const parts = t.split(":");
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        if (h >= 1 && h <= 6) {
          return `${String(h + 12).padStart(2, "0")}:${parts[1]}`;
        }
      }
      return t;
    };

    const resolvedStartTime = normalizeTutoringHour(startTime);
    const resolvedEndTime = normalizeTutoringHour(endTime);

    let resolvedBatchId = batchId;
    if (!resolvedBatchId) {
      const Batch = (await import("@/models/Batch")).default;
      const fallbackBatch = await Batch.findOne({ classLevel });
      resolvedBatchId = fallbackBatch?._id;
    }

    // Deduplication check: prevent creating duplicate session if an identical class exists
    const existingSession = await LiveSession.findOne({
      date,
      startTime: { $in: [startTime, resolvedStartTime] },
      classLevel,
      subject,
      status: { $ne: "CANCELLED" },
    });

    if (existingSession) {
      existingSession.topic = topic.trim();
      existingSession.description = description.trim();
      existingSession.title = resolvedTitle;
      existingSession.startTime = resolvedStartTime;
      existingSession.endTime = resolvedEndTime;
      existingSession.status = isLiveNow ? "LIVE" : (status || existingSession.status);
      if (materials && Array.isArray(materials)) existingSession.materials = materials;
      if (resolvedBatchId) existingSession.batchId = resolvedBatchId;
      if (isLiveNow && !existingSession.actualStartTime) existingSession.actualStartTime = new Date();
      await existingSession.save();

      return NextResponse.json({
        success: true,
        message: "Class session updated successfully.",
        class: existingSession,
      }, { status: 200 });
    }

    // Generate unique livekit room id
    const cleanSubject = subject.toLowerCase().replace(/[^a-z0-9]/g, "");
    const randomHex = Math.random().toString(16).substring(2, 8);
    const livekitRoomId = `acuity-${cleanSubject}-${Date.now().toString().slice(-4)}-${randomHex}`;

    if (isLiveNow || status === "LIVE") {
      try {
        await LiveSession.updateMany(
          {
            teacherId: teacherUserId,
            status: "LIVE",
          },
          {
            $set: { status: "COMPLETED", actualEndTime: new Date() },
          }
        );
      } catch (cleanErr) {
        console.warn("Error concluding prior live classes:", cleanErr);
      }
    }

    const newClass = await LiveSession.create({
      title: resolvedTitle,
      subject,
      topic: topic.trim(),
      description: description.trim(),
      classLevel,
      batchId: resolvedBatchId,
      teacherId: teacherUserId,
      date,
      startTime: resolvedStartTime,
      endTime: resolvedEndTime,
      meetingId: livekitRoomId,
      livekitRoomId,
      status: isLiveNow ? "LIVE" : (status || "PUBLISHED"),
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
          message: `${resolvedTitle} on ${date} from ${startTime} to ${endTime}.`,
          type: "CLASS_REMINDER",
          linkUrl: `/student/classes`,
          read: false,
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn("Notification creation failed:", notifErr);
    }

    try {
      await recordAuditLog({
        actorId: teacherUserId,
        action: "CLASS_CREATED",
        entityType: "LIVE_SESSION",
        entityId: newClass._id.toString(),
        details: { title: resolvedTitle, subject, date, startTime, status: newClass.status },
      });
    } catch {}

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
