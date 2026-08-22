import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import User from "@/models/User";
import TeacherProfile from "@/models/TeacherProfile";
import { hashPassword } from "@/lib/auth/passwords";
import { teacherRegisterSchema } from "@/lib/validations/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const validation = teacherRegisterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const email = data.email.toLowerCase().trim();
    const phone = data.phone.trim();

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email or phone already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);

    // Create User with PENDING_APPROVAL status
    const user = await User.create({
      name: data.name.trim(),
      email,
      phone,
      altPhone: data.altPhone,
      passwordHash,
      role: "TEACHER",
      status: "PENDING_APPROVAL", // Teacher accounts require admin approval
    });

    // Create TeacherProfile
    await TeacherProfile.create({
      userId: user._id,
      qualification: data.qualification.trim(),
      specialization: data.specialization.trim(),
      subjects: data.subjects,
      classesTaught: data.classesTaught,
      experienceYears: data.experienceYears,
      address: data.address,
      resumeUrl: data.resumeUrl || "",
      certificateUrl: data.certificateUrl || "",
      idProofUrl: data.idProofUrl || "",
      approvalStatus: "PENDING_APPROVAL",
    });

    await recordAuditLog({
      actorId: user._id.toString(),
      action: "TEACHER_REGISTERED_PENDING_APPROVAL",
      entityType: "USER",
      entityId: user._id.toString(),
      details: { specialization: data.specialization, subjects: data.subjects },
    });

    return NextResponse.json({
      success: true,
      status: "PENDING_APPROVAL",
      message:
        "Your teacher registration has been received! Our academic administration team will review your qualifications. You will be able to log in once your account is approved.",
    });
  } catch (error: any) {
    console.error("Teacher Registration API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to register teacher." }, { status: 500 });
  }
}
