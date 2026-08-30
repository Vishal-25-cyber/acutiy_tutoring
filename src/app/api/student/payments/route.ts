import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Payment from "@/models/Payment";
import StudentProfile from "@/models/StudentProfile";
import SystemSettings from "@/models/SystemSettings";
import { emitPaymentStatusUpdate } from "@/lib/payment-events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [settings, profile] = await Promise.all([
      SystemSettings.findOne().lean(),
      StudentProfile.findOne({ userId: session.userId }).lean(),
    ]);

    const monthlyFee = (settings as any)?.monthlyTuitionFee || 2500;
    const companyName = (settings as any)?.companyName || "Acuity Tutoring";
    const upiId = (settings as any)?.upiId || "acuity.tutoring@upi";
    const qrCodeImageUrl = (settings as any)?.qrCodeImageUrl || "";

    // Strictly fetch payments belonging ONLY to this specific student
    const payments = await Payment.find({ studentId: session.userId })
      .sort({ createdAt: -1, dueDate: -1 })
      .lean();

    const pendingVerification = payments.find((p) => p.status === "PENDING_VERIFICATION");
    const currentFee = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
    const history = payments.filter((p) => p.status === "PAID");

    return NextResponse.json(
      {
        currentFee: currentFee || null,
        pendingVerification: pendingVerification || null,
        history, // strictly this student's real payment receipts alone
        allPayments: payments,
        settings: {
          companyName,
          upiId,
          qrCodeImageUrl,
          monthlyFee,
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Student Payments Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId, paymentMethod, transactionId, upiId, courseName, courseId, amount } = await req.json();

    await connectToDatabase();

    let payment = null;
    if (paymentId && paymentId !== "direct-pay") {
      payment = await Payment.findOne({ _id: paymentId, studentId: session.userId });
    }

    const now = new Date();
    const currentMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(now);

    if (!payment) {
      // Create fresh payment submission record
      payment = new Payment({
        studentId: session.userId,
        amount: Number(amount) || 2500,
        billingMonth: currentMonthStr,
        courseName: courseName || `Tuition Fee (${currentMonthStr})`,
        dueDate: now,
        receiptNumber: `REC-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        status: "PENDING_VERIFICATION",
        paymentMethod: paymentMethod || "Online UPI Transfer",
        transactionId: transactionId && transactionId.trim() ? transactionId.trim() : `UPI-${Date.now().toString().slice(-8)}`,
      });
    } else {
      payment.status = "PENDING_VERIFICATION";
      payment.paidDate = undefined;
      payment.paymentMethod = paymentMethod || "Online UPI Transfer";
      payment.transactionId =
        transactionId && transactionId.trim()
          ? transactionId.trim()
          : `UPI-${Date.now().toString().slice(-8)}`;
      if (upiId) payment.upiId = upiId;
      if (courseName) payment.courseName = courseName;
      if (courseId) payment.courseId = courseId;
    }

    await payment.save();

    emitPaymentStatusUpdate({
      paymentId: payment._id.toString(),
      studentId: session.userId,
      status: "PENDING_VERIFICATION",
      amount: payment.amount,
      transactionId: payment.transactionId,
      receiptNumber: payment.receiptNumber,
      billingMonth: payment.billingMonth,
    });

    return NextResponse.json({
      success: true,
      message: "Payment reference submitted. Verification in progress.",
      payment,
    });
  } catch (error: any) {
    console.error("Submit Payment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
