"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Flame, LogOut, PhoneCall, ShieldCheck, User as UserIcon } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { Badge } from "@/components/ui/badge";

interface PortalHeaderProps {
  userName?: string;
  userRole?: string;
  streakCount?: number;
  currentClass?: string;
  batchName?: string;
}

export function PortalHeader({
  userName = "User",
  userRole = "STUDENT",
  streakCount = 7,
  currentClass,
  batchName,
}: PortalHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  };

  return (
    <header className="h-20 px-6 sm:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Left Info / Badge */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Welcome, {userName.split(" ")[0]}</span>
            {userRole === "STUDENT" && currentClass && (
              <Badge variant="default" className="text-[11px] font-bold">
                {currentClass}
              </Badge>
            )}
          </h1>
          {batchName && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Assigned Batch: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{batchName}</span>
            </p>
          )}
        </div>
      </div>

      {/* Right Stats & Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Gamified Streak Counter for Students */}
        {userRole === "STUDENT" && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-xs">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span>{streakCount}-Day Streak</span>
          </div>
        )}

        {/* Support Hotline pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
          <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
          <span>Support: +91 98765 43210</span>
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {userName[0] || "U"}
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
