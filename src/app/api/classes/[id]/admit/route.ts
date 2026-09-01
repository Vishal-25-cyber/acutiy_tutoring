import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";

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

  // Fallback: look for today's live or active session
  const now = new Date();
  const todayDateStr = now.toISOString().split("T")[0];
  const liveSession = await LiveSession.findOne({
    date: todayDateStr,
    status: { $in: ["LIVE", "PUBLISHED", "SCHEDULED"] },
  }).sort({ updatedAt: -1 });
  if (liveSession) return liveSession;

  return await LiveSession.findOne({ status: "LIVE" }) || await LiveSession.findOne().sort({ updatedAt: -1 });
}

// ─────────────────────────────────────────────────────────────────
// POST — Student knocks (requests to join) or re-knocks after leaving/denial
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

    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);

    if (!classDoc) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const userId = session.userId;

    if (!classDoc.admittedStudents) classDoc.admittedStudents = [];
    if (!classDoc.deniedStudents) classDoc.deniedStudents = [];
    if (!classDoc.pendingAdmissions) classDoc.pendingAdmissions = [];

    // Reset previous states so every knock is a fresh request to the faculty
    classDoc.deniedStudents = (classDoc.deniedStudents as any[]).filter(
      (e: any) => e.userId !== userId
    );
    classDoc.admittedStudents = (classDoc.admittedStudents as any[]).filter(
      (e: any) => e.userId !== userId
    );

    // Add to pending (idempotent — update timestamp if already pending)
    const existingPending = (classDoc.pendingAdmissions as any[]).find(
      (e: any) => e.userId === userId
    );
    if (!existingPending) {
      (classDoc.pendingAdmissions as any[]).push({
        userId,
        name: studentName,
        requestedAt: new Date(),
      });
    } else {
      existingPending.requestedAt = new Date();
      existingPending.name = studentName;
    }

    await classDoc.save();

    return NextResponse.json({ status: "PENDING" });
  } catch (err: any) {
    console.error("POST /api/classes/[id]/admit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE — Student cancels knock, leaves lobby, or leaves live classroom
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
    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const userId = session.userId;

    // Remove student from both pending and admitted when they leave the classroom
    if (classDoc.pendingAdmissions) {
      classDoc.pendingAdmissions = (classDoc.pendingAdmissions as any[]).filter(
        (e: any) => e.userId !== userId
      );
    }
    if (classDoc.admittedStudents) {
      classDoc.admittedStudents = (classDoc.admittedStudents as any[]).filter(
        (e: any) => e.userId !== userId
      );
    }
    await classDoc.save();

    return NextResponse.json({ success: true, message: "Participant left classroom" });
  } catch (err: any) {
    console.error("DELETE /api/classes/[id]/admit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// GET — Poll admission status
//   ?userId=...  → student polls for their own status
//   (no userId)  → teacher fetches full pending list
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

    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);

    if (!classDoc) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    // STUDENT POLL: Check if this specific student is admitted or denied
    if (queryUserId) {
      const isAdmitted = (classDoc.admittedStudents || []).some(
        (e: any) => e.userId === queryUserId
      );
      if (isAdmitted) {
        return NextResponse.json({ status: "ADMITTED" });
      }

      const isDenied = (classDoc.deniedStudents || []).some(
        (e: any) => e.userId === queryUserId
      );
      if (isDenied) {
        return NextResponse.json({ status: "DENIED" });
      }

      return NextResponse.json({ status: "PENDING" });
    }

    // TEACHER POLL: Return full pending queue and admitted list
    return NextResponse.json({
      pendingAdmissions: (classDoc.pendingAdmissions || []).map((e: any) => ({
        userId: e.userId,
        name: e.name,
        requestedAt: e.requestedAt,
      })),
      admittedStudents: (classDoc.admittedStudents || []).map((e: any) => ({
        userId: e.userId,
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

    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);

    if (!classDoc) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (!classDoc.admittedStudents) classDoc.admittedStudents = [];
    if (!classDoc.deniedStudents) classDoc.deniedStudents = [];
    if (!classDoc.pendingAdmissions) classDoc.pendingAdmissions = [];

    // Find student name from pending
    const pendingItem = (classDoc.pendingAdmissions as any[]).find(
      (e: any) => e.userId === userId
    );
    const studentName = pendingItem?.name || "Student";

    // Remove from pending
    classDoc.pendingAdmissions = (classDoc.pendingAdmissions as any[]).filter(
      (e: any) => e.userId !== userId
    );

    if (action === "ADMIT") {
      const alreadyAdmitted = (classDoc.admittedStudents as any[]).some(
        (e: any) => e.userId === userId
      );
      if (!alreadyAdmitted) {
        (classDoc.admittedStudents as any[]).push({
          userId,
          name: studentName,
          admittedAt: new Date(),
        });
      }
      // Remove from denied if previously denied
      classDoc.deniedStudents = (classDoc.deniedStudents as any[]).filter(
        (e: any) => e.userId !== userId
      );
    } else if (action === "DENY") {
      const alreadyDenied = (classDoc.deniedStudents as any[]).some(
        (e: any) => e.userId === userId
      );
      if (!alreadyDenied) {
        (classDoc.deniedStudents as any[]).push({
          userId,
          name: studentName,
          deniedAt: new Date(),
        });
      }
      classDoc.admittedStudents = (classDoc.admittedStudents as any[]).filter(
        (e: any) => e.userId !== userId
      );
    }

    await classDoc.save();

    return NextResponse.json({
      success: true,
      action,
      userId,
      pendingAdmissions: classDoc.pendingAdmissions,
      admittedStudents: classDoc.admittedStudents,
    });
  } catch (err: any) {
    console.error("PATCH /api/classes/[id]/admit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const PUT = PATCH;
