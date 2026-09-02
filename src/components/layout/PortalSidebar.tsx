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
  CreditCard,
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
import { warmupPortalCache, prefetchApi, invalidateCache, clearAuthAndCaches, useFastFetch } from "@/lib/api-cache";

interface SidebarLink {
  href: string;
  label: string;
  icon: any;
  badge?: string;
  badgeVariant?: "default" | "warning" | "success" | "live";
  api?: string;
}

interface SidebarProps {
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

export function PortalSidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const studentLinks: SidebarLink[] = React.useMemo(() => [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard, api: "/api/student/dashboard" },
    { href: "/student/classes", label: "Live Classes & Timetable", icon: Video, api: "/api/student/classes" },
    { href: "/student/materials", label: "Study Materials", icon: BookOpen, api: "/api/student/materials" },
    { href: "/student/assignments", label: "Assignments & Tasks", icon: FileCheck, api: "/api/student/assignments" },
    { href: "/student/attendance", label: "Attendance Record", icon: CalendarCheck2, api: "/api/student/attendance" },
    {
      href: "/student/fees",
      label: "Fee Receipts & QR",
      icon: CreditCard,
      api: "/api/student/payments",
    },
  ], []);

  const teacherLinks: SidebarLink[] = React.useMemo(() => [
    { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard, api: "/api/teacher/dashboard" },
    { href: "/teacher/reports", label: "Performance & Growth", icon: Activity, api: "/api/teacher/reports" },
    { href: "/teacher/schedule", label: "Schedule & Timetable", icon: CalendarCheck2, api: "/api/classes" },
    { href: "/teacher/live-class/create", label: "Launch Live Class", icon: Video, badge: "Host" },
    { href: "/teacher/assignments", label: "Assignments & Grading", icon: FileCheck, api: "/api/teacher/assignments" },
    { href: "/teacher/students", label: "Student Roster", icon: Users2, api: "/api/teacher/students" },
    { href: "/teacher/materials", label: "Study Resources", icon: BookOpen, api: "/api/teacher/materials" },
    { href: "/teacher/attendance", label: "Staff Attendance Log", icon: Clock },
  ], []);

  const { data: dashboardData } = useFastFetch(role === "ADMIN" ? "/api/admin/dashboard" : "");

  const pendingTeacherCount = dashboardData?.metrics?.pendingApprovals ?? 0;
  const pendingStudentCount = dashboardData?.metrics?.pendingStudentApprovals ?? 0;
  const teacherPendingBadge = pendingTeacherCount > 0 ? `${pendingTeacherCount} Pending` : undefined;
  const studentPendingBadge = pendingStudentCount > 0 ? `${pendingStudentCount} Pending` : undefined;

  const adminLinks: SidebarLink[] = React.useMemo(() => [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard, api: "/api/admin/dashboard" },
    { href: "/admin/reports", label: "Performance & Growth", icon: Activity, api: "/api/teacher/reports" },
    {
      href: "/admin/students",
      label: "Student Approvals",
      icon: Users2,
      badge: studentPendingBadge,
      badgeVariant: "warning",
      api: "/api/admin/students",
    },
    {
      href: "/admin/teachers",
      label: "Faculty Approvals",
      icon: UserCheck,
      badge: teacherPendingBadge,
      badgeVariant: "warning",
      api: "/api/admin/teachers?status=ALL",
    },
    { href: "/admin/batches", label: "Batch Slots", icon: Layers, api: "/api/batches" },
    { href: "/admin/classes", label: "Live Class Schedule", icon: Video, api: "/api/classes" },
    { href: "/admin/attendance", label: "Student Attendance", icon: CalendarCheck2, api: "/api/admin/attendance?classLevel=ALL&status=ALL" },
    { href: "/admin/staff-attendance", label: "Faculty Attendance", icon: Clock, api: "/api/admin/staff-attendance" },
    { href: "/admin/finance", label: "Fee Accounts & Income", icon: DollarSign, api: "/api/admin/finance" },
    { href: "/admin/settings", label: "Institute Settings", icon: Settings, api: "/api/admin/settings" },
  ], [teacherPendingBadge, studentPendingBadge]);

  const links = role === "STUDENT" ? studentLinks : role === "TEACHER" ? teacherLinks : adminLinks;

  // Pre-warm data into in-memory cache once on mount for instant transitions
  useEffect(() => {
    warmupPortalCache(role);
  }, [role]);

  const handleHoverPrefetch = (item: any) => {
    if (item.href) {
      try {
        router.prefetch(item.href);
      } catch (e) { }
    }
    if (item.api) {
      prefetchApi(item.api);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      clearAuthAndCaches();
      window.location.href = "/";
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#001726] flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-colors">
      {/* Sidebar Header */}
      <div className="h-20 px-4 flex items-center border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#00121e]/50">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/images/mantif_logo.png"
            alt="Mantif Logo"
            className="w-11 h-11 object-contain group-hover:scale-105 transition-transform shrink-0"
          />
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="font-black text-[18px] tracking-[0.14em] text-[#002137] dark:text-white leading-tight select-none truncate"
                style={{ fontFamily: "'Montserrat', 'Outfit', 'Inter', sans-serif" }}
              >
                M<span className="text-[#b89047] dark:text-[#dfb74a]">Λ</span>NTIF
              </span>
              <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#b89047]/15 text-[#8f6d2b] dark:text-[#dfb74a] uppercase tracking-wider border border-[#b89047]/30 shrink-0">
                {role}
              </span>
            </div>
            <p className="text-[9.5px] font-bold text-[#b89047] dark:text-[#dfb74a] tracking-tight leading-none mt-0.5 truncate">
              Human x Artificial Intelligence
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3.5 px-3 space-y-1 overflow-y-auto">
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
                "flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all group",
                isActive
                  ? "bg-[#002137] text-white dark:bg-[#002842] dark:text-[#dfb74a] shadow-sm border border-[#002137] dark:border-[#b89047]/40"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-[#dfb74a]" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                    item.badgeVariant === "warning"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                      : item.badgeVariant === "live"
                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                        : isActive
                          ? "bg-blue-200/60 dark:bg-blue-900/40 text-blue-700 dark:text-sky-300"
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
