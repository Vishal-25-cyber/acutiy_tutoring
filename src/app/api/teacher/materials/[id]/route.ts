import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Material from "@/models/Material";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    let deletedDoc = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      deletedDoc = await Material.findByIdAndDelete(id);
    }

    if (!deletedDoc) {
      deletedDoc = await Material.findOneAndDelete({
        $or: [{ _id: id }, { title: id }, { fileName: id }],
      });
    }

    return NextResponse.json({
      success: true,
      message: "Study material deleted from MongoDB successfully.",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("DELETE /api/teacher/materials/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete material" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const material = mongoose.Types.ObjectId.isValid(id)
      ? await Material.findById(id).populate("uploadedBy", "name email").lean()
      : await Material.findOne({ title: id }).populate("uploadedBy", "name email").lean();

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json({ material });
  } catch (error: any) {
    console.error("GET /api/teacher/materials/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch material" }, { status: 500 });
  }
}
