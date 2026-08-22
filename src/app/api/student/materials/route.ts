import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import Material from "@/models/Material";

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
    const profile = await StudentProfile.findOne({ userId: session.userId });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const filter: any = {
      classLevel: profile.currentClass,
    };

    if (category && category !== "ALL") {
      filter.category = category;
    }

    if (subject && subject !== "ALL") {
      filter.subject = subject;
    }

    const materials = await Material.find(filter)
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      materials,
      studentClass: profile.currentClass,
      enrolledSubjects: profile.subjects,
    });
  } catch (error: any) {
    console.error("Student Materials API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
