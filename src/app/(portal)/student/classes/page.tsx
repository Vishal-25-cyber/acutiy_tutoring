"use client";

import React from "react";
import Link from "next/link";
import {
  Video,
  Clock,
  Calendar,
  User,
  BookOpen,
  Printer,
  ChevronRight,
  CalendarDays,
  Radio,
  GraduationCap,
  Dot,
  ArrowRight,
  Lock,
  Sparkles,
  Link2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFastFetch } from "@/lib/api-cache";
import { downloadTimetableDoc } from "@/lib/download";
import { Download, Check } from "lucide-react";
import { useClassLiveTimer } from "@/lib/class-timing";

export default function StudentClassesPage() {
  const { data } = useFastFetch("/api/student/classes");
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isDownloaded, setIsDownloaded] = React.useState(false);

  const currentClass = data?.currentClass || "Class 10";
  const board = data?.board || "CBSE";
  const currentDay = data?.currentDay || "Monday";
  const batch = data?.batch;
  const batchName = batch?.name || "7:00 PM – 8:00 PM";

  // Real-time live timer & meeting lock status
  const timing = useClassLiveTimer(batch);

  const defaultWeeklySchedule = [
    {
      day: "Monday",
      time: batchName,
      subject: "Mathematics",
      topic: "Quadratic Equations — Discriminant & Real Roots Formula",
      faculty: "Dr. Sarah Jenkins",
      status: currentDay.toLowerCase() === "monday" ? "LIVE" : "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "Step-by-step problem solving on quadratic equations and discriminant analysis.",
    },
    {
      day: "Tuesday",
      time: batchName,
      subject: "Science",
      topic: "Light: Reflection & Refraction — Ray Diagrams Exemplar",
      faculty: "Prof. Rajesh Kumar",
      status: currentDay.toLowerCase() === "tuesday" ? "LIVE" : "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "Concave and convex mirrors ray tracing with NCERT exemplar problems.",
    },
    {
      day: "Wednesday",
      time: batchName,
      subject: "Mathematics",
      topic: "Arithmetic Progressions — nth Term & Sum of Terms",
      faculty: "Dr. Sarah Jenkins",
      status: currentDay.toLowerCase() === "wednesday" ? "LIVE" : "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "Derivations of Sn formulas and finding nth terms in arithmetic series.",
    },
    {
      day: "Thursday",
      time: batchName,
      subject: "English",
      topic: "Analytical Paragraph & Advanced Grammar Clauses",
      faculty: "Ms. Anita Desai",
      status: currentDay.toLowerCase() === "thursday" ? "LIVE" : "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "High-scoring writing techniques and active/passive voice application.",
    },
    {
      day: "Friday",
      time: batchName,
      subject: "Social Science",
      topic: "Nationalism in India / Life Processes Core Concepts",
      faculty: "Prof. Rajesh Kumar",
      status: currentDay.toLowerCase() === "friday" ? "LIVE" : "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "Timeline of the freedom movement and important map markers.",
    },
    {
      day: "Saturday",
      time: batchName,
      subject: "Revision & Doubts",
      topic: "Weekly Test Analysis, Doubt Resolution & Worksheet Solving",
      faculty: "Senior Academic Faculty",
      status: currentDay.toLowerCase() === "saturday" ? "LIVE" : "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "Comprehensive review of the week's curriculum with live doubt solving.",
    },
  ];

  const weeklySchedule =
    Array.isArray(data?.weeklySchedule) && data.weeklySchedule.length > 0
      ? data.weeklySchedule.map((s: any) => ({ ...s, roomId: timing.permanentRoomId }))
      : defaultWeeklySchedule;

  const todayScheduleItem = weeklySchedule.find(
    (s: any) => s.day.toLowerCase() === currentDay.toLowerCase()
  ) || weeklySchedule[0];

  const getSubjectAccent = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case "mathematics":
        return { dot: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200 dark:border-indigo-800/60" };
      case "science":
      case "physics":
      case "chemistry":
        return { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800/60" };
      case "english":
        return { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800/60" };
      case "social science":
        return { dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-200 dark:border-rose-800/60" };
      default:
        return { dot: "bg-purple-500", text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-800/60" };
    }
  };

  const handleDownloadTimetable = () => {
    setIsDownloading(true);
    const success = downloadTimetableDoc({
      currentClass,
      board,
      batchName,
      weeklySchedule,
    });
    if (success) {
      setIsDownloaded(true);
      setTimeout(() => {
        setIsDownloaded(false);
      }, 2500);
    }
    setIsDownloading(false);
  };

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Live Classes & Timetable
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <GraduationCap className="w-3.5 h-3.5" />
              {currentClass} ({board})
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Registered Batch: <strong className="font-mono text-slate-800 dark:text-slate-200">{batchName}</strong> (Mon–Sat)</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
              <Link2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Permanent Meet Link: <strong className="text-indigo-600 dark:text-indigo-400">{timing.permanentRoomId}</strong></span>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button
            onClick={handleDownloadTimetable}
            variant="outline"
            size="sm"
            className="text-xs font-semibold gap-2 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-xs"
          >
            {isDownloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Timetable Downloaded</span>
              </>
            ) : isDownloading ? (
              <>
                <Download className="w-3.5 h-3.5 animate-bounce text-indigo-500" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Download Timetable</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── TUITION FEE LOCK PAYWALL (WHEN FEE UNPAID OR UNDER REVIEW) ── */}
      {data?.locked ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-transparent border-2 border-amber-500/30 text-center space-y-6 shadow-xl shadow-amber-500/5">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-500/10">
            {data.isUnderReview ? <Clock className="w-8 h-8 animate-spin text-amber-600" /> : <Lock className="w-8 h-8 text-amber-600" />}
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 inline-block">
              {data.isUnderReview ? "Payment Under Review" : "Tuition Payment Required"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {data.isUnderReview ? "Awaiting Administrator Confirmation" : "Live Classroom & Timetable Locked"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {data.isUnderReview
                ? `Your tuition payment of ₹${data.pendingVerification?.amount || 2500} for ${data.pendingVerification?.billingMonth || "August 2026"} (Ref: ${data.pendingVerification?.transactionId || "Submitted"}) has been received and is currently under review by the administrator. Full access to live classes and timetable will be unlocked as soon as the admin confirms it.`
                : `Your monthly tuition fee of ₹${data.unpaidFee?.amount || 2500} for ${data.unpaidFee?.billingMonth || "Current Month"} is pending. Please complete fee payment to submit for admin confirmation and unlock classes.`}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/student/fees">
              <Button size="lg" className="font-extrabold text-sm bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 px-8 py-3 rounded-2xl cursor-pointer">
                {data.isUnderReview ? "View Payment Status & Invoice →" : `Pay Tuition Fee (₹${data.unpaidFee?.amount || 2500}) to Unlock Classes →`}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ── 1. DEDICATED LIVE CLASSROOM CARD WITH TIMING LOCK & COUNTDOWN ── */}
          <div
            className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 shadow-sm relative overflow-hidden ${
              timing.canJoin
                ? "bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/40 text-white ring-1 ring-emerald-500/30 shadow-emerald-900/20 shadow-xl"
                : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100"
            }`}
          >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Class Info & Timing */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              {timing.canJoin ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-sm">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  CLASS IS LIVE NOW
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  TIMED ENTRY LOCK
                </span>
              )}

              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                timing.canJoin
                  ? "bg-emerald-900/60 text-emerald-200 border-emerald-700/60"
                  : "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
              }`}>
                {batchName}
              </span>

              <span className={`text-xs font-mono ${timing.canJoin ? "text-emerald-300 font-bold" : "text-slate-400"}`}>
                Room: {timing.permanentRoomId}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${timing.canJoin ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                {todayScheduleItem?.subject}: {todayScheduleItem?.topic}
              </h2>
              <p className={`text-xs sm:text-sm ${timing.canJoin ? "text-emerald-100/80" : "text-slate-500 dark:text-slate-400"}`}>
                Instructor: <strong>{todayScheduleItem?.faculty}</strong> • Single Permanent Meet Link (Same Daily)
              </p>
            </div>

            {/* Countdown / Live Timing Details */}
            <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-3 border ${
              timing.canJoin
                ? "bg-emerald-900/40 border-emerald-500/30 text-emerald-200"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}>
              {timing.canJoin ? (
                <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-ping" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <div className="space-y-0.5">
                <span className="font-bold block">
                  {timing.canJoin ? "Active Classroom Window:" : "Class Entry Window Lock:"}
                </span>
                <span>{timing.detailedCountdown}</span>
              </div>
            </div>
          </div>

          {/* Right: Join Button (Live vs Locked with Countdown) */}
          <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
            {timing.canJoin ? (
              <Link href={`/classroom/${timing.permanentRoomId}`} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto font-black text-sm px-8 py-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/30 gap-2.5 animate-bounce-subtle cursor-pointer"
                >
                  <Video className="w-5 h-5" />
                  <span>Join Live Classroom</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <div className="space-y-2 w-full sm:w-auto text-left lg:text-right">
                <Button
                  disabled
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto font-bold text-xs sm:text-sm px-6 py-6 rounded-2xl border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed gap-2"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>{timing.countdownText}</span>
                </Button>
                <p className="text-[11px] text-slate-400 font-mono">
                  Opens automatically during {batchName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. WEEKLY SCHEDULE TABLE ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
              Weekly Class Schedule & Timetable
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Monday – Saturday</span>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="col-span-2">Day & Timing</div>
          <div className="col-span-5">Subject & Topic</div>
          <div className="col-span-3">Faculty Instructor</div>
          <div className="col-span-2 text-right">Class Status</div>
        </div>

        {/* Schedule Rows */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          {weeklySchedule.map((item: any, idx: number) => {
            const isToday = currentDay.toLowerCase() === item.day.toLowerCase();
            const canJoinToday = isToday && timing.canJoin;
            const accent = getSubjectAccent(item.subject);

            return (
              <div
                key={idx}
                className={`py-4 px-4 sm:px-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors ${
                  isToday
                    ? canJoinToday
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "bg-indigo-50/40 dark:bg-indigo-950/20"
                    : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                }`}
              >
                {/* Col 1: Day & Time */}
                <div className="col-span-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {item.day}
                    </span>
                    {isToday && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        canJoinToday ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
                      }`}>
                        {canJoinToday ? "Live" : "Today"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.time || batchName}</span>
                  </div>
                </div>

                {/* Col 2: Subject & Topic */}
                <div className="col-span-5 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${accent.dot} shrink-0`} />
                    <span className={`text-xs font-extrabold ${accent.text}`}>
                      {item.subject}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-snug">
                    {item.topic}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
                    {item.description}
                  </p>
                </div>

                {/* Col 3: Faculty */}
                <div className="col-span-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-tight">
                      {item.faculty}
                    </p>
                    <p className="text-[10px] text-slate-400">Faculty Specialist</p>
                  </div>
                </div>

                {/* Col 4: Status / Join Action */}
                <div className="col-span-2 flex items-center justify-start md:justify-end">
                  {canJoinToday ? (
                    <Link href={`/classroom/${timing.permanentRoomId}`} className="w-full md:w-auto">
                      <button className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm cursor-pointer">
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Live</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  ) : isToday ? (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">{timing.countdownText}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Scheduled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}
    </main>
  );
}
