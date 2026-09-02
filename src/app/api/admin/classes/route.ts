import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import LiveSession from "@/models/LiveSession";
import Attendance from "@/models/Attendance";
import StudentProfile from "@/models/StudentProfile";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const dbSessions = await LiveSession.find()
      .populate("teacherId", "name email avatarUrl")
      .populate("batchId", "name startTime endTime capacity")
      .lean();

    const now = new Date();
    const nowMs = now.getTime();

    const sessions = await Promise.all(
      dbSessions.map(async (s: any) => {
        const batchId = s.batchId?._id || s.batchId;
        const [attendanceCount, enrolledCount] = await Promise.all([
          Attendance.countDocuments({
            sessionId: s._id,
            status: { $in: ["PRESENT", "LATE"] },
          }),
          StudentProfile.countDocuments(
            batchId ? { batchId } : { currentClass: s.classLevel }
          ),
        ]);

        return {
          id: s._id.toString(),
          meetingId: s.meetingId || s.livekitRoomId,
          title: s.title,
          subject: s.subject,
          classLevel: s.classLevel,
          topic: s.topic || "",
          description: s.description || "",
          batch: s.batchId?.name || `${s.startTime} – ${s.endTime}`,
          batchId: batchId ? batchId.toString() : "",
          teacher: s.teacherId?.name || "Faculty Specialist",
          teacherEmail: s.teacherId?.email || "",
          participantsCount: attendanceCount,
          enrolledCount: enrolledCount || 0,
          status: s.status || "SCHEDULED",
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          graceMinutes: s.gracePeriodMinutes ?? 5,
          recordingUrl: s.recordingUrl || "",
        };
      })
    );

    // Sort by priority: Live (tier 0) -> Nearest Upcoming (tier 1, asc) -> Recent Completed (tier 2, desc) -> Cancelled (tier 3)
    const getSessionPriority = (s: any) => {
      if (s.status === "LIVE") return { tier: 0, time: 0 };

      let startMs = 0;
      let endMs = 0;
      if (s.date && s.startTime) {
        const [y, m, d] = s.date.split("-").map(Number);
        const [sh, sm] = s.startTime.split(":").map(Number);
        const [eh, em] = (s.endTime || "20:00").split(":").map(Number);
        startMs = new Date(y, m - 1, d, sh, sm).getTime();
        endMs = new Date(y, m - 1, d, eh, em).getTime();
      }

      if (startMs <= nowMs && endMs > nowMs && s.status !== "CANCELLED" && s.status !== "COMPLETED") {
        return { tier: 0, time: 0 };
      }

      if (startMs > nowMs && s.status !== "CANCELLED") {
        return { tier: 1, time: startMs }; // Upcoming nearest first
      }

      if (s.status === "CANCELLED") {
        return { tier: 3, time: -startMs };
      }

      return { tier: 2, time: -endMs }; // Completed most recent first
    };

    sessions.sort((a, b) => {
      const pA = getSessionPriority(a);
      const pB = getSessionPriority(b);
      if (pA.tier !== pB.tier) {
        return pA.tier - pB.tier;
      }
      return pA.time - pB.time;
    });

    // Deduplicate: remove sessions with identical title + date + startTime + teacher
    // (prevents UI from showing the same class twice if duplicates exist in DB)
    const seen = new Set<string>();
    const uniqueSessions = sessions.filter((s) => {
      const key = `${s.title}|${s.date}|${s.startTime}|${s.teacher}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      sessions: uniqueSessions,
      currentTime: now.toISOString(),
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Admin Classes API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
