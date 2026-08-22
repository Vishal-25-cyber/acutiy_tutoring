import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import Attendance from "@/models/Attendance";
import LiveSession from "@/models/LiveSession";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const userSession = await getSession();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, durationMinutes } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const now = new Date();

    const attendance = await Attendance.findOne({
      studentId: userSession.userId,
      sessionId,
    });

    if (attendance) {
      attendance.leaveTime = now;
      if (durationMinutes && typeof durationMinutes === "number") {
        attendance.durationMinutes = Math.max(attendance.durationMinutes || 0, Math.round(durationMinutes));
      } else if (attendance.joinTime) {
        const calculatedMins = Math.round((now.getTime() - attendance.joinTime.getTime()) / (1000 * 60));
        attendance.durationMinutes = calculatedMins;
      }

      // Check partial vs present threshold (e.g. at least 30 mins or 50% of class)
      if (attendance.durationMinutes < 15 && attendance.status !== "LATE") {
        attendance.status = "PARTIAL";
      }

      await attendance.save();
    }

    return NextResponse.json({ success: true, attendance });
  } catch (error: any) {
    console.error("Record Attendance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
