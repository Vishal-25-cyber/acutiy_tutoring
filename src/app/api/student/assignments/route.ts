import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const profile = await StudentProfile.findOne({ userId: session.userId }).lean();
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Query real assignments for the student's class
    const assignments = await Assignment.find({
      classLevel: profile.currentClass,
    })
      .populate("teacherId", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    const submissions = await AssignmentSubmission.find({ studentId: session.userId }).lean();
    const submissionMap = new Map(submissions.map((s: any) => [s.assignmentId.toString(), s]));

    const result = assignments.map((assignment: any) => {
      const submission: any = submissionMap.get(assignment._id.toString());
      let status: "PENDING" | "SUBMITTED" | "EVALUATED" | "OVERDUE" = "PENDING";

      if (submission) {
        status = submission.status || "SUBMITTED";
      } else if (assignment.dueDate && new Date(assignment.dueDate).getTime() < Date.now()) {
        status = "OVERDUE";
      }

      return {
        _id: assignment._id.toString(),
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        classLevel: assignment.classLevel,
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks || 20,
        attachmentUrl: assignment.attachmentUrl,
        teacher: assignment.teacherId,
        submission: submission
          ? {
              _id: submission._id.toString(),
              status: submission.status,
              submissionText: submission.submissionText,
              fileUrl: submission.fileUrl,
              submittedAt: submission.submittedAt,
              marksObtained: submission.marksObtained,
              feedback: submission.feedback,
              gradedAt: submission.gradedAt,
            }
          : null,
        calculatedStatus: status,
      };
    });

    return NextResponse.json({
      assignments: result,
      studentClass: profile.currentClass,
      board: profile.board || "CBSE",
    }, {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (error: any) {
    console.error("Student Assignments Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
