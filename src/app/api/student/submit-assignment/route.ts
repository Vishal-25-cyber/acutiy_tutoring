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

    const { assignmentId, submissionText, fileUrl } = await req.json();
    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    let assignment = null;
    if (mongoose.Types.ObjectId.isValid(assignmentId)) {
      assignment = await Assignment.findById(assignmentId).lean();
    }

    // Server-side Deadline Enforcement
    if (assignment && assignment.dueDate) {
      const d = new Date(assignment.dueDate);
      d.setHours(23, 59, 59, 999);
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
            "This assignment has already been evaluated and graded by faculty. Resubmissions are not permitted.",
        },
        { status: 400 }
      );
    }

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
        submissionText: submissionText || "",
        fileUrl: fileUrl || "",
        submittedAt: new Date(),
        status: "SUBMITTED",
      },
      { upsert: true, new: true, lean: true }
    );

    // Non-blocking notification if assignment has a teacher
    if (assignment && assignment.teacherId) {
      Notification.create({
        userId: assignment.teacherId,
        title: "New Assignment Submission",
        message: `${session.name} submitted solution for "${assignment.title}".`,
        type: "ASSIGNMENT",
      }).catch((e) => console.error("Notification creation failed:", e));
    }

    return NextResponse.json({
      success: true,
      message: "Assignment submitted successfully!",
      submission,
    });
  } catch (error: any) {
    console.error("Submit Assignment Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit assignment" }, { status: 500 });
  }
}
