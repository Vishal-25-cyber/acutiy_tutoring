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
    participants: Record<string, { id: string; name: string; role: string; lastSeen: number; isCameraOn?: boolean; isMicOn?: boolean; isScreenSharing?: boolean }>;
    signals: Array<{ from: string; to?: string; type: "offer" | "answer" | "candidate" | "leave" | "CLASS_ENDED"; data?: any; timestamp: number }>;
  }
> = {};

// In-memory alias cache (meetingId / livekitRoomId -> canonical Mongo ID)
const roomAliases: Record<string, string> = {};

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
      return canonical;
    }
  } catch {}

  roomAliases[id] = id;
  return id;
}

export function getRoom(roomId: string) {
  const targetId = roomAliases[roomId] || roomId;
  if (!roomSignals[targetId]) {
    roomSignals[targetId] = { participants: {}, signals: [] };
  }
  // Clean up old signals (>30s) and inactive participants (>20s)
  const now = Date.now();
  roomSignals[targetId].signals = roomSignals[targetId].signals.filter((s) => now - s.timestamp < 30000);
  for (const [pid, p] of Object.entries(roomSignals[targetId].participants)) {
    if (now - p.lastSeen > 20000) {
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
      room.signals.push({
        from: userId,
        type: "CLASS_ENDED",
        timestamp: Date.now(),
      });
      return NextResponse.json({ success: true, isEnded: true });
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

    // If signaling payload included (offer, answer, ICE candidate)
    if (type && data) {
      room.signals.push({
        from: userId,
        to,
        type,
        data,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ success: true, isEnded: Boolean(room.isEnded), timestamp: Date.now() });
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
    const since = parseInt(searchParams.get("since") || "0", 10);

    const canonicalId = await resolveCanonicalRoomId(roomId);
    const room = getRoom(canonicalId);

    // Signals meant for this user or broadcast to everyone, excluding self
    const relevantSignals = room.signals.filter((s) => {
      if (s.from === userId) return false;
      if (s.timestamp <= since) return false;
      if (s.to && s.to !== userId) return false;
      return true;
    });

    const activeParticipants = Object.values(room.participants);

    return NextResponse.json({
      isEnded: Boolean(room.isEnded),
      signals: relevantSignals,
      participants: activeParticipants,
      serverTime: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
