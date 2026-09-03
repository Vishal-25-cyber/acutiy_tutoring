import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import TeacherProfile from "@/models/TeacherProfile";
import Payment from "@/models/Payment";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { user: null },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    await connectToDatabase();
    const user: any = await User.findById(session.userId).select("-passwordHash");
    if (!user) {
      return NextResponse.json(
        { user: null },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
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
    let trialData: any = null;

    if (user.role === "STUDENT") {
      profileData = await StudentProfile.findOne({ userId: user._id }).populate("batchId").lean();

      // Check real payment records for this student
      const payments = await Payment.find({ studentId: user._id }).lean();
      const hasPaid = payments.some((p: any) => p.status === "PAID");
      const pendingVerification = payments.some((p: any) => p.status === "PENDING_VERIFICATION");

      // Calculate 2-Day (48 Hours) Free Trial
      const start = profileData?.trialStartDate || profileData?.createdAt || user.createdAt || new Date();
      const startDate = new Date(start);
      const endDate = profileData?.trialEndsAt
        ? new Date(profileData.trialEndsAt)
        : new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

      const now = new Date();
      const diffMs = endDate.getTime() - now.getTime();
      const remainingHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
      const remainingMinutes = Math.max(0, Math.ceil(diffMs / (1000 * 60)));
      const isTrialActive = !hasPaid && diffMs > 0;
      const isTrialExpired = !hasPaid && diffMs <= 0;
      const hasAccess = hasPaid || isTrialActive;

      trialData = {
        isTrialActive,
        isTrialExpired,
        trialEndsAt: endDate.toISOString(),
        trialStartDate: startDate.toISOString(),
        remainingHours,
        remainingMinutes,
        hasPaid,
        hasAccess,
        pendingVerification,
      };
    } else if (user.role === "TEACHER") {
      profileData = teacherProfile || (await TeacherProfile.findOne({ userId: user._id }).lean());
    }

    return NextResponse.json(
      {
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
          trial: trialData,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Auth ME error:", error);
    return NextResponse.json(
      { user: null },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}
