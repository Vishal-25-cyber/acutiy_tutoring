import mongoose, { Schema, Document, Model } from "mongoose";
import { IPayment } from "@/types";

export interface IPaymentDocument extends Document, Omit<IPayment, "_id"> {}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    billingMonth: { type: String, required: true, index: true }, // "January 2025"
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ["PAID", "PENDING", "PENDING_VERIFICATION", "OVERDUE", "FAILED"],
      default: "PENDING",
      index: true,
    },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    paymentMethod: { type: String, default: "Online (Razorpay Gateway Architecture)" },
    transactionId: { type: String },
    courseName: { type: String },
    courseId: { type: String },
    upiId: { type: String },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models && mongoose.models.Payment) {
  delete (mongoose.models as any).Payment;
}

export const Payment: Model<IPaymentDocument> =
  mongoose.models.Payment || mongoose.model<IPaymentDocument>("Payment", PaymentSchema);

export default Payment;
