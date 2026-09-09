import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Material from "@/models/Material";
import StudentProfile from "@/models/StudentProfile";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch all materials from MongoDB so teacher can manage all uploaded curriculum resources
    const materials = await Material.find()
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ materials }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Get Materials Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { Readable } from "stream";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, category, fileUrl, fileName, fileSize, classLevel, subject, batchId } =
      await req.json();

    if (!title || !category || !classLevel || !subject) {
      return NextResponse.json(
        { error: "Title, category, class level, and subject are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const db = mongoose.connection.db;

    let permanentFileUrl = fileUrl || "https://acuity.edu/materials/sample-notes.pdf";
    let actualFileSize = fileSize || "1.4 MB";
    const cleanFileName = (fileName || `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`)
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    // Handle large base64 file uploads: stream into MongoDB GridFS (no 16MB document limit!)
    if (fileUrl && fileUrl.startsWith("data:")) {
      let mimeType = "application/pdf";
      let base64Data = "";
      const commaIdx = fileUrl.indexOf(",");
      if (commaIdx !== -1) {
        const header = fileUrl.substring(0, commaIdx);
        base64Data = fileUrl.substring(commaIdx + 1).replace(/\s/g, "+");
        const match = header.match(/data:([^;,]+)/);
        if (match && match[1]) {
          mimeType = match[1].toLowerCase();
        }
      } else {
        base64Data = fileUrl.replace(/\s/g, "+");
      }

      const fileBuffer = Buffer.from(base64Data, "base64");
      const mb = (fileBuffer.length / (1024 * 1024)).toFixed(1);
      actualFileSize = `${mb} MB`;

      if (db) {
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "materials" });
        const uploadStream = bucket.openUploadStream(cleanFileName, {
          contentType: mimeType,
          metadata: {
            title,
            classLevel,
            subject,
            category,
            uploadedBy: session.userId,
            originalName: fileName,
            fileSize: actualFileSize,
            createdAt: new Date(),
          },
        });

        await new Promise<void>((resolve, reject) => {
          const readable = Readable.from(fileBuffer);
          readable
            .pipe(uploadStream)
            .on("finish", () => resolve())
            .on("error", (err) => reject(err));
        });

        const gridFsId = uploadStream.id.toString();
        permanentFileUrl = `/api/materials/file/${gridFsId}`;

        // Also cache to server disk public/uploads/materials/
        try {
          const uploadsDir = path.join(process.cwd(), "public", "uploads", "materials");
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          fs.writeFileSync(path.join(uploadsDir, `${gridFsId}_${cleanFileName}`), fileBuffer);
        } catch (diskErr) {
          console.warn("Could not cache file to disk:", diskErr);
        }
      }
    }

    const newMaterial = await Material.create({
      title,
      description: description || "",
      category,
      fileUrl: permanentFileUrl,
      fileName: cleanFileName,
      fileSize: actualFileSize,
      classLevel,
      subject,
      batchId: batchId || undefined,
      uploadedBy: session.userId,
    });

    // Notify enrolled students in that class
    const students = await StudentProfile.find({ currentClass: classLevel });
    if (students.length > 0) {
      const notifs = students.map((s) => ({
        userId: s.userId,
        title: `New Study Material: ${subject}`,
        message: `Teacher ${session.name || "Faculty"} uploaded "${title}" in the Learning Hub.`,
        type: "NEW_MATERIAL",
        linkUrl: "/student/materials",
      }));
      await Notification.insertMany(notifs);
    }

    return NextResponse.json({
      success: true,
      message: "Material published to Learning Hub and stored in MongoDB successfully!",
      material: newMaterial,
    });
  } catch (error: any) {
    console.error("Post Material Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let materialId = searchParams.get("id");

    if (!materialId) {
      const body = await req.json().catch(() => ({}));
      materialId = body.id || body.materialId;
    }

    if (!materialId) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;

    let deletedDoc: any = null;

    if (mongoose.Types.ObjectId.isValid(materialId)) {
      deletedDoc = await Material.findByIdAndDelete(materialId);
    } else {
      deletedDoc = await Material.findOneAndDelete({
        $or: [{ _id: materialId }, { title: materialId }],
      });
    }

    // Clean up GridFS file if linked
    if (deletedDoc?.fileUrl && db) {
      const match = deletedDoc.fileUrl.match(/\/api\/materials\/file\/([0-9a-fA-F]{24})/);
      if (match && match[1]) {
        try {
          const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "materials" });
          await bucket.delete(new mongoose.Types.ObjectId(match[1]));
        } catch (e) {
          console.warn("GridFS file cleanup warning:", e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Material deleted from MongoDB successfully.",
    });
  } catch (error: any) {
    console.error("Delete Material Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
