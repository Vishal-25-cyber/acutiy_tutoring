import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Notification from "@/models/Notification";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized access. Please login as a student." }, { status: 401 });
    }

    const { assignmentId, submissionText, fileUrl, proctoringSnapshotUrl, timeTakenMinutes, type } =
      await req.json();

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    let assignment: any = null;
    if (mongoose.Types.ObjectId.isValid(assignmentId)) {
      assignment = await Assignment.findById(assignmentId).lean();
    }

    // Server-side Deadline Enforcement: check if deadline has passed
    if (assignment && assignment.dueDate) {
      const d = new Date(assignment.dueDate);
      if (Date.now() > d.getTime()) {
        return NextResponse.json(
          { error: `Submission closed: The deadline (${new Date(assignment.dueDate).toLocaleDateString()}) has passed.` },
          { status: 400 }
        );
      }
    }

    // Server-side Evaluated / Graded Check: Cannot resubmit if evaluated
    const existingSubmission = await AssignmentSubmission.findOne({
      assignmentId: mongoose.Types.ObjectId.isValid(assignmentId)
        ? new mongoose.Types.ObjectId(assignmentId)
        : assignmentId,
      studentId: mongoose.Types.ObjectId.isValid(session.userId)
        ? new mongoose.Types.ObjectId(session.userId)
        : session.userId,
    }).lean();

    if (
      existingSubmission &&
      (existingSubmission.status === "EVALUATED" ||
        existingSubmission.marksObtained !== undefined)
    ) {
      return NextResponse.json(
        {
          error:
            "This task has already been evaluated and graded by faculty. Resubmissions are not permitted.",
        },
        { status: 400 }
      );
    }

    const taskType = type || assignment?.type || "ASSIGNMENT";

    // Fast atomic upsert
    const submission = await AssignmentSubmission.findOneAndUpdate(
      {
        assignmentId: mongoose.Types.ObjectId.isValid(assignmentId)
          ? new mongoose.Types.ObjectId(assignmentId)
          : new mongoose.Types.ObjectId("64b8a123456789abcdef0001"),
        studentId: mongoose.Types.ObjectId.isValid(session.userId)
          ? new mongoose.Types.ObjectId(session.userId)
          : session.userId,
      },
      {
        type: taskType,
        submissionText: submissionText || "",
        fileUrl: fileUrl || "",
        proctoringSnapshotUrl: proctoringSnapshotUrl || "",
        timeTakenMinutes: Number(timeTakenMinutes) || undefined,
        submittedAt: new Date(),
        status: "SUBMITTED",
      },
      { upsert: true, new: true, lean: true }
    );

    // Non-blocking notification if assignment has a teacher
    if (assignment && assignment.teacherId) {
      const typeLabel = taskType === "TEST" ? "Proctored Test" : taskType === "HOMEWORK" ? "Homework" : "Assignment";
      Notification.create({
        userId: assignment.teacherId,
        title: `New ${typeLabel} Submission`,
        message: `${session.name} submitted solution for "${assignment.title}".`,
        type: "ASSIGNMENT",
      }).catch((e) => console.error("Notification creation failed:", e));
    }

    return NextResponse.json({
      success: true,
      message: `${taskType === "TEST" ? "Proctored test" : taskType === "HOMEWORK" ? "Homework" : "Assignment"} submitted successfully!`,
      submission,
    });
  } catch (error: any) {
    console.error("Submit Assignment Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit assignment" }, { status: 500 });
  }
}
