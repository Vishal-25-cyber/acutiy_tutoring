import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnouncementDocument extends Document {
  title: string;
  content: string;
  targetRole: "ALL" | "STUDENT" | "TEACHER";
  classLevel?: string;
  batchId?: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    targetRole: {
      type: String,
      enum: ["ALL", "STUDENT", "TEACHER"],
      default: "ALL",
      index: true,
    },
    classLevel: { type: String, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch" },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export const Announcement: Model<IAnnouncementDocument> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncementDocument>("Announcement", AnnouncementSchema);

export default Announcement;
