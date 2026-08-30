import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import TeacherProfile from "@/models/TeacherProfile";
import Batch from "@/models/Batch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [allUsers, rawStudentProfiles, batches] = await Promise.all([
      User.find().lean(),
      StudentProfile.find().populate("userId").lean(),
      Batch.find().lean(),
    ]);

    const validStudents = rawStudentProfiles.filter((s: any) => s.userId != null);
    const allStudentUsers = allUsers.filter((u: any) => u.role === "STUDENT");
    const allTeacherUsers = allUsers.filter((u: any) => u.role === "TEACHER");

    // Real Student enrollment by class (1 to 10)
    const classOrder = [
      "Class 1",
      "Class 2",
      "Class 3",
      "Class 4",
      "Class 5",
      "Class 6",
      "Class 7",
      "Class 8",
      "Class 9",
      "Class 10",
    ];

    const classDistribution = classOrder.map((cls) => {
      const count = validStudents.filter((s: any) => s.currentClass === cls).length;
      return { class: cls, count };
    });

    // Real Growth trend for last 6 months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const enrollmentGrowth = [];

    for (let i = 5; i >= 0; i--) {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[mDate.getMonth()];

      const studentsCumulative = allStudentUsers.filter(
        (s: any) => new Date(s.createdAt || Date.now()) <= endOfMonth
      ).length;

      const teachersCumulative = allTeacherUsers.filter(
        (t: any) => new Date(t.createdAt || Date.now()) <= endOfMonth
      ).length;

      enrollmentGrowth.push({
        month: monthName,
        students: studentsCumulative,
        teachers: teachersCumulative,
      });
    }

    // Real Batch Occupancy
    const batchOccupancy = batches.map((b: any) => {
      const enrolled = validStudents.filter((s: any) => {
        const bId = s.batchId?._id || s.batchId;
        return bId && bId.toString() === b._id.toString();
      }).length;

      return {
        name: b.name,
        capacity: b.capacity || 30,
        enrolled,
      };
    });

    return NextResponse.json({
      classDistribution,
      enrollmentGrowth,
      batchOccupancy,
      totalStudents: validStudents.length,
      totalTeachers: allTeacherUsers.length,
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Admin Analytics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
