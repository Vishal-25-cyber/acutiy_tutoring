import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Notification from "@/models/Notification";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assignmentId, submissionText, fileUrl } = await req.json();
    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Server-side Deadline Enforcement
    if (assignment.dueDate) {
      const d = new Date(assignment.dueDate);
      d.setHours(23, 59, 59, 999);
      if (Date.now() > d.getTime()) {
        return NextResponse.json(
          { error: `Submission closed: The deadline (${new Date(assignment.dueDate).toLocaleDateString()}) has passed.` },
          { status: 400 }
        );
      }
    }

    // Fast atomic upsert
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId, studentId: session.userId },
      {
        submissionText: submissionText || "",
        fileUrl: fileUrl || "",
        submittedAt: new Date(),
        status: "SUBMITTED",
      },
      { upsert: true, new: true, lean: true }
    );

    // Non-blocking notification
    if (assignment.teacherId) {
      Notification.create({
        userId: assignment.teacherId,
        title: "New Assignment Submission",
        message: `${session.name} submitted solution for "${assignment.title}".`,
        type: "ASSIGNMENT",
      }).catch((e) => console.error("Notification creation failed:", e));
    }

    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    console.error("Submit Assignment Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit assignment" }, { status: 500 });
  }
}
