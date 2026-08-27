import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import Attendance from "@/models/Attendance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const liveClass = await LiveSession.findById(id).populate("teacherId", "name avatarUrl");
    if (!liveClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Participants with active heartbeat in the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const activeAttendances = await Attendance.find({
      sessionId: id,
      lastActiveTime: { $gte: twoMinutesAgo },
    })
      .populate("studentId", "name email avatarUrl")
      .lean();

    const participants = activeAttendances.map((att: any) => ({
      id: att.studentId?._id?.toString() || att.studentId,
      name: att.studentId?.name || "Student",
      email: att.studentId?.email,
      avatarUrl: att.studentId?.avatarUrl,
      role: "STUDENT",
      joinTime: att.joinTime,
      durationMinutes: att.totalDurationMinutes || att.durationMinutes || 0,
    }));

    // Add teacher if room is live
    if (liveClass.status === "LIVE" && liveClass.teacherId) {
      const teacher = liveClass.teacherId as any;
      participants.unshift({
        id: teacher._id?.toString() || "teacher",
        name: teacher.name || "Teacher",
        email: teacher.email,
        avatarUrl: teacher.avatarUrl,
        role: "TEACHER",
        joinTime: liveClass.actualStartTime || new Date(),
        durationMinutes: 0,
      });
    }

    return NextResponse.json({
      count: participants.length,
      participants,
    });
  } catch (error: any) {
    console.error("GET /api/classes/[id]/participants error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
