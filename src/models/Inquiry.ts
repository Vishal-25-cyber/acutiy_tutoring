import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInquiry extends Document {
  name: string;
  email: string;
  phone: string;
  classLevel?: string;
  subject?: string;
  message: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED";
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    classLevel: { type: String, default: "Class 10" },
    subject: { type: String, default: "General Admissions & Curriculum" },
    message: { type: String, required: true },
    status: { type: String, enum: ["NEW", "IN_PROGRESS", "RESOLVED"], default: "NEW" },
  },
  { timestamps: true }
);

export const Inquiry: Model<IInquiry> =
  mongoose.models.Inquiry || mongoose.model<IInquiry>("Inquiry", InquirySchema);

export default Inquiry;
