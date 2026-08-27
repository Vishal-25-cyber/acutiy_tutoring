import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Payment from "@/models/Payment";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    await connectToDatabase();

    if (paymentId) {
      const payment = await Payment.findOne({
        _id: paymentId,
        studentId: session.userId,
      }).lean();

      if (!payment) {
        return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        status: payment.status,
        hasAccess: payment.status === "PAID",
        payment: {
          id: payment._id.toString(),
          amount: payment.amount,
          billingMonth: payment.billingMonth,
          courseName: payment.courseName || payment.billingMonth,
          courseId: payment.courseId,
          status: payment.status,
          transactionId: payment.transactionId,
          receiptNumber: payment.receiptNumber,
          paidDate: payment.paidDate,
          dueDate: payment.dueDate,
        },
      });
    }

    // If no paymentId, return current active / pending verification payments
    const payments = await Payment.find({ studentId: session.userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const pendingVerification = payments.find((p) => p.status === "PENDING_VERIFICATION");
    const latestPaid = payments.find((p) => p.status === "PAID");

    return NextResponse.json({
      success: true,
      pendingVerification: pendingVerification
        ? {
            id: pendingVerification._id.toString(),
            amount: pendingVerification.amount,
            billingMonth: pendingVerification.billingMonth,
            courseName: pendingVerification.courseName || pendingVerification.billingMonth,
            status: pendingVerification.status,
            transactionId: pendingVerification.transactionId,
          }
        : null,
      latestPaid: latestPaid
        ? {
            id: latestPaid._id.toString(),
            amount: latestPaid.amount,
            billingMonth: latestPaid.billingMonth,
            courseName: latestPaid.courseName || latestPaid.billingMonth,
            status: latestPaid.status,
            transactionId: latestPaid.transactionId,
            paidDate: latestPaid.paidDate,
          }
        : null,
      payments: payments.map((p) => ({
        id: p._id.toString(),
        amount: p.amount,
        billingMonth: p.billingMonth,
        courseName: p.courseName || p.billingMonth,
        status: p.status,
        hasAccess: p.status === "PAID",
        transactionId: p.transactionId,
        receiptNumber: p.receiptNumber,
      })),
    });
  } catch (error: any) {
    console.error("Payment Status Check Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
