import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import Material from "@/models/Material";
import { getSubjectsForClassAndBoard } from "@/lib/curriculum";
import { getStudentFeeAccessStatus } from "@/lib/fee-guard";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subject = searchParams.get("subject");

    await connectToDatabase();

    // 1. Fee Lock Enforcement: Student cannot download/access study notes if monthly tuition is unpaid or under review
    const feeStatus = await getStudentFeeAccessStatus(session.userId);
    if (feeStatus.isLocked) {
      return NextResponse.json({
        locked: true,
        reason: feeStatus.reason,
        isUnderReview: feeStatus.isUnderReview,
        message: feeStatus.message,
        unpaidFee: feeStatus.unpaidFee,
        pendingVerification: feeStatus.pendingVerification,
        materials: [],
      });
    }

    const profile = await StudentProfile.findOne({ userId: session.userId }).lean();
    if (!profile) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const currentClass = profile.currentClass || "Class 10";
    const board = profile.board || "CBSE";

    // Filter materials for this student's class level
    const filter: any = {
      $or: [
        { classLevel: currentClass },
        { classLevel: { $exists: false } },
        { classLevel: null },
      ],
    };

    if (category && category !== "ALL") {
      filter.category = category;
    }

    if (subject && subject !== "ALL") {
      filter.subject = subject;
    }

    const rawMaterials = await Material.find(filter)
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // Format all faculty-uploaded materials with proper fallback author
    const materials = rawMaterials.map((m: any) => ({
      _id: m._id.toString(),
      title: m.title,
      description: m.description,
      category: m.category || "NOTES",
      fileUrl: m.fileUrl,
      fileName: m.fileName || `${m.title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: m.fileSize || "1.4 MB",
      classLevel: m.classLevel || currentClass,
      subject: m.subject || "General",
      uploadedBy: m.uploadedBy?.name || (typeof m.uploadedBy === "string" ? m.uploadedBy : "Faculty Specialist"),
      createdAt: m.createdAt,
    }));

    const syllabusSubjects = getSubjectsForClassAndBoard(currentClass, board);

    return NextResponse.json({
      materials,
      studentClass: currentClass,
      board: board,
      enrolledSubjects: profile.subjects?.length > 0 ? profile.subjects : syllabusSubjects,
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Student Materials API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
