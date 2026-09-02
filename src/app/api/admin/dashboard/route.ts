import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import TeacherProfile from "@/models/TeacherProfile";
import LiveSession from "@/models/LiveSession";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";

import AuditLog from "@/models/AuditLog";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Assignment from "@/models/Assignment";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const todayDateStr = new Date().toISOString().split("T")[0];

    const [
      totalStudents,
      activeStudents,
      pendingStudents,
      totalTeachers,
      activeTeachers,
      pendingTeachers,
      todayClasses,
      liveSessions,
      payments,
      allAttendance,
      highRiskStudents,
      upcomingClassesList,
      auditLogs,
      recentSubmissions,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "STUDENT", status: "ACTIVE" }),
      User.countDocuments({ role: "STUDENT", status: "PENDING_APPROVAL" }),
      User.countDocuments({ role: "TEACHER" }),
      User.countDocuments({ role: "TEACHER", status: "ACTIVE" }),
      User.countDocuments({ role: "TEACHER", status: "PENDING_APPROVAL" }),
      LiveSession.countDocuments({ date: todayDateStr }),
      LiveSession.countDocuments({ status: "LIVE" }),
      Payment.find().lean(),
      Attendance.find().limit(200).lean(),
      StudentProfile.countDocuments({ attendanceRiskLevel: "HIGH" }),
      LiveSession.find({
        status: { $in: ["SCHEDULED", "PUBLISHED", "LIVE"] },
        date: { $gte: todayDateStr },
      })
        .populate("teacherId", "name email")
        .populate("batchId", "name startTime endTime")
        .sort({ date: 1, startTime: 1 })
        .limit(4)
        .lean(),
      AuditLog.find()
        .populate("actorId", "name email role")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      AssignmentSubmission.find()
        .populate("studentId", "name email")
        .populate("assignmentId", "title subject maxMarks")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Financial breakdown from real payments
    const totalCollected = payments
      .filter((p: any) => p.status === "PAID")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const totalPending = payments
      .filter((p: any) => p.status === "PENDING" || p.status === "OVERDUE")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Attendance rate
    const presentAttendance = allAttendance.filter(
      (a: any) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const avgAttendance =
      allAttendance.length > 0
        ? Math.min(100, Math.round((presentAttendance / allAttendance.length) * 100))
        : 100;

    // Assemble real live activity feed
    const activities: any[] = [];

    // Format audit logs
    auditLogs.forEach((log: any) => {
      const actorName = log.actorId?.name || log.actorId?.email || "System User";
      let actionTitle = `${actorName} performed ${log.action.replace(/_/g, " ")}`;
      let actType = log.entityType || "SYSTEM";

      if (log.action === "STUDENT_LOGIN") {
        actionTitle = `${actorName} logged in for batch ${log.details?.batchName || "Session"}`;
        actType = "STUDENT";
      } else if (log.action === "TEACHER_LOGIN") {
        actionTitle = `Faculty ${actorName} logged in (marked present)`;
        actType = "TEACHER";
      } else if (log.action === "BATCH_CREATED" || log.action === "BATCH_UPDATED") {
        actionTitle = `Batch slot updated (${log.details?.name || "Batch"})`;
        actType = "BATCH";
      } else if (log.action === "ADMIN_LOGIN") {
        actionTitle = `Admin ${actorName} logged into management center`;
        actType = "ADMIN";
      }

      activities.push({
        id: log._id.toString(),
        type: actType,
        title: actionTitle,
        timestamp: new Date(log.createdAt).getTime(),
      });
    });

    // Add recent assignment submissions
    recentSubmissions.forEach((sub: any) => {
      const studentName = sub.studentId?.name || sub.studentId?.email || "Student";
      const asgTitle = sub.assignmentId?.title || "Homework";
      const isGraded = sub.status === "EVALUATED";
      activities.push({
        id: sub._id.toString(),
        type: "HOMEWORK",
        title: isGraded
          ? `Assignment graded for ${studentName} (${sub.marksObtained}/${sub.assignmentId?.maxMarks || 20} Marks)`
          : `${studentName} turned in solution for "${asgTitle}"`,
        timestamp: new Date(sub.updatedAt || sub.createdAt).getTime(),
      });
    });

    // Sort combined activities by timestamp descending
    activities.sort((a, b) => b.timestamp - a.timestamp);

    // Format relative time
    const formatTimeAgo = (ts: number) => {
      const diffSec = Math.floor((Date.now() - ts) / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} min${diffMin !== 1 ? "s" : ""} ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr} hr${diffHr !== 1 ? "s" : ""} ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    };

    const formattedActivities = activities.slice(0, 8).map((act) => ({
      ...act,
      time: formatTimeAgo(act.timestamp),
    }));

    return NextResponse.json({
      metrics: {
        totalStudents,
        activeStudents,
        pendingStudentApprovals: pendingStudents,
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
      upcomingClasses: upcomingClassesList.map((cls: any) => ({
        id: cls._id.toString(),
        title: cls.title,
        subject: cls.subject,
        classLevel: cls.classLevel,
        date: cls.date,
        startTime: cls.startTime,
        endTime: cls.endTime,
        batch: cls.batchId?.name || "7:00 PM – 8:00 PM",
        teacher: cls.teacherId?.name || "Faculty Specialist",
        status: cls.status || "PUBLISHED",
      })),
      recentActivity: formattedActivities.length > 0 ? formattedActivities : [
        { id: "1", type: "SYSTEM", title: "Real-time tutoring system online & synchronized", time: "Just now" },
      ],
      serverTime: new Date().toISOString(),
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Admin Dashboard Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
