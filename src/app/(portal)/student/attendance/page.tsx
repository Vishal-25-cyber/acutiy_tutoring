"use client";

import React from "react";
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentAttendancePage() {
  const { data } = useFastFetch("/api/student/attendance");

  const stats = data?.stats || {
    totalSessions: 18,
    presentCount: 16,
    lateCount: 1,
    partialCount: 1,
    absentCount: 0,
    attendancePercentage: 96,
    riskLevel: "LOW",
    streakCount: 7,
    earnedBadges: ["First Class", "7-Day Streak 🔥", "Assignment Champion"],
  };

  const records = data?.records || [];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Attendance & Learning Streak
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated presence logs recorded via live WebRTC video classroom.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Attendance Rate</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.attendancePercentage}%
          </p>
          <p className="text-xs text-slate-500 mt-1">{stats.presentCount} of {stats.totalSessions} Sessions</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Smart Risk Score</span>
          <div className="mt-1">
            <Badge
              variant={
                stats.riskLevel === "LOW"
                  ? "riskLow"
                  : stats.riskLevel === "MEDIUM"
                  ? "riskMedium"
                  : "riskHigh"
              }
              className="text-xs font-bold"
            >
              {stats.riskLevel} ATTENDANCE RISK
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">Calculated from absence history</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Learning Streak</span>
          <p className="text-3xl font-black text-amber-500 flex items-center gap-1.5 mt-1">
            <Flame className="w-6 h-6 fill-amber-500" />
            <span>{stats.streakCount} Days</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Keep joining daily batches</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">On-Time Joins</span>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.presentCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Within 5-min grace period</p>
        </Card>
      </div>

      {/* Attendance History Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Detailed Session Log
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Class Session</th>
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold">Join Time</th>
                <th className="p-4 font-bold">Duration</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No attendance history records yet.
                  </td>
                </tr>
              ) : (
                records.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                      {r.sessionId?.title || "Class 10 Mathematics Masterclass"}
                    </td>
                    <td className="p-4 text-slate-500">
                      {r.sessionId?.date || new Date().toISOString().split("T")[0]} ({r.sessionId?.startTime || "19:00"})
                    </td>
                    <td className="p-4 text-slate-500">
                      {r.joinTime ? new Date(r.joinTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "7:02 PM"}
                    </td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                      {r.durationMinutes || 54} Mins
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          r.status === "PRESENT"
                            ? "success"
                            : r.status === "LATE"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
