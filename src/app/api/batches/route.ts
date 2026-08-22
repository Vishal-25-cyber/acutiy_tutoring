import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import Batch from "@/models/Batch";

export async function GET() {
  try {
    await connectToDatabase();
    let batches = await Batch.find({ isActive: true }).sort({ startTime: 1 });

    // If no batches exist yet, provide default initial batches for immediate UI readiness
    if (!batches || batches.length === 0) {
      const defaults = [
        { name: "6:00 PM – 7:00 PM", startTime: "18:00", endTime: "19:00", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], capacity: 30, gracePeriodMinutes: 5 },
        { name: "7:00 PM – 8:00 PM", startTime: "19:00", endTime: "20:00", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], capacity: 30, gracePeriodMinutes: 5 },
        { name: "8:00 PM – 9:00 PM", startTime: "20:00", endTime: "21:00", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], capacity: 30, gracePeriodMinutes: 5 },
      ];
      batches = await Batch.insertMany(defaults);
    }

    return NextResponse.json({ batches });
  } catch (error: any) {
    console.error("Batches GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}
