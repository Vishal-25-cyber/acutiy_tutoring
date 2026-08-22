import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import LiveSession from "@/models/LiveSession";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const userSession = await getSession();
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, sessionId, question, options, optionIndex } = await req.json();
    await connectToDatabase();

    const session = await LiveSession.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Live session not found" }, { status: 404 });
    }

    // Teacher creates or ends a poll
    if (action === "CREATE") {
      if (userSession.role !== "TEACHER" && userSession.role !== "ADMIN") {
        return NextResponse.json({ error: "Only teachers can create classroom polls" }, { status: 403 });
      }

      session.activePoll = {
        question: question || "Quick Concept Check",
        options: (options || ["Option A", "Option B", "Option C", "Option D"]).map((opt: string) => ({
          text: opt,
          votes: 0,
        })),
        isActive: true,
        votedUserIds: [],
      };
      await session.save();

      return NextResponse.json({ success: true, poll: session.activePoll });
    }

    // Student votes
    if (action === "VOTE") {
      if (!session.activePoll || !session.activePoll.isActive) {
        return NextResponse.json({ error: "No active poll in this classroom" }, { status: 400 });
      }

      if (session.activePoll.votedUserIds.includes(userSession.userId)) {
        return NextResponse.json({ error: "You have already voted in this poll" }, { status: 400 });
      }

      if (typeof optionIndex === "number" && session.activePoll.options[optionIndex]) {
        session.activePoll.options[optionIndex].votes += 1;
        session.activePoll.votedUserIds.push(userSession.userId);
        await session.save();
      }

      return NextResponse.json({ success: true, poll: session.activePoll });
    }

    // Close poll
    if (action === "CLOSE") {
      if (session.activePoll) {
        session.activePoll.isActive = false;
        await session.save();
      }
      return NextResponse.json({ success: true, poll: session.activePoll });
    }

    return NextResponse.json({ error: "Invalid poll action" }, { status: 400 });
  } catch (error: any) {
    console.error("Poll API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
