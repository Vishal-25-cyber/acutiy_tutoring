import mongoose, { Schema, Document, Model } from "mongoose";
import { ILiveSession } from "@/types";

export interface ILiveSessionDocument extends Document, Omit<ILiveSession, "_id"> {}

const ClassroomPollSchema = new Schema(
  {
    question: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        votes: { type: Number, default: 0 },
      },
    ],
    isActive: { type: Boolean, default: true },
    votedUserIds: [{ type: String }],
  },
  { _id: false }
);

const MaterialSchema = new Schema(
  {
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    category: { type: String, default: "NOTES" },
    fileSize: { type: String },
  },
  { _id: false }
);

const LiveSessionSchema = new Schema<ILiveSessionDocument>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, index: true },
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
      default: "Class 10",
      index: true,
    },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // "19:00"
    endTime: { type: String, required: true }, // "20:00"
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"],
      default: "PUBLISHED",
      index: true,
    },
    meetingId: { type: String, index: true },
    livekitRoomId: { type: String, index: true },
    gracePeriodMinutes: { type: Number, default: 5 },
    attendanceThresholdPercent: { type: Number, default: 75 },
    materials: [MaterialSchema],
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    allowLateJoinManually: { type: Boolean, default: false },
    recordingUrl: { type: String, default: "" },
    activePoll: { type: ClassroomPollSchema },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure meetingId and livekitRoomId are populated
LiveSessionSchema.pre("save", function (next) {
  if (!this.meetingId && this.livekitRoomId) {
    this.meetingId = this.livekitRoomId;
  } else if (!this.livekitRoomId && this.meetingId) {
    this.livekitRoomId = this.meetingId;
  }
  next();
});

export const LiveSession: Model<ILiveSessionDocument> =
  mongoose.models.LiveSession ||
  mongoose.model<ILiveSessionDocument>("LiveSession", LiveSessionSchema);

export const Class = LiveSession;

export default LiveSession;
