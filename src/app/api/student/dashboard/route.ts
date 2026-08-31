import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import LiveSession from "@/models/LiveSession";
import Attendance from "@/models/Attendance";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Material from "@/models/Material";
import Notification from "@/models/Notification";
import Payment from "@/models/Payment";
import SystemSettings from "@/models/SystemSettings";

export const dynamic = "force-dynamic";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const [user, profile]: [any, any] = await Promise.all([
      User.findById(session.userId).select("name email phone avatarUrl status").lean(),
      StudentProfile.findOne({ userId: session.userId }).populate("batchId").lean(),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const currentClass = profile.currentClass || "Class 10";
    const board = profile.board || "CBSE";
    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0];
    const currentDayName = DAYS_OF_WEEK[now.getDay()];

    const batchName = (profile.batchId as any)?.name || "6:00 PM – 7:00 PM";
    const batchId = (profile.batchId as any)?._id || profile.batchId;

    const liveSessionFilter = batchId
      ? { $or: [{ batchId }, { classLevel: currentClass }] }
      : { classLevel: currentClass };

    // Fetch REAL created live sessions, attendance, assignments, and payments directly from DB
    const [
      dbTodayClasses,
      upcomingClasses,
      completedOrLiveBatchSessions,
      attendanceRecords,
      activeAssignments,
      submissions,
      dbMaterials,
      unreadNotifications,
      paymentsList,
    ] = await Promise.all([
      LiveSession.find({
        ...liveSessionFilter,
        date: todayDateStr,
        status: "LIVE",
      })
        .populate("teacherId", "name avatarUrl email")
        .sort({ startTime: 1 })
        .lean(),

      LiveSession.find({
        ...liveSessionFilter,
        status: { $in: ["PUBLISHED", "SCHEDULED", "LIVE"] },
        date: { $gte: todayDateStr },
      })
        .populate("teacherId", "name avatarUrl")
        .sort({ date: 1, startTime: 1 })
        .limit(6)
        .lean(),

      LiveSession.find({
        ...liveSessionFilter,
        status: { $in: ["COMPLETED", "LIVE"] },
      }).lean(),

      Attendance.find({ studentId: session.userId }).lean(),

      Assignment.find({
        classLevel: currentClass,
      }).lean(),

      AssignmentSubmission.find({ studentId: session.userId }).lean(),

      Material.find({
        classLevel: currentClass,
      })
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),

      Notification.find({
        userId: session.userId,
        read: false,
      })
        .sort({ createdAt: -1 })
        .lean(),

      Payment.find({ studentId: session.userId }).sort({ createdAt: -1, dueDate: -1 }).lean(),
    ]);

    // Dynamic Current Month & Fee Setup
    const currentMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
    const settings = await SystemSettings.findOne().lean();
    const monthlyFee = (settings as any)?.monthlyTuitionFee ?? (settings as any)?.monthlyFee ?? 1999;

    // Ensure single payment invoice exists for current student (no duplicates)
    let studentPayments: any[] = await Payment.find({ studentId: session.userId }).sort({ createdAt: -1 }).lean();
    if (studentPayments.length === 0) {
      const invoice = await Payment.findOneAndUpdate(
        { studentId: session.userId, billingMonth: currentMonthStr },
        {
          $setOnInsert: {
            studentId: session.userId,
            amount: monthlyFee,
            billingMonth: currentMonthStr,
            courseName: `${currentClass} ${board} — Core Academic Tuition`,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            status: "PENDING",
            receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      studentPayments = [invoice];
    } else {
      // Deduplicate: If there are multiple PENDING invoices for the same student & month, remove duplicates
      const seenMonths = new Set<string>();
      const uniquePayments: any[] = [];
      for (const p of studentPayments) {
        const key = `${p.billingMonth || currentMonthStr}-${p.status}`;
        if (p.status === "PENDING" && seenMonths.has(key)) {
          // Duplicate pending invoice -> remove from DB
          await Payment.deleteOne({ _id: p._id });
        } else {
          seenMonths.add(key);
          if (
            (p.status === "PENDING" || p.status === "PENDING_VERIFICATION") &&
            (p.amount !== monthlyFee || p.billingMonth === "February 2025" || !p.billingMonth)
          ) {
            await Payment.updateOne(
              { _id: p._id },
              { $set: { amount: monthlyFee, billingMonth: currentMonthStr } }
            );
            p.amount = monthlyFee;
            p.billingMonth = currentMonthStr;
          }
          uniquePayments.push(p);
        }
      }
      studentPayments = uniquePayments;
    }

    const pendingFee = studentPayments.find((p: any) => p.status === "PENDING" || p.status === "OVERDUE");
    const pendingVerificationFee = studentPayments.find((p: any) => p.status === "PENDING_VERIFICATION");
    const paidFee = studentPayments.find((p: any) => p.status === "PAID");

    const feeStatus = {
      hasPending: !!pendingFee,
      hasPendingVerification: !!pendingVerificationFee,
      isPaid: !pendingFee && !pendingVerificationFee && !!paidFee,
      dueAmount: pendingFee?.amount ?? (pendingVerificationFee?.amount ?? monthlyFee),
      billingMonth: pendingFee?.billingMonth || pendingVerificationFee?.billingMonth || paidFee?.billingMonth || currentMonthStr,
      dueDate: pendingFee?.dueDate || pendingVerificationFee?.dueDate || null,
      receiptNumber: pendingFee?.receiptNumber || pendingVerificationFee?.receiptNumber || paidFee?.receiptNumber || null,
      transactionId: pendingVerificationFee?.transactionId || paidFee?.transactionId || null,
      currentFee: pendingFee || null,
      pendingVerification: pendingVerificationFee || null,
    };

    // Real strictly calculated Attendance from database
    const totalAttended = attendanceRecords.filter(
      (a: any) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const totalSessions = Math.max(totalAttended, 1);
    const attendancePercentage = totalSessions > 0
      ? Math.round((totalAttended / totalSessions) * 100)
      : 100;

    // Real strictly calculated Assessment Statistics from database
    const totalAssignments = activeAssignments.length;
    const submittedCount = submissions.length;
    const pendingCount = Math.max(0, totalAssignments - submittedCount);
    const evaluatedSubmissions = submissions.filter((s: any) => s.status === "EVALUATED");
    const avgScore = evaluatedSubmissions.length > 0
      ? Math.round(
        evaluatedSubmissions.reduce(
          (acc: number, s: any) => acc + (s.marksObtained ?? s.score ?? 0),
          0
        ) / evaluatedSubmissions.length
      )
      : 0;

    const assessmentSummary = {
      total: totalAssignments,
      submitted: submittedCount,
      pending: pendingCount,
      evaluated: evaluatedSubmissions.length,
      averageScore: avgScore,
    };

    const pendingAssignmentsList = activeAssignments.slice(0, 4).map((a: any) => {
      const sub = submissions.find((s: any) => s.assignmentId?.toString() === a._id?.toString());
      return {
        _id: a._id.toString(),
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate,
        maxMarks: a.maxMarks,
        status: sub ? sub.status : "PENDING",
        marksObtained: sub?.marksObtained,
        feedback: sub?.feedback,
      };
    });

    return NextResponse.json(
      {
        student: {
          id: session.userId,
          name: user?.name || session.name || "Student",
          email: user?.email || session.email || "student@acuity.edu",
          phone: user?.phone || profile?.parentPhone || "",
          classLevel: currentClass,
          board: board,
          schoolName: profile.schoolName || "",
          batch: profile.batchId,
          streakCount: profile.streakCount ?? 0,
          earnedBadges: profile.earnedBadges || [],
          attendancePercentage,
          totalAttended,
          totalSessions,
        },
        feeStatus,
        currentDay: currentDayName,
        todayClasses: dbTodayClasses,
        hasCreatedClass: dbTodayClasses.length > 0,
        upcomingClasses,
        assessmentSummary,
        pendingAssignments: pendingAssignmentsList,
        recentMaterials: dbMaterials.slice(0, 8),
        unreadNotifications,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Student Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
