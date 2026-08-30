"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Video,
  Users,
  FileCheck,
  BookOpen,
  CalendarCheck2,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Calendar,
  Shuffle,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFastFetch } from "@/lib/api-cache";
import { ScheduleSwapModal } from "@/components/classroom/ScheduleSwapModal";
import { useClassLiveTimer } from "@/lib/class-timing";

function TeacherLiveClassRow({ cls, onSwap }: { cls: any; onSwap: (cls: any) => void }) {
  const batchData = {
    ...(cls.batchId || {}),
    date: cls.date,
    startTime: cls.startTime || cls.batchId?.startTime,
    endTime: cls.endTime || cls.batchId?.endTime,
    days: cls.batchId?.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    gracePeriodMinutes: cls.gracePeriodMinutes || cls.batchId?.gracePeriodMinutes || 10,
  };

  const timing = useClassLiveTimer(batchData);
  const targetRoomId = timing.permanentRoomId || cls.livekitRoomId || cls._id;

  return (
    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
            {cls.subject}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
            {cls.startTime} – {cls.endTime}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
            {cls.classLevel || "Class 10"}
          </span>
          {timing.isLiveNow ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              ● Live Now ({timing.countdownText})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Clock className="w-3 h-3 text-amber-500 animate-spin" />
              {timing.countdownText}
            </span>
          )}
        </div>
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
          {cls.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {cls.topic || timing.detailedCountdown}
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        {/* Reschedule / Day Swap Tool Button */}
        <button
          type="button"
          onClick={() => onSwap(cls)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
          <span>Swap / Reschedule</span>
        </button>

        {timing.canJoin ? (
          <Link href={`/classroom/${targetRoomId}`}>
            <button className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-md shadow-emerald-500/25 animate-pulse">
              <Video className="w-4 h-4" />
              <span>Start Live Classroom</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        ) : (
          <button
            disabled
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
            title={timing.detailedCountdown}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Opens at {cls.startTime} ({timing.countdownText})</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const { data, refetch } = useFastFetch("/api/teacher/dashboard");
  const [swapModalSession, setSwapModalSession] = useState<any>(null);

  const teacher = data?.teacher || {
    name: "Faculty Member",
    qualification: "M.Sc., B.Ed",
    specialization: "Class 8-10 Mathematics & Science",
    subjects: ["Mathematics", "Science"],
    classesTaught: ["Class 8", "Class 9", "Class 10"],
  };

  const stats = data?.stats || {
    totalStudents: 0,
    todayClassesCount: 0,
    pendingEvaluations: 0,
    totalMaterials: 0,
    averageAttendance: 100,
  };

  const todayClasses = Array.isArray(data?.todayClasses) ? data.todayClasses : [];
  const upcomingClasses = Array.isArray(data?.upcomingClasses) ? data.upcomingClasses : [];
  const combinedSessions = [...todayClasses, ...upcomingClasses];

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome, {teacher.name}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Faculty
            </span>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-0.5 pt-0.5">
            <p>
              Subjects: <strong className="text-slate-700 dark:text-slate-300">{teacher.subjects?.join(", ")}</strong>
            </p>
            <p>
              Grades: <strong className="text-slate-700 dark:text-slate-300">{teacher.classesTaught?.join(", ")}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium self-start md:self-auto">
          <Calendar className="w-3.5 h-3.5" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* ── METRICS (LIVE DATABASE METRICS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned Students</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.totalStudents} <span className="text-xs font-normal text-slate-400">enrolled</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Today&apos;s Sessions</span>
            <p className="text-2xl font-bold text-[#004b79] dark:text-[#dfb74a] tracking-tight">
              {stats.todayClassesCount} <span className="text-xs font-normal text-slate-400">scheduled</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending Grading</span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {stats.pendingEvaluations} <span className="text-xs font-normal text-slate-400">tasks</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Attendance</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {stats.averageAttendance}% <span className="text-xs font-normal text-slate-400">turnout</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CalendarCheck2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── TODAY'S LIVE CLASS SCHEDULE (WITH REAL-TIME COUNTDOWN) ── */}
      {todayClasses.length > 0 && (
        <div className="space-y-3">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Today&apos;s Active Lecture Schedule
            </h2>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">Live Timing Synced</span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50 shadow-xs">
            {todayClasses.map((cls: any) => (
              <TeacherLiveClassRow
                key={cls._id}
                cls={cls}
                onSwap={(target) => setSwapModalSession(target)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── QUICK ACTIONS ── */}
      <div className="space-y-3">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Teaching Management Modules
          </h2>
          <span className="text-[11px] text-slate-400">Direct Navigation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/teacher/schedule"
            prefetch={true}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-[#004b79] dark:hover:border-[#dfb74a] transition-all group flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <CalendarDays className="w-5 h-5 text-[#004b79] dark:text-[#dfb74a]" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">Timetable & Schedule Swap</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Manage session timings and swap subject days</p>
            </div>
          </Link>

          <Link
            href="/teacher/materials"
            prefetch={true}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-[#004b79] dark:hover:border-[#dfb74a] transition-all group flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <BookOpen className="w-5 h-5 text-[#004b79] dark:text-[#dfb74a]" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">Upload Learning Notes</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Share PDFs, formula handbooks & workbooks</p>
            </div>
          </Link>

          <Link
            href="/teacher/assignments"
            prefetch={true}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-[#004b79] dark:hover:border-[#dfb74a] transition-all group flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <FileCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">Assignments & Grading</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Post homework tasks & grade student solutions</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── SCHEDULE RESCHEDULE & SWAP MODAL ── */}
      {swapModalSession && (
        <ScheduleSwapModal
          isOpen={!!swapModalSession}
          onClose={() => setSwapModalSession(null)}
          targetSession={swapModalSession}
          allSessions={combinedSessions}
          onSuccess={() => {
            if (typeof refetch === "function") refetch();
          }}
        />
      )}
    </main>
  );
}
