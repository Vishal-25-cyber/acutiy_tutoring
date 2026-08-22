import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import TeacherProfile from "@/models/TeacherProfile";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const teacherProfile = await TeacherProfile.findOne({ userId: session.userId });
    const classesTaught = teacherProfile?.classesTaught || [];

    const students = await StudentProfile.find({
      currentClass: { $in: classesTaught },
    })
      .populate("userId", "name email phone status avatarUrl")
      .populate("batchId")
      .sort({ currentClass: 1 });

    return NextResponse.json({ students });
  } catch (error: any) {
    console.error("Teacher Students Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
