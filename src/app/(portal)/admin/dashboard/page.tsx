"use client";

import React from "react";
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
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";

const INITIAL_METRICS = {
  totalStudents: 3,
  activeStudents: 3,
  totalTeachers: 3,
  activeTeachers: 3,
  pendingApprovals: 1,
  todayClasses: 2,
  activeLiveSessions: 0,
  monthlyRevenue: 15000,
  pendingRevenue: 2500,
  averageAttendance: 95,
};

const INITIAL_ACTIVITY = [
  { id: "1", type: "STUDENT", title: "Student enrolled in Class 10 CBSE batch", time: "10 mins ago" },
  { id: "2", type: "LIVE", title: "Class 10 Mathematics Live Classroom session scheduled", time: "35 mins ago" },
  { id: "3", type: "PAYMENT", title: "Tuition fee received (₹2,500) for Class 10", time: "1 hour ago" },
  { id: "4", type: "TEACHER", title: "Faculty profile verified for Class 8-10 Science", time: "2 hours ago" },
];

export default function AdminDashboardPage() {
  const { data } = useFastFetch("/api/admin/dashboard", {
    metrics: INITIAL_METRICS,
    recentActivity: INITIAL_ACTIVITY,
  });

  const metrics = data?.metrics || INITIAL_METRICS;
  const recentActivity = data?.recentActivity || INITIAL_ACTIVITY;

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
              Admin Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Platform Administrator
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time operations, enrolled students, faculty roster, and tuition fee records.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium self-start md:self-auto">
          <Clock className="w-3.5 h-3.5" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* ── ESSENTIAL METRICS (CARDLESS HAIRLINE SUMMARY) ── */}
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

      {/* ── RECENT PLATFORM ACTIVITY (CARDLESS TABLE) ── */}
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
