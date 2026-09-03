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

    const rawFee = Number((settings as any)?.monthlyTuitionFee ?? (settings as any)?.monthlyFee);
    const monthlyFee = !isNaN(rawFee) && rawFee > 0 ? rawFee : 1999;
    const companyName = (settings as any)?.companyName || "Mantif Tutoring";
    const upiId = (settings as any)?.upiId || "karunyas001-1@okicici";
    const qrCodeImageUrl = (settings as any)?.qrCodeImageUrl || "";
    const currentMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());

    // Strictly fetch payments belonging ONLY to this specific student
    let payments: any[] = await Payment.find({ studentId: session.userId })
      .sort({ createdAt: -1, dueDate: -1 })
      .lean();

    // If no invoice exists, generate one atomically for the current month
    if (payments.length === 0) {
      const invoice = await Payment.findOneAndUpdate(
        { studentId: session.userId, billingMonth: currentMonthStr },
        {
          $setOnInsert: {
            studentId: session.userId,
            amount: monthlyFee,
            billingMonth: currentMonthStr,
            courseName: `${profile?.currentClass || "Class 10"} ${profile?.board || "CBSE"} — Core Academic Tuition`,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            status: "PENDING",
            receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      payments = [invoice];
    } else {
      // Deduplicate: If there are multiple PENDING invoices for the same month, delete duplicates
      const seenMonths = new Set<string>();
      const uniquePayments: any[] = [];
      for (const p of payments) {
        const key = `${p.billingMonth || currentMonthStr}-${p.status}`;
        if (p.status === "PENDING" && seenMonths.has(key)) {
          await Payment.deleteOne({ _id: p._id });
        } else {
          seenMonths.add(key);
          if (
            (p.status === "PENDING" || p.status === "PENDING_VERIFICATION") &&
            (p.amount !== monthlyFee || !p.amount || p.amount <= 0 || p.billingMonth === "February 2025" || !p.billingMonth)
          ) {
            await Payment.updateOne(
              { _id: p._id },
              { $set: { amount: monthlyFee, billingMonth: currentMonthStr } }
            );
            p.amount = monthlyFee;
            p.billingMonth = currentMonthStr;
          }
          uniquePayments.push(p);
        }
      }
      payments = uniquePayments;
    }

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

    const settings = await SystemSettings.findOne().lean();
    const configuredFee = (settings as any)?.monthlyTuitionFee ?? (settings as any)?.monthlyFee ?? 1999;

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
        amount: Number(amount) || configuredFee,
        billingMonth: currentMonthStr,
        courseName: courseName || `Tuition Fee (${currentMonthStr})`,
        dueDate: now,
        receiptNumber: `REC-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        status: "PENDING_VERIFICATION",
        paymentMethod: paymentMethod || "Online UPI Transfer",
        transactionId: transactionId && transactionId.trim() ? transactionId.trim() : `UPI-${Date.now().toString().slice(-8)}`,
      });
    } else {
      payment.amount = Number(amount) || payment.amount || configuredFee;
      payment.billingMonth = currentMonthStr;
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
