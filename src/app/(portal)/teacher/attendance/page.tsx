import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck2,
  Clock,
  Download,
  CheckCircle2,
  Users,
  Search,
  ArrowRight,
  Calendar,
  Radio,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";
import { getClassLiveState, sortClassesByPriority } from "@/lib/class-timing";

export default function TeacherAttendancePage() {
  const { data, isLoading } = useFastFetch("/api/teacher/attendance");
  const [searchQuery, setSearchQuery] = useState("");

  const sessions = Array.isArray(data?.sessions) ? data.sessions : [];

  const conductedSessions = sessions.filter((s: any) => {
    const liveState = getClassLiveState(s);
    return liveState === "COMPLETED" || liveState === "LIVE" || (s.presentCount || 0) > 0 || s.isConducted === true;
  });

  const totalConductedPresent = conductedSessions.reduce((sum: number, s: any) => sum + (s.presentCount || 0), 0);
  const totalConductedEnrolled = conductedSessions.reduce((sum: number, s: any) => sum + (s.totalEnrolled || 1), 0);

  const liveAvgAttendance =
    totalConductedEnrolled > 0
      ? Math.min(100, Math.round((totalConductedPresent / totalConductedEnrolled) * 100))
      : 100;

  const totalConductedCount = conductedSessions.length || 1;
  const assignedStudents = data?.summary?.totalStudentsAssigned || 3;

  const filteredSessions = sessions.filter(
    (s: any) =>
      !searchQuery.trim() ||
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Batch Attendance Logs & Presence Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time attendance recorded through live classroom video joins and multi-session durations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* ── METRICS (CARDLESS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Average Attendance</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {liveAvgAttendance}% <span className="text-xs font-normal text-slate-400">turnout</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Sessions Held</span>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {totalConductedCount} <span className="text-xs font-normal text-slate-400">sessions</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned Students</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {assignedStudents} <span className="text-xs font-normal text-slate-400">enrolled</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search session by topic or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* ── SESSIONS ATTENDANCE TABLE (CARDLESS) ── */}
      <div className="space-y-3">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Conducted Live Sessions ({filteredSessions.length})
          </h2>
          <span className="text-[11px] text-slate-400">Click any class to inspect student roster</span>
        </div>

        {isLoading && sessions.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <Clock className="w-8 h-8 text-slate-400 mx-auto animate-spin" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Loading attendance data...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <CalendarCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No session logs found</p>
            <p className="text-xs text-slate-400">Attendance records will be generated automatically when live lectures are held.</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            {filteredSessions.map((sess: any) => {
              const liveState = getClassLiveState(sess);
              const isLive = liveState === "LIVE" || sess.status === "LIVE";
              const isConducted = liveState === "COMPLETED" || isLive || (sess.presentCount || 0) > 0 || sess.isConducted === true;

              const rate =
                sess.attendanceRate !== null && sess.attendanceRate !== undefined
                  ? sess.attendanceRate
                  : sess.totalEnrolled > 0
                  ? Math.min(100, Math.round(((sess.presentCount || 0) / sess.totalEnrolled) * 100))
                  : (sess.presentCount || 0) > 0 ? 100 : 0;

              return (
                <div
                  key={sess._id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {sess.subject}
                      </span>
                      {isLive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <Radio className="w-3 h-3 animate-pulse" />
                          Live
                        </span>
                      )}
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {sess.title || sess.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span>{sess.date}</span>
                      <span>·</span>
                      <span className="font-mono">{sess.startTime} – {sess.endTime}</span>
                      <span>·</span>
                      <span>{sess.batchName || sess.classLevel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isConducted ? (
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                          {rate}% Turnout
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {sess.presentCount || 0}/{sess.totalEnrolled || 1} Present
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Upcoming Schedule
                      </span>
                    )}

                    <Link to={`/teacher/attendance/${sess._id}`}>
                      <button className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
                        <span>Roster Log</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

