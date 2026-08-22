import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import Batch from "@/models/Batch";
import { hashPassword } from "@/lib/auth/passwords";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const classLevel = searchParams.get("classLevel");
    const board = searchParams.get("board");
    const batchId = searchParams.get("batchId");
    const riskLevel = searchParams.get("riskLevel");

    await connectToDatabase();

    // Query StudentProfiles
    const profileFilter: any = {};
    if (classLevel && classLevel !== "ALL") profileFilter.currentClass = classLevel;
    if (board && board !== "ALL") profileFilter.board = board;
    if (batchId && batchId !== "ALL") profileFilter.batchId = batchId;
    if (riskLevel && riskLevel !== "ALL") profileFilter.attendanceRiskLevel = riskLevel;

    const profiles = await StudentProfile.find(profileFilter)
      .populate("userId")
      .populate("batchId")
      .sort({ createdAt: -1 });

    // Filter by search query on User name / email / phone
    const filtered = profiles.filter((p) => {
      if (!p.userId) return false;
      const user = p.userId as any;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.includes(q) ||
        p.schoolName?.toLowerCase().includes(q)
      );
    });

    return NextResponse.json({ students: filtered });
  } catch (error: any) {
    console.error("Admin Students Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      schoolName,
      board,
      currentClass,
      subjects,
      batchId,
      parentName,
      parentPhone,
      altEmergencyPhone,
    } = body;

    if (!name || !email || !phone || !currentClass || !batchId || !parentName || !parentPhone) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (existing) {
      return NextResponse.json({ error: "Email or phone already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password || "Student@123");

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
    });

    const profile = await StudentProfile.create({
      userId: user._id,
      schoolName: schoolName || "National Public School",
      board: board || "CBSE",
      currentClass,
      subjects: subjects || ["Mathematics", "Science"],
      batchId,
      parentName,
      parentPhone,
      altEmergencyPhone,
      streakCount: 1,
      attendanceRiskLevel: "LOW",
    });

    await recordAuditLog({
      actorId: session.userId,
      action: "ADMIN_STUDENT_CREATED",
      entityType: "USER",
      entityId: user._id.toString(),
      details: { name, currentClass, batchId },
    });

    return NextResponse.json({ success: true, user, profile });
  } catch (error: any) {
    console.error("Admin Create Student Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, batchId, status, currentClass, attendanceRiskLevel, resetPassword } =
      await req.json();

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    if (status) {
      await User.findByIdAndUpdate(studentId, { status });
    }

    if (resetPassword) {
      const newHash = await hashPassword(resetPassword);
      await User.findByIdAndUpdate(studentId, { passwordHash: newHash });
    }

    const updateData: any = {};
    if (batchId) updateData.batchId = batchId;
    if (currentClass) updateData.currentClass = currentClass;
    if (attendanceRiskLevel) updateData.attendanceRiskLevel = attendanceRiskLevel;

    if (Object.keys(updateData).length > 0) {
      await StudentProfile.findOneAndUpdate({ userId: studentId }, updateData);
    }

    await recordAuditLog({
      actorId: session.userId,
      action: "ADMIN_STUDENT_UPDATED",
      entityType: "USER",
      entityId: studentId,
      details: { status, batchId, currentClass },
    });

    return NextResponse.json({ success: true, message: "Student account updated successfully." });
  } catch (error: any) {
    console.error("Admin Patch Student Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
