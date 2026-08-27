import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import { recordAuditLog } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Staff access only." }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const liveClass = await LiveSession.findById(id);
    if (!liveClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    liveClass.status = "COMPLETED";
    liveClass.actualEndTime = new Date();
    await liveClass.save();

    await recordAuditLog({
      actorId: session.userId,
      action: "CLASS_ENDED",
      entityType: "LIVE_SESSION",
      entityId: liveClass._id.toString(),
      details: { status: "COMPLETED", actualEndTime: liveClass.actualEndTime },
    });

    return NextResponse.json({
      success: true,
      message: "Class session marked as COMPLETED.",
      class: liveClass,
    });
  } catch (error: any) {
    console.error("PUT /api/classes/[id]/end error:", error);
    return NextResponse.json({ error: error.message || "Failed to end class" }, { status: 500 });
  }
}
