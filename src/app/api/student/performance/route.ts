import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import AssignmentSubmission from "@/models/AssignmentSubmission";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const profile = await StudentProfile.findOne({ userId: session.userId });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const submissions = await AssignmentSubmission.find({
      studentId: session.userId,
      status: "EVALUATED",
    }).populate("assignmentId");

    // Monthly progress trend
    const monthlyProgress = [
      { month: "Sep", score: 72, attendance: 88 },
      { month: "Oct", score: 78, attendance: 92 },
      { month: "Nov", score: 82, attendance: 94 },
      { month: "Dec", score: 85, attendance: 90 },
      { month: "Jan", score: 89, attendance: 96 },
    ];

    // Subject breakdown
    const subjectBreakdown = [
      { subject: "Mathematics", score: 88, fullMark: 100, strength: "Strong in Algebra & Geometry" },
      { subject: "Science", score: 84, fullMark: 100, strength: "Strong in Physics & Chemical Reactions" },
      { subject: "English", score: 92, fullMark: 100, strength: "High reading comprehension & vocabulary" },
      { subject: "Social Science", score: 79, fullMark: 100, strength: "Good in Geography, Revise Map Work" },
    ];

    const overallScore = Math.round(
      subjectBreakdown.reduce((acc, curr) => acc + curr.score, 0) / subjectBreakdown.length
    );

    return NextResponse.json({
      overallScore,
      improvementPercentage: "+14%",
      subjectBreakdown,
      monthlyProgress,
      strengths: [
        "Consistent daily class attendance",
        "Timely submission of weekly worksheets",
        "Active participation in live quizzes",
      ],
      areasForImprovement: [
        "Practice additional quadratic equation problems in Mathematics",
        "Review historical timeline diagrams for Social Science",
      ],
    });
  } catch (error: any) {
    console.error("Student Performance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
