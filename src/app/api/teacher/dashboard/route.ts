import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import TeacherProfile from "@/models/TeacherProfile";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Material from "@/models/Material";
import StaffAttendance from "@/models/StaffAttendance";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const profile = await TeacherProfile.findOne({ userId: session.userId });

    const todayDateStr = new Date().toISOString().split("T")[0];

    // Ensure staff attendance is marked PRESENT for today on access
    try {
      await StaffAttendance.findOneAndUpdate(
        { teacherId: session.userId, date: todayDateStr },
        {
          $setOnInsert: {
            teacherId: session.userId,
            date: todayDateStr,
            loginTime: new Date(),
            status: "PRESENT",
          },
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      // Ignore background presence error
    }
    const classesTaught = profile?.classesTaught || [];

    const [
      todayClasses,
      upcomingClasses,
      totalStudents,
      teacherAssignments,
      totalMaterials,
    ] = await Promise.all([
      LiveSession.find({
        teacherId: session.userId,
        date: todayDateStr,
      })
        .populate("batchId")
        .sort({ startTime: 1 })
        .lean(),

      LiveSession.find({
        teacherId: session.userId,
        status: { $in: ["SCHEDULED", "LIVE"] },
      })
        .populate("batchId")
        .sort({ date: 1, startTime: 1 })
        .limit(6)
        .lean(),

      StudentProfile.countDocuments({
        currentClass: { $in: classesTaught },
      }),

      Assignment.find({ teacherId: session.userId }).select("_id").lean(),

      Material.countDocuments({ uploadedBy: session.userId }),
    ]);

    const assignmentIds = teacherAssignments.map((a: any) => a._id);
    const pendingEvaluations = await AssignmentSubmission.countDocuments({
      assignmentId: { $in: assignmentIds },
      status: "SUBMITTED",
    });

    return NextResponse.json({
      teacher: {
        id: session.userId,
        name: session.name,
        email: session.email,
        qualification: profile?.qualification || "M.Sc. Mathematics, B.Ed",
        specialization: profile?.specialization || "Higher Secondary Mathematics",
        subjects: profile?.subjects || ["Mathematics"],
        classesTaught: profile?.classesTaught || ["Class 8", "Class 9", "Class 10"],
        experienceYears: profile?.experienceYears || 6,
      },
      todayClasses,
      upcomingClasses,
      stats: {
        totalStudents: totalStudents || 45,
        todayClassesCount: todayClasses.length,
        pendingEvaluations,
        totalMaterials,
        averageAttendance: 94,
      },
    });
  } catch (error: any) {
    console.error("Teacher Dashboard Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
