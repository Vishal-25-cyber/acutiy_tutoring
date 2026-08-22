import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Assignment from "@/models/Assignment";
import Notification from "@/models/Notification";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId, marksObtained, feedback } = await req.json();
    if (!submissionId || marksObtained === undefined) {
      return NextResponse.json({ error: "Submission ID and marks are required." }, { status: 400 });
    }

    await connectToDatabase();
    const submission = await AssignmentSubmission.findById(submissionId).populate("assignmentId");
    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    submission.marksObtained = Number(marksObtained);
    submission.feedback = feedback || "Good work, keep practicing!";
    submission.status = "EVALUATED";
    submission.gradedBy = session.userId as any;
    submission.gradedAt = new Date();
    await submission.save();

    // Notify student
    const assignmentTitle = (submission.assignmentId as any)?.title || "Assignment";
    await Notification.create({
      userId: submission.studentId,
      title: `Assignment Evaluated: ${assignmentTitle}`,
      message: `Your score: ${marksObtained} marks. Teacher Feedback: "${feedback || "Well done!"}"`,
      type: "ASSIGNMENT",
      linkUrl: "/student/assignments",
    });

    return NextResponse.json({
      success: true,
      message: "Submission evaluated successfully and feedback delivered to student.",
      submission,
    });
  } catch (error: any) {
    console.error("Evaluate Assignment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
