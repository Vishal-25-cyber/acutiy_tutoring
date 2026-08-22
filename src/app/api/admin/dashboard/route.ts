import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import TeacherProfile from "@/models/TeacherProfile";
import LiveSession from "@/models/LiveSession";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      pendingTeachers,
      todayClasses,
      liveSessions,
      payments,
      allAttendance,
      highRiskStudents,
    ] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "STUDENT", status: "ACTIVE" }),
      User.countDocuments({ role: "TEACHER" }),
      User.countDocuments({ role: "TEACHER", status: "ACTIVE" }),
      User.countDocuments({ role: "TEACHER", status: "PENDING_APPROVAL" }),
      LiveSession.countDocuments({ date: new Date().toISOString().split("T")[0] }),
      LiveSession.countDocuments({ status: "LIVE" }),
      Payment.find().lean(),
      Attendance.find().limit(100).lean(),
      StudentProfile.countDocuments({ attendanceRiskLevel: "HIGH" }),
    ]);

    // Financial breakdown
    const totalCollected = payments
      .filter((p: any) => p.status === "PAID")
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const totalPending = payments
      .filter((p: any) => p.status === "PENDING" || p.status === "OVERDUE")
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    // Attendance rate
    const presentAttendance = allAttendance.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length;
    const avgAttendance = allAttendance.length > 0 ? Math.round((presentAttendance / allAttendance.length) * 100) : 92;

    return NextResponse.json({
      metrics: {
        totalStudents,
        activeStudents,
        totalTeachers,
        activeTeachers,
        pendingApprovals: pendingTeachers,
        todayClasses,
        activeLiveSessions: liveSessions,
        monthlyRevenue: totalCollected,
        pendingRevenue: totalPending,
        totalCollections: totalCollected + totalPending,
        averageAttendance: avgAttendance,
        highRiskStudents,
      },
      recentActivity: [
        { id: "1", type: "STUDENT", title: "New student enrolled in Class 9 CBSE", time: "10 mins ago" },
        { id: "2", type: "LIVE", title: "Class 10 Mathematics Live Session completed", time: "35 mins ago" },
        { id: "3", type: "PAYMENT", title: "Tuition fee received (₹2,500) via online gateway", time: "1 hour ago" },
        { id: "4", type: "TEACHER", title: "New teacher application submitted (Dr. Anita, Science)", time: "2 hours ago" },
      ],
    });
  } catch (error: any) {
    console.error("Admin Dashboard Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
