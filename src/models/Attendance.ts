import mongoose, { Schema, Document, Model } from "mongoose";
import { IAttendance } from "@/types";

export interface IAttendanceDocument extends Document, Omit<IAttendance, "_id"> {}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "LiveSession", required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    classLevel: {
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
    joinTime: { type: Date },
    leaveTime: { type: Date },
    durationMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PRESENT", "LATE", "PARTIAL", "ABSENT"],
      default: "PRESENT",
      index: true,
    },
    manualOverride: { type: Boolean, default: false },
    remarks: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

export const Attendance: Model<IAttendanceDocument> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendanceDocument>("Attendance", AttendanceSchema);

export default Attendance;
