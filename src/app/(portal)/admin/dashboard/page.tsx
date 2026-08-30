"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users2,
  UserCheck,
  Video,
  DollarSign,
  CalendarCheck2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Layers,
  Activity,
  Calendar,
  Hourglass,
  Radio,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminDashboardPage() {
  const { data } = useFastFetch("/api/admin/dashboard");
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  // Ticking real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const metrics = data?.metrics || {
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    activeTeachers: 0,
    pendingApprovals: 0,
    todayClasses: 0,
    activeLiveSessions: 0,
    monthlyRevenue: 0,
    pendingRevenue: 0,
    averageAttendance: 100,
  };

  const recentActivity = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
  const upcomingClasses = Array.isArray(data?.upcomingClasses) ? data.upcomingClasses : [];

  const formattedDate = currentDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = currentDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Calculate time to go for upcoming classes
  const calculateClassTimeToGo = (cls: any) => {
    if (cls.status === "LIVE") {
      return { label: "LIVE NOW", isLive: true, color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold animate-pulse" };
    }
    if (!cls.date || !cls.startTime) {
      return { label: "Upcoming", isLive: false, color: "bg-blue-50 text-[#004b79] dark:bg-[#002137] dark:text-[#dfb74a] border-blue-200 dark:border-[#004b79]/60" };
    }

    try {
      const [y, m, d] = cls.date.split("-").map(Number);
      const [sh, sm] = cls.startTime.split(":").map(Number);
      const [eh, em] = (cls.endTime || "20:00").split(":").map(Number);

      const startDateTime = new Date(y, m - 1, d, sh, sm);
      const endDateTime = new Date(y, m - 1, d, eh, em);

      const diffMs = startDateTime.getTime() - currentDateTime.getTime();
      const endDiffMs = endDateTime.getTime() - currentDateTime.getTime();

      if (diffMs <= 0 && endDiffMs > 0) {
        return { label: "LIVE NOW", isLive: true, color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold animate-pulse" };
      }

      if (endDiffMs <= 0) {
        return { label: "Concluded", isLive: false, color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700" };
      }

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const totalHours = Math.floor(totalMinutes / 60);
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      const minutes = totalMinutes % 60;

      if (days > 0) {
        return {
          label: `Starts in ${days}d ${hours}h`,
          isLive: false,
          color: "bg-blue-50 text-[#004b79] dark:bg-[#002137] dark:text-[#dfb74a] border-blue-200 dark:border-[#004b79]/60",
        };
      }

      if (hours > 0) {
        return {
          label: `Starts in ${hours}h ${minutes}m`,
          isLive: false,
          color: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        };
      }

      return {
        label: `Starts in ${minutes} mins`,
        isLive: false,
        color: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold",
      };
    } catch {
      return { label: "Scheduled", isLive: false, color: "bg-blue-50 text-[#004b79]" };
    }
  };

  const getSubjectBadge = (subject?: string) => {
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
      default:
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800";
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Admin Overview
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              Platform Administrator
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time live operations, enrolled students, faculty roster, and tuition fee records.
          </p>
        </div>

        {/* Live Clock with Date and Time */}
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a] shrink-0" />
          <span>{formattedDate}</span>
          <span className="text-slate-300 dark:text-slate-600 font-mono">•</span>
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formattedTime}</span>
        </div>
      </div>

      {/* ── 2. CARDLESS 4-METRIC FLAT STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pb-2">
        {/* Metric 1: Enrolled Students */}
        <Link href="/admin/students" className="py-2 sm:px-6 first:pl-0 space-y-1 group">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#004b79] transition-colors">
            Enrolled Students
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {metrics.totalStudents}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {metrics.activeStudents} Active in Batches
          </p>
        </Link>

        {/* Metric 2: Faculty Staff */}
        <Link href="/admin/teachers" className="py-2 sm:px-6 space-y-1 group">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#004b79] transition-colors">
            Faculty Staff
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {metrics.totalTeachers}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            {metrics.pendingApprovals > 0 ? `${metrics.pendingApprovals} Pending Approval` : "All Verified"}
          </p>
        </Link>

        {/* Metric 3: Live Lectures */}
        <Link href="/admin/classes" className="py-2 sm:px-6 space-y-1 group">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#004b79] transition-colors">
            Live Lectures Today
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {metrics.todayClasses}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {metrics.activeLiveSessions > 0 ? `${metrics.activeLiveSessions} In Progress` : "Scheduled Today"}
          </p>
        </Link>

        {/* Metric 4: Monthly Collections */}
        <Link href="/admin/finance" className="py-2 sm:px-6 space-y-1 group">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#004b79] transition-colors">
            Monthly Collections
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            ₹{Number(metrics.monthlyRevenue).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-slate-400">
            Pending: ₹{Number(metrics.pendingRevenue).toLocaleString("en-IN")}
          </p>
        </Link>
      </div>



      {/* ── 4. SCHEDULED & UPCOMING LIVE LECTURES (CARDLESS TABLE) ── */}
      {upcomingClasses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Scheduled &amp; Upcoming Live Lectures
              </h2>
            </div>
            <Link
              href="/admin/classes"
              className="text-xs font-bold text-[#004b79] dark:text-[#dfb74a] hover:underline flex items-center gap-1"
            >
              <span>View All Sessions</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
            <div className="col-span-3">Subject &amp; Class</div>
            <div className="col-span-4">Session Topic</div>
            <div className="col-span-3">Faculty &amp; Timing</div>
            <div className="col-span-2 text-right">Countdown &amp; Status</div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {upcomingClasses.map((cls: any) => {
              const countdown = calculateClassTimeToGo(cls);
              return (
                <div
                  key={cls.id}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                >
                  {/* Col 1: Subject & Grade */}
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSubjectBadge(cls.subject)}`}>
                        {cls.subject}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {cls.classLevel}
                      </span>
                    </div>
                  </div>

                  {/* Col 2: Topic */}
                  <div className="col-span-4 space-y-0.5">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {cls.title}
                    </h3>
                  </div>

                  {/* Col 3: Faculty & Time */}
                  <div className="col-span-3 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {cls.teacher || "Faculty Specialist"}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Calendar className="w-3 h-3 text-[#004b79] dark:text-[#dfb74a]" />
                      <span>{cls.date} • {cls.startTime}</span>
                    </div>
                  </div>

                  {/* Col 4: Status */}
                  <div className="col-span-2 text-left md:text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${countdown.color}`}>
                      <Hourglass className="w-2.5 h-2.5" />
                      <span>{countdown.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. LIVE PLATFORM ACTIVITY LOG (CARDLESS TABLE) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Live Platform Activity Log
            </h2>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-bold text-[#004b79] dark:text-[#dfb74a] hover:underline"
          >
            View Audit Logs
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {recentActivity.map((act: any) => (
            <div
              key={act.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors px-1"
            >
              <div className="space-y-0.5">
                <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {act.title}
                </p>
                <p className="text-[11px] text-slate-400">
                  Event Category: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{act.type}</strong>
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                <span>{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
