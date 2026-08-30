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

    // 1. Get all attendance records recorded for this class
    const attendanceRecords = await Attendance.find({ sessionId: liveClass._id })
      .populate("studentId", "name email phone avatarUrl")
      .lean();

    const attendanceMap = new Map<string, any>();
    const attendedUserIds: string[] = [];

    attendanceRecords.forEach((att: any) => {
      const studentKey =
        typeof att.studentId === "object" ? att.studentId?._id?.toString() : att.studentId?.toString();
      if (studentKey) {
        attendanceMap.set(studentKey, att);
        attendedUserIds.push(studentKey);
      }
    });

    // 2. Get all students enrolled in this batch, grade level, or who attended this class
    const batchId =
      typeof liveClass.batchId === "object"
        ? (liveClass.batchId as any)?._id
        : liveClass.batchId;

    const queryFilters: any[] = [];
    if (batchId) queryFilters.push({ batchId });
    if (liveClass.classLevel) queryFilters.push({ currentClass: liveClass.classLevel });
    if (attendedUserIds.length > 0) queryFilters.push({ userId: { $in: attendedUserIds } });

    let studentProfiles = await StudentProfile.find(
      queryFilters.length > 0 ? { $or: queryFilters } : {}
    )
      .populate("userId", "name email phone avatarUrl status")
      .lean();

    if (studentProfiles.length === 0) {
      studentProfiles = await StudentProfile.find({})
        .populate("userId", "name email phone avatarUrl status")
        .lean();
    }

    const addedUserIds = new Set<string>();

    // 3. Merge roster with attendance records
    const roster: any[] = [];

    studentProfiles.forEach((profile: any) => {
      const user = profile.userId;
      if (!user) return;

      const userIdStr = user._id.toString();
      if (addedUserIds.has(userIdStr)) return;
      addedUserIds.add(userIdStr);

      const att = attendanceMap.get(userIdStr);
      const duration = att?.totalDurationMinutes ?? att?.durationMinutes ?? 0;
      const joinTime = att?.joinTime ? new Date(att.joinTime).toISOString() : null;
      const leaveTime = att?.leaveTime ? new Date(att.leaveTime).toISOString() : null;
      const sessions = att?.sessions || [];
      const status = att?.status || "ABSENT";

      roster.push({
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
      });
    });

    // 4. Also add any attended users that might not have had a profile matching the query
    attendanceRecords.forEach((att: any) => {
      const user = att.studentId;
      if (!user) return;
      const userIdStr = typeof user === "object" ? user._id?.toString() : user.toString();
      if (!userIdStr || addedUserIds.has(userIdStr)) return;
      addedUserIds.add(userIdStr);

      const duration = att.totalDurationMinutes ?? att.durationMinutes ?? 0;
      const joinTime = att.joinTime ? new Date(att.joinTime).toISOString() : null;
      const leaveTime = att.leaveTime ? new Date(att.leaveTime).toISOString() : null;
      const sessions = att.sessions || [];

      roster.push({
        studentId: userIdStr,
        name: user.name || "Student",
        email: user.email || "--",
        phone: user.phone || "--",
        avatarUrl: user.avatarUrl || "",
        currentClass: att.classLevel || liveClass.classLevel || "Class 10",
        board: "CBSE",
        joinTime,
        leaveTime,
        durationMinutes: duration,
        sessionsCount: sessions.length,
        sessions,
        status: att.status || "PRESENT",
        attendanceRecordId: att._id || null,
      });
    });

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden: Only staff can mark student attendance." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();

    const liveClass = await LiveSession.findById(id);
    if (!liveClass) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }

    const body = await req.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No attendance updates provided." }, { status: 400 });
    }

    for (const item of updates) {
      if (!item.studentId || !item.status) continue;

      await Attendance.findOneAndUpdate(
        {
          sessionId: liveClass._id,
          studentId: item.studentId,
        },
        {
          sessionId: liveClass._id,
          studentId: item.studentId,
          status: item.status,
          remarks: item.remarks || "Staff verified",
          durationMinutes: item.status === "PRESENT" ? 60 : item.status === "LATE" ? 45 : 0,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true, updatedCount: updates.length });
  } catch (error: any) {
    console.error("POST /api/classes/[id]/attendance error:", error);
    return NextResponse.json({ error: error.message || "Failed to update attendance." }, { status: 500 });
  }
}
