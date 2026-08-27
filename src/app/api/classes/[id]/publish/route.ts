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
      return NextResponse.json({ error: "Forbidden: Only staff can publish classes." }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const liveClass = await LiveSession.findById(id);
    if (!liveClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (session.role === "TEACHER" && liveClass.teacherId.toString() !== session.userId) {
      return NextResponse.json({ error: "Forbidden: You cannot publish another teacher's class." }, { status: 403 });
    }

    liveClass.status = "PUBLISHED";
    await liveClass.save();

    // Notify all eligible students in the batch
    const eligibleStudents = await StudentProfile.find({
      batchId: liveClass.batchId,
      ...(liveClass.classLevel ? { currentClass: liveClass.classLevel } : {}),
    });

    if (eligibleStudents.length > 0) {
      const notifications = eligibleStudents.map((student) => ({
        userId: student.userId,
        title: `Class Published: ${liveClass.subject}`,
        message: `${liveClass.title || liveClass.topic} is scheduled for ${liveClass.date} at ${liveClass.startTime}.`,
        type: "CLASS_REMINDER",
        linkUrl: `/student/classes`,
        read: false,
      }));
      await Notification.insertMany(notifications);
    }

    await recordAuditLog({
      actorId: session.userId,
      action: "CLASS_PUBLISHED",
      entityType: "LIVE_SESSION",
      entityId: liveClass._id.toString(),
      details: {
        title: liveClass.title,
        batchId: liveClass.batchId?.toString(),
        notifiedStudents: eligibleStudents.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Class published successfully! ${eligibleStudents.length} students have been notified.`,
      class: liveClass,
    });
  } catch (error: any) {
    console.error("PUT /api/classes/[id]/publish error:", error);
    return NextResponse.json({ error: error.message || "Failed to publish class." }, { status: 500 });
  }
}
