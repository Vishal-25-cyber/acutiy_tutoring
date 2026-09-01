import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudentReportHistoryDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  generatedBy: mongoose.Types.ObjectId;
  reportPeriod: string;
  overallScore: number;
  attendancePercentage: number;
  testAverage: number;
  assignmentCompletionPercentage: number;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentReportHistorySchema = new Schema<IStudentReportHistoryDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportPeriod: { type: String, required: true, default: "This Term" },
    overallScore: { type: Number, required: true },
    attendancePercentage: { type: Number, required: true },
    testAverage: { type: Number, required: true },
    assignmentCompletionPercentage: { type: Number, required: true },
    pdfUrl: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const StudentReportHistory: Model<IStudentReportHistoryDocument> =
  mongoose.models.StudentReportHistory ||
  mongoose.model<IStudentReportHistoryDocument>("StudentReportHistory", StudentReportHistorySchema);

export default StudentReportHistory;
