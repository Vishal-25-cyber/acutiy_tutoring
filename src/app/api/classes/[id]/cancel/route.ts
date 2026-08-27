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
      return NextResponse.json({ error: "Forbidden: Only staff can cancel classes." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason = "Class cancelled by teacher" } = body;

    await connectToDatabase();

    const liveClass = await LiveSession.findById(id);
    if (!liveClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (session.role === "TEACHER" && liveClass.teacherId.toString() !== session.userId) {
      return NextResponse.json({ error: "Forbidden: You cannot cancel another teacher's class." }, { status: 403 });
    }

    liveClass.status = "CANCELLED";
    await liveClass.save();

    // Notify students
    const eligibleStudents = await StudentProfile.find({
      batchId: liveClass.batchId,
      ...(liveClass.classLevel ? { currentClass: liveClass.classLevel } : {}),
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

    await recordAuditLog({
      actorId: session.userId,
      action: "CLASS_CANCELLED",
      entityType: "LIVE_SESSION",
      entityId: liveClass._id.toString(),
      details: { reason, notifiedStudents: eligibleStudents.length },
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
