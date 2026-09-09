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

    const teacherSubjects = profile?.subjects && profile.subjects.length > 0 ? profile.subjects : ["Mathematics"];

    // Fetch dashboard datasets concurrently in parallel
    const [
      rawTodayClasses,
      upcomingClasses,
      totalStudents,
      totalMaterials,
      teacherAssignments,
      allTeacherSessions,
      allStudentProfiles,
    ] = await Promise.all([
      LiveSession.find({
        teacherId: session.userId,
        $or: [{ date: todayDateStr }, { status: "LIVE" }],
      })
        .populate("batchId")
        .sort({ startTime: 1 })
        .lean(),
      LiveSession.find({
        teacherId: session.userId,
        status: { $in: ["SCHEDULED", "PUBLISHED", "LIVE"] },
      })
        .populate("batchId")
        .sort({ date: 1, startTime: 1 })
        .limit(6)
        .lean(),
      StudentProfile.countDocuments(
        classesTaught.length > 0 ? { currentClass: { $in: classesTaught } } : {}
      ),
      Material.countDocuments({ uploadedBy: session.userId }),
      Assignment.find({
        $or: [
          { teacherId: session.userId },
          { subject: { $in: teacherSubjects } },
        ],
      }).select("_id").lean(),
      LiveSession.find({ teacherId: session.userId }, "_id status batchId classLevel").lean(),
      StudentProfile.find({}, "batchId currentClass").lean(),
    ]);

    let todayClasses = rawTodayClasses;
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

    const assignmentIds = teacherAssignments.map((a: any) => a._id);
    const allTeacherSessionIds = allTeacherSessions.map((s: any) => s._id);

    const [pendingEvaluations, teacherAttendanceRecords] = await Promise.all([
      AssignmentSubmission.countDocuments({
        assignmentId: { $in: assignmentIds },
        status: "SUBMITTED",
      }),
      Attendance.find({
        sessionId: { $in: allTeacherSessionIds },
      }, "sessionId status").lean(),
    ]);
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

    let assignedStaffId = profile?.staffId;
    if (!assignedStaffId) {
      const allTeachers = await TeacherProfile.find().sort({ createdAt: 1 }).select("_id userId").lean();
      const idx = allTeachers.findIndex((t: any) => t.userId?.toString() === session.userId || t._id?.toString() === profile?._id?.toString());
      assignedStaffId = `STF_${String(idx >= 0 ? idx + 1 : 1).padStart(3, "0")}`;
      if (profile?._id) {
        await TeacherProfile.findByIdAndUpdate(profile._id, { staffId: assignedStaffId });
      }
    }

    return NextResponse.json({
      teacher: {
        id: session.userId,
        teacherId: assignedStaffId,
        staffId: assignedStaffId,
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
