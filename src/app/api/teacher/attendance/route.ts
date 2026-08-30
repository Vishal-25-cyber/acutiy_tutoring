import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import Attendance from "@/models/Attendance";
import StudentProfile from "@/models/StudentProfile";
import TeacherProfile from "@/models/TeacherProfile";
import StaffAttendance from "@/models/StaffAttendance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [teacherProfile, studentProfiles] = await Promise.all([
      TeacherProfile.findOne({ userId: session.userId }).lean(),
      StudentProfile.find({}).lean(),
    ]);

    const classesTaught = teacherProfile?.classesTaught || [];

    // 1. Fetch all classes conducted or scheduled by this teacher
    const query: any = session.role === "TEACHER" ? { teacherId: session.userId } : {};
    const classes = await LiveSession.find(query)
      .populate("batchId")
      .sort({ date: -1, startTime: -1 })
      .lean();

    // 2. Map batch and class enrolled counts
    const batchStudentCountMap = new Map<string, number>();
    studentProfiles.forEach((st) => {
      const bId = st.batchId?.toString();
      if (bId) {
        batchStudentCountMap.set(bId, (batchStudentCountMap.get(bId) || 0) + 1);
      }
    });

    // 3. For each class, fetch attendance counts
    const classIds = classes.map((c) => c._id);
    const allAttendances = await Attendance.find({ sessionId: { $in: classIds } }).lean();

    const attendanceByClassMap = new Map<string, any[]>();
    allAttendances.forEach((att) => {
      const cId = att.sessionId?.toString();
      if (cId) {
        const arr = attendanceByClassMap.get(cId) || [];
        arr.push(att);
        attendanceByClassMap.set(cId, arr);
      }
    });

    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0];
    const nowTimeStr = now.toTimeString().slice(0, 5);

    let conductedEnrolledSum = 0;
    let conductedPresentSum = 0;
    let conductedSessionsCount = 0;

    const sessionStats = classes.map((cls: any) => {
      const bId = cls.batchId?._id?.toString() || cls.batchId?.toString();
      const batchEnrolled = bId ? batchStudentCountMap.get(bId) || 0 : 0;
      const classLevelEnrolled = cls.classLevel
        ? studentProfiles.filter((st) => st.currentClass === cls.classLevel).length
        : 0;
      const classAtts = attendanceByClassMap.get(cls._id.toString()) || [];

      // Total enrolled students for this session's batch or grade level
      const totalEnrolled =
        batchEnrolled ||
        classLevelEnrolled ||
        (classAtts.length > 0 ? classAtts.length : 1);

      const presentCount = classAtts.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
      const lateCount = classAtts.filter((a) => a.status === "LATE").length;
      const absentCount = classAtts.filter((a) => a.status === "ABSENT").length || Math.max(0, totalEnrolled - presentCount);

      const isConducted =
        cls.status === "COMPLETED" ||
        cls.status === "LIVE" ||
        (cls.date && cls.date < todayDateStr) ||
        (cls.date === todayDateStr && cls.endTime && cls.endTime <= nowTimeStr) ||
        classAtts.length > 0;

      let rate: number | null = null;
      if (isConducted) {
        conductedSessionsCount++;
        rate = totalEnrolled > 0
          ? Math.min(100, Math.round((presentCount / totalEnrolled) * 100))
          : (classAtts.length > 0 ? 100 : 0);

        conductedEnrolledSum += totalEnrolled;
        conductedPresentSum += presentCount;
      }

      return {
        _id: cls._id,
        title: cls.title,
        subject: cls.subject,
        topic: cls.topic,
        classLevel: cls.classLevel,
        date: cls.date,
        startTime: cls.startTime,
        endTime: cls.endTime,
        status: cls.status,
        batchName: cls.batchId?.name || "Evening Batch",
        totalEnrolled,
        presentCount,
        lateCount,
        absentCount,
        isConducted,
        attendanceRate: rate,
      };
    });

    // Real dynamic student count enrolled in teacher's classes/grades
    const assignedStudentsCount = studentProfiles.filter((st) =>
      classesTaught.length > 0 ? classesTaught.includes(st.currentClass) : true
    ).length;

    let averageRate = 100;
    if (conductedEnrolledSum > 0) {
      averageRate = Math.min(100, Math.round((conductedPresentSum / conductedEnrolledSum) * 100));
    } else if (allAttendances.length > 0) {
      const totalPresentInAll = allAttendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
      averageRate = Math.round((totalPresentInAll / allAttendances.length) * 100);
    }

    // 4. Fetch Faculty Staff Attendance Logs
    let staffRecords: any[] = await StaffAttendance.find({ teacherId: session.userId })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    // Auto-seed today's record if teacher has conducted classes or logged in
    let todayStaffRecord: any = staffRecords.find((r) => r.date === todayDateStr);
    if (!todayStaffRecord) {
      const todayConducted = sessionStats.filter((s) => s.date === todayDateStr && s.isConducted).length;
      if (todayConducted > 0) {
        todayStaffRecord = await StaffAttendance.create({
          teacherId: session.userId,
          date: todayDateStr,
          loginTime: new Date(),
          classesConducted: todayConducted,
          workingHours: Math.round(todayConducted * 1.5 * 10) / 10,
          status: "PRESENT",
        });
        staffRecords = [todayStaffRecord, ...staffRecords];
      }
    }

    const totalDutyDays = staffRecords.length || 1;
    const presentDutyDays = staffRecords.filter((r) => r.status === "PRESENT" || r.status === "HALF_DAY").length;
    const staffAttendanceRate = Math.round((presentDutyDays / totalDutyDays) * 100);

    return NextResponse.json({
      sessions: sessionStats,
      summary: {
        totalSessions: conductedSessionsCount,
        totalScheduledSessions: classes.length,
        averageAttendance: averageRate,
        totalStudentsAssigned: assignedStudentsCount || studentProfiles.length,
      },
      staffAttendance: {
        records: staffRecords,
        todayRecord: todayStaffRecord || null,
        totalDutyDays,
        presentDutyDays,
        staffAttendanceRate,
      },
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("GET /api/teacher/attendance error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json(); // "CHECK_IN" or "CHECK_OUT"
    await connectToDatabase();

    const todayDateStr = new Date().toISOString().split("T")[0];

    if (action === "CHECK_IN") {
      const record = await StaffAttendance.findOneAndUpdate(
        { teacherId: session.userId, date: todayDateStr },
        {
          loginTime: new Date(),
          status: "PRESENT",
          $inc: { classesConducted: 0 },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return NextResponse.json({
        success: true,
        message: "Staff Attendance: Check-in recorded successfully!",
        record,
      });
    } else if (action === "CHECK_OUT") {
      const existing = await StaffAttendance.findOne({ teacherId: session.userId, date: todayDateStr });
      const loginTime = existing?.loginTime ? new Date(existing.loginTime).getTime() : Date.now() - 3600000;
      const hours = Math.round(((Date.now() - loginTime) / (1000 * 60 * 60)) * 10) / 10;

      const record = await StaffAttendance.findOneAndUpdate(
        { teacherId: session.userId, date: todayDateStr },
        {
          logoutTime: new Date(),
          workingHours: Math.max(1, hours),
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        message: "Staff Attendance: Check-out recorded successfully!",
        record,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/teacher/attendance error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
