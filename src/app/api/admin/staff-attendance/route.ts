import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StaffAttendance from "@/models/StaffAttendance";
import User from "@/models/User";
import TeacherProfile from "@/models/TeacherProfile";
import LiveSession from "@/models/LiveSession";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const todayStr = new Date().toISOString().split("T")[0];

    // Fetch all active teachers
    const teachers = await User.find({ role: "TEACHER", status: "ACTIVE" })
      .select("name email phone avatarUrl status createdAt")
      .lean();

    // Fetch today's staff attendance records
    const todayAttendanceList = await StaffAttendance.find({ date: todayStr }).lean();
    const attendanceMap = new Map<string, any>();
    todayAttendanceList.forEach((att: any) => {
      attendanceMap.set(att.teacherId.toString(), att);
    });

    // For each teacher, count lectures conducted today
    const todaySessions = await LiveSession.find({ date: todayStr }).select("teacherId status").lean();
    const sessionCountMap = new Map<string, number>();
    todaySessions.forEach((sess: any) => {
      const tId = sess.teacherId?.toString();
      if (tId) {
        sessionCountMap.set(tId, (sessionCountMap.get(tId) || 0) + 1);
      }
    });

    const staffRoster = teachers.map((teacher: any) => {
      const tId = teacher._id.toString();
      const attendance = attendanceMap.get(tId);
      const currentStatus = attendance ? attendance.status : "PENDING_LOGIN";
      const isPresent = currentStatus === "PRESENT";
      const loginTime = attendance?.loginTime ? new Date(attendance.loginTime) : null;
      const classesCount = sessionCountMap.get(tId) || attendance?.classesConducted || 0;

      return {
        id: tId,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        date: todayStr,
        status: currentStatus,
        loginTime: isPresent && loginTime
          ? loginTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
          : isPresent
          ? "Logged In"
          : currentStatus === "ABSENT"
          ? "Marked Absent"
          : currentStatus === "LEAVE"
          ? "On Leave"
          : "—",
        rawLoginTime: attendance?.loginTime || null,
        classesConducted: classesCount,
        hours: isPresent ? `${(classesCount * 1.0 + 1.5).toFixed(1)} hrs` : "0 hrs",
      };
    });

    const totalTeachers = teachers.length;
    const todayPresentCount = staffRoster.filter((s) => s.status === "PRESENT").length;
    const attendancePercentage =
      totalTeachers > 0 ? Math.round((todayPresentCount / totalTeachers) * 100) : 100;

    // Calculate live monthly average from StaffAttendance records in database
    const now = new Date();
    const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthRecords = await StaffAttendance.find({
      date: { $gte: startOfMonthStr, $lte: todayStr },
    }).lean();

    const totalMonthRecords = monthRecords.length;
    const presentMonthRecords = monthRecords.filter(
      (r: any) => r.status === "PRESENT" || r.status === "LATE"
    ).length;

    const monthlyAverage =
      totalMonthRecords > 0
        ? Math.min(100, Math.round((presentMonthRecords / totalMonthRecords) * 100))
        : attendancePercentage;

    return NextResponse.json({
      staffRoster,
      stats: {
        totalTeachers,
        todayPresent: todayPresentCount,
        attendancePercentage,
        monthlyAverage,
      },
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Staff Attendance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { teacherId, status, date } = body;

    if (!teacherId || !status) {
      return NextResponse.json(
        { error: "Teacher ID and attendance status are required." },
        { status: 400 }
      );
    }

    const targetDate = date || new Date().toISOString().split("T")[0];
    const now = new Date();

    const record = await StaffAttendance.findOneAndUpdate(
      { teacherId, date: targetDate },
      {
        $set: {
          status,
          ...(status === "PRESENT"
            ? { loginTime: now }
            : status === "ABSENT" || status === "LEAVE"
            ? { loginTime: now }
            : {}),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `Teacher attendance updated to ${status}.`,
      record,
    });
  } catch (error: any) {
    console.error("Admin Mark Staff Attendance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
