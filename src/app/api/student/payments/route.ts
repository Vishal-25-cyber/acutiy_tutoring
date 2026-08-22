import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Payment from "@/models/Payment";
import SystemSettings from "@/models/SystemSettings";

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
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      });
      payments = [currentInvoice];
    }

    const currentFee = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
    const history = payments.filter((p) => p.status === "PAID");

    return NextResponse.json({
      currentFee: currentFee || null,
      history,
      allPayments: payments,
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

    const { paymentId, paymentMethod } = await req.json();
    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const payment = await Payment.findOne({ _id: paymentId, studentId: session.userId });
    if (!payment) {
      return NextResponse.json({ error: "Payment invoice not found" }, { status: 404 });
    }

    payment.status = "PAID";
    payment.paidDate = new Date();
    payment.paymentMethod = paymentMethod || "Online (Razorpay Gateway Architecture)";
    payment.transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await payment.save();

    return NextResponse.json({
      success: true,
      message: "Tuition payment processed successfully! Receipt is available.",
      payment,
    });
  } catch (error: any) {
    console.error("Process Payment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
