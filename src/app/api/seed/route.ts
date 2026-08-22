import { NextResponse } from "next/server";
import { runSeed } from "@/scripts/seed";

export async function GET() {
  try {
    await runSeed();
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with demo accounts and data!",
      credentials: {
        admin: { email: "admin@acuity.edu", password: "Admin@123", role: "ADMIN" },
        teacherApproved: { email: "sarah.maths@acuity.edu", password: "Teacher@123", role: "TEACHER" },
        teacherPending: { email: "anita.english@acuity.edu", password: "Teacher@123", role: "TEACHER (Pending)" },
        studentClass10: { email: "aravind.class10@acuity.edu", password: "Student@123", batch: "7:00 PM – 8:00 PM", role: "STUDENT" },
        studentClass9: { email: "priya.class9@acuity.edu", password: "Student@123", batch: "6:00 PM – 7:00 PM", role: "STUDENT" },
      },
    });
  } catch (error: any) {
    console.error("Seed API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
