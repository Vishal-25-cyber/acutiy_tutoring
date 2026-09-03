import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Teacher role required." }, { status: 401 });
    }

    const { submissionId, assignmentId, studentId } = await req.json();

    if (!submissionId && (!assignmentId || !studentId)) {
      return NextResponse.json(
        { error: "submissionId or both assignmentId and studentId are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query: any = submissionId
      ? { _id: submissionId }
      : { assignmentId, studentId };

    const submission = await AssignmentSubmission.findOne(query).populate("assignmentId");

    if (!submission) {
      return NextResponse.json({ error: "Submission record not found." }, { status: 404 });
    }

    // Grant retest permission and reset violation counters
    submission.retestPermitted = true;
    submission.retestGrantedBy = session.userId as any;
    submission.retestGrantedAt = new Date();
    submission.violationCount = 0;
    submission.isDisqualified = false;
    submission.disqualifiedReason = "Retest permission granted by faculty.";
    submission.status = "PENDING";
    await submission.save();

    const asgTitle = (submission.assignmentId as any)?.title || "Proctored Test";

    // Notify Student
    await Notification.create({
      userId: submission.studentId,
      title: "Retest Permission Granted! 📝",
      message: `Your faculty has granted permission to retake "${asgTitle}". You can now start your retest.`,
      type: "TEST",
      linkUrl: "/student/assignments",
    });

    return NextResponse.json({
      success: true,
      message: `Retest permission granted for ${asgTitle}. Student has been notified.`,
      submission: {
        _id: submission._id.toString(),
        retestPermitted: true,
        isDisqualified: false,
        status: submission.status,
      },
    });
  } catch (error: any) {
    console.error("Grant Retest API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to grant retest" }, { status: 500 });
  }
}
