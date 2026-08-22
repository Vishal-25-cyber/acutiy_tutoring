import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import Batch from "@/models/Batch";
import StudentProfile from "@/models/StudentProfile";
import { batchCreateSchema } from "@/lib/validations/auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const batches = await Batch.find().populate("assignedTeacherIds", "name email").sort({ startTime: 1 });

    // Calculate enrolled count per batch
    const batchesWithCounts = await Promise.all(
      batches.map(async (b) => {
        const enrolledCount = await StudentProfile.countDocuments({ batchId: b._id });
        return {
          ...b.toObject(),
          enrolledCount,
          occupancyPercentage: Math.min(100, Math.round((enrolledCount / (b.capacity || 30)) * 100)),
        };
      })
    );

    return NextResponse.json({ batches: batchesWithCounts });
  } catch (error: any) {
    console.error("Admin Batches Error:", error);
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
    const validation = batchCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;
    await connectToDatabase();

    const newBatch = await Batch.create({
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      days: data.days,
      capacity: data.capacity,
      gracePeriodMinutes: data.gracePeriodMinutes ?? 5,
      assignedTeacherIds: body.assignedTeacherIds || [],
      isActive: true,
    });

    await recordAuditLog({
      actorId: session.userId,
      action: "BATCH_CREATED",
      entityType: "BATCH",
      entityId: newBatch._id.toString(),
      details: { name: data.name, capacity: data.capacity, gracePeriodMinutes: data.gracePeriodMinutes },
    });

    return NextResponse.json({ success: true, batch: newBatch });
  } catch (error: any) {
    console.error("Admin Create Batch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchId, name, startTime, endTime, days, capacity, gracePeriodMinutes, isActive, assignedTeacherIds } =
      await req.json();

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const updated = await Batch.findByIdAndUpdate(
      batchId,
      {
        ...(name && { name }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(days && { days }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(gracePeriodMinutes !== undefined && { gracePeriodMinutes: Number(gracePeriodMinutes) }),
        ...(isActive !== undefined && { isActive }),
        ...(assignedTeacherIds && { assignedTeacherIds }),
      },
      { new: true }
    );

    await recordAuditLog({
      actorId: session.userId,
      action: "BATCH_UPDATED",
      entityType: "BATCH",
      entityId: batchId,
      details: { name, capacity, gracePeriodMinutes, isActive },
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (error: any) {
    console.error("Admin Patch Batch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("id");
    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    await Batch.findByIdAndUpdate(batchId, { isActive: false });

    return NextResponse.json({ success: true, message: "Batch deactivated successfully." });
  } catch (error: any) {
    console.error("Admin Delete Batch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
