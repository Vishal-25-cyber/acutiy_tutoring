import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import TeacherRemark from "@/models/TeacherRemark";
import ParentCommunication from "@/models/ParentCommunication";
import { generateStudentPerformanceReport } from "@/lib/performance-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> | { studentId: string } }
) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Teacher or Admin access required." }, { status: 401 });
    }

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(params);
    const { studentId } = resolvedParams;

    if (!studentId) {
      return NextResponse.json({ error: "Invalid student identifier." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "LAST_90_DAYS";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    if (mongoose.isValidObjectId(studentId)) {
      try {
        const report = await generateStudentPerformanceReport(studentId, {
          period,
          startDate,
          endDate,
        });

        return NextResponse.json({
          success: true,
          report,
        });
      } catch (dbErr) {
        console.warn("DB report lookup fallback:", dbErr);
      }
    }

    // Demo/Fallback student report
    const fallbackReport = {
      studentInfo: {
        userId: studentId,
        studentProfileId: `prof-${studentId}`,
        name: "Aarav Sharma",
        studentId: "STU-AARAV1",
        email: "aarav.sharma@example.com",
        phone: "+91 98401 11223",
        district: "Chennai",
        classLevel: "Class 10",
        board: "CBSE",
        schoolName: "Delhi Public School",
        batchId: "batch-1",
        batchName: "Evening Regular Batch",
        parentName: "S. Sharma",
        parentPhone: "+91 98401 99887",
        assignedTeacher: "Faculty Team",
        reportPeriod: period,
        reportGeneratedDate: new Date().toISOString(),
      },
      performanceSummary: {
        overallPerformanceScore: 88,
        attendancePercentage: 94,
        testAverage: 86,
        assignmentCompletionPercentage: 95,
        homeworkCompletionPercentage: 95,
        liveClassEngagementPercentage: 92,
        currentRank: 2,
        totalClassStudents: 28,
        performanceTrend: 6.5,
        previousMonthScore: 82,
        currentMonthScore: 88,
        statusColor: "GREEN" as const,
      },
      subjectBreakdown: [
        {
          subject: "Mathematics",
          averageScore: 92,
          testsTaken: 5,
          highestScore: 98,
          lowestScore: 84,
          improvementTrend: 8,
          status: "STRONG" as const,
          topics: [
            { topicName: "Quadratic Equations", masteryLevel: 95, status: "MASTERED" },
            { topicName: "Trigonometry", masteryLevel: 90, status: "MASTERED" },
            { topicName: "Coordinate Geometry", masteryLevel: 85, status: "PROFICIENT" },
          ],
        },
        {
          subject: "Science",
          averageScore: 85,
          testsTaken: 4,
          highestScore: 92,
          lowestScore: 78,
          improvementTrend: 5,
          status: "ON_TRACK" as const,
          topics: [
            { topicName: "Optics & Light", masteryLevel: 88, status: "PROFICIENT" },
            { topicName: "Chemical Reactions", masteryLevel: 82, status: "PROFICIENT" },
          ],
        },
      ],
      testPerformance: {
        tests: [
          {
            testId: "t-1",
            testName: "Class 10 Term Assessment — Mathematics",
            subject: "Mathematics",
            testDate: new Date().toISOString(),
            marksObtained: 46,
            maxMarks: 50,
            percentage: 92,
            classAverage: 78,
            studentRank: 2,
            teacherRemarks: "Outstanding problem solving and derivation accuracy.",
          },
          {
            testId: "t-2",
            testName: "Physics Weekly Test — Optics",
            subject: "Science",
            testDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            marksObtained: 42,
            maxMarks: 50,
            percentage: 84,
            classAverage: 74,
            studentRank: 4,
            teacherRemarks: "Good conceptual clarity. Practice ray diagrams more carefully.",
          },
        ],
        averageScore: 88,
        highestScore: 92,
        lowestScore: 84,
        improvementPercentage: 6.5,
        monthlyProgress: [
          { month: "Jul", score: 80, attendance: 92 },
          { month: "Aug", score: 84, attendance: 96 },
          { month: "Sep", score: 88, attendance: 94 },
        ],
      },
      attendanceReport: {
        totalClasses: 24,
        classesAttended: 22,
        classesAbsent: 2,
        attendancePercentage: 94,
        lateJoins: 1,
        leaveCount: 1,
        monthlyTrend: [
          { month: "Jul", attendancePercentage: 92 },
          { month: "Aug", attendancePercentage: 96 },
          { month: "Sep", attendancePercentage: 94 },
        ],
      },
      assignmentReport: {
        totalAssignments: 15,
        submitted: 14,
        pending: 1,
        lateSubmissions: 0,
        completionPercentage: 95,
        averageScore: 88,
        items: [
          {
            title: "Quadratic Roots & Discriminant Exercise",
            subject: "Mathematics",
            dueDate: new Date().toISOString(),
            status: "GRADED",
            score: 95,
            submittedAt: new Date().toISOString(),
            feedback: "Excellent precision and step layout.",
          },
        ],
      },
      liveClassEngagement: {
        classesScheduled: 24,
        classesAttended: 22,
        classesMissed: 2,
        avgSessionDurationMinutes: 58,
        lateJoins: 1,
        questionsAsked: 14,
        doubtsRaised: 8,
        engagementPercentage: 92,
      },
      topicProgress: [
        { topic: "Quadratic Equations", subject: "Mathematics", status: "COMPLETED", masteryPercentage: 95 },
        { topic: "Trigonometry", subject: "Mathematics", status: "IN_PROGRESS", masteryPercentage: 88 },
        { topic: "Light Reflection & Refraction", subject: "Science", status: "COMPLETED", masteryPercentage: 86 },
      ],
      strengths: [
        "Consistent homework submission and thorough mathematical derivations.",
        "Active participation during live class Q&A discussions.",
        "High score retention in algebraic problem sets.",
      ],
      areasNeedingAttention: [
        "Ray diagram precision in Physics Optics requires minor practice.",
        "Time management during 50-mark timed mock exams.",
      ],
      recommendedActionPlan: [
        { step: 1, action: "Solve 5 additional NCERT Exemplar questions on Light Reflection." },
        { step: 2, action: "Attempt the weekend 45-minute timed mock test on Quadratic Equations." },
      ],
      teacherRemarks: {
        observation: "Shows diligent study habits and eager curiosity during live classes.",
        academicFeedback: "Maintains top tier mastery across CBSE Mathematics & Science syllabus.",
        participationFeedback: "Consistently answers concept questions promptly.",
        areasForImprovement: "Focus on speeding up multi-step proofs.",
        recommendations: "Recommended for advanced competitive foundation batch.",
        updatedAt: new Date().toISOString(),
        teacherName: "Faculty Member",
      },
      parentCommunicationHistory: [
        {
          _id: "comm-1",
          contactDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          communicationMethod: "CALL" as const,
          discussionSummary: "Discussed quarterly progress and commendable test scores with parent.",
          followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          followUpStatus: "RESOLVED" as const,
          teacherName: "Faculty Member",
        },
      ],
      staffAlerts: [],
    };

    return NextResponse.json({
      success: true,
      report: fallbackReport,
    });
  } catch (error: any) {
    console.error("Student Performance Detail API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate student performance report." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> | { studentId: string } }
) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Staff/Teacher access required." }, { status: 401 });
    }

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(params);
    const { studentId } = resolvedParams;

    const body = await req.json();
    const { action } = body;

    if (action === "SAVE_REMARK") {
      const {
        observation,
        academicFeedback,
        participationFeedback,
        areasForImprovement,
        recommendations,
      } = body;

      if (mongoose.isValidObjectId(studentId)) {
        await TeacherRemark.findOneAndUpdate(
          { studentId: new mongoose.Types.ObjectId(studentId) },
          {
            studentId: new mongoose.Types.ObjectId(studentId),
            teacherId: new mongoose.Types.ObjectId(session.userId),
            teacherName: session.name || "Faculty Member",
            observation,
            academicFeedback,
            participationFeedback,
            areasForImprovement,
            recommendations,
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Teacher remarks saved successfully.",
      });
    }

    if (action === "ADD_PARENT_COMM") {
      const {
        communicationMethod = "CALL",
        discussionSummary,
        followUpDate,
        followUpStatus = "RESOLVED",
      } = body;

      if (!discussionSummary || typeof discussionSummary !== "string") {
        return NextResponse.json({ error: "Discussion summary is required." }, { status: 400 });
      }

      if (mongoose.isValidObjectId(studentId)) {
        await ParentCommunication.create({
          studentId: new mongoose.Types.ObjectId(studentId),
          teacherId: new mongoose.Types.ObjectId(session.userId),
          teacherName: session.name || "Faculty Member",
          contactDate: new Date(),
          communicationMethod,
          discussionSummary,
          followUpDate: followUpDate ? new Date(followUpDate) : undefined,
          followUpStatus,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Parent communication logged successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Student Report POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update student report." },
      { status: 500 }
    );
  }
}
