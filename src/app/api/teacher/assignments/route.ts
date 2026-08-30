import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import StudentProfile from "@/models/StudentProfile";
import Notification from "@/models/Notification";

import TeacherProfile from "@/models/TeacherProfile";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    let query: any = {};
    if (session.role === "TEACHER") {
      const teacherProfile = await TeacherProfile.findOne({ userId: session.userId }).lean();
      const teacherSubjects = teacherProfile?.subjects && teacherProfile.subjects.length > 0
        ? teacherProfile.subjects
        : [];
      const classesTaught = teacherProfile?.classesTaught && teacherProfile.classesTaught.length > 0
        ? teacherProfile.classesTaught
        : [];

      const orConditions: any[] = [
        { teacherId: session.userId },
        { teacherId: { $exists: false } },
        { teacherId: null },
      ];

      if (teacherSubjects.length > 0) {
        orConditions.push({ subject: { $in: teacherSubjects } });
      }

      if (classesTaught.length > 0 && teacherSubjects.length > 0) {
        orConditions.push({
          classLevel: { $in: classesTaught },
          subject: { $in: teacherSubjects },
        });
      }

      query = { $or: orConditions };
    }

    const assignments = await Assignment.find(query)
      .populate("batchId")
      .populate("teacherId", "name email avatarUrl")
      .sort({ createdAt: -1 });

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({ assignmentId: { $in: assignmentIds } })
      .populate("studentId", "name email avatarUrl")
      .populate("assignmentId")
      .sort({ createdAt: -1 });

    const submissionCounts: Record<string, number> = {};
    submissions.forEach((sub: any) => {
      const aId = sub.assignmentId?._id?.toString() || sub.assignmentId?.toString();
      if (aId) {
        submissionCounts[aId] = (submissionCounts[aId] || 0) + 1;
      }
    });

    const enrichedAssignments = assignments.map((asg: any) => {
      const doc = asg.toObject ? asg.toObject() : asg;
      return {
        ...doc,
        submissionCount: submissionCounts[doc._id.toString()] || 0,
      };
    });

    return NextResponse.json({ assignments: enrichedAssignments, submissions }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
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
