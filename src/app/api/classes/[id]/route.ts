import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import { recordAuditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const liveClass = await LiveSession.findById(id)
      .populate("batchId")
      .populate("teacherId", "name email avatarUrl phone");

    if (!liveClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    // Role checks
    if (session.role === "STUDENT") {
      const studentProfile = await StudentProfile.findOne({ userId: session.userId });
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found." }, { status: 403 });
      }

      const studentBatchId = studentProfile.batchId?.toString();
      const classBatchId =
        typeof liveClass.batchId === "object"
          ? (liveClass.batchId as any)?._id?.toString()
          : liveClass.batchId?.toString();

      if (studentBatchId !== classBatchId) {
        return NextResponse.json(
          { error: "Forbidden: You do not belong to this class batch." },
          { status: 403 }
        );
      }

      if (liveClass.status === "DRAFT") {
        return NextResponse.json({ error: "Class has not been published yet." }, { status: 403 });
      }
    }

    return NextResponse.json({ class: liveClass });
  } catch (error: any) {
    console.error("GET /api/classes/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch class." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Only staff can edit classes." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();
    const liveClass = await LiveSession.findById(id);

    if (!liveClass) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    // Check ownership if teacher
    if (
      session.role === "TEACHER" &&
      liveClass.teacherId.toString() !== session.userId
    ) {
      return NextResponse.json({ error: "Forbidden: You cannot edit another teacher's class." }, { status: 403 });
    }

    // Update allowed fields
    const {
      title,
      subject,
      topic,
      description,
      classLevel,
      batchId,
      date,
      startTime,
      endTime,
      materials,
      gracePeriodMinutes,
      attendanceThresholdPercent,
    } = body;

    if (title !== undefined) liveClass.title = title;
    if (subject !== undefined) liveClass.subject = subject;
    if (topic !== undefined) liveClass.topic = topic;
    if (description !== undefined) liveClass.description = description;
    if (classLevel !== undefined) liveClass.classLevel = classLevel;
    if (batchId !== undefined) liveClass.batchId = batchId;
    if (date !== undefined) liveClass.date = date;
    if (startTime !== undefined) liveClass.startTime = startTime;
    if (endTime !== undefined) liveClass.endTime = endTime;
    if (materials !== undefined) liveClass.materials = materials;
    if (gracePeriodMinutes !== undefined) liveClass.gracePeriodMinutes = Number(gracePeriodMinutes);
    if (attendanceThresholdPercent !== undefined) liveClass.attendanceThresholdPercent = Number(attendanceThresholdPercent);

    await liveClass.save();

    await recordAuditLog({
      actorId: session.userId,
      action: "CLASS_UPDATED",
      entityType: "LIVE_SESSION",
      entityId: liveClass._id.toString(),
      details: { title: liveClass.title, topic: liveClass.topic },
    });

    return NextResponse.json({ success: true, message: "Class updated successfully.", class: liveClass });
  } catch (error: any) {
    console.error("PUT /api/classes/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update class." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req).catch(() => null);

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
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    await LiveSession.findByIdAndDelete(liveClass._id);

    await recordAuditLog({
      actorId: session.userId,
      action: "CLASS_DELETED",
      entityType: "LIVE_SESSION",
      entityId: liveClass._id.toString(),
    });

    return NextResponse.json({ success: true, message: "Class deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/classes/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete class." }, { status: 500 });
  }
}
