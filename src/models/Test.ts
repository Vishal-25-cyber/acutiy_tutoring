import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITestDocument extends Document {
  title: string;
  subject: string;
  classLevel: "Class 6" | "Class 7" | "Class 8" | "Class 9" | "Class 10";
  batchId: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  testDate: Date;
  maxMarks: number;
  topic?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema = new Schema<ITestDocument>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, index: true },
    classLevel: {
      type: String,
      enum: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
      required: true,
      index: true,
    },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    testDate: { type: Date, required: true, default: Date.now, index: true },
    maxMarks: { type: Number, required: true, default: 50 },
    topic: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
  }
);

export const Test: Model<ITestDocument> =
  mongoose.models.Test || mongoose.model<ITestDocument>("Test", TestSchema);

export default Test;
