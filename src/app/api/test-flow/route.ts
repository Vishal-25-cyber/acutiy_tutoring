import { NextResponse } from "next/server";
import { runTestFlow } from "@/scripts/test-classroom-flow";

export async function GET() {
  try {
    const result = await runTestFlow();
    return NextResponse.json({ success: true, message: "Classroom & Attendance E2E flow verified successfully!", result });
  } catch (error: any) {
    console.error("Test Flow Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
