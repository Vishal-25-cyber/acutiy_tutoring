import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import { getRoom, resolveCanonicalRoomId } from "../signal/route";

export const dynamic = "force-dynamic";

async function resolveClassDoc(id: string) {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const doc = await LiveSession.findById(id);
    if (doc) return doc;
  }
  const byMeetingId = await LiveSession.findOne({
    $or: [{ meetingId: id }, { livekitRoomId: id }],
  });
  if (byMeetingId) return byMeetingId;

  // Fallback: look for today's active session
  const now = new Date();
  const todayDateStr = now.toISOString().split("T")[0];
  const liveSession = await LiveSession.findOne({
    date: todayDateStr,
    status: { $in: ["LIVE", "PUBLISHED", "SCHEDULED"] },
  }).sort({ updatedAt: -1 });
  if (liveSession) return liveSession;

  return (await LiveSession.findOne({ status: "LIVE" })) || (await LiveSession.findOne().sort({ updatedAt: -1 }));
}

// ─────────────────────────────────────────────────────────────────
// POST — Student knocks (requests to join)
// Body: { name?: string }
// ─────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can knock." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const studentName: string = body.name || session.name || "Student";
    const userId = String(session.userId);

    // Clear any prior memory state for fresh knock
    try {
      const canonicalId = await resolveCanonicalRoomId(id);
      const room = getRoom(canonicalId);
      if (room.admissions) delete room.admissions[userId];
    } catch {}

    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    // Atomic DB update
    await LiveSession.findByIdAndUpdate(classDoc._id, {
      $pull: {
        deniedStudents: { userId },
        admittedStudents: { userId },
        pendingAdmissions: { userId },
      },
    });

    await LiveSession.findByIdAndUpdate(classDoc._id, {
      $push: {
        pendingAdmissions: {
          userId,
          name: studentName,
          requestedAt: new Date(),
        },
      },
    });

    return NextResponse.json({ status: "PENDING" });
  } catch (err: any) {
    console.error("POST /api/classes/[id]/admit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE — Student cancels knock or leaves
// ─────────────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const userId = String(session.userId);

    try {
      const canonicalId = await resolveCanonicalRoomId(id);
      const room = getRoom(canonicalId);
      if (room.admissions) delete room.admissions[userId];
    } catch {}

    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);
    if (classDoc) {
      await LiveSession.findByIdAndUpdate(classDoc._id, {
        $pull: {
          pendingAdmissions: { userId },
          admittedStudents: { userId },
        },
      });
    }

    return NextResponse.json({ success: true, message: "Participant left classroom" });
  } catch (err: any) {
    console.error("DELETE /api/classes/[id]/admit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// GET — Poll admission status
// ─────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get("userId");

    // 1. Check instant in-memory cache first
    try {
      const canonicalId = await resolveCanonicalRoomId(id);
      const room = getRoom(canonicalId);
      const checkId = String(queryUserId || session.userId);
      if (room.admissions && room.admissions[checkId]) {
        return NextResponse.json({ status: room.admissions[checkId] });
      }
    } catch {}

    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    // STUDENT POLL: Check if student is admitted or denied
    if (queryUserId || session.role === "STUDENT") {
      const studentIdToCheck = String(queryUserId || session.userId || "");
      const isAdmitted = (classDoc.admittedStudents || []).some(
        (e: any) => String(e.userId) === studentIdToCheck || String(e.userId) === String(session.userId)
      );
      if (isAdmitted) {
        return NextResponse.json({ status: "ADMITTED" });
      }

      const isDenied = (classDoc.deniedStudents || []).some(
        (e: any) => String(e.userId) === studentIdToCheck || String(e.userId) === String(session.userId)
      );
      if (isDenied) {
        return NextResponse.json({ status: "DENIED" });
      }

      return NextResponse.json({ status: "PENDING" });
    }

    // TEACHER POLL: Return full pending queue and admitted list
    return NextResponse.json({
      pendingAdmissions: (classDoc.pendingAdmissions || []).map((e: any) => ({
        userId: String(e.userId),
        name: e.name,
        requestedAt: e.requestedAt,
      })),
      admittedStudents: (classDoc.admittedStudents || []).map((e: any) => ({
        userId: String(e.userId),
        name: e.name,
        admittedAt: e.admittedAt,
      })),
    });
  } catch (err: any) {
    console.error("GET /api/classes/[id]/admit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH / PUT — Teacher admits or denies a student
// Body: { userId: string, action: "ADMIT" | "DENY" }
// ─────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.role !== "TEACHER" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Only teachers can manage admissions." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { userId, action } = body;

    if (!userId || !["ADMIT", "DENY"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request. userId and action ('ADMIT' | 'DENY') are required." },
        { status: 400 }
      );
    }

    const targetUserId = String(userId);

    // 1. Instantly record in in-memory room cache so student gets admitted on next poll
    try {
      const canonicalId = await resolveCanonicalRoomId(id);
      const room = getRoom(canonicalId);
      if (!room.admissions) room.admissions = {};
      room.admissions[targetUserId] = action === "ADMIT" ? "ADMITTED" : "DENIED";
    } catch {}

    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    // Find student name from pending
    const pendingItem = (classDoc.pendingAdmissions as any[]).find(
      (e: any) => String(e.userId) === targetUserId
    );
    const studentName = pendingItem?.name || "Student";

    // 2. Atomic MongoDB update
    if (action === "ADMIT") {
      await LiveSession.findByIdAndUpdate(classDoc._id, {
        $pull: {
          pendingAdmissions: { userId: targetUserId },
          deniedStudents: { userId: targetUserId },
        },
        $addToSet: {
          admittedStudents: {
            userId: targetUserId,
            name: studentName,
            admittedAt: new Date(),
          },
        },
      });
    } else {
      await LiveSession.findByIdAndUpdate(classDoc._id, {
        $pull: {
          pendingAdmissions: { userId: targetUserId },
          admittedStudents: { userId: targetUserId },
        },
        $addToSet: {
          deniedStudents: {
            userId: targetUserId,
            name: studentName,
            deniedAt: new Date(),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      action,
      userId: targetUserId,
    });
  } catch (err: any) {
    console.error("PATCH /api/classes/[id]/admit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return PATCH(req, ctx);
}
