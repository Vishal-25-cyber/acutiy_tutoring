import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import { generateStudentPerformanceReport } from "@/lib/performance-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized. Student access required." }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "LAST_90_DAYS";

    const report = await generateStudentPerformanceReport(session.userId, { period });

    return NextResponse.json({
      success: true,
      report,
      overallScore: report.performanceSummary.overallPerformanceScore,
      improvementPercentage: report.performanceSummary.performanceTrend,
      subjectBreakdown: report.subjectBreakdown,
      monthlyProgress: report.testPerformance.monthlyProgress,
      strengths: report.strengths,
      areasForImprovement: report.areasNeedingAttention,
      recommendedActionPlan: report.recommendedActionPlan,
    });
  } catch (error: any) {
    console.error("Student Performance Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load student performance." }, { status: 500 });
  }
}
