import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const profile = await StudentProfile.findOne({ userId: session.userId });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const assignments = await Assignment.find({
      classLevel: profile.currentClass,
      batchId: profile.batchId,
    })
      .populate("teacherId", "name email")
      .sort({ dueDate: 1 });

    const submissions = await AssignmentSubmission.find({ studentId: session.userId });
    const submissionMap = new Map(submissions.map((s) => [s.assignmentId.toString(), s]));

    const result = assignments.map((assignment) => {
      const submission = submissionMap.get(assignment._id.toString());
      let status: "PENDING" | "SUBMITTED" | "EVALUATED" | "OVERDUE" = "PENDING";

      if (submission) {
        status = submission.status;
      } else if (new Date(assignment.dueDate).getTime() < Date.now()) {
        status = "OVERDUE";
      }

      return {
        assignment,
        submission: submission || null,
        calculatedStatus: status,
      };
    });

    return NextResponse.json({ assignments: result });
  } catch (error: any) {
    console.error("Student Assignments Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
