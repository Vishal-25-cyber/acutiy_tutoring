import mongoose, { Schema, Document, Model } from "mongoose";
import { ITeacherProfile } from "@/types";

export interface ITeacherProfileDocument extends Document, Omit<ITeacherProfile, "_id"> {}

const TeacherProfileSchema = new Schema<ITeacherProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    staffId: { type: String, trim: true, index: true },
    qualification: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    subjects: [{ type: String, trim: true }],
    classesTaught: [
      {
        type: String,
        enum: [
          "Class 6",
          "Class 7",
          "Class 8",
          "Class 9",
          "Class 10",
        ],
      },
    ],
    experienceYears: { type: Number, required: true, default: 0 },
    district: { type: String, trim: true, default: "" },
    address: { type: String, trim: true },
    resumeUrl: { type: String, default: "" },
    certificateUrl: { type: String, default: "" },
    idProofUrl: { type: String, default: "" },
    approvalStatus: {
      type: String,
      enum: ["ACTIVE", "PENDING_APPROVAL", "SUSPENDED", "REJECTED"],
      default: "PENDING_APPROVAL",
      index: true,
    },
    preferredBatchIds: [{ type: Schema.Types.ObjectId, ref: "Batch" }],
  },
  {
    timestamps: true,
  }
);

export const TeacherProfile: Model<ITeacherProfileDocument> =
  mongoose.models.TeacherProfile ||
  mongoose.model<ITeacherProfileDocument>("TeacherProfile", TeacherProfileSchema);

export default TeacherProfile;
