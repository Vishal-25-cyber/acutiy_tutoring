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
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Settings,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminDashboardPage() {
  const { data } = useFastFetch("/api/admin/dashboard");

  const metrics = data?.metrics || {
    totalStudents: 124,
    activeStudents: 118,
    totalTeachers: 12,
    activeTeachers: 11,
    pendingApprovals: 1,
    todayClasses: 6,
    activeLiveSessions: 1,
    monthlyRevenue: 248500,
    pendingRevenue: 32000,
    averageAttendance: 94,
    highRiskStudents: 2,
  };

  const recentActivity = data?.recentActivity || [
    { id: "1", type: "STUDENT", title: "New student enrolled in Class 10 CBSE", time: "10 mins ago" },
    { id: "2", type: "LIVE", title: "Class 10 Mathematics Live Session completed", time: "35 mins ago" },
    { id: "3", type: "PAYMENT", title: "Tuition fee received (₹2,500) via online gateway", time: "1 hour ago" },
    { id: "4", type: "TEACHER", title: "New teacher application submitted (Dr. Anita, Science)", time: "2 hours ago" },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Admin Command Center
            </h1>
            <Badge variant="default" className="text-xs">
              Platform Master
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time operations, WebRTC video metrics, tuition ledger, and faculty approval desk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/batches" prefetch={true}>
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold text-xs rounded-xl">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Batch Manager</span>
            </Button>
          </Link>
          <Link href="/admin/finance" prefetch={true}>
            <Button variant="secondary" size="sm" className="gap-1.5 font-semibold text-xs rounded-xl">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tuition Ledger</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/students" prefetch={true} className="block group">
          <Card className="p-5 flex flex-col justify-between group-hover:border-indigo-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Enrolled Students</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                <Users2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {metrics.totalStudents}
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                {metrics.activeStudents} Active in Batches
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/admin/teachers" prefetch={true} className="block group">
          <Card className="p-5 flex flex-col justify-between group-hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Faculty Staff</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                {metrics.totalTeachers}
              </p>
              <div className="mt-1">
                {metrics.pendingApprovals > 0 ? (
                  <Badge variant="warning" className="text-[10px]">
                    {metrics.pendingApprovals} Pending Approval
                  </Badge>
                ) : (
                  <span className="text-xs text-slate-500">All Approved</span>
                )}
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/classes" prefetch={true} className="block group">
          <Card className="p-5 flex flex-col justify-between group-hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Live WebRTC Classrooms</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics.todayClasses}
              </p>
              <div className="mt-1">
                <Badge variant="live" className="text-[10px]">
                  {metrics.activeLiveSessions} Live Right Now
                </Badge>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/finance" prefetch={true} className="block group">
          <Card className="p-5 flex flex-col justify-between group-hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Monthly Collections</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                ₹{(metrics.monthlyRevenue / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Pending: ₹{(metrics.pendingRevenue / 1000).toFixed(1)}k
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Two Column Grid: Operations Shortcuts & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Operations Control Panel
            </h3>
            <span className="text-xs text-slate-400">Class 1 to 10 Central Desk</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Link href="/admin/students" prefetch={true} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-500 transition-all group">
              <Users2 className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-slate-900 dark:text-slate-100">Student Directory</p>
              <p className="text-slate-500 mt-0.5">Filter by CBSE & State Board, assign batches, password resets.</p>
            </Link>

            <Link href="/admin/teachers" prefetch={true} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-purple-500 transition-all group">
              <UserCheck className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-slate-900 dark:text-slate-100">Teacher Approvals</p>
              <p className="text-slate-500 mt-0.5">Review teacher qualifications, approve, reject, or assign salary tier.</p>
            </Link>

            <Link href="/admin/batches" prefetch={true} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-500 transition-all group">
              <Layers className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-slate-900 dark:text-slate-100">Batch Manager</p>
              <p className="text-slate-500 mt-0.5">5-min late-entry rules, capacity bars, evening slots.</p>
            </Link>

            <Link href="/admin/attendance" prefetch={true} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-amber-500 transition-all group">
              <CalendarCheck2 className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-slate-900 dark:text-slate-100">Attendance & Risk Log</p>
              <p className="text-slate-500 mt-0.5">Smart risk flags (&lt;75%) and one-click CSV export.</p>
            </Link>
          </div>
        </Card>

        {/* Activity Stream */}
        <Card className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Live Platform Activity
            </h3>
            <Link href="/admin/audit-logs" prefetch={true} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Full Audit Trail
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivity.map((act: any) => (
              <div key={act.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{act.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
