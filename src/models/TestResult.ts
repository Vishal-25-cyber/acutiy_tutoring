import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITestResultDocument extends Document {
  testId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  rank?: number;
  teacherRemarks?: string;
  evaluatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TestResultSchema = new Schema<ITestResultDocument>(
  {
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, default: 50 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    rank: { type: Number },
    teacherRemarks: { type: String, default: "", trim: true },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

TestResultSchema.index({ testId: 1, studentId: 1 }, { unique: true });

export const TestResult: Model<ITestResultDocument> =
  mongoose.models.TestResult || mongoose.model<ITestResultDocument>("TestResult", TestResultSchema);

export default TestResult;
