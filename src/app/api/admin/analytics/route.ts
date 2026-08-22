import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import Batch from "@/models/Batch";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Student enrollment by class
    const classDistribution = [
      { class: "Class 1", count: 8 },
      { class: "Class 2", count: 9 },
      { class: "Class 3", count: 12 },
      { class: "Class 4", count: 14 },
      { class: "Class 5", count: 16 },
      { class: "Class 6", count: 22 },
      { class: "Class 7", count: 25 },
      { class: "Class 8", count: 32 },
      { class: "Class 9", count: 38 },
      { class: "Class 10", count: 44 },
    ];

    // Growth trend
    const enrollmentGrowth = [
      { month: "Aug", students: 110, teachers: 8 },
      { month: "Sep", students: 145, teachers: 10 },
      { month: "Oct", students: 172, teachers: 12 },
      { month: "Nov", students: 195, teachers: 14 },
      { month: "Dec", students: 210, teachers: 15 },
      { month: "Jan", students: 230, teachers: 16 },
    ];

    // Subject Performance Average
    const subjectPerformance = [
      { subject: "Mathematics", averageScore: 82, passRate: 96 },
      { subject: "Science", averageScore: 79, passRate: 94 },
      { subject: "English", averageScore: 88, passRate: 99 },
      { subject: "Social Science", averageScore: 81, passRate: 95 },
      { subject: "Tamil", averageScore: 86, passRate: 98 },
    ];

    // Batch Occupancy
    const batchOccupancy = [
      { name: "6:00 PM – 7:00 PM", capacity: 30, enrolled: 26 },
      { name: "7:00 PM – 8:00 PM", capacity: 30, enrolled: 29 },
      { name: "8:00 PM – 9:00 PM", capacity: 30, enrolled: 22 },
    ];

    return NextResponse.json({
      classDistribution,
      enrollmentGrowth,
      subjectPerformance,
      batchOccupancy,
    });
  } catch (error: any) {
    console.error("Admin Analytics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
