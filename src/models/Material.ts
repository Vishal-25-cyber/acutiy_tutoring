import mongoose, { Schema, Document, Model } from "mongoose";
import { IMaterial } from "@/types";

export interface IMaterialDocument extends Document, Omit<IMaterial, "_id"> {}

const MaterialSchema = new Schema<IMaterialDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: ["NOTES", "PDF", "WORKSHEET", "ASSIGNMENT", "QUESTION_PAPER", "REVISION", "RECORDING"],
      required: true,
      index: true,
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: String, default: "1.2 MB" },
    classLevel: {
      type: String,
      enum: [
        "Class 6",
        "Class 7",
        "Class 8",
        "Class 9",
        "Class 10",
      ],
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export const Material: Model<IMaterialDocument> =
  mongoose.models.Material || mongoose.model<IMaterialDocument>("Material", MaterialSchema);

export default Material;
