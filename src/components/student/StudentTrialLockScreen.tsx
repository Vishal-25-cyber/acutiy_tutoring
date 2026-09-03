"use client";

import React from "react";
import Link from "next/link";
import { Lock, ArrowRight, Sparkles, MessageCircle, CreditCard, CheckCircle2, Clock } from "lucide-react";

interface StudentTrialLockScreenProps {
  studentName?: string;
  studentClass?: string;
  studentId?: string;
  trialEndsAt?: string | Date;
}

export function StudentTrialLockScreen({
  studentName = "Student",
  studentClass = "Class 10",
  studentId,
  trialEndsAt,
}: StudentTrialLockScreenProps) {
  const formattedEndDate = trialEndsAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(trialEndsAt))
    : "Recently Ended";

  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-[#001726] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {/* Top Highlight Banner */}
        <div className="bg-gradient-to-r from-[#002137] via-[#003659] to-[#004b79] p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#dfb74a]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <Lock className="w-6 h-6 text-[#dfb74a]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-[#dfb74a]/20 text-[#dfb74a] border border-[#dfb74a]/30">
                Access Restricted
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                2-Day Free Trial Expired
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
            Your 48-hour free trial for <strong className="text-white font-bold">{studentName}</strong> ({studentClass}) has officially completed. Live classrooms, syllabus materials, and assignment portals are locked until your monthly tuition fee is verified.
          </p>
        </div>

        {/* Inner Card Details */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Account Status</span>
              <p className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Trial Ended</span>
              </p>
            </div>
            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:dark:border-slate-800 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Expired On</span>
              <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {formattedEndDate}
              </p>
            </div>
            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:dark:border-slate-800 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Action Required</span>
              <p className="font-extrabold text-indigo-600 dark:text-indigo-400">
                Submit Fee UTR
              </p>
            </div>
          </div>

          {/* What Unlocks After Payment */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#dfb74a]" />
              <span>What Unlocks Instantly Upon Payment Verification:</span>
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Live Interactive WebRTC Classes</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Full NCERT &amp; CBSE Chapter Notes</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Teacher Assignment Submissions &amp; Grades</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Official Downloadable Tax Invoices</span>
              </li>
            </ul>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/student/fees"
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#002137] hover:bg-[#003659] text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer group"
            >
              <CreditCard className="w-4 h-4 text-[#dfb74a]" />
              <span>Open Tuition Fees &amp; Founder QR</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="https://wa.me/916381180488?text=Hello%20Mantif%20Tutoring%20Team,%20my%202-day%20free%20trial%20has%20ended.%20I%20would%20like%20to%20verify%20my%20tuition%20payment."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-3.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span>Contact Academic Admin</span>
            </a>
          </div>

          <p className="text-[11px] text-center text-slate-400">
            Already transferred via UPI? Submit your 12-digit UTR on the Tuition Fees page. The administrator verifies payments swiftly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentTrialLockScreen;
