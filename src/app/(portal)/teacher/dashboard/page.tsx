"use client";

import React from "react";
import {
  BookOpen,
  ShieldCheck,
  Calendar,
  GraduationCap,
  Mail,
  Hash,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";
import { PortalHeader } from "@/components/layout/PortalHeader";

export default function TeacherDashboardPage() {
  const { data } = useFastFetch("/api/teacher/dashboard");

  const teacher = data?.teacher || {
    name: "Faculty Member",
    qualification: "M.Sc., B.Ed",
    specialization: "Class 8-10 Mathematics & Science",
    subjects: ["Mathematics", "Science"],
    classesTaught: ["Class 8", "Class 9", "Class 10"],
    email: "",
  };

  const stats = data?.stats || {
    totalStudents: 0,
    todayClassesCount: 0,
    pendingEvaluations: 0,
    averageAttendance: 100,
  };

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <>
      {/* ── NAVBAR ── */}
      <PortalHeader userRole="TEACHER" />

      <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-in fade-in duration-150 select-none">

        {/* ── 1. WELCOME HEADER ── */}
        <div className="flex flex-row items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Welcome, {teacher.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Faculty
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Subjects: <strong className="text-slate-700 dark:text-slate-300">{teacher.subjects?.join(", ")}</strong>
              &nbsp;·&nbsp;
              Grades: <strong className="text-slate-700 dark:text-slate-300">{teacher.classesTaught?.join(", ")}</strong>
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayFormatted}</span>
          </div>
        </div>

        {/* ── 2. TEACHING OVERVIEW STATS (FLAT, NO CARDS) ── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Teaching Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned Students</span>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                {stats.totalStudents}
              </p>
              <p className="text-xs text-slate-400">enrolled</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Today&apos;s Sessions</span>
              <p className="text-3xl font-black text-[#004b79] dark:text-[#dfb74a] tracking-tight leading-none">
                {stats.todayClassesCount}
              </p>
              <p className="text-xs text-slate-400">scheduled</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending Grading</span>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none">
                {stats.pendingEvaluations}
              </p>
              <p className="text-xs text-slate-400">tasks</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Attendance</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                {stats.averageAttendance}%
              </p>
              <p className="text-xs text-slate-400">turnout</p>
            </div>
          </div>
        </div>

        {/* ── 3. FACULTY DETAILS (FLAT TABLE) ── */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty Details &amp; Credentials</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {[
              { icon: GraduationCap, label: "Teacher Name", value: teacher.name },
              { icon: ShieldCheck,   label: "Qualification", value: teacher.qualification || "M.Sc., B.Ed" },
              { icon: BookOpen,      label: "Specialization", value: teacher.specialization || teacher.subjects?.join(", ") },
              { icon: Hash,          label: "Classes Taught", value: teacher.classesTaught?.join(", ") },
              ...(teacher.email ? [{ icon: Mail, label: "Email Address", value: teacher.email }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-3.5 gap-6">
                <div className="flex items-center gap-2.5 min-w-[160px]">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 text-right">{value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}
