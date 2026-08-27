import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Payment from "@/models/Payment";
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
    let payments = await Payment.find({ studentId: session.userId }).sort({ dueDate: -1 });

    // If no payments created yet, generate current active invoice
    if (payments.length === 0) {
      const settings = await SystemSettings.findOne();
      const monthlyFee = settings?.monthlyTuitionFee || 2500;
      const currentInvoice = await Payment.create({
        studentId: session.userId,
        amount: monthlyFee,
        billingMonth: "February 2025",
        courseName: "Class 10 CBSE — All Subjects Comprehensive Bundle",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      });
      payments = [currentInvoice];
    }

    const pendingVerification = payments.find((p) => p.status === "PENDING_VERIFICATION");
    const currentFee = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
    const history = payments.filter((p) => p.status === "PAID");

    return NextResponse.json({
      currentFee: currentFee || null,
      pendingVerification: pendingVerification || null,
      history,
      allPayments: payments,
    }, {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    });
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

    // Set to PENDING_VERIFICATION (do not mark PAID prematurely!)
    payment.status = "PENDING_VERIFICATION";
    payment.paymentMethod = paymentMethod || "Online UPI Transfer";
    payment.transactionId =
      transactionId && transactionId.trim()
        ? transactionId.trim()
        : `UPI-${Date.now().toString().slice(-8)}`;
    if (upiId) payment.upiId = upiId;
    if (courseName) payment.courseName = courseName;
    if (courseId) payment.courseId = courseId;
    await payment.save();

    // Emit event so any listeners get notified of pending state
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
      message: "Payment transaction submitted successfully. Awaiting administrative verification.",
      payment,
    });
  } catch (error: any) {
    console.error("Process Payment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
