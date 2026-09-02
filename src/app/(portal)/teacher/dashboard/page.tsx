"use client";

import React from "react";
import {
  BookOpen,
  ShieldCheck,
  Calendar,
  GraduationCap,
  Mail,
  Hash,
  Clock,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { formatStaffId } from "@/lib/id-generator";

export default function TeacherDashboardPage() {
  const { data: authData } = useFastFetch("/api/auth/me");
  const { data: dashboardData } = useFastFetch("/api/teacher/dashboard");

  const authUser = authData?.user;
  const teacher = dashboardData?.teacher;

  // If a student somehow reaches this page, let layout redirect immediately
  if (authUser && authUser.role === "STUDENT") {
    return null;
  }

  // Correctly resolve the logged in teacher's name
  const rawName =
    teacher?.name ||
    (authUser?.role === "TEACHER" ? authUser?.name : null) ||
    "Faculty Member";
  const userName = typeof rawName === "string" && rawName.trim() ? rawName : "Faculty Member";

  const staffId = teacher?.teacherId || teacher?.staffId
    ? (teacher.teacherId || teacher.staffId)
    : formatStaffId(authUser?._id);

  const stats = dashboardData?.stats || {
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

        {/* ── 1. WELCOME HEADER (PERFECT ALIGNMENT, EXACT NAME) ── */}
        <div className="flex flex-row items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome, {userName}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayFormatted}</span>
          </div>
        </div>

        {/* ── 2. TEACHING OVERVIEW STATS (FLAT, PERFECT ALIGNMENT) ── */}
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending Reviews</span>
              <p className="text-3xl font-black text-amber-500 tracking-tight leading-none">
                {stats.pendingEvaluations}
              </p>
              <p className="text-xs text-slate-400">submissions</p>
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

        {/* ── 3. FACULTY DETAILS & CREDENTIALS (MODERN PROFILE CARD GRID WITH TEACHER ID) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Faculty Profile &amp; Credentials
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Verified Active Faculty
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              {
                icon: Hash,
                label: "Teacher ID",
                value: staffId.startsWith("#") ? staffId : `#${staffId}`,
                isBadge: true,
              },
              {
                icon: GraduationCap,
                label: "Teacher Name",
                value: userName,
              },
              {
                icon: ShieldCheck,
                label: "Qualification",
                value: teacher?.qualification || "BE CSE",
              },
              {
                icon: BookOpen,
                label: "Specialization",
                value: teacher?.specialization || teacher?.subjects?.join(", ") || "Higher Secondary Sciences",
              },
              {
                icon: Clock,
                label: "Classes Taught",
                value: teacher?.classesTaught?.join(", ") || "Class 8, Class 9, Class 10",
              },
              {
                icon: Mail,
                label: "Email Address",
                value: teacher?.email || authUser?.email || "—",
                isMono: true,
              },
            ].map(({ icon: Icon, label, value, isBadge, isMono }) => (
              <div
                key={label}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all flex items-start gap-3.5"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {label}
                  </span>
                  {isBadge ? (
                    <span className="inline-block font-mono font-bold text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60">
                      {value}
                    </span>
                  ) : (
                    <p
                      className={`text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate ${
                        isMono ? "font-mono" : ""
                      }`}
                      title={String(value)}
                    >
                      {value || "—"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}
