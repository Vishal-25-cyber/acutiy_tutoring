import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Payment from "@/models/Payment";
import StudentProfile from "@/models/StudentProfile";
import SystemSettings from "@/models/SystemSettings";
import { emitPaymentStatusUpdate } from "@/lib/payment-events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    let payments = await Payment.find({ studentId: session.userId }).sort({ createdAt: -1, dueDate: -1 });

    const now = new Date();
    const currentMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(now);

    // If no payments created yet, generate current active invoice dynamically
    if (payments.length === 0) {
      const [settings, profile] = await Promise.all([
        SystemSettings.findOne().lean(),
        StudentProfile.findOne({ userId: session.userId }).lean(),
      ]);

      const monthlyFee = (settings as any)?.monthlyTuitionFee || 2500;
      const classLevel = (profile as any)?.currentClass || "Class 10";
      const board = (profile as any)?.board || "CBSE";

      const currentInvoice = await Payment.create({
        studentId: session.userId,
        amount: monthlyFee,
        billingMonth: currentMonthStr,
        courseName: `${classLevel} ${board} — All Subjects Comprehensive Bundle (${currentMonthStr})`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        receiptNumber: `REC-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      });
      payments = [currentInvoice];
    }

    const pendingVerification = payments.find((p) => p.status === "PENDING_VERIFICATION");
    const currentFee = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
    const history = payments.filter((p) => p.status === "PAID");

    return NextResponse.json(
      {
        currentFee: currentFee || null,
        pendingVerification: pendingVerification || null,
        history,
        allPayments: payments,
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
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId, paymentMethod, transactionId, upiId, courseName, courseId } = await req.json();
    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const payment = await Payment.findOne({ _id: paymentId, studentId: session.userId });
    if (!payment) {
      return NextResponse.json({ error: "Payment invoice not found" }, { status: 404 });
    }

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
    await payment.save();

    emitPaymentStatusUpdate({
      paymentId: payment._id.toString(),
      studentId: session.userId,
      courseId: payment.courseId,
      courseName: payment.courseName || payment.billingMonth,
      status: "PENDING_VERIFICATION",
      amount: payment.amount,
      transactionId: payment.transactionId,
      receiptNumber: payment.receiptNumber,
      billingMonth: payment.billingMonth,
    });

    return NextResponse.json({
      success: true,
      status: "PENDING_VERIFICATION",
      message: "Tuition payment submitted successfully! It is now Under Review and awaiting confirmation by the administrator.",
      payment,
    });
  } catch (error: any) {
    console.error("Process Payment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
