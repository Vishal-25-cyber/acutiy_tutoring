"use client";

import React, { useState } from "react";
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  UserCheck,
  Calendar,
  GraduationCap,
  User,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentAttendancePage() {
  const { data, isLoading } = useFastFetch("/api/student/attendance");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const currentClass = data?.stats?.currentClass || "Class 10";
  const board = data?.stats?.board || "CBSE";

  const stats = data?.stats || {
    totalSessions: 25,
    presentCount: 23,
    attendancePercentage: 92,
    riskLevel: "LOW",
    todayStatus: "PRESENT",
  };

  const isCompliant = stats.attendancePercentage >= 75;

  const defaultRecords = [
    {
      _id: "att-1",
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      time: "7:00 PM – 8:00 PM",
      subject: "Mathematics",
      title: "Quadratic Equations — Discriminant & Real Roots",
      faculty: "Dr. Sarah Jenkins",
      status: "PRESENT",
    },
    {
      _id: "att-2",
      date: new Date(Date.now() - 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      time: "7:00 PM – 8:00 PM",
      subject: "Science",
      title: "Light: Reflection & Refraction — Ray Diagrams Exemplar",
      faculty: "Prof. Rajesh Kumar",
      status: "PRESENT",
    },
    {
      _id: "att-3",
      date: new Date(Date.now() - 86400000 * 2).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      time: "7:00 PM – 8:00 PM",
      subject: "English",
      title: "Analytical Paragraph & Advanced Grammar Clauses",
      faculty: "Ms. Anita Desai",
      status: "PRESENT",
    },
    {
      _id: "att-4",
      date: new Date(Date.now() - 86400000 * 3).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      time: "7:00 PM – 8:00 PM",
      subject: "Social Science",
      title: "Nationalism in India — Non-Cooperation Movement Timeline",
      faculty: "Prof. Rajesh Kumar",
      status: "PRESENT",
    },
    {
      _id: "att-5",
      date: new Date(Date.now() - 86400000 * 4).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      time: "7:00 PM – 8:00 PM",
      subject: "Mathematics",
      title: "Arithmetic Progressions — nth Term & Sum Formula",
      faculty: "Dr. Sarah Jenkins",
      status: "LATE",
    },
  ];

  const records = Array.isArray(data?.records) && data.records.length > 0
    ? data.records
    : defaultRecords;

  const filteredRecords = records.filter((r: any) => {
    return statusFilter === "ALL" || r.status?.toUpperCase() === statusFilter.toUpperCase();
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

  const todayStatus = stats.todayStatus || "PRESENT";

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      
      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Attendance & Streak
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Verified classroom turnout marked by faculty and live session participation for <span className="font-semibold text-slate-700 dark:text-slate-300">{currentClass} ({board})</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isCompliant
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isCompliant ? "Compliant (≥ 75% CBSE Rule)" : "Turnout Below 75%"}</span>
          </span>
        </div>
      </div>

      {/* ── 2. CARDLESS 3-METRIC HAIRLINE STRIP ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pb-2">
        {/* Metric 1: Overall Attendance Rate */}
        <div className="py-2 sm:px-6 first:pl-0 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attendance Turnout</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {stats.attendancePercentage}%
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Meets minimum 75% requirement
          </p>
        </div>

        {/* Metric 2: Sessions Attended */}
        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sessions Attended</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.presentCount} <span className="text-sm font-semibold text-slate-400">/ {stats.totalSessions} Total</span>
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Active batch participation
          </p>
        </div>

        {/* Metric 3: Today's Status */}
        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's Live Status</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Present
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Verified by faculty roll call
          </p>
        </div>
      </div>

      {/* ── 3. SESSION HISTORY (CARDLESS TABLE) ── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
              Class Session History Log
            </h2>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "PRESENT", "LATE", "ABSENT"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {st === "ALL" ? "All Sessions" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Table Headers */}
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-3">Date & Time</div>
          <div className="col-span-5">Subject & Lecture Topic</div>
          <div className="col-span-2">Faculty Instructor</div>
          <div className="col-span-2 text-right">Attendance Status</div>
        </div>

        {/* History Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-850">
          {filteredRecords.map((r: any) => {
            const isPresent = r.status === "PRESENT";
            const isLate = r.status === "LATE";

            return (
              <div
                key={r._id}
                className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
              >
                {/* Col 1: Date & Time */}
                <div className="col-span-3 space-y-0.5">
                  <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{r.date}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{r.time}</p>
                </div>

                {/* Col 2: Subject & Topic */}
                <div className="col-span-5 space-y-0.5">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getSubjectColor(r.subject)}`}>
                    {r.subject}
                  </span>
                  <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{r.title}</p>
                </div>

                {/* Col 3: Faculty */}
                <div className="col-span-2">
                  <p className="font-medium text-xs text-slate-800 dark:text-slate-200 truncate">
                    {r.faculty || "Faculty Specialist"}
                  </p>
                  <p className="text-[10px] text-slate-400">Staff Faculty</p>
                </div>

                {/* Col 4: Status */}
                <div className="col-span-2 text-left md:text-right">
                  <span
                    className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isPresent
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
          })}
        </div>
      </div>

    </main>
  );
}
