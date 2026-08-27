import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import TeacherProfile from "@/models/TeacherProfile";
import StaffAttendance from "@/models/StaffAttendance";
import Batch from "@/models/Batch";
import { comparePassword } from "@/lib/auth/passwords";
import { signToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { role, email, password, batchId, identifier } = body;

    if (!role || !password) {
      return NextResponse.json({ error: "Role and password are required." }, { status: 400 });
    }

    // STUDENT LOGIN
    if (role === "STUDENT") {
      const loginId = (identifier || email || "").trim().toLowerCase();
      if (!loginId) {
        return NextResponse.json({ error: "Email or phone number is required." }, { status: 400 });
      }

      // Find user by email or phone
      const user = await User.findOne({
        role: "STUDENT",
        $or: [{ email: loginId }, { phone: loginId }],
      });

      if (!user) {
        return NextResponse.json({ error: "Invalid credentials. Student not found." }, { status: 401 });
      }

      if (user.status === "SUSPENDED" || user.status === "REJECTED") {
        return NextResponse.json(
          { error: "Your account is currently suspended. Please contact administration." },
          { status: 403 }
        );
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Invalid credentials. Please check your password." }, { status: 401 });
      }

      // Resolve Student Profile & Assigned Batch
      const studentProfile = await StudentProfile.findOne({ userId: user._id });
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
      }

      const assignedBatchId = studentProfile.batchId ? studentProfile.batchId.toString() : batchId || "";

      // Generate Session Token
      const token = await signToken({
        userId: user._id.toString(),
        email: user.email,
        role: "STUDENT",
        name: user.name,
        status: user.status,
        batchId: assignedBatchId,
        currentClass: studentProfile.currentClass,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          currentClass: studentProfile.currentClass,
          batchId: studentProfile.batchId,
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

      await recordAuditLog({
        actorId: user._id.toString(),
        action: "STUDENT_LOGIN",
        entityType: "USER",
        entityId: user._id.toString(),
        details: { batchId: assignedBatchId },
      });

      return response;
    }

    // TEACHER LOGIN
    if (role === "TEACHER") {
      const loginEmail = (email || identifier || "").trim().toLowerCase();
      const user = await User.findOne({ role: "TEACHER", email: loginEmail });

      if (!user) {
        return NextResponse.json({ error: "Teacher account not found." }, { status: 401 });
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Invalid password." }, { status: 401 });
      }

      const teacherProfile = await TeacherProfile.findOne({ userId: user._id });
      if (user.status === "PENDING_APPROVAL" || teacherProfile?.approvalStatus === "PENDING_APPROVAL") {
        return NextResponse.json(
          {
            error: "Your account is awaiting admin approval.",
            status: "PENDING_APPROVAL",
          },
          { status: 403 }
        );
      }

      if (user.status === "SUSPENDED" || user.status === "REJECTED") {
        return NextResponse.json({ error: "Your teacher account is suspended or not approved." }, { status: 403 });
      }

      const token = await signToken({
        userId: user._id.toString(),
        email: user.email,
        role: "TEACHER",
        name: user.name,
        status: user.status,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
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

      // Automatically mark staff attendance as PRESENT on login
      try {
        const todayDateStr = new Date().toISOString().split("T")[0];
        await StaffAttendance.findOneAndUpdate(
          { teacherId: user._id, date: todayDateStr },
          {
            $setOnInsert: {
              teacherId: user._id,
              date: todayDateStr,
              loginTime: new Date(),
              status: "PRESENT",
            },
          },
          { upsert: true, new: true }
        );
      } catch (attErr) {
        console.warn("Auto staff attendance recording error:", attErr);
      }

      await recordAuditLog({
        actorId: user._id.toString(),
        action: "TEACHER_LOGIN",
        entityType: "USER",
        entityId: user._id.toString(),
      });

      return response;
    }

    // ADMIN LOGIN
    if (role === "ADMIN") {
      const loginEmail = (email || identifier || "").trim().toLowerCase();
      const user = await User.findOne({ role: "ADMIN", email: loginEmail });

      if (!user) {
        return NextResponse.json({ error: "Admin credentials not found." }, { status: 401 });
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
      }

      const token = await signToken({
        userId: user._id.toString(),
        email: user.email,
        role: "ADMIN",
        name: user.name,
        status: user.status,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
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

      await recordAuditLog({
        actorId: user._id.toString(),
        action: "ADMIN_LOGIN",
        entityType: "USER",
        entityId: user._id.toString(),
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process login." }, { status: 500 });
  }
}
