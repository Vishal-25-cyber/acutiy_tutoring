import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    await StudentProfile.updateOne(
      { userId: session.userId },
      { $set: { hasSeenTrialWelcome: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking trial welcome as seen:", error);
    return NextResponse.json({ error: "Failed to update trial status" }, { status: 500 });
  }
}
