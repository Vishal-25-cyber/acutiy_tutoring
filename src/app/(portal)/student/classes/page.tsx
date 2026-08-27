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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFastFetch } from "@/lib/api-cache";
import { downloadTimetableDoc } from "@/lib/download";
import { Download, Check } from "lucide-react";

export default function StudentClassesPage() {
  const { data } = useFastFetch("/api/student/classes");
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isDownloaded, setIsDownloaded] = React.useState(false);

  const currentClass = data?.currentClass || "Class 10";
  const board = data?.board || "CBSE";
  const currentDay = data?.currentDay || "Tuesday";
  const batchName = data?.batch?.name || "7:00 PM – 8:00 PM";

  const todayClasses: any[] = Array.isArray(data?.todayClasses) ? data.todayClasses : [];

  const defaultWeeklySchedule = [
    {
      day: "Monday",
      time: batchName,
      subject: "Mathematics",
      topic: "Quadratic Equations — Discriminant & Real Roots Formula",
      faculty: "Dr. Sarah Jenkins",
      status: currentDay.toLowerCase() === "monday" ? "LIVE" : "SCHEDULED",
      roomId: "acuity-maths-live",
      description: "Step-by-step problem solving on quadratic equations and discriminant analysis.",
    },
    {
      day: "Tuesday",
      time: batchName,
      subject: "Science",
      topic: "Light: Reflection & Refraction — Ray Diagrams Exemplar",
      faculty: "Prof. Rajesh Kumar",
      status: currentDay.toLowerCase() === "tuesday" ? "LIVE" : "SCHEDULED",
      roomId: "acuity-science-live",
      description: "Concave and convex mirrors ray tracing with NCERT exemplar problems.",
    },
    {
      day: "Wednesday",
      time: batchName,
      subject: "Mathematics",
      topic: "Arithmetic Progressions — nth Term & Sum of Terms",
      faculty: "Dr. Sarah Jenkins",
      status: currentDay.toLowerCase() === "wednesday" ? "LIVE" : "SCHEDULED",
      roomId: "acuity-maths-live",
      description: "Derivations of Sn formulas and finding nth terms in arithmetic series.",
    },
    {
      day: "Thursday",
      time: batchName,
      subject: "English",
      topic: "Analytical Paragraph & Advanced Grammar Clauses",
      faculty: "Ms. Anita Desai",
      status: currentDay.toLowerCase() === "thursday" ? "LIVE" : "SCHEDULED",
      roomId: "acuity-english-live",
      description: "High-scoring writing techniques and active/passive voice application.",
    },
    {
      day: "Friday",
      time: batchName,
      subject: "Social Science",
      topic: "Nationalism in India / Life Processes Core Concepts",
      faculty: "Prof. Rajesh Kumar",
      status: currentDay.toLowerCase() === "friday" ? "LIVE" : "SCHEDULED",
      roomId: "acuity-social-live",
      description: "Timeline of the freedom movement and important map markers.",
    },
    {
      day: "Saturday",
      time: batchName,
      subject: "Revision & Doubts",
      topic: "Weekly Test Analysis, Doubt Resolution & Worksheet Solving",
      faculty: "Senior Academic Faculty",
      status: currentDay.toLowerCase() === "saturday" ? "LIVE" : "SCHEDULED",
      roomId: "acuity-revision-live",
      description: "Comprehensive review of the week's curriculum with live doubt solving.",
    },
  ];

  const weeklySchedule =
    Array.isArray(data?.weeklySchedule) && data.weeklySchedule.length > 0
      ? data.weeklySchedule
      : defaultWeeklySchedule;

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Live Classes & Timetable
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <GraduationCap className="w-3.5 h-3.5" />
              {currentClass} ({board})
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Batch: <strong className="font-mono text-slate-700 dark:text-slate-300">{batchName}</strong> Mon–Sat</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>HD Video Classes with Automated Attendance</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button
            onClick={handleDownloadTimetable}
            variant="outline"
            size="sm"
            className="text-xs font-semibold gap-2 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-xs"
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
                <span>Print & Download Timetable</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── WEEKLY SCHEDULE TABLE ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Weekly Schedule
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Mon – Sat</span>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="col-span-2">Day & Time</div>
          <div className="col-span-5">Subject & Topic</div>
          <div className="col-span-3">Faculty</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {/* Schedule Rows */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
          {weeklySchedule.map((item: any, idx: number) => {
            const isToday = currentDay.toLowerCase() === item.day.toLowerCase();
            const isLive = item.status === "LIVE" || isToday;
            const classRoomId = item.roomId || "acuity-live-classroom";
            const accent = getSubjectAccent(item.subject);

            return (
              <div
                key={idx}
                className={`py-4 px-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors ${
                  isToday
                    ? "bg-indigo-50/50 dark:bg-indigo-950/20"
                    : "bg-white dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                }`}
              >
                {/* Col 1: Day & Time */}
                <div className="col-span-2 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      {item.day}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-600 text-white leading-none">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{item.time || batchName}</span>
                  </div>
                </div>

                {/* Col 2: Subject & Topic */}
                <div className="col-span-5 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${accent.dot} shrink-0`} />
                    <span className={`text-[11px] font-semibold ${accent.text}`}>
                      {item.subject}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200 leading-snug">
                    {item.topic}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
                    {item.description}
                  </p>
                </div>

                {/* Col 3: Faculty */}
                <div className="col-span-3 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-medium text-xs text-slate-700 dark:text-slate-300 leading-tight">
                      {item.faculty}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Faculty</p>
                  </div>
                </div>

                {/* Col 4: Status / Join */}
                <div className="col-span-2 flex items-center justify-start md:justify-end">
                  {isLive ? (
                    <Link href={`/classroom/${classRoomId}`} className="w-full md:w-auto">
                      <button className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm cursor-pointer">
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Class</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      <Clock className="w-3 h-3" />
                      Scheduled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
