import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import StudentProfile from "@/models/StudentProfile";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const assignments = await Assignment.find({ teacherId: session.userId })
      .populate("batchId")
      .sort({ createdAt: -1 });

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({ assignmentId: { $in: assignmentIds } })
      .populate("studentId", "name email")
      .populate("assignmentId");

    return NextResponse.json({ assignments, submissions });
  } catch (error: any) {
    console.error("Get Assignments Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, subject, classLevel, batchId, dueDate, maxMarks, attachmentUrl } =
      await req.json();

    if (!title || !subject || !classLevel || !batchId || !dueDate) {
      return NextResponse.json({ error: "Please fill all required assignment fields." }, { status: 400 });
    }

    await connectToDatabase();
    const newAssignment = await Assignment.create({
      title,
      description: description || "",
      subject,
      classLevel,
      batchId,
      teacherId: session.userId,
      dueDate: new Date(dueDate),
      maxMarks: Number(maxMarks) || 20,
      attachmentUrl: attachmentUrl || "",
    });

    // Notify students
    const eligibleStudents = await StudentProfile.find({
      currentClass: classLevel,
      batchId,
    });

    if (eligibleStudents.length > 0) {
      const notifs = eligibleStudents.map((st) => ({
        userId: st.userId,
        title: `New Assignment: ${title}`,
        message: `Due on ${new Date(dueDate).toLocaleDateString()}. Subject: ${subject}. Max marks: ${maxMarks || 20}.`,
        type: "ASSIGNMENT",
        linkUrl: "/student/assignments",
      }));
      await Notification.insertMany(notifs);
    }

    return NextResponse.json({
      success: true,
      message: `Assignment created! ${eligibleStudents.length} students notified.`,
      assignment: newAssignment,
    });
  } catch (error: any) {
    console.error("Create Assignment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
