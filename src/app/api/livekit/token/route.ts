import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import Attendance from "@/models/Attendance";
import { getSession } from "@/lib/auth/session";
import { createLivekitToken } from "@/lib/livekit/token";

export async function POST(req: NextRequest) {
  try {
    const userSession = await getSession();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    await connectToDatabase();
    let liveSession: any = null;

    if (mongoose.Types.ObjectId.isValid(sessionId)) {
      liveSession = await LiveSession.findById(sessionId)
        .populate("batchId")
        .populate("teacherId", "name email avatarUrl");
    }

    if (!liveSession) {
      liveSession = await LiveSession.findOne({
        $or: [{ meetingId: sessionId }, { livekitRoomId: sessionId }],
      })
        .populate("batchId")
        .populate("teacherId", "name email avatarUrl");
    }

    if (!liveSession) {
      liveSession = await LiveSession.findOne({ status: "LIVE" })
        .populate("batchId")
        .populate("teacherId", "name email avatarUrl");
    }

    if (!liveSession) {
      return NextResponse.json({ error: "Live session not found." }, { status: 404 });
    }

    const teacherObj = liveSession.teacherId as any;
    const isTeacher = userSession.role === "TEACHER" || userSession.role === "ADMIN";
    const isAdmin = userSession.role === "ADMIN";

    // If STUDENT: Enforce Batch, Class & 5-Minute Grace Period Lockout
    if (userSession.role === "STUDENT") {
      const studentProfile = await StudentProfile.findOne({ userId: userSession.userId });
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
      }

      // If class is not already LIVE, check class level and batch assignment
      if (liveSession.status !== "LIVE") {
        if (studentProfile.currentClass && liveSession.classLevel && studentProfile.currentClass !== liveSession.classLevel) {
          return NextResponse.json(
            { error: `This live class is for ${liveSession.classLevel}. You are enrolled in ${studentProfile.currentClass}.` },
            { status: 403 }
          );
        }

        const studentBatchId = studentProfile.batchId?.toString();
        const sessionBatchId =
          typeof liveSession.batchId === "object"
            ? (liveSession.batchId as any)._id?.toString()
            : liveSession.batchId?.toString();

        if (studentBatchId && sessionBatchId && studentBatchId !== sessionBatchId) {
          return NextResponse.json(
            { error: "You are not assigned to this class batch." },
            { status: 403 }
          );
        }
      }

      // Check Late Entry Grace Period only if session is not active/LIVE
      const graceMinutes = liveSession.gracePeriodMinutes ?? 15;
      const now = new Date();

      // Parse class start datetime
      const sessionStartDateTime = new Date(`${liveSession.date}T${(liveSession.startTime || "00:00").padStart(5, "0")}:00`);

      if (liveSession.status !== "LIVE" && !isNaN(sessionStartDateTime.getTime())) {
        const diffMs = now.getTime() - sessionStartDateTime.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffMinutes > graceMinutes && !liveSession.allowLateJoinManually && liveSession.status !== "COMPLETED") {
          return NextResponse.json(
            {
              error: "ENTRY_CLOSED",
              message: "Class entry is closed. You can access the learning materials and recording after the class.",
              graceMinutes,
              diffMinutes,
            },
            { status: 403 }
          );
        }
      }

      // Record / Update Attendance on Join
      const existingAttendance = await Attendance.findOne({
        studentId: userSession.userId,
        sessionId: liveSession._id,
      });

      if (!existingAttendance) {
        const isLate =
          !isNaN(sessionStartDateTime.getTime()) &&
          now.getTime() - sessionStartDateTime.getTime() > 2 * 60 * 1000;

        await Attendance.create({
          studentId: userSession.userId,
          sessionId: liveSession._id,
          batchId: liveSession.batchId,
          classLevel: liveSession.classLevel,
          joinTime: now,
          status: isLate ? "LATE" : "PRESENT",
          durationMinutes: 0,
        });

        // Update student attendance stats
        await StudentProfile.findOneAndUpdate(
          { userId: userSession.userId },
          { $inc: { totalClassesAttended: 1 } }
        );
      }
    }

    // Generate Token
    const roomName = liveSession.livekitRoomId || `acuity-room-${liveSession._id}`;
    const token = await createLivekitToken({
      roomName,
      participantIdentity: userSession.userId,
      participantName: userSession.name,
      isTeacher: isTeacher || isAdmin,
    });

    // If teacher joins and session was SCHEDULED or PUBLISHED, mark it LIVE
    if ((isTeacher || isAdmin) && (liveSession.status === "SCHEDULED" || liveSession.status === "PUBLISHED")) {
      liveSession.status = "LIVE";
      if (!liveSession.actualStartTime) liveSession.actualStartTime = new Date();
      await liveSession.save();
    }

    return NextResponse.json({
      token,
      roomName,
      serverUrl: process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://mantif-tutoring-m774kgwp.livekit.cloud",
      session: {
        id: liveSession._id,
        title: liveSession.title,
        subject: liveSession.subject,
        classLevel: liveSession.classLevel,
        topic: liveSession.topic,
        status: liveSession.status,
        startTime: liveSession.startTime,
        endTime: liveSession.endTime,
        gracePeriodMinutes: liveSession.gracePeriodMinutes,
        teacher: liveSession.teacherId,
        activePoll: liveSession.activePoll,
      },
    });
  } catch (error: any) {
    console.error("LiveKit Token Error:", error);
    return NextResponse.json({ error: error.message || "Failed to join live session." }, { status: 500 });
  }
}
