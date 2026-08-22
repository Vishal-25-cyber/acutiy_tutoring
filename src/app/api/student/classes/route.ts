import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import LiveSession from "@/models/LiveSession";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const profile = await StudentProfile.findOne({ userId: session.userId }).populate("batchId");
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const classes = await LiveSession.find({
      classLevel: profile.currentClass,
      batchId: profile.batchId,
    })
      .populate("teacherId", "name avatarUrl email")
      .populate("batchId")
      .sort({ date: -1, startTime: 1 });

    return NextResponse.json({
      classes,
      batch: profile.batchId,
      currentClass: profile.currentClass,
    });
  } catch (error: any) {
    console.error("Student Classes API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
