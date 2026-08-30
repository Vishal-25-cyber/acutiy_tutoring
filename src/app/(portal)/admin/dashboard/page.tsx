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
  CheckCircle2,
  Calendar,
  Hourglass,
  Sparkles,
  Eye,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminDashboardPage() {
  const { data } = useFastFetch("/api/admin/dashboard");
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  // Ticking real-time clock every second
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
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = currentDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Calculate days/hours/minutes to go for upcoming classes
  const calculateClassTimeToGo = (cls: any) => {
    if (cls.status === "LIVE") {
      return { label: "🔴 LIVE NOW", isLive: true, color: "bg-rose-500 text-white font-bold animate-pulse" };
    }
    if (!cls.date || !cls.startTime) {
      return { label: "Upcoming", isLive: false, color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" };
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
        return { label: "🔴 LIVE NOW", isLive: true, color: "bg-rose-500 text-white font-bold animate-pulse" };
      }

      if (endDiffMs <= 0) {
        return { label: "Concluded", isLive: false, color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" };
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
          color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
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
      return { label: "Scheduled", isLive: false, color: "bg-indigo-50 text-indigo-700" };
    }
  };

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Admin Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Platform Administrator
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time live operations, enrolled students, faculty roster, and tuition fee records.
          </p>
        </div>

        {/* Live Clock with Date and Time */}
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium self-start md:self-auto bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{formattedDate}</span>
          <span className="text-slate-300 dark:text-slate-600 font-mono">|</span>
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formattedTime}</span>
        </div>
      </div>

      {/* ── ESSENTIAL METRICS (LIVE DATABASE VALUES) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/students" prefetch={true} className="block group">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-indigo-400 dark:hover:border-indigo-700 transition-colors flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Enrolled Students</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {metrics.totalStudents}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {metrics.activeStudents} Active in Batches
              </p>
            </div>
            <div className="w-9 h-9 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/admin/teachers" prefetch={true} className="block group">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-purple-400 dark:hover:border-purple-700 transition-colors flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Faculty Staff</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {metrics.totalTeachers}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                {metrics.pendingApprovals > 0 ? `${metrics.pendingApprovals} Pending Approval` : "All Verified"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/admin/classes" prefetch={true} className="block group">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-emerald-400 dark:hover:border-emerald-700 transition-colors flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Live Lectures Today</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {metrics.todayClasses}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {metrics.activeLiveSessions > 0 ? `${metrics.activeLiveSessions} In Progress` : "Scheduled Today"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link href="/admin/finance" prefetch={true} className="block group">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-amber-400 dark:hover:border-amber-700 transition-colors flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Monthly Collections</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                ₹{Number(metrics.monthlyRevenue).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pending: ₹{Number(metrics.pendingRevenue).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* ── QUICK MANAGEMENT SHORTCUTS ── */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
        <Link href="/admin/students" prefetch={true}>
          <button className="px-3.5 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Users2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Students Directory</span>
          </button>
        </Link>
        <Link href="/admin/teachers" prefetch={true}>
          <button className="px-3.5 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Faculty Verification</span>
          </button>
        </Link>
        <Link href="/admin/batches" prefetch={true}>
          <button className="px-3.5 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Batch Manager</span>
          </button>
        </Link>
        <Link href="/admin/classes" prefetch={true}>
          <button className="px-3.5 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Video className="w-3.5 h-3.5 text-rose-600" />
            <span>Live Session Monitor</span>
          </button>
        </Link>
        <Link href="/admin/staff-attendance" prefetch={true}>
          <button className="px-3.5 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
            <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Staff Attendance</span>
          </button>
        </Link>
        <Link href="/admin/finance" prefetch={true}>
          <button className="px-3.5 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            <span>Tuition Ledger</span>
          </button>
        </Link>
      </div>

      {/* ── UPCOMING LIVE LECTURES WITH COUNTDOWN ── */}
      {upcomingClasses.length > 0 && (
        <div className="space-y-3">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Scheduled & Upcoming Live Lectures
              </h2>
            </div>
            <Link href="/admin/classes" prefetch={true} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <span>View All Sessions</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingClasses.map((cls: any) => {
              const countdown = calculateClassTimeToGo(cls);
              return (
                <div
                  key={cls.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {cls.subject}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{cls.classLevel}</span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${countdown.color}`}>
                      <Hourglass className="w-2.5 h-2.5" />
                      <span>{countdown.label}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {cls.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      <span>{cls.date} • {cls.startTime}</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px]">
                      {cls.teacher}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── RECENT PLATFORM ACTIVITY (LIVE REAL LOGS) ── */}
      <div className="space-y-3">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Live Platform Activity Log
            </h2>
          </div>
          <Link href="/admin/audit-logs" prefetch={true} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            View Audit Logs
          </Link>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
          {recentActivity.map((act: any) => (
            <div
              key={act.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="space-y-0.5">
                <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {act.title}
                </p>
                <p className="text-[11px] text-slate-400">
                  Event Category: <strong className="text-slate-600 dark:text-slate-400">{act.type}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400 font-mono">
                <Clock className="w-3 h-3" />
                <span>{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
