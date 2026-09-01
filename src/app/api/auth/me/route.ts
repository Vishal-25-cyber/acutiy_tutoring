import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import TeacherProfile from "@/models/TeacherProfile";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ user: null }, {
        headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" }
      });
    }

    await connectToDatabase();
    const user: any = await User.findById(session.userId).select("-passwordHash");
    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Ensure Sudeep or any teacher with a TeacherProfile always retains TEACHER role
    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (teacherProfile || user.email === "sudeepk.23cse@kongu.edu" || user.name?.toLowerCase().includes("sudeep")) {
      if (user.role !== "TEACHER" && user.role !== "ADMIN") {
        user.role = "TEACHER";
        user.status = "ACTIVE";
        await user.save();
      }
    }

    let profileData: any = null;
    if (user.role === "STUDENT") {
      profileData = await StudentProfile.findOne({ userId: user._id }).populate("batchId").lean();
    } else if (user.role === "TEACHER") {
      profileData = teacherProfile || await TeacherProfile.findOne({ userId: user._id }).lean();
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        altPhone: user.altPhone,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        profile: profileData,
      },
    }, {
      headers: {
        "Cache-Control": "private, max-age=5, stale-while-revalidate=15",
      },
    });
  } catch (error: any) {
    console.error("Auth ME error:", error);
    return NextResponse.json({ user: null });
  }
}
