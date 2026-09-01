import connectToDatabase from "@/lib/db/mongoose";
import Payment from "@/models/Payment";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import SystemSettings from "@/models/SystemSettings";

export interface FeeAccessStatus {
  isLocked: boolean;
  hasPaid: boolean;
  isUnderReview: boolean;
  isTrialActive: boolean;
  trialHoursRemaining: number;
  trialExpiresAt?: string;
  reason: "PAID" | "FREE_TRIAL" | "PENDING_VERIFICATION" | "UNPAID_DUE";
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
 * Checks whether the student has access:
 * 1. 2-Day Free Trial: From the moment of signup (48 hours), every student gets full free trial access.
 * 2. Paid & Confirmed by Admin: If student paid and admin confirmed (status: PAID), access is granted permanently for billing cycle.
 * 3. Trial Expired + Payment Pending Review: Access locked with "Under Review" notice until admin approves.
 * 4. Trial Expired + Unpaid: Access locked with "Tuition Fee Due" paywall.
 */
export async function getStudentFeeAccessStatus(userId: string): Promise<FeeAccessStatus> {
  await connectToDatabase();

  const [user, profile, settings, payments] = await Promise.all([
    User.findById(userId).lean(),
    StudentProfile.findOne({ userId }).lean(),
    SystemSettings.findOne().lean(),
    Payment.find({ studentId: userId }).sort({ createdAt: -1, dueDate: -1 }).lean(),
  ]);

  const configuredFee = (settings as any)?.monthlyTuitionFee ?? (settings as any)?.monthlyFee ?? 1999;
  const currentMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());

  // 1. Check if student has already PAID & Confirmed by Admin
  const paidDoc = payments.find((p: any) => p.status === "PAID");
  if (paidDoc) {
    return {
      isLocked: false,
      hasPaid: true,
      isUnderReview: false,
      isTrialActive: false,
      trialHoursRemaining: 0,
      reason: "PAID",
      message: "Tuition fees are fully paid and confirmed by admin.",
      unpaidFee: null,
      pendingVerification: null,
    };
  }

  // 2. Check 2-Day Free Trial (48 Hours from user/profile creation date)
  const userCreatedAt = user?.createdAt || (profile as any)?.createdAt;
  const registrationTime = userCreatedAt ? new Date(userCreatedAt).getTime() : Date.now();
  const trialDurationMs = 2 * 24 * 60 * 60 * 1000; // 48 hours = 2 days
  const trialExpiresAt = new Date(registrationTime + trialDurationMs);
  const nowMs = Date.now();

  const isTrialActive = nowMs < trialExpiresAt.getTime();
  const trialHoursRemaining = isTrialActive
    ? Math.max(1, Math.ceil((trialExpiresAt.getTime() - nowMs) / (1000 * 60 * 60)))
    : 0;

  if (isTrialActive) {
    return {
      isLocked: false,
      hasPaid: false,
      isUnderReview: false,
      isTrialActive: true,
      trialHoursRemaining,
      trialExpiresAt: trialExpiresAt.toISOString(),
      reason: "FREE_TRIAL",
      message: `Your account access is currently active. All materials and classes are unlocked!`,
      unpaidFee: null,
      pendingVerification: null,
    };
  }

  // 3. Trial has Expired — Check Payment Status
  const pendingVerificationDoc = payments.find(
    (p: any) => p.status === "PENDING_VERIFICATION"
  );
  const unpaidFeeDoc = payments.find(
    (p: any) => p.status === "PENDING" || p.status === "OVERDUE"
  );

  // 3A. Payment submitted but under review (awaiting admin confirmation)
  if (pendingVerificationDoc) {
    return {
      isLocked: true,
      hasPaid: false,
      isUnderReview: true,
      isTrialActive: false,
      trialHoursRemaining: 0,
      reason: "PENDING_VERIFICATION",
      message: `Your fee submission of ₹${pendingVerificationDoc.amount || configuredFee} for ${pendingVerificationDoc.billingMonth || currentMonthStr} is currently Under Review by the Administrator. Access will unlock once approved.`,
      unpaidFee: null,
      pendingVerification: {
        _id: pendingVerificationDoc._id.toString(),
        amount: pendingVerificationDoc.amount || configuredFee,
        billingMonth: pendingVerificationDoc.billingMonth || currentMonthStr,
        transactionId: pendingVerificationDoc.transactionId,
      },
    };
  }

  // 3B. Unpaid tuition fee dues (Trial Expired)
  return {
    isLocked: true,
    hasPaid: false,
    isUnderReview: false,
    isTrialActive: false,
    trialHoursRemaining: 0,
    reason: "UNPAID_DUE",
    message: `Please complete your monthly tuition fee (₹${unpaidFeeDoc?.amount || configuredFee}) for ${unpaidFeeDoc?.billingMonth || currentMonthStr} to unlock full access to study materials and live sessions.`,
    unpaidFee: {
      _id: unpaidFeeDoc?._id ? unpaidFeeDoc._id.toString() : "unpaid-due",
      amount: unpaidFeeDoc?.amount || configuredFee,
      billingMonth: unpaidFeeDoc?.billingMonth || currentMonthStr,
      dueDate: unpaidFeeDoc?.dueDate ? new Date(unpaidFeeDoc.dueDate).toISOString() : undefined,
      status: unpaidFeeDoc?.status || "PENDING",
      receiptNumber: unpaidFeeDoc?.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
      transactionId: unpaidFeeDoc?.transactionId,
    },
    pendingVerification: null,
  };
}
