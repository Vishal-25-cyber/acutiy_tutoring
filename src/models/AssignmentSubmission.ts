import mongoose, { Schema, Document, Model } from "mongoose";
import { IAssignmentSubmission } from "@/types";

export interface IAssignmentSubmissionDocument
  extends Document,
    Omit<IAssignmentSubmission, "_id"> {}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmissionDocument>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    submissionText: { type: String, trim: true },
    fileUrl: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["PENDING", "SUBMITTED", "EVALUATED", "OVERDUE"],
      default: "SUBMITTED",
      index: true,
    },
    marksObtained: { type: Number },
    feedback: { type: String, trim: true },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
    gradedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const AssignmentSubmission: Model<IAssignmentSubmissionDocument> =
  mongoose.models.AssignmentSubmission ||
  mongoose.model<IAssignmentSubmissionDocument>(
    "AssignmentSubmission",
    AssignmentSubmissionSchema
  );

export default AssignmentSubmission;
