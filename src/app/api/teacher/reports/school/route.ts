import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import { getDistinctSchoolsList, generateSchoolPerformanceReport } from "@/lib/performance-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Staff/Teacher access required." }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const schoolName = searchParams.get("schoolName");
    const classLevel = searchParams.get("classLevel") || "ALL";
    const period = searchParams.get("period") || "LAST_90_DAYS";

    // 1. If schoolName is provided, generate the full consolidated school cohort performance report
    if (schoolName) {
      const report = await generateSchoolPerformanceReport(schoolName, {
        classLevel,
        period,
      });

      return NextResponse.json({
        success: true,
        report,
      });
    }

    // 2. Otherwise return the list of all distinct schools with student count
    const schools = await getDistinctSchoolsList();

    return NextResponse.json({
      success: true,
      schools,
    });
  } catch (error: any) {
    console.error("School Reports API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load school performance reports." },
      { status: 500 }
    );
  }
}
