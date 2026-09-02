import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import TeacherProfile from "@/models/TeacherProfile";
import Batch from "@/models/Batch";
import { hashPassword } from "@/lib/auth/passwords";

/**
 * POST /api/auth/register
 * 
 * Registers a new STUDENT or TEACHER.
 * Creates records in:
 *  - STUDENT: `users` collection + `studentprofiles` collection
 *  - TEACHER:  `users` collection + `teacherprofiles` collection (status: PENDING_APPROVAL)
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { role } = body;

    if (!role || !["STUDENT", "TEACHER"].includes(role)) {
      return NextResponse.json({ error: "Role must be STUDENT or TEACHER." }, { status: 400 });
    }

    // ── STUDENT REGISTRATION ──
    if (role === "STUDENT") {
      const {
        name, email, phone, password,
        schoolName, district, board, currentClass, batchId,
        parentName, parentPhone, gender, dob,
      } = body;

      // Validate required fields
      if (!name || !email || !phone || !password) {
        return NextResponse.json({ error: "Name, email, phone and password are required." }, { status: 400 });
      }
      if (!schoolName || !board || !currentClass || !batchId) {
        return NextResponse.json({ error: "School name, board, class and batch are required." }, { status: 400 });
      }
      if (!parentName || !parentPhone) {
        return NextResponse.json({ error: "Parent name and parent phone are required." }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }

      // Check if email or phone is already registered
      const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
      if (existing) {
        return NextResponse.json({ error: "An account with this email or phone already exists." }, { status: 409 });
      }

      // Check batch exists or assign active batch
      let batch = null;
      if (batchId && typeof batchId === "string" && batchId.length === 24) {
        try {
          batch = await Batch.findById(batchId);
        } catch {
          batch = null;
        }
      }
      if (!batch) {
        batch = await Batch.findOne({ isActive: true });
      }
      if (!batch) {
        batch = await Batch.create({
          name: "7:00 PM – 8:00 PM",
          startTime: "19:00",
          endTime: "20:00",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          capacity: 30,
          gracePeriodMinutes: 5,
        });
      }

      const passwordHash = await hashPassword(password);

      // Save to `users` collection (PENDING_APPROVAL status until Admin approves)
      const user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        district: district?.trim() || "",
        passwordHash,
        role: "STUDENT",
        status: "PENDING_APPROVAL",
      });

      const normalizedGender = (gender || "OTHER").toString().toUpperCase();
      const safeGender = ["MALE", "FEMALE", "OTHER"].includes(normalizedGender) ? normalizedGender : "OTHER";

      // Save to `studentprofiles` collection
      await StudentProfile.create({
        userId: user._id,
        schoolName: schoolName.trim(),
        district: district?.trim() || "",
        board,
        currentClass,
        batchId,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        gender: safeGender,
        dob: dob || "",
        subjects: [],
        streakCount: 0,
        totalClassesAttended: 0,
        totalClassesScheduled: 0,
      });

      return NextResponse.json({
        success: true,
        message: "Student registration submitted! Your account is pending admin approval. You will be able to log in once approved by the administrator.",
        user: { name: user.name, email: user.email, role: "STUDENT", status: "PENDING_APPROVAL" },
      }, { status: 201 });
    }

    // ── TEACHER REGISTRATION ──
    if (role === "TEACHER") {
      const {
        name, email, phone, password,
        qualification, specialization, experienceYears, district, address,
        classesTaught, subjects,
      } = body;

      if (!name || !email || !phone || !password) {
        return NextResponse.json({ error: "Name, email, phone and password are required." }, { status: 400 });
      }
      if (!qualification || !specialization) {
        return NextResponse.json({ error: "Qualification and specialization are required." }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }

      // Check if email or phone already exists
      const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
      if (existing) {
        return NextResponse.json({ error: "An account with this email or phone already exists." }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);

      // Save to `users` collection (PENDING_APPROVAL status for teachers)
      const user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        district: district?.trim() || address?.trim() || "",
        passwordHash,
        role: "TEACHER",
        status: "PENDING_APPROVAL",
      });

      const safeClasses = Array.isArray(classesTaught) && classesTaught.length > 0 ? classesTaught : ["Class 10"];
      const safeSubjects = Array.isArray(subjects) && subjects.length > 0 ? subjects : [specialization.trim() || "Mathematics"];

      // Save to `teacherprofiles` collection
      await TeacherProfile.create({
        userId: user._id,
        qualification: qualification.trim(),
        specialization: specialization.trim(),
        subjects: safeSubjects,
        classesTaught: safeClasses,
        experienceYears: parseInt(experienceYears) || 0,
        district: district?.trim() || address?.trim() || "",
        address: address?.trim() || district?.trim() || "",
        approvalStatus: "PENDING_APPROVAL",
      });

      return NextResponse.json({
        success: true,
        message: "Teacher registration submitted! Your account is pending admin approval. You will be notified once approved.",
        user: { name: user.name, email: user.email, role: "TEACHER", status: "PENDING_APPROVAL" },
      }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  } catch (error: any) {
    console.error("Register API error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "This email or phone is already registered." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Registration failed." }, { status: 500 });
  }
}
