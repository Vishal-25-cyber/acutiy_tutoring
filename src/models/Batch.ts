import mongoose, { Schema, Document, Model } from "mongoose";
import { IBatch } from "@/types";

export interface IBatchDocument extends Document, Omit<IBatch, "_id"> {}

const BatchSchema = new Schema<IBatchDocument>(
  {
    name: { type: String, required: true, trim: true }, // e.g. "6:00 PM – 7:00 PM"
    startTime: { type: String, required: true }, // e.g. "18:00"
    endTime: { type: String, required: true }, // e.g. "19:00"
    days: [{ type: String, default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] }],
    capacity: { type: Number, default: 30 },
    gracePeriodMinutes: { type: Number, default: 5 },
    assignedTeacherIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Batch: Model<IBatchDocument> =
  mongoose.models.Batch || mongoose.model<IBatchDocument>("Batch", BatchSchema);

export default Batch;
