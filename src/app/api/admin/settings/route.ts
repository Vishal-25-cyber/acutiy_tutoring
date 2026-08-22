import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import SystemSettings from "@/models/SystemSettings";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({
        companyName: "Acuity Tutoring & Live Learning",
        supportPhone1: "+91 98765 43210",
        supportPhone2: "+91 98765 43211",
        supportPhone3: "+91 98765 43212",
        supportEmail: "support@acuity.edu",
        defaultGracePeriodMinutes: 5,
        minAttendanceThresholdPercent: 75,
        monthlyTuitionFee: 2500,
        registrationFee: 500,
        academicYear: "2025-2026",
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(body);
    } else {
      Object.assign(settings, body);
    }
    await settings.save();

    await recordAuditLog({
      actorId: session.userId,
      action: "SETTINGS_UPDATED",
      entityType: "SETTINGS",
      details: body,
    });

    return NextResponse.json({
      success: true,
      message: "System configuration saved successfully.",
      settings,
    });
  } catch (error: any) {
    console.error("Settings POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
