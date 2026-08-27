import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import Attendance from "@/models/Attendance";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Only staff can view class attendance logs." }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const liveClass = await LiveSession.findById(id)
      .populate("batchId")
      .populate("teacherId", "name email avatarUrl");

    if (!liveClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    // Check teacher ownership unless admin
    if (session.role === "TEACHER" && liveClass.teacherId && (liveClass.teacherId as any)._id?.toString() !== session.userId) {
      // allow staff read-only if shared, but check
    }

    // 1. Get all students enrolled in this batch & class level
    const batchId =
      typeof liveClass.batchId === "object"
        ? (liveClass.batchId as any)?._id
        : liveClass.batchId;

    const studentProfiles = await StudentProfile.find({
      batchId,
      ...(liveClass.classLevel ? { currentClass: liveClass.classLevel } : {}),
    })
      .populate("userId", "name email phone avatarUrl status")
      .lean();

    // 2. Get all attendance records recorded for this class
    const attendanceRecords = await Attendance.find({ sessionId: liveClass._id })
      .populate("studentId", "name email phone avatarUrl")
      .lean();

    const attendanceMap = new Map<string, any>();
    attendanceRecords.forEach((att: any) => {
      const studentKey =
        typeof att.studentId === "object" ? att.studentId?._id?.toString() : att.studentId?.toString();
      if (studentKey) {
        attendanceMap.set(studentKey, att);
      }
    });

    // 3. Merge roster with attendance records
    const roster = studentProfiles
      .map((profile: any) => {
        const user = profile.userId;
        if (!user) return null;

        const userIdStr = user._id.toString();
        const att = attendanceMap.get(userIdStr);

        const duration = att?.totalDurationMinutes ?? att?.durationMinutes ?? 0;
        const joinTime = att?.joinTime ? new Date(att.joinTime).toISOString() : null;
        const leaveTime = att?.leaveTime ? new Date(att.leaveTime).toISOString() : null;
        const sessions = att?.sessions || [];
        const status = att?.status || "ABSENT";

        return {
          studentId: userIdStr,
          name: user.name,
          email: user.email,
          phone: user.phone || profile.parentPhone || "--",
          avatarUrl: user.avatarUrl || "",
          currentClass: profile.currentClass,
          board: profile.board,
          joinTime,
          leaveTime,
          durationMinutes: duration,
          sessionsCount: sessions.length,
          sessions,
          status,
          attendanceRecordId: att?._id || null,
        };
      })
      .filter(Boolean);

    // 4. Calculate Aggregate Stats
    const totalEnrolled = roster.length;
    const presentCount = roster.filter((s: any) => s.status === "PRESENT").length;
    const absentCount = totalEnrolled - presentCount;
    const attendancePercentage =
      totalEnrolled > 0 ? Number(((presentCount / totalEnrolled) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      class: {
        id: liveClass._id,
        title: liveClass.title,
        subject: liveClass.subject,
        topic: liveClass.topic,
        description: liveClass.description,
        classLevel: liveClass.classLevel,
        date: liveClass.date,
        startTime: liveClass.startTime,
        endTime: liveClass.endTime,
        status: liveClass.status,
        batch: liveClass.batchId,
        teacher: liveClass.teacherId,
        attendanceThresholdPercent: liveClass.attendanceThresholdPercent || 75,
      },
      stats: {
        totalStudents: totalEnrolled,
        presentCount,
        absentCount,
        attendancePercentage,
      },
      roster,
    });
  } catch (error: any) {
    console.error("GET /api/classes/[id]/attendance error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch attendance log." }, { status: 500 });
  }
}
