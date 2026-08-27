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
    if (!userSession || userSession.role !== "STUDENT") {
      return NextResponse.json({ success: true });
    }

    const { classId, sessionId } = await req.json();
    const targetClassId = classId || sessionId;
    if (!targetClassId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const now = new Date();

    const [liveClass, attendance] = await Promise.all([
      LiveSession.findById(targetClassId),
      Attendance.findOne({ studentId: userSession.userId, sessionId: targetClassId }),
    ]);

    if (!attendance) {
      return NextResponse.json({ success: true, message: "No active attendance session." });
    }

    const sessions = attendance.sessions || [];
    if (sessions.length > 0) {
      const activeSession = sessions[sessions.length - 1];
      activeSession.leaveTime = now;
      const joinDate = new Date(activeSession.joinTime);
      const diffMins = Math.max(0, Math.round((now.getTime() - joinDate.getTime()) / 60000));
      activeSession.durationMinutes = diffMins;
    } else {
      const joinDate = attendance.joinTime ? new Date(attendance.joinTime) : now;
      const diffMins = Math.max(0, Math.round((now.getTime() - joinDate.getTime()) / 60000));
      sessions.push({
        joinTime: joinDate,
        leaveTime: now,
        durationMinutes: diffMins,
      });
    }

    const totalMins = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    attendance.sessions = sessions;
    attendance.leaveTime = now;
    attendance.durationMinutes = totalMins;
    attendance.totalDurationMinutes = totalMins;
    attendance.lastActiveTime = now;

    if (!attendance.manualOverride && liveClass) {
      const scheduledMins = calculateScheduledMinutes(liveClass.startTime, liveClass.endTime);
      const thresholdPercent = liveClass.attendanceThresholdPercent ?? 75;
      const requiredMinutes = Math.round((scheduledMins * thresholdPercent) / 100);

      attendance.status = totalMins >= requiredMinutes ? "PRESENT" : "ABSENT";
    }

    await attendance.save();

    return NextResponse.json({
      success: true,
      durationMinutes: totalMins,
      status: attendance.status,
    });
  } catch (error: any) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
