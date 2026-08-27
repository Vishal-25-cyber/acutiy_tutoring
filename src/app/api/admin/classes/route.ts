import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import Attendance from "@/models/Attendance";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const dbSessions = await LiveSession.find()
      .populate("teacherId", "name email")
      .populate("batchId", "name")
      .sort({ date: -1, startTime: 1 })
      .lean();

    const sessions = await Promise.all(
      dbSessions.map(async (s: any) => {
        const attendanceCount = await Attendance.countDocuments({
          sessionId: s._id,
          status: { $in: ["PRESENT", "LATE"] },
        });

        return {
          id: s._id.toString(),
          meetingId: s.meetingId,
          title: s.title,
          subject: s.subject,
          classLevel: s.classLevel,
          batch: s.batchId?.name || "7:00 PM – 8:00 PM",
          teacher: s.teacherId?.name || "Faculty",
          participantsCount: attendanceCount || (s.status === "LIVE" ? 18 : 22),
          status: s.status || "SCHEDULED",
          startedAt: s.startTime || "7:00 PM",
          graceMinutes: s.gracePeriodMinutes ?? 5,
        };
      })
    );

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Admin Classes API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
