import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import Material from "@/models/Material";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    readableStream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    readableStream.on("end", () => resolve(Buffer.concat(chunks)));
    readableStream.on("error", (err) => reject(err));
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    let rawId = resolvedParams?.id || "";

    if (!rawId) {
      const urlPath = req.nextUrl?.pathname || new URL(req.url).pathname;
      const parts = urlPath.split("/");
      rawId = parts[parts.length - 1] || "";
    }

    if (!rawId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Determine download mode vs inline browser view
    const urlObj = req.nextUrl || new URL(req.url);
    const isDownload = urlObj.searchParams.get("download") === "1";

    // Clean ID: strip file extension if appended e.g. "65c123.pdf" -> "65c123"
    const cleanId = rawId.replace(/\.[a-zA-Z0-9]+$/, "");

    await connectToDatabase();
    const db = mongoose.connection.db;

    let fileBuffer: Buffer | null = null;
    let contentType = "application/pdf";
    let fileName = "study_material.pdf";

    // 1. Try finding in MongoDB GridFS by ObjectId
    if (db && mongoose.Types.ObjectId.isValid(cleanId)) {
      try {
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "materials" });
        const files = await bucket.find({ _id: new mongoose.Types.ObjectId(cleanId) }).toArray();
        if (files && files.length > 0) {
          const fileDoc = files[0];
          const downloadStream = bucket.openDownloadStream(fileDoc._id);
          fileBuffer = await streamToBuffer(downloadStream);
          contentType = fileDoc.contentType || "application/pdf";
          fileName = fileDoc.filename || fileDoc.metadata?.originalName || "study_material.pdf";
        }
      } catch (gridFsErr) {
        console.warn("GridFS lookup warning:", gridFsErr);
      }
    }

    // 2. If not found in GridFS directly, check if cleanId is a Material document _id
    if (!fileBuffer && mongoose.Types.ObjectId.isValid(cleanId)) {
      try {
        const material = await Material.findById(cleanId).lean();
        if (material) {
          fileName = material.fileName || `${material.title.replace(/\s+/g, "_")}.pdf`;

          // If material references a GridFS file:
          const gridFsMatch = material.fileUrl?.match(/\/api\/materials\/file\/([0-9a-fA-F]{24})/);
          if (gridFsMatch && gridFsMatch[1] && db) {
            const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "materials" });
            const files = await bucket.find({ _id: new mongoose.Types.ObjectId(gridFsMatch[1]) }).toArray();
            if (files && files.length > 0) {
              const fileDoc = files[0];
              const downloadStream = bucket.openDownloadStream(fileDoc._id);
              fileBuffer = await streamToBuffer(downloadStream);
              contentType = fileDoc.contentType || "application/pdf";
            }
          }

          // If material stores a base64 data URL:
          if (!fileBuffer && material.fileUrl?.startsWith("data:")) {
            const dataUrl = material.fileUrl;
            const commaIdx = dataUrl.indexOf(",");
            if (commaIdx !== -1) {
              const header = dataUrl.substring(0, commaIdx);
              const base64Data = dataUrl.substring(commaIdx + 1).replace(/\s/g, "+");
              fileBuffer = Buffer.from(base64Data, "base64");
              const mimeMatch = header.match(/data:([^;,]+)/);
              if (mimeMatch && mimeMatch[1]) {
                contentType = mimeMatch[1].toLowerCase();
              }
            }
          }

          // If material stores a local static upload URL:
          if (!fileBuffer && material.fileUrl?.startsWith("/uploads/")) {
            const localDiskPath = path.join(process.cwd(), "public", material.fileUrl);
            if (fs.existsSync(localDiskPath)) {
              fileBuffer = fs.readFileSync(localDiskPath);
            }
          }
        }
      } catch (matErr) {
        console.warn("Material doc lookup warning:", matErr);
      }
    }

    // 3. Check local disk uploads cache
    if (!fileBuffer) {
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "materials");
        if (fs.existsSync(uploadsDir)) {
          const entries = fs.readdirSync(uploadsDir);
          const matchedFile = entries.find(
            (f) => f.startsWith(cleanId) || f === rawId || f.includes(cleanId)
          );
          if (matchedFile) {
            fileBuffer = fs.readFileSync(path.join(uploadsDir, matchedFile));
            fileName = matchedFile.replace(/^[0-9a-fA-F]{24}_/, "");
            if (fileName.toLowerCase().endsWith(".pdf")) contentType = "application/pdf";
            else if (fileName.toLowerCase().endsWith(".png")) contentType = "image/png";
            else if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
          }
        }
      } catch (diskErr) {
        console.warn("Disk upload lookup warning:", diskErr);
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: "Study material file not found or corrupted." }, { status: 404 });
    }

    // Guarantee clean extension on filename
    const safeExt = contentType === "application/pdf" ? ".pdf" : "";
    if (safeExt && !fileName.toLowerCase().endsWith(safeExt)) {
      fileName = `${fileName}${safeExt}`;
    }

    const disposition = isDownload ? "attachment" : "inline";
    const encodedFileName = encodeURIComponent(fileName);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.length),
        "Content-Disposition": `${disposition}; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error: any) {
    console.error("GET /api/materials/file/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to stream file" }, { status: 500 });
  }
}
