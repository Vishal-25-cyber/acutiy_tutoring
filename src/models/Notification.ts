import mongoose, { Schema, Document, Model } from "mongoose";
import { INotification } from "@/types";

export interface INotificationDocument extends Document, Omit<INotification, "_id"> {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "CLASS_REMINDER",
        "NEW_MATERIAL",
        "ASSIGNMENT",
        "TEST",
        "HOMEWORK",
        "ATTENDANCE_WARNING",
        "ANNOUNCEMENT",
        "SYSTEM",
      ],
      default: "SYSTEM",
      index: true,
    },
    read: { type: Boolean, default: false, index: true },
    linkUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);

export default Notification;
