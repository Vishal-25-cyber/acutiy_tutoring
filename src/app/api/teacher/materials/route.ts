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

    const newMaterial = await Material.create({
      title,
      description: description || "",
      category,
      fileUrl: fileUrl || "https://acuity.edu/materials/sample-notes.pdf",
      fileName: fileName || `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: fileSize || "1.4 MB",
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

    if (mongoose.Types.ObjectId.isValid(materialId)) {
      await Material.findByIdAndDelete(materialId);
    } else {
      await Material.findOneAndDelete({
        $or: [{ _id: materialId }, { title: materialId }],
      });
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
