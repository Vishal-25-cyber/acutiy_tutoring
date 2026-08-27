"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useFastFetch } from "@/lib/api-cache";

interface PortalHeaderProps {
  userName?: string;
  userRole?: string;
}

export function PortalHeader({
  userName: propUserName,
  userRole: propUserRole,
}: PortalHeaderProps) {
  const pathname = usePathname();
  const { data: authData } = useFastFetch("/api/auth/me");
  const { data: paymentData } = useFastFetch(propUserRole === "STUDENT" ? "/api/student/payments" : "");

  const user = authData?.user;
  const rawName = propUserName || user?.name || "Student";
  const safeName = typeof rawName === "string" && rawName.trim() ? rawName : "Student";
  const userRole = propUserRole || user?.role || "STUDENT";

  const currentFee = paymentData?.currentFee;
  const pendingVerification = paymentData?.pendingVerification;

  const getPageTitle = () => {
    if (pathname.includes("/admin/dashboard")) return "Command Center Overview";
    if (pathname.includes("/admin/students")) return "Student Directory & Management";
    if (pathname.includes("/admin/teachers")) return "Faculty & Teacher Approvals";
    if (pathname.includes("/admin/batches")) return "Dynamic Batch Manager";
    if (pathname.includes("/admin/classes")) return "Live Session Monitor";
    if (pathname.includes("/admin/staff-attendance")) return "Staff Attendance & Presence";
    if (pathname.includes("/admin/attendance")) return "Student Attendance Records";
    if (pathname.includes("/admin/finance")) return "Tuition Ledger & Financials";
    if (pathname.includes("/admin/analytics")) return "Platform Growth & Analytics";
    if (pathname.includes("/admin/settings")) return "System Configuration & Settings";
    if (pathname.includes("/admin/audit-logs")) return "Administrative Audit Logs";
    if (pathname.includes("/fees")) return "Tuition Fees & Receipts";
    if (pathname.includes("/classes") || pathname.includes("/schedule")) return "Live Classes & Timetable";
    if (pathname.includes("/materials")) return "Learning Hub & Notes";
    if (pathname.includes("/assignments")) return "Assignments & Tasks";
    if (pathname.includes("/attendance")) return "Attendance Records";
    if (pathname.includes("/performance")) return "Performance & Analytics";
    if (pathname.includes("/students")) return "Batch Student Roster";
    if (pathname.includes("/live-class/create")) return "Host Live Classroom";
    return userRole === "ADMIN" ? "Admin Command Center" : userRole === "TEACHER" ? "Teacher Workspace" : "Student Dashboard";
  };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right: Fees Due Pill + Notifications + User */}
      <div className="flex items-center gap-3 shrink-0">
        {userRole === "STUDENT" && (
          <>
            {currentFee ? (
              <Link
                href="/student/fees"
                prefetch={true}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-all shadow-sm group"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>Due: ₹{currentFee.amount}</span>
              </Link>
            ) : pendingVerification ? (
              <Link
                href="/student/fees"
                prefetch={true}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold animate-pulse"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Verification Pending</span>
              </Link>
            ) : (
              <Link
                href="/student/fees"
                prefetch={true}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Dues Cleared</span>
              </Link>
            )}
          </>
        )}

        <NotificationBell />

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
            {safeName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
            {safeName}
          </span>
        </div>
      </div>
    </header>
  );
}
