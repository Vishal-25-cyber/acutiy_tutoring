import mongoose, { Schema, Document, Model } from "mongoose";
import { IStudentProfile } from "@/types";

export interface IStudentProfileDocument extends Document, Omit<IStudentProfile, "_id"> {}

const StudentProfileSchema = new Schema<IStudentProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    schoolName: { type: String, required: true, trim: true },
    board: {
      type: String,
      enum: ["CBSE", "State Board"],
      required: true,
      index: true,
    },
    currentClass: {
      type: String,
      enum: [
        "Class 1",
        "Class 2",
        "Class 3",
        "Class 4",
        "Class 5",
        "Class 6",
        "Class 7",
        "Class 8",
        "Class 9",
        "Class 10",
      ],
      required: true,
      index: true,
    },
    subjects: [{ type: String, trim: true }],
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    parentName: { type: String, required: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    altEmergencyPhone: { type: String, trim: true },
    dob: { type: String },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER", "Male", "Female", "Other"],
      default: "OTHER",
      set: (v: string) => (v ? v.toUpperCase() : "OTHER"),
    },
    streakCount: { type: Number, default: 1 },
    streakLastUpdated: { type: Date, default: Date.now },
    earnedBadges: {
      type: [String],
      default: ["First Class", "Eager Learner"],
    },
    attendanceRiskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
      index: true,
    },
    totalClassesAttended: { type: Number, default: 0 },
    totalClassesScheduled: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile: Model<IStudentProfileDocument> =
  mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfileDocument>("StudentProfile", StudentProfileSchema);

export default StudentProfile;
