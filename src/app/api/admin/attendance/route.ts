import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Attendance from "@/models/Attendance";
import StudentProfile from "@/models/StudentProfile";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classLevel = searchParams.get("classLevel");
    const batchId = searchParams.get("batchId");
    const status = searchParams.get("status");

    await connectToDatabase();

    const filter: any = {};
    if (classLevel && classLevel !== "ALL") filter.classLevel = classLevel;
    if (batchId && batchId !== "ALL") filter.batchId = batchId;
    if (status && status !== "ALL") filter.status = status;

    const rawRecords = await Attendance.find(filter)
      .populate("studentId", "name email phone")
      .populate("sessionId", "title subject topic date startTime")
      .populate("batchId", "name")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Only keep records that belong to existing students
    const records = rawRecords.filter((r: any) => r.studentId != null);

    // Aggregate statistics
    const totalCount = records.length;
    const presentCount = records.filter((r: any) => r.status === "PRESENT").length;
    const lateCount = records.filter((r: any) => r.status === "LATE").length;
    const partialCount = records.filter((r: any) => r.status === "PARTIAL").length;
    const absentCount = records.filter((r: any) => r.status === "ABSENT").length;

    const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 100;

    // High risk students
    const highRiskStudents = await StudentProfile.find({ attendanceRiskLevel: "HIGH" })
      .populate("userId", "name email phone")
      .populate("batchId", "name");

    return NextResponse.json({
      records,
      stats: {
        totalRecords: totalCount,
        presentCount,
        lateCount,
        partialCount,
        absentCount,
        attendanceRate,
        highRiskCount: highRiskStudents.length,
      },
      highRiskStudents,
    });
  } catch (error: any) {
    console.error("Admin Attendance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
