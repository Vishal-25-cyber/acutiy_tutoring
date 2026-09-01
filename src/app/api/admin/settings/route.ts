import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import SystemSettings from "@/models/SystemSettings";
import Payment from "@/models/Payment";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    await connectToDatabase();
    let settings: any = await SystemSettings.findOne().lean();

    if (!settings) {
      settings = await SystemSettings.create({
        companyName: "Mantif Tutoring & Live Learning",
        supportPhone1: "9876543210",
        supportPhone2: "9876543211",
        supportPhone3: "9876543212",
        supportEmail: "support@mantif.edu",
        defaultGracePeriodMinutes: 5,
        minAttendanceThresholdPercent: 75,
        monthlyTuitionFee: 2500,
        registrationFee: 500,
        academicYear: "2025-2026",
      });
    }

    return NextResponse.json({ settings }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
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

    // Extract the 10 digits
    const cleanPhone1 = (body.supportPhone1 || "").replace(/\D/g, "").slice(-10);
    const cleanPhone2 = (body.supportPhone2 || "").replace(/\D/g, "").slice(-10);
    const cleanPhone3 = (body.supportPhone3 || "").replace(/\D/g, "").slice(-10);

    const phoneRegex = /^[1-9]\d{9}$/;
    if (cleanPhone1 && !phoneRegex.test(cleanPhone1)) {
      return NextResponse.json(
        { error: "Primary Hotline (Phone 1) must be a valid 10-digit number." },
        { status: 400 }
      );
    }
    if (cleanPhone2 && !phoneRegex.test(cleanPhone2)) {
      return NextResponse.json(
        { error: "Batch Coordinator (Phone 2) must be a valid 10-digit number." },
        { status: 400 }
      );
    }
    if (cleanPhone3 && !phoneRegex.test(cleanPhone3)) {
      return NextResponse.json(
        { error: "Emergency Escalation (Phone 3) must be a valid 10-digit number." },
        { status: 400 }
      );
    }

    body.supportPhone1 = cleanPhone1 || "9876543210";
    body.supportPhone2 = cleanPhone2 || "9876543211";
    body.supportPhone3 = cleanPhone3 || "9876543212";

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(body);
    } else {
      Object.assign(settings, body);
    }
    if (body.monthlyTuitionFee) {
      (settings as any).monthlyFee = Number(body.monthlyTuitionFee);
    }
    await settings.save();

    // Dynamically update all pending/unpaid invoices to reflect the new configured tuition fee and current month
    if (body.monthlyTuitionFee && !isNaN(Number(body.monthlyTuitionFee))) {
      const newFee = Number(body.monthlyTuitionFee);
      const currentMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
      await Payment.updateMany(
        { status: { $in: ["PENDING", "PENDING_VERIFICATION"] } },
        { $set: { amount: newFee, billingMonth: currentMonthStr } }
      );
    }

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
