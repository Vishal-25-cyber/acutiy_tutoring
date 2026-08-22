"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

export function PortalSidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/classes", label: "Live Classes & Timetable", icon: Video, badge: "Live" },
    { href: "/student/materials", label: "Learning Hub", icon: BookOpen },
    { href: "/student/assignments", label: "Assignments & Tasks", icon: FileCheck },
    { href: "/student/attendance", label: "Attendance & Streak", icon: CalendarCheck2 },
    { href: "/student/performance", label: "Performance & Scores", icon: TrendingUp },
    { href: "/student/ai-tutor", label: "AI Study Buddy", icon: Bot, badge: "AI" },
    { href: "/student/fees", label: "Fees & Receipts", icon: CreditCard },
    { href: "/student/parent-view", label: "Parent View Portal", icon: Users2 },
  ];

  const teacherLinks = [
    { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/schedule", label: "Timetable & Schedule", icon: CalendarCheck2 },
    { href: "/teacher/live-class/create", label: "Create Live Class", icon: Video, badge: "Host" },
    { href: "/teacher/materials", label: "Upload Materials", icon: BookOpen },
    { href: "/teacher/assignments", label: "Assignments & Grading", icon: FileCheck },
    { href: "/teacher/students", label: "Batch Student Roster", icon: Users2 },
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

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex flex-col h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Sidebar Header */}
      <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100">
            ACUITY
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {role} PORTAL
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Hotlines Badge */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Emergency / Support</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">+91 98765 43210</p>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">3 Hotlines Active 24/7</p>
        </div>
      </div>
    </aside>
  );
}
