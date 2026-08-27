import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import { recordAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, date, startTime, endTime } = await req.json();

    if (!sessionId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Session ID, new date, start time, and end time are required." }, { status: 400 });
    }

    await connectToDatabase();
    const liveSession = await LiveSession.findById(sessionId);

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (session.role !== "ADMIN" && liveSession.teacherId.toString() !== session.userId) {
      return NextResponse.json({ error: "You can only reschedule your own sessions." }, { status: 403 });
    }

    // Check for conflicting session at same date & overlapping time
    const conflictingSession = await LiveSession.findOne({
      _id: { $ne: sessionId },
      teacherId: liveSession.teacherId,
      date: date,
      status: { $in: ["SCHEDULED", "PUBLISHED", "LIVE"] },
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
      ],
    });

    if (conflictingSession) {
      return NextResponse.json(
        {
          error: `Schedule conflict: You are already handling "${conflictingSession.title}" on ${date} from ${conflictingSession.startTime} to ${conflictingSession.endTime}. Please choose a non-overlapping slot or use the Swap feature.`,
          conflictSessionId: conflictingSession._id,
        },
        { status: 409 }
      );
    }

    liveSession.date = date;
    liveSession.startTime = startTime;
    liveSession.endTime = endTime;
    await liveSession.save();

    await recordAuditLog({
      actorId: session.userId,
      action: "LIVE_SESSION_RESCHEDULED",
      entityType: "LIVE_SESSION",
      entityId: liveSession._id.toString(),
      details: { newDate: date, newTime: `${startTime}-${endTime}` },
    });

    return NextResponse.json({
      success: true,
      message: `Session rescheduled to ${date} (${startTime} – ${endTime}) without conflicts.`,
      session: liveSession,
    });
  } catch (error: any) {
    console.error("Reschedule Error:", error);
    return NextResponse.json({ error: error.message || "Failed to reschedule session." }, { status: 500 });
  }
}
