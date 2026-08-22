import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import Attendance from "@/models/Attendance";
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

    const attendanceRecords = await Attendance.find({ studentId: session.userId })
      .populate("sessionId", "title subject topic date startTime endTime")
      .sort({ createdAt: -1 });

    const totalSessions = attendanceRecords.length || 1;
    const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
    const lateCount = attendanceRecords.filter((a) => a.status === "LATE").length;
    const partialCount = attendanceRecords.filter((a) => a.status === "PARTIAL").length;
    const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;

    const attendancePercentage = Math.round(((presentCount + lateCount) / totalSessions) * 100);

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (attendancePercentage < 65) {
      riskLevel = "HIGH";
    } else if (attendancePercentage < 75) {
      riskLevel = "MEDIUM";
    }

    return NextResponse.json({
      records: attendanceRecords,
      stats: {
        totalSessions: attendanceRecords.length,
        presentCount,
        lateCount,
        partialCount,
        absentCount,
        attendancePercentage,
        riskLevel,
        streakCount: profile.streakCount || 3,
        earnedBadges: profile.earnedBadges || [],
      },
    });
  } catch (error: any) {
    console.error("Student Attendance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
