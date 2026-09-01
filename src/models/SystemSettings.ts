import mongoose, { Schema, Document, Model } from "mongoose";
import { ISystemSettings } from "@/types";

export interface ISystemSettingsDocument extends Document, ISystemSettings {}

const SystemSettingsSchema = new Schema<ISystemSettingsDocument>(
  {
    companyName: { type: String, default: "Mantif Tutoring & Live Learning" },
    logoUrl: { type: String, default: "/images/mantif_logo.png" },
    upiId: { type: String, default: "mantif.tutoring@upi" },
    qrCodeImageUrl: { type: String, default: "" },
    supportPhone1: { type: String, default: "+91 98765 43210" },
    supportPhone2: { type: String, default: "+91 98765 43211" },
    supportPhone3: { type: String, default: "+91 98765 43212" },
    supportEmail: { type: String, default: "support@mantif.edu" },
    defaultGracePeriodMinutes: { type: Number, default: 5 },
    minAttendanceThresholdPercent: { type: Number, default: 75 },
    monthlyTuitionFee: { type: Number, default: 2500 },
    registrationFee: { type: Number, default: 500 },
    academicYear: { type: String, default: "2025-2026" },
  },
  {
    timestamps: true,
  }
);

export const SystemSettings: Model<ISystemSettingsDocument> =
  mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettingsDocument>("SystemSettings", SystemSettingsSchema);

export default SystemSettings;
