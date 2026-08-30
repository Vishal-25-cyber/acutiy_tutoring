import connectToDatabase from "@/lib/db/mongoose";
import Payment from "@/models/Payment";

export interface FeeAccessStatus {
  isLocked: boolean;
  hasPaid: boolean;
  isUnderReview: boolean;
  reason: "PAID" | "PENDING_VERIFICATION" | "UNPAID_DUE";
  message: string;
  unpaidFee: {
    _id: string;
    amount: number;
    billingMonth: string;
    dueDate?: string;
    status: string;
    receiptNumber: string;
    transactionId?: string;
  } | null;
  pendingVerification: {
    _id: string;
    amount: number;
    billingMonth: string;
    transactionId?: string;
  } | null;
}

/**
 * Checks whether the student has paid and been confirmed by Admin.
 * - If status is PENDING_VERIFICATION: Payment is under review (Access Locked until Admin Confirms).
 * - If status is PENDING / OVERDUE: Payment is unpaid (Access Locked until Paid & Confirmed).
 * - If status is PAID: Confirmed by Admin (Access Granted).
 */
export async function getStudentFeeAccessStatus(userId: string): Promise<FeeAccessStatus> {
  await connectToDatabase();

  const payments = await Payment.find({ studentId: userId }).sort({ createdAt: -1, dueDate: -1 }).lean();

  const pendingVerificationDoc = payments.find(
    (p: any) => p.status === "PENDING_VERIFICATION"
  );
  const unpaidFeeDoc = payments.find(
    (p: any) => p.status === "PENDING" || p.status === "OVERDUE"
  );

  // 1. Payment submitted but under review (awaiting admin confirmation)
  if (pendingVerificationDoc) {
    return {
      isLocked: true,
      hasPaid: false,
      isUnderReview: true,
      reason: "PENDING_VERIFICATION",
      message: `Your payment of ₹${pendingVerificationDoc.amount} for ${pendingVerificationDoc.billingMonth} has been received and is currently Under Review by the Administrator. Access to live classes and notes will be unlocked once approved by the admin.`,
      unpaidFee: null,
      pendingVerification: {
        _id: pendingVerificationDoc._id.toString(),
        amount: pendingVerificationDoc.amount,
        billingMonth: pendingVerificationDoc.billingMonth,
        transactionId: pendingVerificationDoc.transactionId,
      },
    };
  }

  // 2. Unpaid tuition fee dues
  if (unpaidFeeDoc) {
    return {
      isLocked: true,
      hasPaid: false,
      isUnderReview: false,
      reason: "UNPAID_DUE",
      message: `Monthly tuition fee for ${unpaidFeeDoc.billingMonth} (₹${unpaidFeeDoc.amount}) is unpaid. Please complete fee payment to submit for admin confirmation and unlock classes.`,
      unpaidFee: {
        _id: unpaidFeeDoc._id.toString(),
        amount: unpaidFeeDoc.amount,
        billingMonth: unpaidFeeDoc.billingMonth,
        dueDate: unpaidFeeDoc.dueDate ? new Date(unpaidFeeDoc.dueDate).toISOString() : undefined,
        status: unpaidFeeDoc.status,
        receiptNumber: unpaidFeeDoc.receiptNumber,
        transactionId: unpaidFeeDoc.transactionId,
      },
      pendingVerification: null,
    };
  }

  // 3. Paid & Confirmed by Admin
  return {
    isLocked: false,
    hasPaid: true,
    isUnderReview: false,
    reason: "PAID",
    message: "Tuition fees are fully paid and confirmed by admin.",
    unpaidFee: null,
    pendingVerification: null,
  };
}
