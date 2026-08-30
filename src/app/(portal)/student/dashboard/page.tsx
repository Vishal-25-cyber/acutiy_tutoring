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
  CreditCard,
  Radio,
  Lock,
  ArrowRight,
  Link2,
} from "lucide-react";
import { Button, cn } from "@/components/ui/button";
import { useFastFetch } from "@/lib/api-cache";
import { useClassLiveTimer } from "@/lib/class-timing";

export default function StudentDashboardPage() {
  const { data: authData } = useFastFetch("/api/auth/me");
  const { data } = useFastFetch("/api/student/dashboard");
  const { data: paymentData } = useFastFetch("/api/student/payments");

  const authUser = authData?.user;
  const student = data?.student;

  const rawName = student?.name || authUser?.name || "Student";
  const safeName = typeof rawName === "string" && rawName.trim() ? rawName : "Student";
  const classLevel = student?.classLevel || authUser?.profile?.currentClass || "Class 10";
  const board = student?.board || authUser?.profile?.board || "CBSE";
  const studentEmail = student?.email || authUser?.email || "student@acuity.edu";
  const batch = student?.batch || authUser?.profile?.batchId;
  const batchName = batch?.name || "7:00 PM – 8:00 PM";

  // Real-time live class countdown & entry window status
  const timing = useClassLiveTimer(batch);
  
  // Real strictly computed attendance values
  const totalSessions = student?.totalSessions ?? 0;
  const totalAttended = student?.totalAttended ?? 0;
  const attendancePercentage = student?.attendancePercentage ?? 0;

  // Real assessment summary stats strictly from database
  const assessments = data?.assessmentSummary || {
    total: 0,
    submitted: 0,
    pending: 0,
    evaluated: 0,
    averageScore: 0,
  };

  // Real fee status
  const currentFee = paymentData?.currentFee || data?.feeStatus?.currentFee;
  const pendingVerification = paymentData?.pendingVerification || data?.feeStatus?.pendingVerification;
  const hasPendingFee = Boolean(currentFee);

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
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Welcome, {safeName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time student workspace • {classLevel} ({board} Board)
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* 2. REAL-TIME LIVE CLASSROOM & TIMED ENTRY WIDGET */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 shadow-sm relative overflow-hidden ${
          timing.canJoin
            ? "bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/40 text-white shadow-xl shadow-emerald-900/20"
            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              {timing.canJoin ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-sm">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  LIVE NOW
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

            <div>
              <h2 className={`text-lg sm:text-xl font-black tracking-tight ${timing.canJoin ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                Daily Live Batch Classroom
              </h2>
              <p className={`text-xs ${timing.canJoin ? "text-emerald-200" : "text-slate-500 dark:text-slate-400"} mt-0.5`}>
                {timing.detailedCountdown} (Permanent Dedicated Meet Link)
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {hasPendingFee ? (
              <Link href="/student/fees">
                <Button
                  size="lg"
                  className="font-black text-xs sm:text-sm px-6 py-5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/25 gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay Fee to Unlock Class</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : timing.canJoin ? (
              <Link href={`/classroom/${timing.permanentRoomId}`}>
                <Button
                  size="lg"
                  className="font-black text-xs sm:text-sm px-6 py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Live Class</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button
                disabled
                size="lg"
                variant="outline"
                className="font-bold text-xs px-5 py-5 rounded-2xl border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/40 cursor-not-allowed gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{timing.countdownText}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3. REAL-TIME TUITION FEE & DUES BANNER */}
      {currentFee ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Monthly Tuition Fee Due: ₹{currentFee.amount}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
                  Payment Required
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Billing Month: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentFee.billingMonth}</span> • Due Date: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentFee.dueDate ? new Date(currentFee.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Immediate"}</span> • Invoice Ref: <span className="font-mono text-slate-500">{currentFee.receiptNumber}</span>
              </p>
            </div>
          </div>
          <Link href="/student/fees" prefetch={true} className="shrink-0">
            <Button variant="glow" size="sm" className="font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-500/25 px-5">
              Pay Tuition (₹{currentFee.amount}) →
            </Button>
          </Link>
        </div>
      ) : pendingVerification ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-blue-500/10 to-indigo-500/5 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Payment Verification in Progress (₹{pendingVerification.amount})
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  Pending Admin Approval
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Submitted Transaction / UTR: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{pendingVerification.transactionId || "Submitted"}</span> • Real-time listener active
              </p>
            </div>
          </div>
          <Link href="/student/fees" prefetch={true} className="shrink-0">
            <Button variant="outline" size="sm" className="font-bold text-xs border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
              View Payment Details
            </Button>
          </Link>
        </div>
      ) : (
        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                Tuition Status: All Fees Cleared & Full Access Active
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Your live classrooms, curriculum materials, and assignment submissions are active.
              </p>
            </div>
          </div>
          <Link href="/student/fees" prefetch={true}>
            <span className="text-xs font-bold text-emerald-600 hover:underline">View Receipts & Invoices →</span>
          </Link>
        </div>
      )}

      {/* 4. CORE ACADEMIC METRICS (Strictly 100% real-time from database) */}
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tuition Dues</span>
            {currentFee ? (
              <Link href="/student/fees" className="block group">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight group-hover:underline">
                  ₹{currentFee.amount} <span className="text-xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">Unpaid</span>
                </p>
              </Link>
            ) : pendingVerification ? (
              <Link href="/student/fees" className="block group">
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight group-hover:underline">
                  ₹{pendingVerification.amount} <span className="text-xs font-bold text-indigo-500">Verifying</span>
                </p>
              </Link>
            ) : (
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                ₹0 <span className="text-xs font-bold text-emerald-500">Cleared</span>
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Rate</span>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {attendancePercentage}% <span className="text-sm font-semibold text-slate-400">({totalAttended}/{totalSessions} Present)</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 5. VERIFIED ACADEMIC PROFILE & ENROLLMENT RECORD */}
      <div className="space-y-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-400">Student Name</span>
            <p className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{safeName}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-400">Registered Email</span>
            <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-sm">{studentEmail}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-400">Curriculum & Board</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{classLevel} — {board} Board</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-400">Daily Live Batch</span>
            <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-base">{batchName} (Mon–Sat)</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-400">Live Attendance Standing</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-bold text-base",
                totalSessions === 0 ? "text-slate-500" : attendancePercentage >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              )}>
                {totalSessions > 0 ? `${attendancePercentage}% Turnout (${totalAttended}/${totalSessions})` : "0% (New Enrollment)"}
              </span>
              <span className="text-xs text-slate-400">(Min: 75%)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-400">Tuition Fee Standing</span>
            <div>
              {currentFee ? (
                <span className="font-bold text-amber-600 dark:text-amber-400 text-base">
                  ₹{currentFee.amount} Due ({currentFee.billingMonth})
                </span>
              ) : pendingVerification ? (
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">
                  Pending Verification (₹{pendingVerification.amount})
                </span>
              ) : (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                  ✓ All Dues Cleared
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
