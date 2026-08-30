"use client";

import React, { useState } from "react";
import {
  Clock,
  UserCheck,
  CheckCircle2,
  ShieldCheck,
  Users,
  Search,
  AlertCircle,
  XCircle,
  Calendar,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";

const INITIAL_STATS = {
  totalTeachers: 1,
  todayPresent: 1,
  attendancePercentage: 100,
  monthlyAverage: 100,
};

export default function AdminStaffAttendancePage() {
  const { data, refetch } = useFastFetch("/api/admin/staff-attendance");
  const [search, setSearch] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [localStatusMap, setLocalStatusMap] = useState<Record<string, string>>({});

  const stats = data?.stats || INITIAL_STATS;
  const staffRoster = Array.isArray(data?.staffRoster) ? data.staffRoster : [];

  const filtered = staffRoster.filter(
    (st: any) =>
      !search.trim() ||
      st.name?.toLowerCase().includes(search.toLowerCase()) ||
      st.email?.toLowerCase().includes(search.toLowerCase())
  );

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const handleMarkTeacherAttendance = async (teacherId: string, status: "PRESENT" | "ABSENT" | "LEAVE") => {
    setIsUpdating(teacherId);
    // Instant optimistic update on UI
    setLocalStatusMap((prev) => ({ ...prev, [teacherId]: status }));

    try {
      const res = await fetch("/api/admin/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          status,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        invalidateCache("/api/admin/staff-attendance");
        invalidateCache("/api/admin/dashboard");
        await refetch();
      }
    } catch (err) {
      console.error("Failed to mark teacher attendance:", err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!staffRoster.length) return;
    setIsUpdating("ALL");
    const optimistic: Record<string, string> = {};
    staffRoster.forEach((st: any) => {
      optimistic[st.id] = "PRESENT";
    });
    setLocalStatusMap(optimistic);

    try {
      await Promise.all(
        staffRoster.map((st: any) =>
          fetch("/api/admin/staff-attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teacherId: st.id,
              status: "PRESENT",
              date: new Date().toISOString().split("T")[0],
            }),
          })
        )
      );
      invalidateCache("/api/admin/staff-attendance");
      invalidateCache("/api/admin/dashboard");
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Staff Attendance & Presence Logs
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Automated Tracking
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time automated staff attendance logged upon faculty portal login and active live classroom sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold gap-1.5 h-9 cursor-pointer"
            disabled={isUpdating === "ALL"}
            onClick={handleMarkAllPresent}
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isUpdating === "ALL" ? "Updating..." : "Mark All Present"}</span>
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
            <Clock className="w-3.5 h-3.5" />
            <span>{todayFormatted}</span>
          </div>
        </div>
      </div>

      {/* ── METRICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Present Today</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.todayPresent} <span className="text-xs font-normal text-slate-400">of {stats.totalTeachers}</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Staff Attendance Rate</span>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {stats.attendancePercentage}% <span className="text-xs font-normal text-slate-400">turnout</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Faculty</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.totalTeachers} <span className="text-xs font-normal text-slate-400">registered</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Monthly Average</span>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 tracking-tight">
              {stats.monthlyAverage}% <span className="text-xs font-normal text-slate-400">compliance</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search faculty by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* ── STAFF ATTENDANCE TABLE ── */}
      <div className="space-y-3">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Faculty Attendance Log & Quick Override (Today)
          </h2>
          <span className="text-[11px] font-mono text-slate-400">{filtered.length} Teachers</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No staff records found</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            {filtered.map((st: any) => {
              const currentStatus = localStatusMap[st.id] || st.status || "PENDING_LOGIN";
              const isPresent = currentStatus === "PRESENT";
              const isLeave = currentStatus === "LEAVE";
              const isAbsent = currentStatus === "ABSENT";
              const isLoading = isUpdating === st.id;

              return (
                <div
                  key={st.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{st.name}</p>
                      <span className="text-xs text-slate-400 font-mono">({st.email})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Login Timestamp: <strong className="text-slate-700 dark:text-slate-300 font-mono">{st.loginTime}</strong></span>
                      <span>·</span>
                      <span>Lectures Conducted: <strong className="text-slate-700 dark:text-slate-300">{st.classesConducted}</strong></span>
                      <span>·</span>
                      <span>Active Hours: <strong className="text-indigo-600 dark:text-indigo-400">{st.hours}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isPresent
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                          : isLeave
                          ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs"
                          : isAbsent
                          ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {isPresent ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isLeave ? (
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      ) : isAbsent ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>
                        {isPresent
                          ? "PRESENT"
                          : isLeave
                          ? "ON LEAVE"
                          : isAbsent
                          ? "ABSENT"
                          : "PENDING LOGIN"}
                      </span>
                    </span>

                    {/* Quick Admin Mark Action Buttons */}
                    <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleMarkTeacherAttendance(st.id, "PRESENT")}
                        className={`h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          isPresent
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        }`}
                      >
                        Present
                      </button>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleMarkTeacherAttendance(st.id, "ABSENT")}
                        className={`h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          isAbsent
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/20"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        }`}
                      >
                        Absent
                      </button>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleMarkTeacherAttendance(st.id, "LEAVE")}
                        className={`h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          isLeave
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-500/20"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        }`}
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
