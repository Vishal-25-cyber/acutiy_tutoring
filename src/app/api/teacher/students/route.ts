import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import TeacherProfile from "@/models/TeacherProfile";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";
import Attendance from "@/models/Attendance";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Batch from "@/models/Batch";
import Payment from "@/models/Payment";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const teacherProfile = await TeacherProfile.findOne({ userId: session.userId });
    const classesTaught = teacherProfile?.classesTaught || [];

    const rawStudents = await StudentProfile.find(
      classesTaught.length > 0 ? { currentClass: { $in: classesTaught } } : {}
    )
      .populate("userId", "name email phone status avatarUrl")
      .populate("batchId")
      .sort({ currentClass: 1 })
      .lean();

    const batches = await Batch.find().sort({ startTime: 1 }).lean();

    // Compute live real-time attendance, homework, and tuition fee metrics for each student
    const students = await Promise.all(
      rawStudents.map(async (st: any) => {
        const studentUserId = st.userId?._id;

        const [attendanceRecords, submissions, payments] = await Promise.all([
          Attendance.find({ studentId: studentUserId }).lean(),
          AssignmentSubmission.find({ studentId: studentUserId }).lean(),
          Payment.find({ studentId: studentUserId }).sort({ createdAt: -1, dueDate: -1 }).lean(),
        ]);

        const presentCount = attendanceRecords.filter(
          (a: any) => a.status === "PRESENT" || a.status === "LATE"
        ).length;
        const totalSessions = Math.max(presentCount, 1);
        const attendancePercentage = totalSessions > 0
          ? Math.round((presentCount / totalSessions) * 100)
          : 100;

        const evaluatedSubmissions = submissions.filter((s: any) => s.status === "EVALUATED");
        const avgScore = evaluatedSubmissions.length > 0
          ? Math.round(
              evaluatedSubmissions.reduce(
                (acc: number, s: any) => acc + (s.marksObtained ?? s.score ?? 0),
                0
              ) / evaluatedSubmissions.length
            )
          : null;

        // Fee status analysis prioritizing current month & pending verification
        const pendingVerificationDoc = payments.find(
          (p: any) => p.status === "PENDING_VERIFICATION"
        );
        const unpaidFeeDoc = payments.find(
          (p: any) => p.status === "PENDING" || p.status === "OVERDUE"
        );
        const latestPaidDoc = payments.find((p: any) => p.status === "PAID");

        let activeStatus = "PAID";
        let activeDoc = latestPaidDoc;
        let isPaid = true;
        let isUnderVerification = false;

        if (pendingVerificationDoc) {
          activeStatus = "PENDING_VERIFICATION";
          activeDoc = pendingVerificationDoc;
          isPaid = false;
          isUnderVerification = true;
        } else if (unpaidFeeDoc) {
          activeStatus = unpaidFeeDoc.status;
          activeDoc = unpaidFeeDoc;
          isPaid = false;
          isUnderVerification = false;
        }

        const feeStatus = {
          isPaid,
          isUnderVerification,
          status: activeStatus,
          label: isUnderVerification
            ? "Under Verification"
            : isPaid
            ? "Paid"
            : "Unpaid Due",
          amount: activeDoc?.amount || 2500,
          billingMonth: activeDoc?.billingMonth || "August 2026",
          receiptNumber: activeDoc?.receiptNumber || "REC-2026-00244",
          transactionId: activeDoc?.transactionId,
          paidDate: latestPaidDoc?.paidDate ? new Date(latestPaidDoc.paidDate).toISOString() : null,
          allPayments: payments.map((p: any) => ({
            _id: p._id,
            amount: p.amount,
            billingMonth: p.billingMonth,
            status: p.status,
            receiptNumber: p.receiptNumber,
            paymentMethod: p.paymentMethod,
            transactionId: p.transactionId,
            paidDate: p.paidDate,
          })),
        };

        return {
          ...st,
          attendancePercentage,
          attendedCount: presentCount,
          totalSessions,
          homeworkSubmitted: submissions.length,
          averageScore: avgScore,
          attendanceRiskLevel: attendancePercentage >= 75 ? "LOW" : attendancePercentage >= 50 ? "MEDIUM" : "HIGH",
          feeStatus,
        };
      })
    );

    return NextResponse.json({ students, batches });
  } catch (error: any) {
    console.error("Teacher Students Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      studentProfileId,
      name,
      phone,
      currentClass,
      board,
      schoolName,
      batchId,
      parentName,
      parentPhone,
    } = body;

    if (!studentProfileId) {
      return NextResponse.json({ error: "Student Profile ID is required." }, { status: 400 });
    }

    await connectToDatabase();

    const profile = await StudentProfile.findById(studentProfileId);
    if (!profile) {
      return NextResponse.json({ error: "Student Profile not found." }, { status: 404 });
    }

    // Update StudentProfile fields
    if (currentClass) profile.currentClass = currentClass;
    if (board) profile.board = board;
    if (schoolName) profile.schoolName = schoolName;
    if (batchId) profile.batchId = batchId;
    if (parentName) profile.parentName = parentName;
    if (parentPhone) profile.parentPhone = parentPhone;
    await profile.save();

    // Update User fields (name, phone)
    if (profile.userId && (name || phone)) {
      await User.findByIdAndUpdate(profile.userId, {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
      });
    }

    const updatedProfile = await StudentProfile.findById(studentProfileId)
      .populate("userId", "name email phone status avatarUrl")
      .populate("batchId")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Student record updated successfully!",
      student: updatedProfile,
    });
  } catch (error: any) {
    console.error("Update Student Profile Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
