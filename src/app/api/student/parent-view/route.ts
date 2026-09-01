import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import Attendance from "@/models/Attendance";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Payment from "@/models/Payment";
import SystemSettings from "@/models/SystemSettings";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const profile = await StudentProfile.findOne({ userId: session.userId }).populate("batchId");
    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const attendanceRecords = await Attendance.find({ studentId: session.userId });
    const total = attendanceRecords.length || 1;
    const present = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const attendancePercentage = Math.round((present / total) * 100);

    const submissions = await AssignmentSubmission.find({
      studentId: session.userId,
      status: "EVALUATED",
    }).populate("assignmentId");

    const payments = await Payment.find({ studentId: session.userId });
    const pendingPayment = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");

    const settings = await SystemSettings.findOne();

    return NextResponse.json({
      student: {
        name: session.name,
        classLevel: profile.currentClass,
        board: profile.board,
        schoolName: profile.schoolName,
        batch: profile.batchId,
        parentName: profile.parentName,
        parentPhone: profile.parentPhone,
        altEmergencyPhone: profile.altEmergencyPhone,
      },
      attendance: {
        percentage: attendancePercentage,
        totalClasses: total,
        attendedClasses: present,
        riskLevel: profile.attendanceRiskLevel,
      },
      recentEvaluations: submissions.slice(0, 5),
      feeStatus: {
        hasPending: !!pendingPayment,
        pendingAmount: pendingPayment?.amount || 0,
        dueDate: pendingPayment?.dueDate,
      },
      officialSupportNumbers: {
        phone1: settings?.supportPhone1 || "+91 98765 43210",
        phone2: settings?.supportPhone2 || "+91 98765 43211",
        phone3: settings?.supportPhone3 || "+91 98765 43212",
        email: settings?.supportEmail || "support@mantif.edu",
      },
      teacherRemarks: [
        "Consistent attendance in evening batches.",
        "Active in solving live classroom MCQs and homework.",
        "Recommended to maintain regular revision before unit tests.",
      ],
    });
  } catch (error: any) {
    console.error("Parent View Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
