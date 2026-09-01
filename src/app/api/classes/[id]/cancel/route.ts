import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import Notification from "@/models/Notification";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req).catch(() => null);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason = "Class cancelled by teacher" } = body;

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
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    liveClass.status = "CANCELLED";
    await liveClass.save();

    // Notify students
    try {
      const eligibleStudents = await StudentProfile.find({
        $or: [
          { batchId: liveClass.batchId },
          { currentClass: liveClass.classLevel },
        ],
      });

      if (eligibleStudents.length > 0) {
        const notifications = eligibleStudents.map((student) => ({
          userId: student.userId,
          title: `Class Cancelled: ${liveClass.subject}`,
          message: `${liveClass.title || liveClass.topic} scheduled for ${liveClass.date} has been cancelled. Reason: ${reason}`,
          type: "ANNOUNCEMENT",
          linkUrl: `/student/classes`,
          read: false,
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn("Notification error on class cancel:", notifErr);
    }

    await recordAuditLog({
      actorId: session.userId,
      action: "CLASS_CANCELLED",
      entityType: "LIVE_SESSION",
      entityId: liveClass._id.toString(),
      details: { reason },
    });

    return NextResponse.json({
      success: true,
      message: "Class cancelled successfully.",
      class: liveClass,
    });
  } catch (error: any) {
    console.error("PUT /api/classes/[id]/cancel error:", error);
    return NextResponse.json({ error: error.message || "Failed to cancel class." }, { status: 500 });
  }
}
