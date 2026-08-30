import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import User from "@/models/User";
import TeacherProfile from "@/models/TeacherProfile";
import Notification from "@/models/Notification";
import { recordAuditLog } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/passwords";
import { isValid10DigitPhone, isValidAcuityOrGmail, sanitize10DigitPhone } from "@/lib/validations/phone";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    return NextResponse.json({ teachers }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
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

    const body = await req.json();
    const {
      teacherId,
      name,
      email,
      phone,
      qualification,
      specialization,
      experienceYears,
      status,
      subjects,
      classesTaught,
      preferredBatchIds,
      resetPassword,
    } = body;

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    if (email && !isValidAcuityOrGmail(email)) {
      return NextResponse.json(
        { error: "Email address must end with @acuity.edu or @gmail.com." },
        { status: 400 }
      );
    }

    if (phone && !isValid10DigitPhone(phone)) {
      return NextResponse.json(
        { error: "Teacher mobile number must be exactly 10 digits and cannot start with 0." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userUpdate: any = {};
    if (name) userUpdate.name = name.trim();
    if (email) userUpdate.email = email.toLowerCase().trim();
    if (phone) userUpdate.phone = sanitize10DigitPhone(phone);
    if (status) userUpdate.status = status;
    if (resetPassword && resetPassword.trim()) {
      userUpdate.passwordHash = await hashPassword(resetPassword.trim());
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(teacherId, userUpdate);
    }

    const updateProfile: any = {};
    if (status) updateProfile.approvalStatus = status;
    if (qualification !== undefined) updateProfile.qualification = qualification;
    if (specialization !== undefined) updateProfile.specialization = specialization;
    if (experienceYears !== undefined) updateProfile.experienceYears = Number(experienceYears);
    if (subjects !== undefined) updateProfile.subjects = subjects;
    if (classesTaught !== undefined) updateProfile.classesTaught = classesTaught;
    if (preferredBatchIds !== undefined) updateProfile.preferredBatchIds = preferredBatchIds;

    if (Object.keys(updateProfile).length > 0) {
      await TeacherProfile.findOneAndUpdate({ userId: teacherId }, updateProfile);
    }

    if (status) {
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
    }

    await recordAuditLog({
      actorId: session.userId,
      action: status ? `TEACHER_STATUS_${status}` : "ADMIN_TEACHER_UPDATED",
      entityType: "USER",
      entityId: teacherId,
      details: { name, email, status, subjects, classesTaught },
    });

    return NextResponse.json({ success: true, message: "Teacher updated successfully." });
  } catch (error: any) {
    console.error("Admin Patch Teacher Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teacherId = (searchParams.get("id") || searchParams.get("teacherId") || "").trim();

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    let user: any = null;
    let teacherProfile: any = null;

    // 1. Try finding by User _id
    try {
      user = await User.findById(teacherId);
    } catch (e) {}

    // 2. If not found, try finding TeacherProfile by _id
    if (!user) {
      try {
        teacherProfile = await TeacherProfile.findById(teacherId);
        if (teacherProfile?.userId) {
          user = await User.findById(teacherProfile.userId);
        }
      } catch (e) {}
    }

    // 3. If still not found, try finding TeacherProfile by userId
    if (!teacherProfile && user) {
      teacherProfile = await TeacherProfile.findOne({ userId: user._id });
    } else if (!user) {
      try {
        teacherProfile = await TeacherProfile.findOne({
          $or: [{ _id: teacherId }, { userId: teacherId }],
        });
        if (teacherProfile?.userId) {
          user = await User.findById(teacherProfile.userId);
        }
      } catch (e) {}
    }

    // 4. Try finding by email
    if (!user) {
      user = await User.findOne({ email: teacherId.toLowerCase(), role: "TEACHER" });
      if (user) {
        teacherProfile = await TeacherProfile.findOne({ userId: user._id });
      }
    }

    const targetUserId = user?._id || teacherProfile?.userId;
    const targetProfileId = teacherProfile?._id;

    if (!user && !teacherProfile) {
      return NextResponse.json({ error: "Teacher record not found in database." }, { status: 404 });
    }

    // Perform database deletion
    if (targetUserId) {
      await Promise.all([
        User.findByIdAndDelete(targetUserId),
        TeacherProfile.deleteMany({ userId: targetUserId }),
      ]);
    }
    if (targetProfileId) {
      await TeacherProfile.findByIdAndDelete(targetProfileId);
    }

    const teacherName = user?.name || "Teacher";

    await recordAuditLog({
      actorId: session.userId,
      action: "ADMIN_TEACHER_DELETED",
      entityType: "USER",
      entityId: (targetUserId || targetProfileId).toString(),
      details: { name: teacherName, email: user?.email },
    });

    return NextResponse.json({
      success: true,
      message: `Teacher "${teacherName}" and associated profile permanently deleted from database.`,
    });
  } catch (error: any) {
    console.error("Admin Delete Teacher Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete teacher" }, { status: 500 });
  }
}
