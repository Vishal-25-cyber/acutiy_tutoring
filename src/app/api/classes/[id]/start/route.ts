import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import Notification from "@/models/Notification";
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

    const liveClass = await LiveSession.findById(id).populate("batchId");
    if (!liveClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (liveClass.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot start a completed class." }, { status: 400 });
    }

    if (liveClass.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot start a cancelled class." }, { status: 400 });
    }

    liveClass.status = "LIVE";
    liveClass.actualStartTime = new Date();
    await liveClass.save();

    // Notify enrolled batch students that class is LIVE now
    if (liveClass.batchId) {
      const students = await StudentProfile.find({ batchId: liveClass.batchId }).select("userId");
      if (students.length > 0) {
        const notifications = students.map((s) => ({
          userId: s.userId,
          title: `🔴 LIVE NOW: ${liveClass.subject} Class Started!`,
          message: `${liveClass.topic || liveClass.title} is now in session. Join the classroom now.`,
          type: "CLASS_REMINDER",
          read: false,
          linkUrl: `/classroom/${liveClass._id}`,
        }));
        await Notification.insertMany(notifications);
      }
    }

    await recordAuditLog({
      actorId: session.userId,
      action: "CLASS_STARTED",
      entityType: "LIVE_SESSION",
      entityId: liveClass._id.toString(),
      details: { status: "LIVE", actualStartTime: liveClass.actualStartTime },
    });

    return NextResponse.json({
      success: true,
      message: "Class session is now LIVE. Students have been notified.",
      class: liveClass,
    });
  } catch (error: any) {
    console.error("PUT /api/classes/[id]/start error:", error);
    return NextResponse.json({ error: error.message || "Failed to start class" }, { status: 500 });
  }
}
