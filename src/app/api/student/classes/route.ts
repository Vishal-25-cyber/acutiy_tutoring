import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import LiveSession from "@/models/LiveSession";
import { getStudentFeeAccessStatus } from "@/lib/fee-guard";
import { sortClassesByPriority } from "@/lib/class-timing";

export const dynamic = "force-dynamic";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // 1. Fee Lock Enforcement: Student cannot access classes if monthly tuition is unpaid or awaiting admin approval
    const feeStatus = await getStudentFeeAccessStatus(session.userId);
    if (feeStatus.isLocked) {
      return NextResponse.json({
        locked: true,
        reason: feeStatus.reason,
        isUnderReview: feeStatus.isUnderReview,
        message: feeStatus.message,
        unpaidFee: feeStatus.unpaidFee,
        pendingVerification: feeStatus.pendingVerification,
        classes: [],
        todayClasses: [],
        weeklySchedule: [],
      });
    }

    let profile: any = await StudentProfile.findOne({ userId: session.userId }).populate("batchId").lean();
    if (!profile) {
      profile = await StudentProfile.create({
        userId: session.userId,
        currentClass: "Class 10",
        board: "State Board",
        schoolName: "SSVS",
      });
    }

    const now = new Date();
    const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Kolkata" });
    const currentDayName = dayFormatter.format(now);
    const todayDateStr = now.toISOString().split("T")[0];

    // Robust auto-cleanup: Any session that was live for >60 mins or from past days or generic session is auto-concluded
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

    const batchName = (profile.batchId as any)?.name || "7:00 PM – 8:00 PM";
    const batchStart = (profile.batchId as any)?.startTime || "19:00";
    const batchEnd = (profile.batchId as any)?.endTime || "20:00";
    const batchId = (profile.batchId as any)?._id || profile.batchId;

    // Query published/scheduled/live/completed classes for this student's grade/batch, or ANY class currently LIVE
    const sessionQuery: any = {
      $or: [
        { status: "LIVE" },
        {
          status: { $in: ["PUBLISHED", "SCHEDULED", "LIVE", "COMPLETED"] },
          $or: [
            { classLevel: profile.currentClass },
            { classLevel: null },
            { classLevel: { $exists: false } },
            { batchId: batchId || null },
            { batchId: null },
            { batchId: { $exists: false } },
            { date: todayDateStr },
          ],
        },
      ],
    };

    const rawClasses = await LiveSession.find(sessionQuery)
      .populate("teacherId", "name avatarUrl email phone")
      .populate("batchId")
      .sort({ date: 1, startTime: 1 })
      .lean();

    const dbClasses = sortClassesByPriority(rawClasses as any[]);

    const todayClasses = dbClasses.filter(
      (c: any) =>
        c.status === "LIVE" ||
        (c.date === todayDateStr && (c.status === "SCHEDULED" || c.status === "PUBLISHED"))
    );

    const hasLiveClassNow = dbClasses.some((c: any) => c.status === "LIVE");
    const activeLiveClass = dbClasses.find((c: any) => c.status === "LIVE");

    // Build real dynamic weekly schedule from actual database LiveSession records
    const weeklySchedule = dbClasses.map((c: any) => {
      let dayName = "Monday";
      if (c.date) {
        try {
          dayName = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Kolkata" }).format(new Date(c.date));
        } catch {}
      }
      return {
        _id: c._id?.toString(),
        day: dayName,
        date: c.date,
        time: c.startTime && c.endTime ? `${c.startTime} – ${c.endTime}` : batchName,
        startTime: c.startTime || batchStart,
        endTime: c.endTime || batchEnd,
        subject: c.subject || "Academic Live Session",
        topic: c.topic || c.title || "Live Class",
        faculty: (c.teacherId as any)?.name || "Assigned Faculty",
        status: c.status || "SCHEDULED",
        roomId: c.livekitRoomId || `mantif-session-${c._id}`,
        description: c.description || "",
      };
    });

    return NextResponse.json({
      classes: dbClasses,
      todayClasses,
      weeklySchedule,
      batch: profile.batchId,
      currentClass: profile.currentClass,
      board: profile.board || "CBSE",
      currentDay: currentDayName,
      isTrialActive: feeStatus.isTrialActive,
      trialHoursRemaining: feeStatus.trialHoursRemaining,
      trialExpiresAt: feeStatus.trialExpiresAt,
      feeStatus,
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("GET /api/student/classes error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch classes" }, { status: 500 });
  }
}
