import mongoose, { Schema, Document, Model } from "mongoose";
import { IAssignment } from "@/types";

export interface IAssignmentDocument extends Document, Omit<IAssignment, "_id"> {}

const AssignmentSchema = new Schema<IAssignmentDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, index: true },
    classLevel: {
      type: String,
      enum: [
        "Class 6",
        "Class 7",
        "Class 8",
        "Class 9",
        "Class 10",
      ],
      required: true,
      index: true,
    },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["ASSIGNMENT", "TEST", "HOMEWORK"],
      default: "ASSIGNMENT",
      index: true,
    },
    durationMinutes: { type: Number, default: 45 },
    proctoringRequired: { type: Boolean, default: true },
    testDate: { type: Date },
    dueDate: { type: Date, required: true },
    maxMarks: { type: Number, required: true, default: 20 },
    attachmentUrl: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const Assignment: Model<IAssignmentDocument> =
  mongoose.models.Assignment ||
  mongoose.model<IAssignmentDocument>("Assignment", AssignmentSchema);

export default Assignment;
