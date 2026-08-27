import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Attendance from "@/models/Attendance";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";

export async function POST(req: NextRequest) {
  try {
    const userSession = await getSession();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    if (userSession.role !== "STUDENT") {
      // Teachers and Admins don't need student attendance records
      return NextResponse.json({ success: true, message: "Staff presence acknowledged." });
    }

    const body = await req.json();
    const { classId, sessionId } = body;
    const targetClassId = classId || sessionId;

    if (!targetClassId) {
      return NextResponse.json({ error: "Class ID is required." }, { status: 400 });
    }

    await connectToDatabase();
    const liveClass = await LiveSession.findById(targetClassId);
    if (!liveClass) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }

    const now = new Date();
    let attendance = await Attendance.findOne({
      studentId: userSession.userId,
      sessionId: liveClass._id,
    });

    if (!attendance) {
      // First time joining this class
      attendance = new Attendance({
        studentId: userSession.userId,
        sessionId: liveClass._id,
        batchId: liveClass.batchId,
        classLevel: liveClass.classLevel || "Class 10",
        joinTime: now,
        leaveTime: now,
        durationMinutes: 0,
        totalDurationMinutes: 0,
        status: "PRESENT",
        sessions: [
          {
            joinTime: now,
            leaveTime: now,
            durationMinutes: 0,
          },
        ],
        lastActiveTime: now,
      });
      await attendance.save();

      // Increment student total classes attended
      await StudentProfile.findOneAndUpdate(
        { userId: userSession.userId },
        { $inc: { totalClassesAttended: 1 } }
      );
    } else {
      // Rejoining class -> Add new subsession to sessions array
      const sessions = attendance.sessions || [];

      // If last session was left unclosed, close it
      if (sessions.length > 0) {
        const last = sessions[sessions.length - 1];
        if (!last.leaveTime || last.leaveTime < last.joinTime) {
          last.leaveTime = now;
          const diffMins = Math.max(0, Math.round((now.getTime() - new Date(last.joinTime).getTime()) / 60000));
          last.durationMinutes = diffMins;
        }
      }

      sessions.push({
        joinTime: now,
        leaveTime: now,
        durationMinutes: 0,
      });

      attendance.sessions = sessions;
      attendance.lastActiveTime = now;
      await attendance.save();
    }

    return NextResponse.json({
      success: true,
      attendance: {
        id: attendance._id,
        studentId: attendance.studentId,
        joinTime: attendance.joinTime,
        totalDurationMinutes: attendance.totalDurationMinutes || 0,
        status: attendance.status,
        sessionCount: attendance.sessions?.length || 1,
      },
    });
  } catch (error: any) {
    console.error("POST /api/attendance/join error:", error);
    return NextResponse.json({ error: error.message || "Failed to record join attendance." }, { status: 500 });
  }
}
