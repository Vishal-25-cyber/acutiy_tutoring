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
  ArrowRight,
  ShieldCheck,
  Calendar,
  Shuffle,
  CalendarDays,
  GraduationCap,
  Mail,
  Hash,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";
import { ScheduleSwapModal } from "@/components/classroom/ScheduleSwapModal";
import { useClassLiveTimer } from "@/lib/class-timing";
import { PortalHeader } from "@/components/layout/PortalHeader";

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
    <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors px-1">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
            {cls.subject}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
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
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{cls.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{cls.topic || timing.detailedCountdown}</p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
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
    email: "",
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

  const quickLinks = [
    {
      href: "/teacher/schedule",
      icon: CalendarDays,
      label: "Timetable & Schedule",
      desc: "Manage session timings and swap subject days",
      color: "text-[#004b79] dark:text-[#dfb74a]",
    },
    {
      href: "/teacher/materials",
      icon: BookOpen,
      label: "Upload Learning Notes",
      desc: "Share PDFs, formula handbooks & workbooks",
      color: "text-[#004b79] dark:text-[#dfb74a]",
    },
    {
      href: "/teacher/assignments",
      icon: FileCheck,
      label: "Assignments & Grading",
      desc: "Post homework tasks & grade student solutions",
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      href: "/teacher/students",
      icon: Users,
      label: "Batch Student Roster",
      desc: "View enrolled students, attendance & fee status",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      href: "/teacher/attendance",
      icon: CalendarCheck2,
      label: "Attendance Log",
      desc: "Mark and review session attendance records",
      color: "text-indigo-600 dark:text-indigo-400",
    },
  ];

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

        {/* ── 2. ACADEMIC VITAL METRICS (FLAT, NO CARDS) ── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Teaching Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5 divide-x-0 lg:divide-x divide-slate-200 dark:divide-slate-800 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned Students</span>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                {stats.totalStudents}
              </p>
              <p className="text-xs text-slate-400">enrolled</p>
            </div>

            <div className="space-y-1 lg:pl-8">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Today&apos;s Sessions</span>
              <p className="text-3xl font-black text-[#004b79] dark:text-[#dfb74a] tracking-tight leading-none">
                {stats.todayClassesCount}
              </p>
              <p className="text-xs text-slate-400">scheduled</p>
            </div>

            <div className="space-y-1 lg:pl-8">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending Grading</span>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none">
                {stats.pendingEvaluations}
              </p>
              <p className="text-xs text-slate-400">tasks</p>
            </div>

            <div className="space-y-1 lg:pl-8">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Attendance</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                {stats.averageAttendance}%
              </p>
              <p className="text-xs text-slate-400">turnout</p>
            </div>
          </div>
        </div>

        {/* ── 3. TEACHER DETAILS (FLAT TABLE) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty Details & Credentials</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {[
              { icon: GraduationCap, label: "Teacher Name", value: teacher.name },
              { icon: ShieldCheck, label: "Qualification", value: teacher.qualification || "M.Sc., B.Ed" },
              { icon: BookOpen, label: "Specialization", value: teacher.specialization || teacher.subjects?.join(", ") },
              { icon: Hash, label: "Classes Taught", value: teacher.classesTaught?.join(", ") },
              ...(teacher.email ? [{ icon: Mail, label: "Email Address", value: teacher.email }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 text-right">{value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. TODAY'S LIVE CLASS SCHEDULE ── */}
        {todayClasses.length > 0 && (
          <div className="space-y-3">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Today&apos;s Active Lecture Schedule
              </h2>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">Live Timing Synced</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
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

        {/* ── 5. TEACHING MANAGEMENT MODULES (FLAT LIST, NO CARDS) ── */}
        <div className="space-y-3">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Teaching Management Modules</h2>
            <span className="text-[11px] text-slate-400">Direct Navigation</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {quickLinks.map(({ href, icon: Icon, label, desc, color }) => (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className="flex items-center justify-between py-4 gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors group px-1"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                    <p className="text-[11px] text-slate-400 truncate">{desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── SCHEDULE SWAP MODAL ── */}
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
    </>
  );
}
