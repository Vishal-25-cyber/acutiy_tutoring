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

    const profile: any = await StudentProfile.findOne({ userId: session.userId }).populate("batchId").lean();
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const now = new Date();
    const currentDayName = DAYS_OF_WEEK[now.getDay()];
    const todayDateStr = now.toISOString().split("T")[0];
    const currentHourMin = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // Auto-conclude any stale LIVE sessions where date < today or time is past endTime
    try {
      await LiveSession.updateMany(
        {
          status: "LIVE",
          $or: [
            { date: { $lt: todayDateStr } },
            { date: todayDateStr, endTime: { $lt: currentHourMin } },
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

    // Query published/scheduled/live/completed classes strictly for this student's batch or class level
    const sessionQuery: any = {
      status: { $in: ["PUBLISHED", "SCHEDULED", "LIVE", "COMPLETED"] },
      $or: [
        { classLevel: profile.currentClass },
        { batchId: batchId || null },
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

    const weeklySchedule = [
      {
        day: "Monday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Mathematics",
        topic: "Quadratic Equations — Discriminant & Real Roots Formula",
        faculty: "Dr. Sarah Jenkins",
        status: currentDayName === "Monday" && hasLiveClassNow ? "LIVE" : "SCHEDULED",
        roomId: activeLiveClass?.livekitRoomId || "acuity-maths-live",
      },
      {
        day: "Tuesday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Science",
        topic: "Light: Reflection & Refraction — Ray Diagrams Exemplar",
        faculty: "Prof. Rajesh Kumar",
        status: currentDayName === "Tuesday" && hasLiveClassNow ? "LIVE" : "SCHEDULED",
        roomId: activeLiveClass?.livekitRoomId || "acuity-science-live",
      },
      {
        day: "Wednesday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Mathematics",
        topic: "Arithmetic Progressions — nth Term & Sum of Terms",
        faculty: "Dr. Sarah Jenkins",
        status: currentDayName === "Wednesday" && hasLiveClassNow ? "LIVE" : "SCHEDULED",
        roomId: activeLiveClass?.livekitRoomId || "acuity-maths-live",
      },
      {
        day: "Thursday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "English",
        topic: "Analytical Paragraph & Advanced Grammar Clauses",
        faculty: "Ms. Anita Desai",
        status: currentDayName === "Thursday" && hasLiveClassNow ? "LIVE" : "SCHEDULED",
        roomId: activeLiveClass?.livekitRoomId || "acuity-english-live",
      },
      {
        day: "Friday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Social Science",
        topic: "Nationalism in India / Life Processes Core Concepts",
        faculty: "Prof. Rajesh Kumar",
        status: currentDayName === "Friday" && hasLiveClassNow ? "LIVE" : "SCHEDULED",
        roomId: activeLiveClass?.livekitRoomId || "acuity-social-live",
      },
      {
        day: "Saturday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Revision & Doubts",
        topic: "Weekly Test Analysis, Doubt Resolution & Worksheet Solving",
        faculty: "Senior Academic Faculty",
        status: currentDayName === "Saturday" && hasLiveClassNow ? "LIVE" : "SCHEDULED",
        roomId: activeLiveClass?.livekitRoomId || "acuity-revision-live",
      },
    ];

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
