import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Payment from "@/models/Payment";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";

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

    const [userDoc, profileDoc] = await Promise.all([
      User.findById(session.userId).lean(),
      StudentProfile.findOne({ userId: session.userId }).lean(),
    ]);

    const start = profileDoc?.trialStartDate || (profileDoc as any)?.createdAt || (userDoc as any)?.createdAt || new Date();
    const startDate = new Date(start);
    const endDate = profileDoc?.trialEndsAt
      ? new Date(profileDoc.trialEndsAt)
      : new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const remainingHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));

    if (paymentId) {
      const payment = await Payment.findOne({
        _id: paymentId,
        studentId: session.userId,
      }).lean();

      if (!payment) {
        return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
      }

      const hasPaid = payment.status === "PAID";
      const isTrialActive = !hasPaid && diffMs > 0;
      const isTrialExpired = !hasPaid && diffMs <= 0;
      const hasAccess = hasPaid || isTrialActive;

      return NextResponse.json({
        success: true,
        status: payment.status,
        hasAccess,
        trial: {
          isTrialActive,
          isTrialExpired,
          trialEndsAt: endDate.toISOString(),
          remainingHours,
          hasPaid,
          hasAccess,
        },
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
    const hasPaid = !!latestPaid;
    const isTrialActive = !hasPaid && diffMs > 0;
    const isTrialExpired = !hasPaid && diffMs <= 0;
    const hasAccess = hasPaid || isTrialActive;

    return NextResponse.json({
      success: true,
      hasAccess,
      trial: {
        isTrialActive,
        isTrialExpired,
        trialEndsAt: endDate.toISOString(),
        remainingHours,
        hasPaid,
        hasAccess,
      },
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
