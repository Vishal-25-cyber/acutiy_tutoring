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
      User.findById(session.userId).select("name email phone avatarUrl").lean(),
      StudentProfile.findOne({ userId: session.userId }).populate("batchId").lean(),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0];
    const currentDayName = DAYS_OF_WEEK[now.getDay()];

    const batchName = (profile.batchId as any)?.name || "6:00 PM – 7:00 PM";
    const batchStart = (profile.batchId as any)?.startTime || "18:00";
    const batchEnd = (profile.batchId as any)?.endTime || "19:00";

    // Fetch REAL created live sessions, attendance, assignments, and payments
    const [
      dbTodayClasses,
      upcomingClasses,
      attendanceRecords,
      activeAssignments,
      submissions,
      dbMaterials,
      unreadNotifications,
      paymentsList,
    ] = await Promise.all([
      LiveSession.find({
        batchId: profile.batchId,
        date: todayDateStr,
        status: "LIVE",
      })
        .populate("teacherId", "name avatarUrl")
        .sort({ startTime: 1 })
        .lean(),

      LiveSession.find({
        batchId: profile.batchId,
        status: { $in: ["PUBLISHED", "SCHEDULED", "LIVE"] },
        date: { $gte: todayDateStr },
      })
        .populate("teacherId", "name avatarUrl")
        .sort({ date: 1, startTime: 1 })
        .limit(6)
        .lean(),

      Attendance.find({ studentId: session.userId }).lean(),

      Assignment.find({
        classLevel: profile.currentClass,
      }).lean(),

      AssignmentSubmission.find({ studentId: session.userId }).lean(),

      Material.find({
        classLevel: profile.currentClass,
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

      Payment.find({ studentId: session.userId }).sort({ dueDate: -1 }).lean(),
    ]);

    // Ensure payment invoice exists for current student
    let studentPayments: any[] = paymentsList;
    if (studentPayments.length === 0) {
      const settings = await SystemSettings.findOne();
      const monthlyFee = settings?.monthlyTuitionFee || 2500;
      const newInvoice = await Payment.create({
        studentId: session.userId,
        amount: monthlyFee,
        billingMonth: "February 2025",
        courseName: `${profile.currentClass} ${profile.board || "CBSE"} — All Subjects Comprehensive Bundle`,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      });
      studentPayments = [newInvoice.toObject ? newInvoice.toObject() : newInvoice];
    }

    const pendingFee = studentPayments.find((p: any) => p.status === "PENDING" || p.status === "OVERDUE");
    const pendingVerificationFee = studentPayments.find((p: any) => p.status === "PENDING_VERIFICATION");
    const paidFee = studentPayments.find((p: any) => p.status === "PAID");

    const feeStatus = {
      hasPending: !!pendingFee,
      hasPendingVerification: !!pendingVerificationFee,
      isPaid: !pendingFee && !pendingVerificationFee && !!paidFee,
      dueAmount: pendingFee?.amount || (pendingVerificationFee?.amount ?? 0),
      billingMonth: pendingFee?.billingMonth || pendingVerificationFee?.billingMonth || paidFee?.billingMonth || "February 2025",
      dueDate: pendingFee?.dueDate || pendingVerificationFee?.dueDate || null,
      receiptNumber: pendingFee?.receiptNumber || pendingVerificationFee?.receiptNumber || paidFee?.receiptNumber || null,
      transactionId: pendingVerificationFee?.transactionId || paidFee?.transactionId || null,
      currentFee: pendingFee || null,
      pendingVerification: pendingVerificationFee || null,
    };

    // Assessment Statistics strictly from real DB records
    const submittedIds = new Set(submissions.map((s: any) => s.assignmentId?.toString()));
    const evaluatedSubmissions = submissions.filter((s: any) => s.status === "EVALUATED");
    const totalAssignments = activeAssignments.length;
    const submittedCount = submissions.length;
    const pendingCount = Math.max(0, totalAssignments - submittedCount);
    const avgScore = evaluatedSubmissions.length > 0
      ? Math.round(evaluatedSubmissions.reduce((acc: number, s: any) => acc + (s.score || 0), 0) / evaluatedSubmissions.length)
      : 0;

    const assessmentSummary = {
      total: totalAssignments,
      submitted: submittedCount,
      pending: pendingCount,
      evaluated: evaluatedSubmissions.length,
      averageScore: avgScore,
    };

    // Master Weekly Schedule Template for Class & Board Routine
    const weeklyScheduleTemplate = [
      {
        day: "Monday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Mathematics",
        topic: "Quadratic Equations — Discriminant & Real Roots Formula",
        faculty: "Dr. Sarah Jenkins",
        status: currentDayName === "Monday" && dbTodayClasses.length > 0 ? "LIVE" : "SCHEDULED",
        roomId: "acuity-maths-live-class",
      },
      {
        day: "Tuesday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Science",
        topic: "Light: Reflection & Refraction — Ray Diagrams Exemplar",
        faculty: "Prof. Rajesh Kumar",
        status: currentDayName === "Tuesday" && dbTodayClasses.length > 0 ? "LIVE" : "SCHEDULED",
        roomId: "acuity-science-live-class",
      },
      {
        day: "Wednesday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Mathematics",
        topic: "Arithmetic Progressions — nth Term & Sum of Terms",
        faculty: "Dr. Sarah Jenkins",
        status: currentDayName === "Wednesday" && dbTodayClasses.length > 0 ? "LIVE" : "SCHEDULED",
        roomId: "acuity-maths-live-class",
      },
      {
        day: "Thursday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "English",
        topic: "Analytical Paragraph & Advanced Grammar Clauses",
        faculty: "Ms. Anita Desai",
        status: currentDayName === "Thursday" && dbTodayClasses.length > 0 ? "LIVE" : "SCHEDULED",
        roomId: "acuity-english-live-class",
      },
      {
        day: "Friday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Social Science",
        topic: "Nationalism in India / Life Processes Core Concepts",
        faculty: "Prof. Rajesh Kumar",
        status: currentDayName === "Friday" && dbTodayClasses.length > 0 ? "LIVE" : "SCHEDULED",
        roomId: "acuity-social-live-class",
      },
      {
        day: "Saturday",
        time: batchName,
        startTime: batchStart,
        endTime: batchEnd,
        subject: "Revision & Doubts",
        topic: "Weekly Test Analysis, Doubt Resolution & Worksheet Solving",
        faculty: "Senior Academic Faculty",
        status: currentDayName === "Saturday" && dbTodayClasses.length > 0 ? "LIVE" : "SCHEDULED",
        roomId: "acuity-revision-live-class",
      },
    ];

    // Comprehensive Materials (DB uploads prioritized, supplemented with curriculum staples)
    const defaultCurriculumMaterials = [
      {
        _id: "mat-curriculum-1",
        title: `${profile.currentClass} Mathematics — Complete Formulas & Solved Derivations`,
        description: "Official formulas handbook with step-by-step solved proofs and problem patterns.",
        category: "NOTES",
        fileUrl: "https://acuity.edu/materials/class10-maths-formulas.pdf",
        fileName: `${profile.currentClass}_Mathematics_Formulas.pdf`,
        fileSize: "2.4 MB",
        classLevel: profile.currentClass,
        subject: "Mathematics",
        uploadedBy: { name: "Dr. Sarah Jenkins" },
        createdAt: new Date().toISOString(),
      },
      {
        _id: "mat-curriculum-2",
        title: `${profile.currentClass} Science — Ray Diagrams & Conceptual Numericals`,
        description: "Concave/convex mirrors, lens ray diagrams workbook with exemplar problems.",
        category: "WORKSHEET",
        fileUrl: "https://acuity.edu/materials/class10-science-light.pdf",
        fileName: `${profile.currentClass}_Science_Ray_Diagrams.pdf`,
        fileSize: "3.8 MB",
        classLevel: profile.currentClass,
        subject: "Science",
        uploadedBy: { name: "Prof. Rajesh Kumar" },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: "mat-curriculum-3",
        title: `${profile.currentClass} English — Grammar Rules, Clauses & Letter Writing`,
        description: "High-scoring formal letter, analytical paragraph and active grammar worksheets.",
        category: "PDF",
        fileUrl: "https://acuity.edu/materials/class10-english-sample.pdf",
        fileName: `${profile.currentClass}_English_Grammar_Guide.pdf`,
        fileSize: "1.6 MB",
        classLevel: profile.currentClass,
        subject: "English",
        uploadedBy: { name: "Ms. Anita Desai" },
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: "mat-curriculum-4",
        title: `${profile.currentClass} Social Science — Indian Nationalism Map Guide`,
        description: "Historical map markers, key timeline events and sample question bank.",
        category: "WORKSHEET",
        fileUrl: "https://acuity.edu/materials/class10-social-map.pdf",
        fileName: `${profile.currentClass}_Social_Science_Map.pdf`,
        fileSize: "4.2 MB",
        classLevel: profile.currentClass,
        subject: "Social Science",
        uploadedBy: { name: "Prof. Rajesh Kumar" },
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Merge DB materials with curriculum materials
    const recentMaterials = [
      ...dbMaterials,
      ...defaultCurriculumMaterials.filter(
        (def) => !dbMaterials.some((m: any) => m.title === def.title)
      ),
    ].slice(0, 8);

    // Attendance Calculation strictly from real database records
    const totalSessions = attendanceRecords.length;
    const totalAttended = attendanceRecords.filter(
      (a: any) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const attendancePercentage = totalSessions > 0
      ? Math.round((totalAttended / totalSessions) * 100)
      : 0;

    const pendingAssignmentsList = activeAssignments.slice(0, 4).map((a: any) => {
      const sub = submissions.find((s: any) => s.assignmentId?.toString() === a._id?.toString());
      return {
        _id: a._id,
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate,
        maxMarks: a.maxMarks,
        status: sub ? sub.status : "PENDING",
        marksObtained: sub?.marksObtained,
      };
    });

    const subjectMastery = [
      { subject: "Mathematics", score: evaluatedSubmissions.length > 0 ? avgScore : 0, progress: evaluatedSubmissions.length > 0 ? avgScore : 0, color: "#6366f1" },
      { subject: "Science", score: evaluatedSubmissions.length > 0 ? avgScore : 0, progress: evaluatedSubmissions.length > 0 ? avgScore : 0, color: "#10b981" },
      { subject: "English", score: evaluatedSubmissions.length > 0 ? avgScore : 0, progress: evaluatedSubmissions.length > 0 ? avgScore : 0, color: "#f59e0b" },
      { subject: "Social Science", score: evaluatedSubmissions.length > 0 ? avgScore : 0, progress: evaluatedSubmissions.length > 0 ? avgScore : 0, color: "#ec4899" },
    ];

    return NextResponse.json({
      student: {
        id: session.userId,
        name: user?.name || session.name || "Student",
        email: user?.email || session.email || "student@acuity.edu",
        phone: user?.phone || profile?.parentPhone || "",
        classLevel: profile.currentClass,
        board: profile.board || "CBSE",
        schoolName: profile.schoolName,
        batch: profile.batchId,
        streakCount: profile.streakCount || 0,
        earnedBadges: profile.earnedBadges || [],
        attendancePercentage: attendancePercentage,
        totalAttended,
        totalSessions,
      },
      feeStatus,
      currentDay: currentDayName,
      todayClasses: dbTodayClasses,
      hasCreatedClass: dbTodayClasses.length > 0,
      upcomingClasses,
      weeklySchedule: weeklyScheduleTemplate,
      assessmentSummary,
      pendingAssignments: pendingAssignmentsList,
      subjectMastery,
      recentMaterials,
      unreadNotifications,
    }, {
      headers: {
        "Cache-Control": "private, max-age=5, stale-while-revalidate=15",
      },
    });
  } catch (error: any) {
    console.error("Student Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
