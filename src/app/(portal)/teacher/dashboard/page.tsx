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
  GraduationCap,
  Calendar,
  Shuffle,
  CalendarDays,
  Sparkles,
  Users2,
  Activity,
  Mail,
  Hash,
  Layers,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { ScheduleSwapModal } from "@/components/classroom/ScheduleSwapModal";
import { useClassLiveTimer } from "@/lib/use-class-timer";

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
    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
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
    email: "",
    experienceYears: 6,
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

  const managementModules = [
    {
      href: "/teacher/schedule",
      title: "Timetable & Schedule Swap",
      desc: "Manage session timings, batch slots & swap subject days",
      icon: CalendarDays,
      color: "text-[#004b79] dark:text-[#dfb74a]",
      bg: "bg-blue-50 dark:bg-[#002137]",
    },
    {
      href: "/teacher/live-class/create",
      title: "Launch Live Class",
      desc: "Host instant or scheduled HD interactive live lectures",
      icon: Video,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      href: "/teacher/assignments",
      title: "Assignments & Grading",
      desc: "Create homework tasks, review submissions & record grades",
      icon: FileCheck,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      href: "/teacher/materials",
      title: "Upload Learning Notes",
      desc: "Share chapter PDFs, formula handbooks & practice sets",
      icon: BookOpen,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      href: "/teacher/students",
      title: "Student Roster & Cohort",
      desc: "Inspect enrolled student profiles, attendance and contact info",
      icon: Users2,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/40",
    },
    {
      href: "/teacher/reports",
      title: "Performance Reports",
      desc: "School-wise cohort analytics, report cards and remarks",
      icon: Activity,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
    },
  ];

  return (
    <>
      {/* ── NAVBAR ── */}
      <PortalHeader userRole="TEACHER" />

      <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-in fade-in duration-150 select-none">
        {/* ── 1. WELCOME HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
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

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium self-start md:self-auto">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{todayFormatted}</span>
          </div>
        </div>

        {/* ── 2. METRICS (CARD DESIGN WITH ICONS) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned Students</span>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {stats.totalStudents} <span className="text-xs font-normal text-slate-400">enrolled</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Today&apos;s Sessions</span>
              <p className="text-2xl sm:text-3xl font-bold text-[#004b79] dark:text-[#dfb74a] tracking-tight">
                {stats.todayClassesCount} <span className="text-xs font-normal text-slate-400">scheduled</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] flex items-center justify-center shrink-0">
              <Video className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending Grading</span>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
                {stats.pendingEvaluations} <span className="text-xs font-normal text-slate-400">tasks</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Attendance</span>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {stats.averageAttendance}% <span className="text-xs font-normal text-slate-400">turnout</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ── 3. TODAY'S LIVE CLASS SCHEDULE ── */}
        <div className="space-y-3">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Today&apos;s Active Lecture Schedule
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Timing Synced
            </span>
          </div>

          {todayClasses.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50 shadow-xs">
              {todayClasses.map((cls: any) => (
                <TeacherLiveClassRow
                  key={cls._id}
                  cls={cls}
                  onSwap={(target) => setSwapModalSession(target)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/30 text-center space-y-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No active lectures running right now for today.
              </p>
              <Link href="/teacher/live-class/create">
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#002137] dark:bg-[#004b79] hover:bg-[#001726] dark:hover:bg-[#0284c7] text-white transition-colors cursor-pointer">
                  <Video className="w-3.5 h-3.5 text-[#dfb74a]" />
                  <span>Launch Live Classroom</span>
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* ── 4. TWO-COLUMN BALANCED SECTION: MODULES + FACULTY DOSSIER ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT: TEACHING MANAGEMENT MODULES (7 COLS) ── */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Teaching Management Modules
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Quick Access</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {managementModules.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-[#004b79] dark:hover:border-[#dfb74a] transition-all group flex flex-col justify-between h-28 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: FACULTY DETAILS & CREDENTIALS DOSSIER (5 COLS) ── */}
          <div className="lg:col-span-5 space-y-4 lg:pl-6 lg:border-l lg:border-slate-200 lg:dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Faculty Details &amp; Credentials
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  Teacher Name
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {teacher.name}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Qualification
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {teacher.qualification || "M.Sc., B.Ed"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  Specialization
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                  {teacher.specialization || teacher.subjects?.join(", ")}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                  <Hash className="w-4 h-4 text-slate-400" />
                  Classes Taught
                </span>
                <span className="font-mono font-bold text-[#004b79] dark:text-[#dfb74a]">
                  {teacher.classesTaught?.join(", ")}
                </span>
              </div>

              {teacher.email && (
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Email Address
                  </span>
                  <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                    {teacher.email}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                  <Sparkles className="w-4 h-4 text-[#dfb74a]" />
                  Teaching Experience
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {teacher.experienceYears ? `${teacher.experienceYears}+ Years` : "6+ Years"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. SCHEDULE RESCHEDULE & SWAP MODAL ── */}
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
