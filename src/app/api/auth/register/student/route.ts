import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import Batch from "@/models/Batch";
import Notification from "@/models/Notification";
import { hashPassword } from "@/lib/auth/passwords";
import { signToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";
import { studentRegisterSchema } from "@/lib/validations/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const validation = studentRegisterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const email = data.email.toLowerCase().trim();
    const phone = data.phone.trim();

    // Check if email or phone is already registered
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email or phone already exists." },
        { status: 409 }
      );
    }

    // Verify batch exists
    const batch = await Batch.findById(data.batchId);
    if (!batch) {
      return NextResponse.json({ error: "Selected batch does not exist." }, { status: 404 });
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create User
    const user = await User.create({
      name: data.name.trim(),
      email,
      phone,
      altPhone: data.altPhone,
      district: data.district?.trim(),
      passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
    });

    // Create StudentProfile
    const profile = await StudentProfile.create({
      userId: user._id,
      schoolName: data.schoolName.trim(),
      district: data.district?.trim(),
      board: data.board,
      currentClass: data.currentClass,
      subjects: data.subjects,
      batchId: batch._id,
      parentName: data.parentName.trim(),
      parentPhone: data.parentPhone.trim(),
      altEmergencyPhone: data.altEmergencyPhone,
      dob: data.dob,
      gender: data.gender,
      streakCount: 1,
      attendanceRiskLevel: "LOW",
      earnedBadges: ["First Class", "Eager Learner"],
    });

    // Send Welcome Notification
    await Notification.create({
      userId: user._id,
      title: "Welcome to Acuity Tutoring!",
      message: `You are enrolled in ${data.currentClass} (${batch.name}). Live classes and learning hub materials are now accessible.`,
      type: "SYSTEM",
    });

    // Generate Session Token
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: "STUDENT",
      name: user.name,
      status: user.status,
      batchId: batch._id.toString(),
      currentClass: data.currentClass,
    });

    await recordAuditLog({
      actorId: user._id.toString(),
      action: "STUDENT_REGISTERED",
      entityType: "USER",
      entityId: user._id.toString(),
      details: { class: data.currentClass, batch: batch.name },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentClass: profile.currentClass,
        batchId: profile.batchId,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Student Registration API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to register student." }, { status: 500 });
  }
}
