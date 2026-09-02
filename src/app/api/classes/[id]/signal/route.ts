import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import LiveSession from "@/models/LiveSession";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// In-memory signaling cache for low-latency WebRTC exchange between laptops
export const roomSignals: Record<
  string,
  {
    isEnded?: boolean;
    admissions?: Record<string, "ADMITTED" | "DENIED">;
    participants: Record<string, { id: string; name: string; role: string; lastSeen: number; isCameraOn?: boolean; isMicOn?: boolean; isScreenSharing?: boolean }>;
    signals: Array<{ id?: number; from: string; to?: string; type: "offer" | "answer" | "candidate" | "leave" | "CLASS_ENDED" | "CLIENT_JOINED" | string; data?: any; timestamp: number }>;
    signalSeq: number;
  }
> = {};

// In-memory alias cache (meetingId / livekitRoomId -> canonical Mongo ID)
export const roomAliases: Record<string, string> = {};

export async function resolveCanonicalRoomId(id: string): Promise<string> {
  if (!id) return "default-room";
  if (roomAliases[id]) return roomAliases[id];

  try {
    await connectToDatabase();
    let doc: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      doc = await LiveSession.findById(id).select("_id meetingId livekitRoomId");
    }
    if (!doc) {
      doc = await LiveSession.findOne({
        $or: [{ meetingId: id }, { livekitRoomId: id }],
      }).select("_id meetingId livekitRoomId");
    }
    if (doc) {
      const canonical = doc._id.toString();
      roomAliases[id] = canonical;
      if (doc.meetingId) roomAliases[doc.meetingId] = canonical;
      if (doc.livekitRoomId) roomAliases[doc.livekitRoomId] = canonical;

      // Link all alias instances to the exact same shared room object
      const sharedRoom =
        roomSignals[canonical] ||
        roomSignals[id] ||
        (doc.meetingId && roomSignals[doc.meetingId]) ||
        (doc.livekitRoomId && roomSignals[doc.livekitRoomId]) ||
        { participants: {}, signals: [], admissions: {}, signalSeq: 0 };

      roomSignals[canonical] = sharedRoom;
      roomSignals[id] = sharedRoom;
      if (doc.meetingId) roomSignals[doc.meetingId] = sharedRoom;
      if (doc.livekitRoomId) roomSignals[doc.livekitRoomId] = sharedRoom;

      return canonical;
    }
  } catch {}

  roomAliases[id] = id;
  return id;
}

export function getRoom(roomId: string) {
  const targetId = roomAliases[roomId] || roomId;
  if (!roomSignals[targetId]) {
    roomSignals[targetId] = { participants: {}, signals: [], admissions: {}, signalSeq: 0 };
  }
  if (!roomSignals[targetId].admissions) {
    roomSignals[targetId].admissions = {};
  }
  if (typeof roomSignals[targetId].signalSeq !== "number") {
    roomSignals[targetId].signalSeq = 0;
  }
  if (roomId !== targetId) {
    roomSignals[roomId] = roomSignals[targetId];
  }

  // Clean up old signals (>60s) and inactive participants (>25s)
  const now = Date.now();
  roomSignals[targetId].signals = roomSignals[targetId].signals.filter((s) => now - s.timestamp < 60000);
  for (const [pid, p] of Object.entries(roomSignals[targetId].participants)) {
    if (now - p.lastSeen > 25000) {
      delete roomSignals[targetId].participants[pid];
    }
  }
  return roomSignals[targetId];
}

// POST: Send WebRTC offer, answer, ICE candidate, heartbeat, or CLASS_ENDED
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    const { id: roomId } = await params;
    const body = await req.json();
    const { senderId, name, role, type, to, data, isCameraOn, isMicOn, isScreenSharing } = body;

    const userId = senderId || session?.userId || `user-${Date.now()}`;
    const userName = name || session?.name || "Participant";
    const userRole = role || session?.role || "STUDENT";

    const canonicalId = await resolveCanonicalRoomId(roomId);
    const room = getRoom(canonicalId);

    if (type === "CLASS_ENDED") {
      room.isEnded = true;
      room.signalSeq = (room.signalSeq || 0) + 1;
      room.signals.push({
        id: room.signalSeq,
        from: userId,
        type: "CLASS_ENDED",
        timestamp: Date.now(),
      });
      return NextResponse.json({ success: true, isEnded: true, lastSeq: room.signalSeq });
    }

    // Update participant presence
    room.participants[userId] = {
      id: userId,
      name: userName,
      role: userRole,
      lastSeen: Date.now(),
      isCameraOn: isCameraOn ?? true,
      isMicOn: isMicOn ?? true,
      isScreenSharing: isScreenSharing ?? false,
    };

    // If signaling payload included (offer, answer, ICE candidate, CLIENT_JOINED)
    if (type) {
      room.signalSeq = (room.signalSeq || 0) + 1;
      room.signals.push({
        id: room.signalSeq,
        from: userId,
        to,
        type,
        data,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      success: true,
      isEnded: Boolean(room.isEnded),
      timestamp: Date.now(),
      lastSeq: room.signalSeq,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: Retrieve signals and active participants for this room
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "";
    const sinceSeq = parseInt(searchParams.get("sinceSeq") || "0", 10);
    const sinceTime = parseInt(searchParams.get("since") || "0", 10);

    const canonicalId = await resolveCanonicalRoomId(roomId);
    const room = getRoom(canonicalId);

    // Signals meant for this user or broadcast to everyone, excluding self
    const relevantSignals = room.signals.filter((s) => {
      if (s.from === userId) return false;
      if (sinceSeq > 0) {
        if (typeof s.id === "number" && s.id <= sinceSeq) return false;
      } else if (sinceTime > 0) {
        if (s.timestamp <= sinceTime) return false;
      }
      if (s.to && s.to !== userId) return false;
      return true;
    });

    const activeParticipants = Object.values(room.participants);

    return NextResponse.json({
      isEnded: Boolean(room.isEnded),
      signals: relevantSignals,
      participants: activeParticipants,
      serverTime: Date.now(),
      lastSeq: room.signalSeq || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
