"use client";

import React from "react";
import Link from "next/link";
import {
  Video,
  Clock,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  ChevronRight,
  FileCheck,
  CalendarCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentDashboardPage() {
  const { data: authData } = useFastFetch("/api/auth/me");
  const { data } = useFastFetch("/api/student/dashboard");

  const authUser = authData?.user;
  const student = data?.student;

  const rawName = student?.name || authUser?.name || "Student";
  const safeName = typeof rawName === "string" && rawName.trim() ? rawName : "Student";
  const classLevel = student?.classLevel || authUser?.profile?.currentClass || "Class 10";
  const board = student?.board || authUser?.profile?.board || "CBSE";
  const studentEmail = student?.email || authUser?.email || "student@acuity.edu";
  const batchName = student?.batch?.name || authUser?.profile?.batchId?.name || "7:00 PM – 8:00 PM";
  const attendancePercentage = student?.attendancePercentage ?? 100;

  // Real assessment summary stats from database
  const assessments = data?.assessmentSummary || {
    total: 0,
    submitted: 0,
    pending: 0,
    evaluated: 0,
    averageScore: 0,
  };

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* 1. CLEAN OPEN-SPACE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Welcome, {safeName}
        </h1>

        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* 2. CORE ACADEMIC METRICS (Larger typography & clearer icons) */}
      <div className="py-4 border-y border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/80">
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tasks</span>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {assessments.total} <span className="text-sm font-semibold text-slate-400">Assigned</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted Work</span>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {assessments.submitted} <span className="text-sm font-semibold text-slate-400">Done</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Due</span>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {assessments.pending} <span className="text-sm font-semibold text-slate-400">Due Soon</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Rate</span>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {attendancePercentage}% <span className="text-sm font-semibold text-slate-400">Present</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. REAL LOGIN DATA SPECIFICATIONS & MODULE ACCESS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left 6-Column: Verified Academic Profile with Real Login Details */}
        <div className="lg:col-span-6 space-y-3">
          <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                Academic Record & Enrollment
              </h2>
            </div>
            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
              ● Active Student
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            <div className="py-3.5 flex items-center justify-between gap-4">
              <span className="font-medium text-slate-500">Student Name</span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{safeName}</span>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-4">
              <span className="font-medium text-slate-500">Registered Email</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-sm">{studentEmail}</span>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-4">
              <span className="font-medium text-slate-500">Curriculum & Board</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">{classLevel} — {board} Board</span>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-4">
              <span className="font-medium text-slate-500">Daily Live Batch</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm sm:text-base">{batchName} (Mon–Sat)</span>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-4">
              <span className="font-medium text-slate-500">Live Attendance Standing</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">{attendancePercentage}% Turnout</span>
                <span className="text-xs text-slate-400">(Requirement: ≥ 75%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6-Column: Core Workspace Modules */}
        <div className="lg:col-span-6 space-y-3">
          <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                Portal Modules
              </h2>
            </div>
            <span className="text-xs sm:text-sm text-slate-400">Direct Navigation</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            <Link
              href="/student/classes"
              prefetch={true}
              className="py-3.5 flex items-center justify-between gap-4 hover:text-indigo-600 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                    Live Classes & Timetable
                  </p>
                  <p className="text-xs text-slate-500">Interactive live classroom sessions & schedule</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/student/materials"
              prefetch={true}
              className="py-3.5 flex items-center justify-between gap-4 hover:text-indigo-600 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                    Learning Hub
                  </p>
                  <p className="text-xs text-slate-500">Curriculum notes, worksheets & PDF downloads</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/student/assignments"
              prefetch={true}
              className="py-3.5 flex items-center justify-between gap-4 hover:text-indigo-600 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                    Assignments & Tasks
                  </p>
                  <p className="text-xs text-slate-500">Submit homework and track graded feedback</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/student/attendance"
              prefetch={true}
              className="py-3.5 flex items-center justify-between gap-4 hover:text-indigo-600 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                    Attendance Records
                  </p>
                  <p className="text-xs text-slate-500">Presence history, reconnection tracking & turnout</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
