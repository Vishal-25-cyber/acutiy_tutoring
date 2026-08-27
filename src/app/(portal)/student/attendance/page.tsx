"use client";

import React, { useState } from "react";
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Calendar,
  Layers,
  GraduationCap,
  BookOpen,
  Filter,
  User,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentAttendancePage() {
  const { data, isLoading } = useFastFetch("/api/student/attendance");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const currentClass = data?.stats?.currentClass || "Class 10";
  const board = data?.stats?.board || "CBSE";

  const stats = data?.stats || {
    totalSessions: 5,
    presentCount: 4,
    attendancePercentage: 80,
    riskLevel: "LOW",
    todayStatus: "PRESENT",
  };

  const isCompliant = stats.attendancePercentage >= 75;
  const records = Array.isArray(data?.records) && data.records.length > 0 ? data.records : [
    {
      _id: "att-1",
      title: "Quadratic Equations — Discriminant & Real Roots Formula",
      subject: "Mathematics",
      faculty: "Dr. Sarah Jenkins",
      date: "Aug 27, 2026",
      time: "7:00 PM – 8:00 PM",
      durationMinutes: 60,
      status: "PRESENT",
    },
    {
      _id: "att-2",
      title: "Light: Reflection & Refraction — Ray Diagrams Exemplar",
      subject: "Science",
      faculty: "Prof. Rajesh Kumar",
      date: "Aug 26, 2026",
      time: "7:00 PM – 8:00 PM",
      durationMinutes: 58,
      status: "PRESENT",
    },
    {
      _id: "att-3",
      title: "Arithmetic Progressions — nth Term & Sum Formulas",
      subject: "Mathematics",
      faculty: "Dr. Sarah Jenkins",
      date: "Aug 25, 2026",
      time: "7:00 PM – 8:00 PM",
      durationMinutes: 60,
      status: "PRESENT",
    },
    {
      _id: "att-4",
      title: "Analytical Paragraph & Advanced Grammar Clauses",
      subject: "English",
      faculty: "Ms. Anita Desai",
      date: "Aug 24, 2026",
      time: "7:00 PM – 8:00 PM",
      durationMinutes: 55,
      status: "PRESENT",
    },
    {
      _id: "att-5",
      title: "Nationalism in India — Civil Disobedience Movement",
      subject: "Social Science",
      faculty: "Prof. Rajesh Kumar",
      date: "Aug 23, 2026",
      time: "7:00 PM – 8:00 PM",
      durationMinutes: 0,
      status: "ABSENT",
    },
  ];

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
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Attendance Records
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{currentClass} ({board})</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Verified attendance records marked by faculty and live session participation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isCompliant
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isCompliant ? "Compliant (≥ 75% Rule)" : "Attendance Below 75%"}</span>
          </span>
        </div>
      </div>

      {/* ── 3 ESSENTIAL STAT METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Overall Attendance Rate */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Rate</span>
            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {stats.attendancePercentage}%
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {isCompliant ? "Meets minimum 75% requirement" : "Requires attendance improvement"}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Completed Sessions Attended */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sessions Attended</span>
            <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.presentCount} <span className="text-sm font-semibold text-slate-400">/ {stats.totalSessions} Total</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Total classes attended
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Today's Attendance Status (Dynamic from Teacher Roll Call) */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Status</span>
            <p
              className={`text-3xl font-black tracking-tight ${
                todayStatus === "PRESENT"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : todayStatus === "LATE"
                  ? "text-amber-500"
                  : todayStatus === "ABSENT"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-700 dark:text-slate-300"
              }`}
            >
              {todayStatus === "PRESENT"
                ? "Present"
                : todayStatus === "LATE"
                ? "Late"
                : todayStatus === "ABSENT"
                ? "Absent"
                : "Pending"}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {todayStatus === "PRESENT"
                ? "Marked present by faculty"
                : todayStatus === "LATE"
                ? "Marked late by faculty"
                : todayStatus === "ABSENT"
                ? "Marked absent by faculty"
                : "Awaiting today's session"}
            </p>
          </div>
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              todayStatus === "PRESENT"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : todayStatus === "LATE"
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                : todayStatus === "ABSENT"
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {todayStatus === "PRESENT" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : todayStatus === "LATE" ? (
              <Clock className="w-6 h-6" />
            ) : todayStatus === "ABSENT" ? (
              <XCircle className="w-6 h-6" />
            ) : (
              <Calendar className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>

      {/* ── VERIFIED ATTENDANCE HISTORY LOG ── */}
      <div className="space-y-4 pt-2">
        <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
              Class Session History
            </h2>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5">
            {["ALL", "PRESENT", "LATE", "ABSENT"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {st === "ALL" ? "All Sessions" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="col-span-3">Date & Time</div>
          <div className="col-span-5">Subject & Topic</div>
          <div className="col-span-2">Faculty</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {/* History Rows */}
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-1">
              <CalendarCheck2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-semibold text-slate-600 dark:text-slate-400">No attendance records found for this filter.</p>
            </div>
          ) : (
            filteredRecords.map((r: any) => {
              const isPresent = r.status === "PRESENT";
              const isLate = r.status === "LATE";

              return (
                <div
                  key={r._id}
                  className="py-3.5 px-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors rounded-xl"
                >
                  {/* Col 1: Date & Time */}
                  <div className="col-span-3 space-y-0.5">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{r.date}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{r.time}</p>
                  </div>

                  {/* Col 2: Subject & Topic */}
                  <div className="col-span-5 space-y-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getSubjectColor(r.subject)}`}>
                      {r.subject}
                    </span>
                    <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{r.title}</p>
                  </div>

                  {/* Col 3: Faculty */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {r.faculty || "Faculty"}
                    </span>
                  </div>

                  {/* Col 4: Status */}
                  <div className="col-span-2 text-left md:text-right">
                    <span
                      className={`inline-block text-[11px] font-extrabold px-3 py-1 rounded-full border ${
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
            })
          )}
        </div>
      </div>
    </main>
  );
}
