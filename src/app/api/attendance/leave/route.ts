import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Attendance from "@/models/Attendance";
import LiveSession from "@/models/LiveSession";

function calculateScheduledMinutes(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 60;
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  if (isNaN(startH) || isNaN(endH)) return 60;
  const diff = endH * 60 + endM - (startH * 60 + startM);
  return diff > 0 ? diff : 60;
}

export async function POST(req: NextRequest) {
  try {
    const userSession = await getSession();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};
    try {
      const rawText = await req.text();
      if (rawText) {
        body = JSON.parse(rawText);
      }
    } catch {
      body = {};
    }

    const { classId, sessionId, durationMinutes: clientDuration } = body;
    const targetClassId = classId || sessionId;

    if (!targetClassId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const liveClass = await LiveSession.findById(targetClassId);
    const attendance = await Attendance.findOne({
      studentId: userSession.userId,
      sessionId: targetClassId,
    });

    if (!attendance) {
      return NextResponse.json({ success: true, message: "No attendance session found to close." });
    }

    const now = new Date();
    const sessions = attendance.sessions || [];

    if (sessions.length > 0) {
      const lastSession = sessions[sessions.length - 1];
      lastSession.leaveTime = now;
      const joinDate = new Date(lastSession.joinTime);
      const subMins = Math.max(1, Math.round((now.getTime() - joinDate.getTime()) / 60000));
      lastSession.durationMinutes = subMins;
    } else {
      // Fallback single session
      const joinDate = attendance.joinTime ? new Date(attendance.joinTime) : now;
      const diffMins = clientDuration || Math.max(1, Math.round((now.getTime() - joinDate.getTime()) / 60000));
      sessions.push({
        joinTime: joinDate,
        leaveTime: now,
        durationMinutes: diffMins,
      });
    }

    // Calculate sum of all session durations
    const totalMins = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    attendance.sessions = sessions;
    attendance.leaveTime = now;
    attendance.durationMinutes = totalMins;
    attendance.totalDurationMinutes = totalMins;
    attendance.lastActiveTime = now;

    // Calculate Attendance Status based on threshold
    if (!attendance.manualOverride && liveClass) {
      const scheduledMins = calculateScheduledMinutes(liveClass.startTime, liveClass.endTime);
      const thresholdPercent = liveClass.attendanceThresholdPercent ?? 75;
      const requiredMinutes = Math.round((scheduledMins * thresholdPercent) / 100);

      if (totalMins >= requiredMinutes) {
        attendance.status = "PRESENT";
      } else {
        attendance.status = "ABSENT";
      }
    }

    await attendance.save();

    return NextResponse.json({
      success: true,
      attendance: {
        id: attendance._id,
        status: attendance.status,
        totalDurationMinutes: totalMins,
        sessionsCount: sessions.length,
        leaveTime: attendance.leaveTime,
      },
    });
  } catch (error: any) {
    console.error("POST /api/attendance/leave error:", error);
    return NextResponse.json({ error: error.message || "Failed to record leave attendance." }, { status: 500 });
  }
}
