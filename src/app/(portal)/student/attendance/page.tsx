"use client";

import React, { useState } from "react";
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  UserCheck,
  Calendar,
  GraduationCap,
  ShieldCheck,
  Download,
  Search,
  FileSpreadsheet,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentAttendancePage() {
  const { data, isLoading } = useFastFetch("/api/student/attendance");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");

  const currentClass = data?.stats?.currentClass || "Class 10";
  const board = data?.stats?.board || "CBSE";

  const stats = data?.stats || {
    totalSessions: 0,
    presentCount: 0,
    attendancePercentage: 100,
    riskLevel: "LOW",
    todayStatus: "NOT_MARKED",
  };

  const isCompliant = stats.attendancePercentage >= 75;

  const records = Array.isArray(data?.records) ? data.records : [];

  const filteredRecords = records.filter((r: any) => {
    const matchesStatus = statusFilter === "ALL" || r.status?.toUpperCase() === statusFilter.toUpperCase();
    const matchesDate = !dateFilter || r.date?.includes(dateFilter) || r.date === dateFilter;
    return matchesStatus && matchesDate;
  });

  const getSubjectColor = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case "mathematics":
        return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800";
      case "science":
      case "physics":
      case "chemistry":
      case "biology":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800";
      case "english":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800";
      case "social science":
        return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800";
      default:
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800";
    }
  };

  const downloadStatementCSV = () => {
    if (!filteredRecords.length) return;
    const headers = ["Date", "Time", "Subject", "Topic", "Faculty", "Attendance Status"];
    const rows = filteredRecords.map((r: any) => [
      `"${r.date || ""}"`,
      `"${r.time || ""}"`,
      `"${r.subject || ""}"`,
      `"${(r.title || "").replace(/"/g, '""')}"`,
      `"${r.faculty || ""}"`,
      `"${r.status || "PRESENT"}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row: any) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Student_Attendance_Statement_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Attendance &amp; Streak Dossier
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Verified classroom turnout marked by faculty and live session participation for{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {currentClass} ({board})
            </span>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={downloadStatementCSV}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
            <span>Download Statement (CSV)</span>
          </button>

          {stats.totalSessions > 0 ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isCompliant
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isCompliant ? "Compliant (≥ 75% Rule)" : "Turnout Below 75%"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>No Attendance Marked (0%)</span>
            </span>
          )}
        </div>
      </div>

      {/* ── 2. CARDLESS 3-METRIC HAIRLINE STRIP ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pb-2">
        <div className="py-2 sm:px-6 first:pl-0 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attendance Turnout</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {stats.totalSessions > 0 ? `${stats.attendancePercentage}%` : "0%"}
          </p>
          <p className={`text-xs font-medium ${stats.totalSessions === 0 ? "text-slate-400" : stats.attendancePercentage >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {stats.totalSessions === 0
              ? "No attendance marked yet"
              : stats.attendancePercentage >= 75
              ? "Meets minimum 75% requirement"
              : "Below minimum 75% requirement"}
          </p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sessions Attended</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.presentCount} <span className="text-sm font-semibold text-slate-400">/ {stats.totalSessions} Total</span>
          </p>
          <p className="text-xs text-slate-500 font-medium">Active batch participation</p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today&apos;s Live Status</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 font-mono">
            {stats.todayStatus === "PRESENT" ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Present
              </>
            ) : stats.todayStatus === "LATE" ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Late
              </>
            ) : stats.todayStatus === "ABSENT" ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Absent
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                Not Marked
              </>
            )}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            {stats.todayStatus === "PRESENT" || stats.todayStatus === "LATE"
              ? "Verified by faculty attendance log"
              : "No attendance recorded for today"}
          </p>
        </div>
      </div>

      {/* ── 3. DATE-WISE FILTER & SESSION HISTORY LOG ── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
              Date-Wise Session Attendance Log ({filteredRecords.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Picker Filter */}
            <input
              type="text"
              placeholder="Filter by date (e.g. 27 Aug)..."
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#004b79]"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="h-9 px-2 text-xs font-bold text-rose-500 hover:underline"
              >
                Clear
              </button>
            )}

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              {["ALL", "PRESENT", "LATE", "ABSENT"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {st === "ALL" ? "All" : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Headers */}
        {filteredRecords.length > 0 && (
          <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
            <div className="col-span-3">Date &amp; Timing</div>
            <div className="col-span-5">Subject &amp; Lecture Topic</div>
            <div className="col-span-2">Faculty Instructor</div>
            <div className="col-span-2 text-right">Attendance Status</div>
          </div>
        )}

        {/* History Rows or Empty State */}
        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <CalendarCheck2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No Attendance Records Found</p>
            <p className="text-xs text-slate-400">Your attendance logs will appear here in real-time as classes are conducted.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredRecords.map((r: any) => {
              const isPresent = r.status === "PRESENT";
              const isLate = r.status === "LATE";

              return (
                <div
                  key={r._id}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                >
                  {/* Col 1: Date & Time */}
                  <div className="col-span-3 space-y-0.5">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{r.date}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{r.time}</p>
                  </div>

                  {/* Col 2: Subject & Topic */}
                  <div className="col-span-5 space-y-1">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getSubjectColor(r.subject)}`}>
                      {r.subject}
                    </span>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{r.title}</p>
                  </div>

                  {/* Col 3: Faculty */}
                  <div className="col-span-2">
                    <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
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
        )}
      </div>
    </main>
  );
}
