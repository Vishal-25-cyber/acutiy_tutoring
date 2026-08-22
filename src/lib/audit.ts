import connectToDatabase from "./db/mongoose";
import AuditLog from "@/models/AuditLog";

interface LogActionParams {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function recordAuditLog(params: LogActionParams): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLog.create({
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details || {},
      ipAddress: params.ipAddress || "127.0.0.1",
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
  }
}
