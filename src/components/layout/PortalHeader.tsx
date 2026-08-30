"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Radio,
  ChevronRight,
  Sparkles,
} from "lucide-react";
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

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const user = authData?.user;
  const rawName = propUserName || user?.name || "User";
  const safeName = typeof rawName === "string" && rawName.trim() ? rawName : "User";
  const userRole = propUserRole || user?.role || "STUDENT";

  const currentFee = paymentData?.currentFee;
  const pendingVerification = paymentData?.pendingVerification;

  const getPageInfo = () => {
    if (pathname.includes("/admin/dashboard")) return { title: "Command Center Overview", portal: "Admin HQ" };
    if (pathname.includes("/admin/students")) return { title: "Student Directory & Management", portal: "Admin HQ" };
    if (pathname.includes("/admin/teachers")) return { title: "Faculty & Teacher Approvals", portal: "Admin HQ" };
    if (pathname.includes("/admin/batches")) return { title: "Dynamic Batch Manager", portal: "Admin HQ" };
    if (pathname.includes("/admin/classes")) return { title: "Live Session Monitor", portal: "Admin HQ" };
    if (pathname.includes("/admin/staff-attendance")) return { title: "Staff Attendance & Presence", portal: "Admin HQ" };
    if (pathname.includes("/admin/attendance")) return { title: "Student Attendance Records", portal: "Admin HQ" };
    if (pathname.includes("/admin/finance")) return { title: "Tuition Ledger & Financials", portal: "Admin HQ" };
    if (pathname.includes("/admin/analytics")) return { title: "Platform Growth & Analytics", portal: "Admin HQ" };
    if (pathname.includes("/admin/settings")) return { title: "System Configuration", portal: "Admin HQ" };
    if (pathname.includes("/fees")) return { title: "Tuition Fees & Receipts", portal: "Student Portal" };
    if (pathname.includes("/teacher/schedule") || pathname.includes("/teacher/live-class")) return { title: "Live Classes & Timetable", portal: "Faculty Portal" };
    if (pathname.includes("/student/classes")) return { title: "Live Classes & Timetable", portal: "Student Portal" };
    if (pathname.includes("/materials")) return { title: "Learning Hub & Notes", portal: userRole === "TEACHER" ? "Faculty Portal" : "Student Portal" };
    if (pathname.includes("/assignments")) return { title: "Assignments & Grading", portal: userRole === "TEACHER" ? "Faculty Portal" : "Student Portal" };
    if (pathname.includes("/attendance")) return { title: "Batch Attendance Records", portal: userRole === "TEACHER" ? "Faculty Portal" : "Student Portal" };
    if (pathname.includes("/performance")) return { title: "Performance & Analytics", portal: "Student Portal" };
    if (pathname.includes("/students")) return { title: "Batch Student Roster", portal: "Faculty Portal" };
    if (pathname.includes("/teacher/dashboard")) return { title: "Faculty Command Dashboard", portal: "Faculty Portal" };
    return {
      title: userRole === "ADMIN" ? "Admin Command Center" : userRole === "TEACHER" ? "Faculty Workspace" : "Student Learning Dashboard",
      portal: userRole === "ADMIN" ? "Admin HQ" : userRole === "TEACHER" ? "Faculty Portal" : "Student Portal",
    };
  };

  const { title, portal } = getPageInfo();

  const getRoleIcon = () => {
    if (userRole === "ADMIN") return <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />;
    if (userRole === "TEACHER") return <BookOpen className="w-3.5 h-3.5 text-indigo-500" />;
    return <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />;
  };

  const getRoleBadge = () => {
    if (userRole === "ADMIN") return "Admin";
    if (userRole === "TEACHER") return "Faculty";
    return "Student";
  };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* ── LEFT: TITLE & ROLE BADGE ── */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight truncate">
          {title}
        </h2>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {getRoleIcon()}
          <span>{getRoleBadge()}</span>
        </span>
      </div>

      {/* ── RIGHT: NOTIFICATIONS + USER PROFILE ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Student Tuition Fee Status */}
        {userRole === "STUDENT" && (
          <>
            {currentFee ? (
              <Link
                href="/student/fees"
                prefetch={true}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-all shadow-xs group"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>Due: ₹{currentFee.amount}</span>
              </Link>
            ) : pendingVerification ? (
              <Link
                href="/student/fees"
                prefetch={true}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold animate-pulse"
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

        {/* Notification Bell */}
        <NotificationBell />

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#002137] dark:bg-[#dfb74a] text-white dark:text-[#002137] font-bold text-xs flex items-center justify-center shadow-xs ring-1 ring-[#b89047]/40">
            {safeName.charAt(0).toUpperCase()}
          </div>

          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline">
            {safeName}
          </span>
        </div>
      </div>
    </header>
  );
}

