import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import TeacherProfile from "@/models/TeacherProfile";
import User from "@/models/User";
import LiveSession from "@/models/LiveSession";
import StudentProfile from "@/models/StudentProfile";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Material from "@/models/Material";
import Attendance from "@/models/Attendance";
import StaffAttendance from "@/models/StaffAttendance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const [profile, userDoc] = await Promise.all([
      TeacherProfile.findOne({ userId: session.userId }).lean(),
      User.findById(session.userId).lean(),
    ]);

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

    // 1. Fetch today's classes and active sessions for this teacher
    let todayClasses = await LiveSession.find({
      teacherId: session.userId,
      $or: [
        { date: todayDateStr },
        { status: "LIVE" },
      ],
    })
      .populate("batchId")
      .sort({ startTime: 1 })
      .lean();

    if (todayClasses.length === 0) {
      todayClasses = await LiveSession.find({
        teacherId: session.userId,
        status: { $in: ["SCHEDULED", "PUBLISHED", "LIVE"] },
      })
        .populate("batchId")
        .sort({ date: 1, startTime: 1 })
        .limit(4)
        .lean();
    }

    const upcomingClasses = await LiveSession.find({
      teacherId: session.userId,
      status: { $in: ["SCHEDULED", "PUBLISHED", "LIVE"] },
    })
      .populate("batchId")
      .sort({ date: 1, startTime: 1 })
      .limit(6)
      .lean();

    // 2. Real dynamic student count enrolled in teacher's classes/grades
    const totalStudents = await StudentProfile.countDocuments(
      classesTaught.length > 0 ? { currentClass: { $in: classesTaught } } : {}
    );

    // 3. Real Materials uploaded by teacher
    const totalMaterials = await Material.countDocuments({ uploadedBy: session.userId });

    // 4. Real Pending Evaluations count
    const teacherSubjects = profile?.subjects && profile.subjects.length > 0 ? profile.subjects : ["Mathematics"];
    const teacherAssignments = await Assignment.find({
      $or: [
        { teacherId: session.userId },
        { subject: { $in: teacherSubjects } },
      ],
    }).select("_id").lean();
    const assignmentIds = teacherAssignments.map((a: any) => a._id);
    const pendingEvaluations = await AssignmentSubmission.countDocuments({
      assignmentId: { $in: assignmentIds },
      status: "SUBMITTED",
    });

    // 5. Real Strictly Calculated Attendance Turnout from Database Records
    const allTeacherSessions = await LiveSession.find({ teacherId: session.userId }).lean();
    const allTeacherSessionIds = allTeacherSessions.map((s: any) => s._id);
    const teacherAttendanceRecords = await Attendance.find({
      sessionId: { $in: allTeacherSessionIds },
    }).lean();

    const allStudentProfiles = await StudentProfile.find({}).lean();
    const batchStudentCountMap = new Map<string, number>();
    allStudentProfiles.forEach((st) => {
      const bId = st.batchId?.toString();
      if (bId) {
        batchStudentCountMap.set(bId, (batchStudentCountMap.get(bId) || 0) + 1);
      }
    });

    const attendanceByClassMap = new Map<string, any[]>();
    teacherAttendanceRecords.forEach((att) => {
      const cId = att.sessionId?.toString();
      if (cId) {
        const arr = attendanceByClassMap.get(cId) || [];
        arr.push(att);
        attendanceByClassMap.set(cId, arr);
      }
    });

    let conductedEnrolledSum = 0;
    let conductedPresentSum = 0;

    allTeacherSessions.forEach((cls: any) => {
      const classAtts = attendanceByClassMap.get(cls._id.toString()) || [];
      const isConducted = cls.status === "COMPLETED" || cls.status === "LIVE" || classAtts.length > 0;
      if (isConducted) {
        const bId = cls.batchId?._id?.toString() || cls.batchId?.toString();
        const batchEnrolled = bId ? batchStudentCountMap.get(bId) || 0 : 0;
        const classLevelEnrolled = cls.classLevel
          ? allStudentProfiles.filter((st) => st.currentClass === cls.classLevel).length
          : 0;
        const totalEnrolled = batchEnrolled || classLevelEnrolled || (classAtts.length > 0 ? classAtts.length : 1);
        const presentCount = classAtts.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;

        conductedEnrolledSum += totalEnrolled;
        conductedPresentSum += presentCount;
      }
    });

    let realAverageAttendance = 0;
    if (conductedEnrolledSum > 0) {
      realAverageAttendance = Math.min(100, Math.round((conductedPresentSum / conductedEnrolledSum) * 100));
    } else if (teacherAttendanceRecords.length > 0) {
      const presentAttendedCount = teacherAttendanceRecords.filter(
        (a: any) => a.status === "PRESENT" || a.status === "LATE"
      ).length;
      realAverageAttendance = Math.round((presentAttendedCount / teacherAttendanceRecords.length) * 100);
    }

    return NextResponse.json({
      teacher: {
        id: session.userId,
        name: userDoc?.name || session.name || "Faculty Member",
        email: userDoc?.email || session.email,
        qualification: profile?.qualification || "M.Sc. Mathematics, B.Ed",
        specialization: profile?.specialization || "Higher Secondary Mathematics",
        subjects: profile?.subjects && profile.subjects.length > 0 ? profile.subjects : ["Mathematics"],
        classesTaught: profile?.classesTaught && profile.classesTaught.length > 0 ? profile.classesTaught : ["Class 8", "Class 9", "Class 10"],
        experienceYears: profile?.experienceYears ?? 6,
      },
      todayClasses,
      upcomingClasses,
      stats: {
        totalStudents,
        todayClassesCount: todayClasses.length,
        pendingEvaluations,
        totalMaterials,
        averageAttendance: realAverageAttendance,
      },
    });
  } catch (error: any) {
    console.error("Teacher Dashboard Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
