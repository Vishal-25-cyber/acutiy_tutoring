import mongoose, { Schema, Document, Model } from "mongoose";
import { IAuditLog } from "@/types";

export interface IAuditLogDocument extends Document, Omit<IAuditLog, "_id"> {}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true }, // e.g. "TEACHER_APPROVED", "BATCH_CHANGED"
    entityType: { type: String, required: true, index: true }, // "USER", "BATCH", "ATTENDANCE"
    entityId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);

export default AuditLog;
