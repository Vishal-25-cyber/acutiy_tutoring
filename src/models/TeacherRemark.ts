import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeacherRemarkDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  teacherName?: string;
  observation: string;
  academicFeedback: string;
  participationFeedback: string;
  areasForImprovement: string;
  recommendations: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherRemarkSchema = new Schema<ITeacherRemarkDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacherName: { type: String, default: "" },
    observation: { type: String, default: "", trim: true },
    academicFeedback: { type: String, default: "", trim: true },
    participationFeedback: { type: String, default: "", trim: true },
    areasForImprovement: { type: String, default: "", trim: true },
    recommendations: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
  }
);

export const TeacherRemark: Model<ITeacherRemarkDocument> =
  mongoose.models.TeacherRemark || mongoose.model<ITeacherRemarkDocument>("TeacherRemark", TeacherRemarkSchema);

export default TeacherRemark;
