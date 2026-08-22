import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import TeacherProfile from "@/models/TeacherProfile";
import Batch from "@/models/Batch";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select("-passwordHash");
    if (!user) {
      return NextResponse.json({ user: null });
    }

    let profileData: any = null;
    if (user.role === "STUDENT") {
      profileData = await StudentProfile.findOne({ userId: user._id }).populate("batchId");
    } else if (user.role === "TEACHER") {
      profileData = await TeacherProfile.findOne({ userId: user._id });
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
    });
  } catch (error: any) {
    console.error("Auth ME error:", error);
    return NextResponse.json({ user: null });
  }
}
