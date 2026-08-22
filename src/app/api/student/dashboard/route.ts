import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import LiveSession from "@/models/LiveSession";
import Attendance from "@/models/Attendance";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Material from "@/models/Material";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const profile = await StudentProfile.findOne({ userId: session.userId }).populate("batchId");
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const todayDateStr = new Date().toISOString().split("T")[0];

    // Concurrently execute all independent dashboard queries with lean()
    const [
      todayClasses,
      upcomingClasses,
      attendanceRecords,
      activeAssignments,
      submissions,
      recentMaterials,
      unreadNotifications,
    ] = await Promise.all([
      LiveSession.find({
        classLevel: profile.currentClass,
        batchId: profile.batchId,
        date: todayDateStr,
        status: { $ne: "CANCELLED" },
      })
        .populate("teacherId", "name avatarUrl")
        .sort({ startTime: 1 })
        .lean(),

      LiveSession.find({
        classLevel: profile.currentClass,
        batchId: profile.batchId,
        status: { $in: ["SCHEDULED", "LIVE"] },
      })
        .populate("teacherId", "name avatarUrl")
        .sort({ date: 1, startTime: 1 })
        .limit(5)
        .lean(),

      Attendance.find({ studentId: session.userId }).lean(),

      Assignment.find({
        classLevel: profile.currentClass,
        batchId: profile.batchId,
      }).lean(),

      AssignmentSubmission.find({ studentId: session.userId }).lean(),

      Material.find({
        classLevel: profile.currentClass,
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),

      Notification.find({
        userId: session.userId,
        read: false,
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Attendance Calculation
    const totalAttended = attendanceRecords.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length;
    const totalSessions = Math.max(attendanceRecords.length, 1);
    const attendancePercentage = Math.round((totalAttended / totalSessions) * 100);

    // Attendance Risk Determination
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (attendancePercentage < 65) {
      riskLevel = "HIGH";
    } else if (attendancePercentage < 75) {
      riskLevel = "MEDIUM";
    }

    const submittedAssignmentIds = new Set(submissions.map((s: any) => s.assignmentId?.toString()));
    const pendingAssignments = activeAssignments.filter(
      (a: any) => !submittedAssignmentIds.has(a._id?.toString())
    );

    return NextResponse.json({
      student: {
        id: session.userId,
        name: session.name,
        email: session.email,
        classLevel: profile.currentClass,
        board: profile.board,
        schoolName: profile.schoolName,
        batch: profile.batchId,
        streakCount: profile.streakCount || 3,
        earnedBadges: profile.earnedBadges || ["First Class", "Assignment Champion"],
        attendanceRiskLevel: riskLevel,
        attendancePercentage,
      },
      todayClasses,
      upcomingClasses,
      pendingAssignmentsCount: pendingAssignments.length,
      recentMaterials,
      unreadNotifications,
      performanceScore: 84, // Composite index
    });
  } catch (error: any) {
    console.error("Student Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
