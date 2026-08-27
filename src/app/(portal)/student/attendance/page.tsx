"use client";

import React, { useState } from "react";
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentAttendancePage() {
  const { data, isLoading } = useFastFetch("/api/student/attendance");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const currentClass = data?.stats?.currentClass || "Class 10";
  const board = data?.stats?.board || "CBSE";

  const stats = data?.stats || {
    totalSessions: 2,
    presentCount: 2,
    attendancePercentage: 100,
    riskLevel: "LOW",
    streakCount: 7,
  };

  const subjectStats = Array.isArray(data?.subjectStats) ? data.subjectStats : [];
  const records = Array.isArray(data?.records) ? data.records : [];

  const filteredRecords = records.filter((r: any) => {
    const matchesSubject =
      selectedSubjectFilter === "ALL" ||
      r.subject?.toLowerCase() === selectedSubjectFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "ALL" || r.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSubject && matchesStatus;
  });

  const getSubjectColor = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case "mathematics":
        return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800";
      case "science":
      case "physics":
      case "chemistry":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800";
      case "english":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800";
      case "social science":
        return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800";
      default:
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800";
    }
  };

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* 1. CLEAN OPEN-SPACE HEADER (Cardless) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Attendance Records & Learning Streak
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{currentClass} ({board})</span>
            </span>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time presence tracking recorded via live video sessions with duration threshold compliance (≥ 75%).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${stats.attendancePercentage >= 75
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{stats.attendancePercentage >= 75 ? "Compliant (≥ 75% Rule Met)" : "Attendance Warning"}</span>
          </span>
        </div>
      </div>

      {/* 2. CORE ATTENDANCE METRICS COUNTER (Flat Borderless Strip) */}
      <div className="py-4 border-y border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/80">
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Attendance</span>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.attendancePercentage}% <span className="text-sm font-semibold text-emerald-600">Present</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Compliance Status</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {stats.riskLevel === "LOW" ? "Low Risk (Eligible)" : stats.riskLevel === "MEDIUM" ? "Medium Risk" : "High Risk"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Streak</span>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-500 tracking-tight flex items-center gap-1">
              <span>{stats.streakCount}</span> <span className="text-sm font-semibold text-slate-400">Days 🔥</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Sessions</span>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {stats.presentCount} <span className="text-sm font-semibold text-slate-400">/ {stats.totalSessions} Total</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. CARDLESS SUBJECT-WISE ATTENDANCE BREAKDOWN */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
              Subject-Wise Attendance Breakdown
            </h2>
          </div>
          <span className="text-xs text-slate-400">Real-time Curriculum Turnout</span>
        </div>

        {/* Column Headers */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
          <div className="col-span-3">Subject</div>
          <div className="col-span-3">Scheduled / Attended</div>
          <div className="col-span-4">Turnout Percentage</div>
          <div className="col-span-2 text-right">Standing</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
          {subjectStats.map((sub: any, idx: number) => {
            const hasHeld = sub.hasHeldClasses || sub.classesScheduled > 0;

            return (
              <div
                key={idx}
                className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors rounded-2xl"
              >
                <div className="col-span-3">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getSubjectColor(sub.subject)}`}>
                    {sub.subject}
                  </span>
                </div>

                <div className="col-span-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {hasHeld ? (
                    <>
                      <strong className="text-slate-900 dark:text-slate-100">{sub.classesAttended}</strong> attended of{" "}
                      <strong className="text-slate-900 dark:text-slate-100">{sub.classesScheduled}</strong> sessions
                    </>
                  ) : (
                    <span className="text-slate-400 italic">Upcoming in weekly routine</span>
                  )}
                </div>

                <div className="col-span-4 flex items-center gap-3">
                  {hasHeld ? (
                    <>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${sub.attendancePercentage}%` }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-slate-100 w-12 text-right">
                        {sub.attendancePercentage}%
                      </span>
                    </>
                  ) : (
                    <div className="flex-1 text-xs text-slate-400 font-mono">
                      <span>No sessions held yet</span>
                    </div>
                  )}
                </div>

                <div className="col-span-2 text-left md:text-right">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {hasHeld
                      ? sub.attendancePercentage >= 75
                        ? "● Compliant"
                        : "● At Risk"
                      : "● Scheduled"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DETAILED SESSION HISTORY & PRESENCE LOG */}
      <div className="space-y-4 pt-2">
        <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
              Class Session Presence Log
            </h2>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {["ALL", "PRESENT", "LATE", "ABSENT"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${statusFilter === st
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
              >
                {st === "ALL" ? "All Logs" : st}
              </button>
            ))}
          </div>
        </div>

        {/* History Rows */}
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-1">
              <CalendarCheck2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-semibold text-slate-600 dark:text-slate-400">No session attendance records found.</p>
              <p className="text-slate-400">Join live classes to record attendance and maintain streak.</p>
            </div>
          ) : (
            filteredRecords.map((r: any) => {
              const isPresent = r.status === "PRESENT";
              const isLate = r.status === "LATE";

              return (
                <div
                  key={r._id}
                  className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors rounded-2xl"
                >
                  <div className="col-span-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getSubjectColor(r.subject)}`}>
                        {r.subject}
                      </span>
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{r.title}</p>
                  </div>

                  <div className="col-span-3 text-xs text-slate-500 font-mono space-y-0.5">
                    <p className="font-bold text-slate-700 dark:text-slate-300">{r.date}</p>
                    <p>{r.time}</p>
                  </div>

                  <div className="col-span-3 text-xs text-slate-500 space-y-0.5">
                    <p>
                      Duration: <strong className="text-slate-800 dark:text-slate-200 font-mono">{r.durationMinutes} mins</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Reconnections: {r.sessionsCount} session
                    </p>
                  </div>

                  <div className="col-span-2 text-left md:text-right">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${isPresent
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : isLate
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                    >
                      {r.status || "PRESENT"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
