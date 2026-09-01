import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";

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

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type"); // "ASSIGNMENT" | "TEST" | "HOMEWORK" | "ALL"

    // Query real assignments for the student's class or assigned batch
    const orConditions: any[] = [{ classLevel: profile.currentClass }];
    if (profile.batchId) {
      orConditions.push({ batchId: profile.batchId });
    }

    const query: any = { $or: orConditions };
    if (typeFilter && typeFilter !== "ALL") {
      query.type = typeFilter;
    }

    const assignments = await Assignment.find(query)
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
        type: assignment.type || "ASSIGNMENT",
        durationMinutes: assignment.durationMinutes || 45,
        proctoringRequired: assignment.proctoringRequired ?? true,
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks || 20,
        attachmentUrl: assignment.attachmentUrl,
        teacher: assignment.teacherId,
        submission: submission
          ? {
              _id: submission._id.toString(),
              type: submission.type || assignment.type || "ASSIGNMENT",
              status: submission.status,
              submissionText: submission.submissionText,
              fileUrl: submission.fileUrl,
              proctoringSnapshotUrl: submission.proctoringSnapshotUrl,
              timeTakenMinutes: submission.timeTakenMinutes,
              submittedAt: submission.submittedAt,
              marksObtained: submission.marksObtained,
              feedback: submission.feedback,
              gradedAt: submission.gradedAt,
            }
          : null,
        calculatedStatus: status,
      };
    });

    return NextResponse.json(
      {
        assignments: result,
        studentClass: profile.currentClass,
        board: profile.board || "CBSE",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Student Assignments Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
