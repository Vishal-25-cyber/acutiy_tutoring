"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Video,
  BookOpen,
  FileCheck,
  CalendarCheck2,
  TrendingUp,
  CreditCard,
  Bot,
  Users2,
  Settings,
  ShieldAlert,
  ClipboardList,
  Sparkles,
  Layers,
  FileText,
  UserCheck,
  Clock,
  DollarSign,
  Activity,
  History,
  LogOut,
} from "lucide-react";
import { cn } from "@/components/ui/button";
import { warmupPortalCache, prefetchApi, invalidateCache } from "@/lib/api-cache";

interface SidebarProps {
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

export function PortalSidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Pre-warm data into in-memory cache on initial load for instant 0ms transitions
  useEffect(() => {
    warmupPortalCache(role);
  }, [role]);

  const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard, api: "/api/student/dashboard" },
    { href: "/student/classes", label: "Live Classes & Timetable", icon: Video, badge: "Live", api: "/api/student/classes" },
    { href: "/student/materials", label: "Learning Hub", icon: BookOpen, api: "/api/student/materials" },
    { href: "/student/assignments", label: "Assignments & Tasks", icon: FileCheck, api: "/api/student/assignments" },
    { href: "/student/attendance", label: "Attendance & Streak", icon: CalendarCheck2, api: "/api/student/attendance" },
  ];

  const teacherLinks = [
    { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard, api: "/api/teacher/dashboard" },
    { href: "/teacher/schedule", label: "Timetable & Schedule", icon: CalendarCheck2, api: "/api/classes" },
    { href: "/teacher/live-class/create", label: "Create Live Class", icon: Video, badge: "Host" },
    { href: "/teacher/materials", label: "Upload Materials", icon: BookOpen, api: "/api/teacher/materials" },
    { href: "/teacher/assignments", label: "Assignments & Grading", icon: FileCheck, api: "/api/teacher/assignments" },
    { href: "/teacher/students", label: "Batch Student Roster", icon: Users2, api: "/api/teacher/students" },
    { href: "/teacher/attendance", label: "Attendance Log", icon: Clock },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Command Center", icon: LayoutDashboard },
    { href: "/admin/students", label: "Student Management", icon: Users2 },
    { href: "/admin/teachers", label: "Teacher Approvals & Staff", icon: UserCheck, badge: "Pending" },
    { href: "/admin/batches", label: "Dynamic Batch Manager", icon: Layers },
    { href: "/admin/classes", label: "Live Session Monitor", icon: Video },
    { href: "/admin/attendance", label: "Student Attendance", icon: CalendarCheck2 },
    { href: "/admin/staff-attendance", label: "Staff Attendance", icon: Clock },
    { href: "/admin/finance", label: "Monthly Income & Fees", icon: DollarSign },
    { href: "/admin/analytics", label: "Advanced Analytics", icon: Activity },
    { href: "/admin/settings", label: "System Settings", icon: Settings },
    { href: "/admin/audit-logs", label: "Admin Audit Logs", icon: History },
  ];

  const links = role === "STUDENT" ? studentLinks : role === "TEACHER" ? teacherLinks : adminLinks;

  const handleHoverPrefetch = (item: any) => {
    if (item.href) router.prefetch(item.href);
    if (item.api) prefetchApi(item.api);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      invalidateCache("/api");
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  };

  return (
    <aside className="w-60 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-colors">
      {/* Sidebar Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white shrink-0">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-200">
            ACUITY
          </span>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {role} Portal
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(`${item.href}/`) &&
              item.href !== "/student/dashboard" &&
              item.href !== "/teacher/dashboard");

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => handleHoverPrefetch(item)}
              onFocus={() => handleHoverPrefetch(item)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-colors group",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-semibold",
                    isActive
                      ? "bg-indigo-200/60 dark:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Sign Out */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
