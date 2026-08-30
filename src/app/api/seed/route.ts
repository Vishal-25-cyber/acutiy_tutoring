import { NextResponse } from "next/server";

/**
 * Seed endpoint is disabled for production use.
 * This is a real-data platform — use /admin/students, /admin/teachers to add real records.
 * To reset the database entirely, use POST /api/reset-db with the correct secret header.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "Seed endpoint is disabled. This is a live production platform.",
      hint: "Use the Admin portal to add real students and teachers. To reset the database, use POST /api/reset-db with x-reset-secret header.",
    },
    { status: 403 }
  );
}

export async function POST() {
  return GET();
}
