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

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type"); // "ASSIGNMENT" | "TEST" | "HOMEWORK" | "ALL"

    let query: any = {};
    if (typeFilter && typeFilter !== "ALL") {
      query.type = typeFilter;
    }

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

      if (query.type) {
        query = {
          type: query.type,
          $or: orConditions,
        };
      } else {
        query = { $or: orConditions };
      }
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
        type: doc.type || "ASSIGNMENT",
        durationMinutes: doc.durationMinutes || 45,
        proctoringRequired: doc.proctoringRequired ?? true,
        submissionCount: submissionCounts[doc._id.toString()] || 0,
      };
    });

    return NextResponse.json(
      { assignments: enrichedAssignments, submissions },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Get Assignments Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      description,
      subject,
      classLevel,
      batchId,
      dueDate,
      maxMarks,
      attachmentUrl,
      attachmentName,
      attachmentSize,
      type,
      durationMinutes,
      proctoringRequired,
      testDate,
    } = await req.json();

    if (!title || !subject || !classLevel || !batchId) {
      return NextResponse.json({ error: "Please fill all required fields." }, { status: 400 });
    }

    const taskType = type || "ASSIGNMENT";
    const finalDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 86400000 * 3);
    const resolvedDescription = (description || "").trim() || `${classLevel} ${subject} — ${title.trim()}`;
    const teacherUserId = session.userId || "staff";

    await connectToDatabase();
    const newAssignment = await Assignment.create({
      title: title.trim(),
      description: resolvedDescription,
      subject,
      classLevel,
      batchId,
      teacherId: teacherUserId,
      type: taskType,
      durationMinutes: taskType === "TEST" ? Number(durationMinutes) || 45 : undefined,
      proctoringRequired: taskType === "TEST" ? (proctoringRequired ?? true) : false,
      testDate: testDate ? new Date(testDate) : undefined,
      dueDate: finalDueDate,
      maxMarks: Number(maxMarks) || (taskType === "TEST" ? 50 : 20),
      attachmentUrl: attachmentUrl || "",
      attachmentName: attachmentName || "",
      attachmentSize: attachmentSize || "",
    });

    // Notify students
    const eligibleStudents = await StudentProfile.find({
      currentClass: classLevel,
      batchId,
    });

    if (eligibleStudents.length > 0) {
      try {
        const typeLabel = taskType === "TEST" ? "Timed Proctored Test" : taskType === "HOMEWORK" ? "Daily Homework" : "Assignment";
        const notifs = eligibleStudents.map((st) => ({
          userId: st.userId,
          title: `New ${typeLabel}: ${title.trim()}`,
          message: `Due on ${finalDueDate.toLocaleDateString()}. Subject: ${subject}. Max marks: ${maxMarks || (taskType === "TEST" ? 50 : 20)}.`,
          type: taskType === "TEST" || taskType === "HOMEWORK" || taskType === "ASSIGNMENT" ? taskType : "ASSIGNMENT",
          linkUrl: "/student/assignments",
          read: false,
        }));
        await Notification.insertMany(notifs);
      } catch (notifErr) {
        console.warn("Notification creation warning:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${taskType === "TEST" ? "Proctored Test" : taskType === "HOMEWORK" ? "Daily Homework" : "Assignment"} created! ${eligibleStudents.length} students notified.`,
      assignment: newAssignment,
    });
  } catch (error: any) {
    console.error("Create Assignment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
