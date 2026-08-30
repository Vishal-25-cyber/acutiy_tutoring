import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import mongoose from "mongoose";
import { hashPassword } from "@/lib/auth/passwords";

/**
 * POST /api/reset-db
 * 
 * PROTECTED endpoint — wipes ALL collections in the database and creates
 * one fresh admin account. Requires a secret key header to prevent accidental calls.
 * 
 * Header required: x-reset-secret: ACUITY_RESET_2025
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-reset-secret");
  if (secret !== "ACUITY_RESET_2025") {
    return NextResponse.json({ error: "Unauthorized. Secret key required." }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json({ error: "Database connection not established." }, { status: 500 });
    }

    // Drop all collections
    const collections = await db.listCollections().toArray();
    const dropped: string[] = [];

    for (const col of collections) {
      await db.collection(col.name).drop();
      dropped.push(col.name);
    }

    // Import models dynamically
    const User = mongoose.model("User");
    const SystemSettings = mongoose.model("SystemSettings");

    // Create fresh admin account
    const adminPasswordHash = await hashPassword("Admin@123");
    const admin = await User.create({
      name: "Administrator",
      email: "admin@acuity.edu",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      phone: "",
    });

    // Create default system settings
    await SystemSettings.create({
      instituteName: "Acuity Tutoring",
      tagline: "Where Accuracy Meets Knowledge",
      phone: "",
      email: "admin@acuity.edu",
      address: "",
      gracePeriodMinutes: 10,
      minAttendancePercent: 75,
      monthlyFee: 2500,
      upiId: "",
    });

    return NextResponse.json({
      success: true,
      message: "Database wiped clean. Fresh start ready.",
      droppedCollections: dropped,
      adminCreated: {
        email: "admin@acuity.edu",
        password: "Admin@123",
        role: "ADMIN",
        id: admin._id.toString(),
      },
    });
  } catch (error: any) {
    console.error("Reset DB error:", error);
    return NextResponse.json({ error: error.message || "Reset failed." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST with x-reset-secret header." }, { status: 405 });
}
