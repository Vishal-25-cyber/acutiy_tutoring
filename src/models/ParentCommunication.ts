import mongoose, { Schema, Document, Model } from "mongoose";

export interface IParentCommunicationDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  teacherName?: string;
  contactDate: Date;
  communicationMethod: "CALL" | "WHATSAPP" | "EMAIL" | "IN_PERSON";
  discussionSummary: string;
  followUpDate?: Date;
  followUpStatus: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  createdAt: Date;
  updatedAt: Date;
}

const ParentCommunicationSchema = new Schema<IParentCommunicationDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacherName: { type: String, default: "" },
    contactDate: { type: Date, required: true, default: Date.now, index: true },
    communicationMethod: {
      type: String,
      enum: ["CALL", "WHATSAPP", "EMAIL", "IN_PERSON"],
      default: "CALL",
    },
    discussionSummary: { type: String, required: true, trim: true },
    followUpDate: { type: Date },
    followUpStatus: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "RESOLVED"],
      default: "PENDING",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ParentCommunication: Model<IParentCommunicationDocument> =
  mongoose.models.ParentCommunication ||
  mongoose.model<IParentCommunicationDocument>("ParentCommunication", ParentCommunicationSchema);

export default ParentCommunication;
