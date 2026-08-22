import mongoose, { Schema, Document, Model } from "mongoose";
import { IStaffAttendance } from "@/types";

export interface IStaffAttendanceDocument extends Document, Omit<IStaffAttendance, "_id"> {}

const StaffAttendanceSchema = new Schema<IStaffAttendanceDocument>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    loginTime: { type: Date, required: true },
    logoutTime: { type: Date },
    classesConducted: { type: Number, default: 0 },
    workingHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PRESENT", "LEAVE", "HALF_DAY", "ABSENT"],
      default: "PRESENT",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

StaffAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

export const StaffAttendance: Model<IStaffAttendanceDocument> =
  mongoose.models.StaffAttendance ||
  mongoose.model<IStaffAttendanceDocument>("StaffAttendance", StaffAttendanceSchema);

export default StaffAttendance;
