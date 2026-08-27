"use client";

import React from "react";
import { usePathname } from "next/navigation";
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

  const user = authData?.user;
  const rawName = propUserName || user?.name || "Student";
  const safeName = typeof rawName === "string" && rawName.trim() ? rawName : "Student";
  const userRole = propUserRole || user?.role || "STUDENT";

  const getPageTitle = () => {
    if (pathname.includes("/classes") || pathname.includes("/schedule")) return "Live Classes & Timetable";
    if (pathname.includes("/materials")) return "Learning Hub & Notes";
    if (pathname.includes("/assignments")) return "Assignments & Tasks";
    if (pathname.includes("/attendance")) return "Attendance Records";
    if (pathname.includes("/performance")) return "Performance & Analytics";
    if (pathname.includes("/students")) return "Batch Student Roster";
    if (pathname.includes("/live-class/create")) return "Host Live Classroom";
    return "Student Dashboard";
  };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Page Title */}
      <h2 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 tracking-tight">
        {getPageTitle()}
      </h2>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-3 shrink-0">
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
