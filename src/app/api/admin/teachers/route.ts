import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import User from "@/models/User";
import TeacherProfile from "@/models/TeacherProfile";
import Notification from "@/models/Notification";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    await connectToDatabase();

    const filter: any = {};
    if (status && status !== "ALL") {
      filter.approvalStatus = status;
    }

    const teachers = await TeacherProfile.find(filter)
      .populate("userId", "name email phone status avatarUrl createdAt")
      .populate("preferredBatchIds")
      .sort({ createdAt: -1 });

    return NextResponse.json({ teachers });
  } catch (error: any) {
    console.error("Admin Teachers Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teacherId, status, subjects, classesTaught, preferredBatchIds } = await req.json();
    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    if (status) {
      await User.findByIdAndUpdate(teacherId, { status });
      await TeacherProfile.findOneAndUpdate({ userId: teacherId }, { approvalStatus: status });

      // Notify the teacher
      const message =
        status === "ACTIVE"
          ? "Your teacher application has been approved! You can now log in and schedule live classes."
          : `Your teacher account status has been updated to: ${status}.`;

      await Notification.create({
        userId: teacherId,
        title: status === "ACTIVE" ? "Account Approved 🎉" : "Account Status Update",
        message,
        type: "SYSTEM",
      });

      await recordAuditLog({
        actorId: session.userId,
        action: `TEACHER_STATUS_${status}`,
        entityType: "USER",
        entityId: teacherId,
        details: { status },
      });
    }

    const updateProfile: any = {};
    if (subjects) updateProfile.subjects = subjects;
    if (classesTaught) updateProfile.classesTaught = classesTaught;
    if (preferredBatchIds) updateProfile.preferredBatchIds = preferredBatchIds;

    if (Object.keys(updateProfile).length > 0) {
      await TeacherProfile.findOneAndUpdate({ userId: teacherId }, updateProfile);
    }

    return NextResponse.json({ success: true, message: "Teacher updated successfully." });
  } catch (error: any) {
    console.error("Admin Patch Teacher Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
