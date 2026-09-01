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

  // Fallback: look for an active live session
  const liveSession = await LiveSession.findOne({ status: "LIVE" });
  if (liveSession) return liveSession;

  return await LiveSession.findOne();
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

    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);

    if (!classDoc) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const userId = session.userId;

    if (!classDoc.admittedStudents) classDoc.admittedStudents = [];
    if (!classDoc.deniedStudents) classDoc.deniedStudents = [];
    if (!classDoc.pendingAdmissions) classDoc.pendingAdmissions = [];

    // Already admitted → tell the client to enter directly
    const alreadyAdmitted = (classDoc.admittedStudents as any[]).some(
      (e: any) => e.userId === userId
    );
    if (alreadyAdmitted) {
      return NextResponse.json({ status: "ADMITTED" });
    }

    // Already denied → inform
    const alreadyDenied = (classDoc.deniedStudents as any[]).some(
      (e: any) => e.userId === userId
    );
    if (alreadyDenied) {
      return NextResponse.json({ status: "DENIED" });
    }

    // Add to pending (idempotent — skip if already pending)
    const alreadyPending = (classDoc.pendingAdmissions as any[]).some(
      (e: any) => e.userId === userId
    );
    if (!alreadyPending) {
      (classDoc.pendingAdmissions as any[]).push({
        userId,
        name: studentName,
        requestedAt: new Date(),
      });
      await classDoc.save();
    }

    return NextResponse.json({ status: "PENDING" });
  } catch (err: any) {
    console.error("POST /api/classes/[id]/admit error:", err);
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
    const pollUserId = searchParams.get("userId");

    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);

    if (!classDoc) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (!classDoc.admittedStudents) classDoc.admittedStudents = [];
    if (!classDoc.deniedStudents) classDoc.deniedStudents = [];
    if (!classDoc.pendingAdmissions) classDoc.pendingAdmissions = [];

    // ── Student polling their own status ──
    if (pollUserId) {
      const admitted = (classDoc.admittedStudents || []).some(
        (e: any) => e.userId === pollUserId
      );
      if (admitted) return NextResponse.json({ status: "ADMITTED" });

      const denied = (classDoc.deniedStudents || []).some(
        (e: any) => e.userId === pollUserId
      );
      if (denied) return NextResponse.json({ status: "DENIED" });

      return NextResponse.json({ status: "PENDING" });
    }

    return NextResponse.json({
      pendingAdmissions: classDoc.pendingAdmissions || [],
      admittedStudents: classDoc.admittedStudents || [],
    });
  } catch (err: any) {
    console.error("GET /api/classes/[id]/admit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// PUT — Teacher admits or denies a student
// Body: { userId: string, action: "ADMIT" | "DENY" }
// ─────────────────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { userId, action } = body as { userId: string; action: "ADMIT" | "DENY" };

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action are required." }, { status: 400 });
    }

    await connectToDatabase();
    const classDoc = await resolveClassDoc(id);
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (!classDoc.admittedStudents) classDoc.admittedStudents = [];
    if (!classDoc.deniedStudents) classDoc.deniedStudents = [];
    if (!classDoc.pendingAdmissions) classDoc.pendingAdmissions = [];

    // Remove from pending regardless of action
    (classDoc.pendingAdmissions as any[]) = (classDoc.pendingAdmissions as any[]).filter(
      (e: any) => e.userId !== userId
    );

    if (action === "ADMIT") {
      const alreadyIn = (classDoc.admittedStudents as any[]).some(
        (e: any) => e.userId === userId
      );
      if (!alreadyIn) {
        (classDoc.admittedStudents as any[]).push({ userId, admittedAt: new Date() });
      }
    } else if (action === "DENY") {
      const alreadyDenied = (classDoc.deniedStudents as any[]).some(
        (e: any) => e.userId === userId
      );
      if (!alreadyDenied) {
        (classDoc.deniedStudents as any[]).push({ userId });
      }
    }

    await classDoc.save();

    return NextResponse.json({ success: true, action });
  } catch (err: any) {
    console.error("PUT /api/classes/[id]/admit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
