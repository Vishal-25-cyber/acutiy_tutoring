import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

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

    let liveClass: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      liveClass = await LiveSession.findById(id);
    }
    if (!liveClass) {
      liveClass = await LiveSession.findOne({
        $or: [{ meetingId: id }, { livekitRoomId: id }],
      });
    }
    if (!liveClass) {
      liveClass = await LiveSession.findOne({ status: "LIVE" });
    }

    if (!liveClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    liveClass.status = "COMPLETED";
    liveClass.actualEndTime = new Date();
    await liveClass.save();

    // Automatically increment classes conducted for Teacher in StaffAttendance
    try {
      const StaffAttendance = (await import("@/models/StaffAttendance")).default;
      const todayDateStr = new Date().toISOString().split("T")[0];
      const teacherUserId = liveClass.teacherId || session.userId;
      await StaffAttendance.findOneAndUpdate(
        { teacherId: teacherUserId, date: todayDateStr },
        {
          $setOnInsert: {
            teacherId: teacherUserId,
            date: todayDateStr,
            loginTime: new Date(),
          },
          $set: {
            status: "PRESENT",
          },
          $inc: {
            classesConducted: 1,
          },
        },
        { upsert: true, new: true }
      );
    } catch (attErr) {
      console.warn("Auto staff attendance recording on class end:", attErr);
    }

    await recordAuditLog({
      actorId: session.userId,
      action: "CLASS_ENDED",
      entityType: "LIVE_SESSION",
      entityId: liveClass._id.toString(),
      details: { status: "COMPLETED", actualEndTime: liveClass.actualEndTime },
    });

    return NextResponse.json({
      success: true,
      message: "Class session marked as COMPLETED and permanently closed.",
      class: liveClass,
    });
  } catch (error: any) {
    console.error("PUT /api/classes/[id]/end error:", error);
    return NextResponse.json({ error: error.message || "Failed to end class" }, { status: 500 });
  }
}
