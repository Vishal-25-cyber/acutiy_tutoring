import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import Batch from "@/models/Batch";
import Attendance from "@/models/Attendance";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Payment from "@/models/Payment";
import { hashPassword } from "@/lib/auth/passwords";
import { recordAuditLog } from "@/lib/audit";
import { isValid10DigitPhone, isValidAcuityOrGmail, sanitize10DigitPhone } from "@/lib/validations/phone";
import { emitPaymentStatusUpdate } from "@/lib/payment-events";

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
    const status = searchParams.get("status");

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

    // Filter by search query and user status
    const filtered = profiles.filter((p) => {
      if (!p.userId) return false;
      const user = p.userId as any;
      if (status && status !== "ALL" && user.status !== status) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.includes(q) ||
        p.schoolName?.toLowerCase().includes(q)
      );
    });

    const userIds = filtered.map((p) => (p.userId as any)?._id || p.userId).filter(Boolean);
    const allPayments = await Payment.find({ studentId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();

    const enriched = filtered.map((p) => {
      const u = p.userId as any;
      const sId = u?._id?.toString() || p.userId?.toString();
      const studentPayments = allPayments.filter((pay: any) => pay.studentId?.toString() === sId);

      const paidPayment = studentPayments.find((pay: any) => pay.status === "PAID");
      const pendingVerification = studentPayments.find((pay: any) => pay.status === "PENDING_VERIFICATION");
      const latestPayment = pendingVerification || paidPayment || studentPayments[0] || null;

      const hasPaid = !!paidPayment;
      const start = p.trialStartDate || (p as any).createdAt || u?.createdAt || now;
      const startDate = new Date(start);
      const endDate = p.trialEndsAt ? new Date(p.trialEndsAt) : new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      const diffMs = endDate.getTime() - now.getTime();
      const remainingHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
      const isTrialActive = !hasPaid && diffMs > 0;
      const isTrialExpired = !hasPaid && diffMs <= 0;

      const baseObj = typeof (p as any).toObject === "function" ? (p as any).toObject() : p;

      return {
        ...baseObj,
        latestPayment,
        hasPaid,
        pendingVerification: !!pendingVerification,
        trial: {
          isTrialActive,
          isTrialExpired,
          trialEndsAt: endDate.toISOString(),
          trialStartDate: startDate.toISOString(),
          remainingHours,
          hasPaid,
        },
      };
    });

    return NextResponse.json({ students: enriched });
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

    if (!isValidAcuityOrGmail(email)) {
      return NextResponse.json(
        { error: "Email address must end with @mantif.edu, @acuity.edu, or @gmail.com." },
        { status: 400 }
      );
    }

    if (!isValid10DigitPhone(phone)) {
      return NextResponse.json(
        { error: "Student mobile number must be exactly 10 digits and cannot start with 0." },
        { status: 400 }
      );
    }

    if (!isValid10DigitPhone(parentPhone)) {
      return NextResponse.json(
        { error: "Parent mobile number must be exactly 10 digits and cannot start with 0." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (existing) {
      return NextResponse.json({ error: "Email or phone already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password || "Student@123");

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: sanitize10DigitPhone(phone),
      passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
    });

    const studentCount = await StudentProfile.countDocuments();
    const formattedStudentId = `STD_${String(studentCount + 1).padStart(3, "0")}`;

    const profile = await StudentProfile.create({
      userId: user._id,
      studentId: formattedStudentId,
      schoolName: schoolName || "National Public School",
      board: board || "CBSE",
      currentClass,
      subjects: subjects || ["Mathematics", "Science"],
      batchId,
      parentName: parentName.trim(),
      parentPhone: sanitize10DigitPhone(parentPhone),
      altEmergencyPhone: altEmergencyPhone ? sanitize10DigitPhone(altEmergencyPhone) : "",
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

    const body = await req.json();
    const {
      studentId,
      name,
      email,
      phone,
      schoolName,
      board,
      currentClass,
      batchId,
      parentName,
      parentPhone,
      altEmergencyPhone,
      attendanceRiskLevel,
      status,
      resetPassword,
      approvePayment,
    } = body;

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    if (email && !isValidAcuityOrGmail(email)) {
      return NextResponse.json(
        { error: "Email address must end with @mantif.edu, @acuity.edu, or @gmail.com." },
        { status: 400 }
      );
    }

    if (phone && !isValid10DigitPhone(phone)) {
      return NextResponse.json(
        { error: "Student mobile number must be exactly 10 digits and cannot start with 0." },
        { status: 400 }
      );
    }

    if (parentPhone && !isValid10DigitPhone(parentPhone)) {
      return NextResponse.json(
        { error: "Parent mobile number must be exactly 10 digits and cannot start with 0." },
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

    // If approving student or explicitly approving payment, activate user & mark payment as PAID
    const shouldApprovePayment = approvePayment || status === "ACTIVE";
    if (shouldApprovePayment) {
      userUpdate.status = "ACTIVE";

      let targetPayment = await Payment.findOne({
        studentId,
        status: { $in: ["PENDING_VERIFICATION", "PENDING", "OVERDUE"] },
      }).sort({ createdAt: -1 });

      if (!targetPayment && approvePayment) {
        targetPayment = await Payment.findOne({ studentId }).sort({ createdAt: -1 });
      }

      if (targetPayment) {
        targetPayment.status = "PAID";
        targetPayment.paidDate = new Date();
        targetPayment.paymentMethod = targetPayment.paymentMethod || "Admin Verified (Online UPI / Netbanking)";
        if (!targetPayment.transactionId) {
          targetPayment.transactionId = `TXN-VERIFIED-${Date.now().toString().slice(-6)}`;
        }
        await targetPayment.save();

        emitPaymentStatusUpdate({
          paymentId: targetPayment._id.toString(),
          studentId: studentId.toString(),
          courseId: targetPayment.courseId,
          courseName: targetPayment.courseName || targetPayment.billingMonth,
          status: "PAID",
          amount: targetPayment.amount,
          transactionId: targetPayment.transactionId,
          receiptNumber: targetPayment.receiptNumber,
          billingMonth: targetPayment.billingMonth,
          verifiedAt: new Date().toISOString(),
        });
      } else if (approvePayment) {
        const currentMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
        const studentProfile = await StudentProfile.findOne({ userId: studentId }).lean();
        const createdPayment = await Payment.create({
          studentId,
          amount: 1999,
          billingMonth: currentMonthStr,
          courseName: `${studentProfile?.currentClass || "Class 10"} ${studentProfile?.board || "CBSE"} — Core Academic Tuition`,
          dueDate: new Date(),
          paidDate: new Date(),
          status: "PAID",
          paymentMethod: "Admin Verified (Online UPI / Netbanking)",
          transactionId: `TXN-VERIFIED-${Date.now().toString().slice(-6)}`,
          receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        });

        emitPaymentStatusUpdate({
          paymentId: createdPayment._id.toString(),
          studentId: studentId.toString(),
          status: "PAID",
          amount: createdPayment.amount,
          transactionId: createdPayment.transactionId,
          receiptNumber: createdPayment.receiptNumber,
          billingMonth: createdPayment.billingMonth,
          verifiedAt: new Date().toISOString(),
        });
      }
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(studentId, userUpdate);
    }

    const profileUpdate: any = {};
    if (schoolName !== undefined) profileUpdate.schoolName = schoolName;
    if (board !== undefined) profileUpdate.board = board;
    if (currentClass !== undefined) profileUpdate.currentClass = currentClass;
    if (batchId !== undefined) profileUpdate.batchId = batchId;
    if (parentName !== undefined) profileUpdate.parentName = parentName;
    if (parentPhone !== undefined) profileUpdate.parentPhone = sanitize10DigitPhone(parentPhone);
    if (altEmergencyPhone !== undefined)
      profileUpdate.altEmergencyPhone = altEmergencyPhone ? sanitize10DigitPhone(altEmergencyPhone) : "";
    if (attendanceRiskLevel !== undefined) profileUpdate.attendanceRiskLevel = attendanceRiskLevel;

    if (Object.keys(profileUpdate).length > 0) {
      await StudentProfile.findOneAndUpdate({ userId: studentId }, profileUpdate);
    }

    await recordAuditLog({
      actorId: session.userId,
      action: "ADMIN_STUDENT_UPDATED",
      entityType: "USER",
      entityId: studentId,
      details: { name, email, currentClass, batchId, status },
    });

    return NextResponse.json({ success: true, message: "Student account updated successfully." });
  } catch (error: any) {
    console.error("Admin Patch Student Error:", error);
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
    const studentId = (searchParams.get("id") || searchParams.get("studentId") || "").trim();

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    let user: any = null;
    let studentProfile: any = null;

    // 1. Try finding by User _id
    try {
      user = await User.findById(studentId);
    } catch (e) {}

    // 2. If not found, try finding StudentProfile by _id
    if (!user) {
      try {
        studentProfile = await StudentProfile.findById(studentId);
        if (studentProfile?.userId) {
          user = await User.findById(studentProfile.userId);
        }
      } catch (e) {}
    }

    // 3. If still not found, try finding StudentProfile by userId
    if (!studentProfile && user) {
      studentProfile = await StudentProfile.findOne({ userId: user._id });
    } else if (!user) {
      try {
        studentProfile = await StudentProfile.findOne({
          $or: [{ _id: studentId }, { userId: studentId }],
        });
        if (studentProfile?.userId) {
          user = await User.findById(studentProfile.userId);
        }
      } catch (e) {}
    }

    // 4. Try finding by email
    if (!user) {
      user = await User.findOne({ email: studentId.toLowerCase(), role: "STUDENT" });
      if (user) {
        studentProfile = await StudentProfile.findOne({ userId: user._id });
      }
    }

    const targetUserId = user?._id || studentProfile?.userId;
    const targetProfileId = studentProfile?._id;

    if (!user && !studentProfile) {
      return NextResponse.json({ error: "Student record not found in database." }, { status: 404 });
    }

    // Delete user and all associated records from database
    if (targetUserId) {
      await Promise.all([
        User.findByIdAndDelete(targetUserId),
        StudentProfile.deleteMany({ userId: targetUserId }),
        Attendance.deleteMany({ studentId: targetUserId }),
        AssignmentSubmission.deleteMany({ studentId: targetUserId }),
        Payment.deleteMany({ studentId: targetUserId }),
      ]);
    }
    if (targetProfileId) {
      await StudentProfile.findByIdAndDelete(targetProfileId);
    }

    const studentName = user?.name || "Student";

    await recordAuditLog({
      actorId: session.userId,
      action: "ADMIN_STUDENT_DELETED",
      entityType: "USER",
      entityId: (targetUserId || targetProfileId).toString(),
      details: { name: studentName, email: user?.email, role: "STUDENT" },
    });

    return NextResponse.json({
      success: true,
      message: `Student "${studentName}" and all associated data permanently deleted from database.`,
    });
  } catch (error: any) {
    console.error("Admin Delete Student Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete student" }, { status: 500 });
  }
}
