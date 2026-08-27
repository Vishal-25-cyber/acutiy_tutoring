import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const todayStr = new Date().toISOString().split("T")[0];

    let query: any = {};

    if (session.role === "STUDENT") {
      const studentProfile = await StudentProfile.findOne({ userId: session.userId });
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
      }

      query = {
        batchId: studentProfile.batchId,
        classLevel: studentProfile.currentClass,
        status: { $in: ["PUBLISHED", "SCHEDULED", "LIVE"] },
        date: { $gte: todayStr },
      };
    } else if (session.role === "TEACHER") {
      query = {
        teacherId: session.userId,
        status: { $in: ["PUBLISHED", "SCHEDULED", "LIVE", "DRAFT"] },
        date: { $gte: todayStr },
      };
    } else {
      query = {
        status: { $in: ["PUBLISHED", "SCHEDULED", "LIVE"] },
        date: { $gte: todayStr },
      };
    }

    const classes = await LiveSession.find(query)
      .populate("batchId")
      .populate("teacherId", "name email avatarUrl")
      .sort({ date: 1, startTime: 1 })
      .lean();

    return NextResponse.json({ classes });
  } catch (error: any) {
    console.error("GET /api/classes/upcoming error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch upcoming classes." }, { status: 500 });
  }
}
