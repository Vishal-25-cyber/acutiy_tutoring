import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionAId, sessionBId } = await req.json();

    if (!sessionAId || !sessionBId) {
      return NextResponse.json({ error: "Both class session IDs are required to swap." }, { status: 400 });
    }

    await connectToDatabase();

    const [sessionA, sessionB] = await Promise.all([
      LiveSession.findById(sessionAId),
      LiveSession.findById(sessionBId),
    ]);

    if (!sessionA || !sessionB) {
      return NextResponse.json({ error: "One or both class sessions could not be found." }, { status: 404 });
    }

    // Verify teacher owns both sessions (or is ADMIN)
    if (session.role !== "ADMIN") {
      if (
        sessionA.teacherId.toString() !== session.userId &&
        sessionB.teacherId.toString() !== session.userId
      ) {
        return NextResponse.json({ error: "You can only swap sessions assigned to you." }, { status: 403 });
      }
    }

    // Swap date, startTime, and endTime
    const aDate = sessionA.date;
    const aStart = sessionA.startTime;
    const aEnd = sessionA.endTime;

    const bDate = sessionB.date;
    const bStart = sessionB.startTime;
    const bEnd = sessionB.endTime;

    sessionA.date = bDate;
    sessionA.startTime = bStart;
    sessionA.endTime = bEnd;

    sessionB.date = aDate;
    sessionB.startTime = aStart;
    sessionB.endTime = aEnd;

    await Promise.all([sessionA.save(), sessionB.save()]);

    await recordAuditLog({
      actorId: session.userId,
      action: "LIVE_SESSION_SWAPPED",
      entityType: "LIVE_SESSION",
      entityId: sessionA._id.toString(),
      details: {
        sessionA: { id: sessionA._id, newDate: sessionA.date, newTime: `${sessionA.startTime}-${sessionA.endTime}` },
        sessionB: { id: sessionB._id, newDate: sessionB.date, newTime: `${sessionB.startTime}-${sessionB.endTime}` },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Class schedule and subject days swapped successfully with zero conflicts.",
      sessionA,
      sessionB,
    });
  } catch (error: any) {
    console.error("Schedule Swap Error:", error);
    return NextResponse.json({ error: error.message || "Failed to swap schedule." }, { status: 500 });
  }
}
