import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import LiveSession from "@/models/LiveSession";
import { getStudentFeeAccessStatus } from "@/lib/fee-guard";
import { sortClassesByPriority } from "@/lib/class-timing";

export const dynamic = "force-dynamic";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET() {
  try {
    const session = await getSession();
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

    const batchName = (profile.batchId as any)?.name || "7:00 PM – 8:00 PM";
    const batchStart = (profile.batchId as any)?.startTime || "19:00";
    const batchEnd = (profile.batchId as any)?.endTime || "20:00";

    const batchId = (profile.batchId as any)?._id || profile.batchId;

    const todayDateStr = now.toISOString().split("T")[0];

    // Query published/scheduled/live/completed classes for this student's batch or class level
    const sessionQuery: any = {
      status: { $in: ["PUBLISHED", "SCHEDULED", "LIVE", "COMPLETED"] },
      $or: [
        { classLevel: profile.currentClass },
        { batchId: batchId || null },
        { status: "LIVE" },
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

    const weeklySchedule = [
      {
        day: "Monday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Mathematics",
        topic: "Quadratic Equations — Discriminant & Real Roots Formula",
        faculty: "Dr. Sarah Jenkins",
        status: currentDayName === "Monday" ? "LIVE" : "SCHEDULED",
        roomId: "acuity-maths-live",
      },
      {
        day: "Tuesday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Science",
        topic: "Light: Reflection & Refraction — Ray Diagrams Exemplar",
        faculty: "Prof. Rajesh Kumar",
        status: currentDayName === "Tuesday" ? "LIVE" : "SCHEDULED",
        roomId: "acuity-science-live",
      },
      {
        day: "Wednesday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Mathematics",
        topic: "Arithmetic Progressions — nth Term & Sum of Terms",
        faculty: "Dr. Sarah Jenkins",
        status: currentDayName === "Wednesday" ? "LIVE" : "SCHEDULED",
        roomId: "acuity-maths-live",
      },
      {
        day: "Thursday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "English",
        topic: "Analytical Paragraph & Advanced Grammar Clauses",
        faculty: "Ms. Anita Desai",
        status: currentDayName === "Thursday" ? "LIVE" : "SCHEDULED",
        roomId: "acuity-english-live",
      },
      {
        day: "Friday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Social Science",
        topic: "Nationalism in India / Life Processes Core Concepts",
        faculty: "Prof. Rajesh Kumar",
        status: currentDayName === "Friday" ? "LIVE" : "SCHEDULED",
        roomId: "acuity-social-live",
      },
      {
        day: "Saturday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Revision & Doubts",
        topic: "Weekly Test Analysis, Doubt Resolution & Worksheet Solving",
        faculty: "Senior Academic Faculty",
        status: currentDayName === "Saturday" ? "LIVE" : "SCHEDULED",
        roomId: "acuity-revision-live",
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
    console.error("Student Classes API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
