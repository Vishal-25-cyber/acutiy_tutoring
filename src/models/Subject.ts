import mongoose, { Schema, Document, Model } from "mongoose";
import { ISubject } from "@/types";

export interface ISubjectDocument extends Document, Omit<ISubject, "_id"> {}

const SubjectSchema = new Schema<ISubjectDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    icon: { type: String, default: "BookOpen" },
    color: { type: String, default: "#6366f1" },
  },
  {
    timestamps: true,
  }
);

export const Subject: Model<ISubjectDocument> =
  mongoose.models.Subject || mongoose.model<ISubjectDocument>("Subject", SubjectSchema);

export default Subject;
