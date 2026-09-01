import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import TeacherRemark from "@/models/TeacherRemark";
import ParentCommunication from "@/models/ParentCommunication";
import { generateStudentPerformanceReport } from "@/lib/performance-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> | { studentId: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Teacher or Admin access required." }, { status: 401 });
    }

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(params);
    const { studentId } = resolvedParams;

    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return NextResponse.json({ error: "Invalid student identifier." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "LAST_90_DAYS";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const report = await generateStudentPerformanceReport(studentId, {
      period,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("Student Performance Detail API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate student performance report." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> | { studentId: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Staff/Teacher access required." }, { status: 401 });
    }

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(params);
    const { studentId } = resolvedParams;
    const body = await req.json();
    const { action } = body;

    const studentObjId = new mongoose.Types.ObjectId(studentId);
    const teacherObjId = new mongoose.Types.ObjectId(session.userId);

    // 1. SAVE TEACHER REMARK
    if (action === "SAVE_REMARK") {
      const { observation, academicFeedback, participationFeedback, areasForImprovement, recommendations } = body;

      const remark = await TeacherRemark.findOneAndUpdate(
        { studentId: studentObjId },
        {
          studentId: studentObjId,
          teacherId: teacherObjId,
          teacherName: session.name || "Academic Staff",
          observation: observation?.trim() || "",
          academicFeedback: academicFeedback?.trim() || "",
          participationFeedback: participationFeedback?.trim() || "",
          areasForImprovement: areasForImprovement?.trim() || "",
          recommendations: recommendations?.trim() || "",
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: "Teacher remarks updated successfully.",
        remark,
      });
    }

    // 2. ADD PARENT COMMUNICATION LOG
    if (action === "ADD_PARENT_COMM") {
      const { communicationMethod, discussionSummary, followUpDate, followUpStatus } = body;

      if (!discussionSummary || !discussionSummary.trim()) {
        return NextResponse.json({ error: "Discussion summary is required." }, { status: 400 });
      }

      const comm = await ParentCommunication.create({
        studentId: studentObjId,
        teacherId: teacherObjId,
        teacherName: session.name || "Academic Counselor",
        contactDate: new Date(),
        communicationMethod: communicationMethod || "CALL",
        discussionSummary: discussionSummary.trim(),
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        followUpStatus: followUpStatus || "PENDING",
      });

      return NextResponse.json({
        success: true,
        message: "Parent communication log recorded successfully.",
        communication: comm,
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    console.error("Save Report Meta API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save report data." }, { status: 500 });
  }
}
