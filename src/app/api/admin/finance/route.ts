import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Payment from "@/models/Payment";
import StudentProfile from "@/models/StudentProfile";
import SystemSettings from "@/models/SystemSettings";
import { recordAuditLog } from "@/lib/audit";
import { emitPaymentStatusUpdate } from "@/lib/payment-events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const rawPayments = await Payment.find()
      .populate("studentId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    // Only keep payments belonging to existing students
    const payments = rawPayments.filter((p: any) => p.studentId != null);

    const totalCollected = payments
      .filter((p: any) => p.status === "PAID")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const totalPending = payments
      .filter((p: any) => p.status === "PENDING" || p.status === "PENDING_VERIFICATION" || p.status === "OVERDUE")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const paidCount = payments.filter((p: any) => p.status === "PAID").length;
    const pendingVerificationCount = payments.filter((p: any) => p.status === "PENDING_VERIFICATION").length;
    const unpaidCount = payments.filter((p: any) => p.status === "PENDING" || p.status === "PENDING_VERIFICATION" || p.status === "OVERDUE").length;

    // Build dynamic monthly trend from real payments
    const monthMap: Record<string, { collected: number; pending: number }> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    // Initialize last 5 months
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      monthMap[mName] = { collected: 0, pending: 0 };
    }

    // Populate from real payments
    payments.forEach((p: any) => {
      const pDate = p.paidDate ? new Date(p.paidDate) : p.createdAt ? new Date(p.createdAt) : new Date();
      const mName = months[pDate.getMonth()];
      if (!monthMap[mName]) {
        monthMap[mName] = { collected: 0, pending: 0 };
      }
      if (p.status === "PAID") {
        monthMap[mName].collected += p.amount || 0;
      } else {
        monthMap[mName].pending += p.amount || 0;
      }
    });

    const monthlyTrend = Object.entries(monthMap).map(([month, data]) => ({
      month,
      collected: data.collected,
      pending: data.pending,
    }));

    return NextResponse.json({
      payments,
      summary: {
        totalRevenue: totalCollected + totalPending,
        totalCollected,
        totalPending,
        paidStudentsCount: paidCount,
        pendingVerificationCount,
        unpaidStudentsCount: unpaidCount,
        collectionRate: totalCollected + totalPending > 0
          ? Math.round((totalCollected / (totalCollected + totalPending)) * 100)
          : 100,
        totalTransactions: payments.length,
      },
      monthlyTrend,
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Admin Finance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId, status } = await req.json();
    if (!paymentId || !status) {
      return NextResponse.json({ error: "Payment ID and status required" }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await Payment.findById(paymentId);
    if (!existing) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const updated = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status,
        ...(status === "PAID" && {
          paidDate: new Date(),
          paymentMethod: existing.paymentMethod || "Admin Verified (Online UPI / Netbanking)",
          transactionId: existing.transactionId || `TXN-VERIFIED-${Date.now().toString().slice(-6)}`,
        }),
      },
      { new: true }
    );

    if (updated && status === "PAID") {
      const studentIdStr =
        typeof updated.studentId === "object" && updated.studentId !== null && "_id" in updated.studentId
          ? (updated.studentId as any)._id.toString()
          : updated.studentId.toString();

      emitPaymentStatusUpdate({
        paymentId: updated._id.toString(),
        studentId: studentIdStr,
        courseId: updated.courseId,
        courseName: updated.courseName || updated.billingMonth,
        status: "PAID",
        amount: updated.amount,
        transactionId: updated.transactionId || `TXN-VERIFIED-${Date.now().toString().slice(-6)}`,
        receiptNumber: updated.receiptNumber,
        billingMonth: updated.billingMonth,
        verifiedAt: new Date().toISOString(),
      });
    }

    await recordAuditLog({
      actorId: session.userId,
      action: `PAYMENT_STATUS_${status}`,
      entityType: "PAYMENT",
      entityId: paymentId,
      details: { status, amount: updated?.amount, transactionId: updated?.transactionId },
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error: any) {
    console.error("Admin Update Payment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
