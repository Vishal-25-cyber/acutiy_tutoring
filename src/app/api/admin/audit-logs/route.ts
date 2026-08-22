import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import AuditLog from "@/models/AuditLog";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const logs = await AuditLog.find()
      .populate("actorId", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Audit Logs Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
