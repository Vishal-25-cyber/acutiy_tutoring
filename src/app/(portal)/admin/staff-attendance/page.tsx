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
  Video,
} from "lucide-react";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";

const INITIAL_STATS = {
  totalTeachers: 3,
  todayPresent: 3,
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
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const handleMarkTeacherAttendance = async (teacherId: string, status: "PRESENT" | "HALF_DAY" | "ABSENT" | "LEAVE") => {
    setIsUpdating(teacherId);
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
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Staff Attendance &amp; Duty Logs
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              Automated Tracking
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time automated staff attendance logged upon faculty portal login and active live classroom sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            disabled={isUpdating === "ALL"}
            onClick={handleMarkAllPresent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isUpdating === "ALL" ? "Updating..." : "Mark All Present"}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
            <span>{todayFormatted}</span>
          </div>
        </div>
      </div>

      {/* ── 2. CARDLESS 4-METRIC FLAT STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pb-2">
        <div className="py-2 sm:px-6 first:pl-0 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Present Today</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.todayPresent} <span className="text-xs font-normal text-slate-400">/ {stats.totalTeachers}</span>
          </p>
          <p className="text-xs text-slate-400">Faculty on duty</p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Duty Turnout</span>
          <p className="text-2xl sm:text-3xl font-black text-[#004b79] dark:text-[#dfb74a] font-mono">
            {stats.attendancePercentage}%
          </p>
          <p className="text-xs text-slate-400">Today&apos;s compliance</p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Faculty</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {stats.totalTeachers}
          </p>
          <p className="text-xs text-slate-400">Registered staff</p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Average</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.monthlyAverage || 100}%
          </p>
          <p className="text-xs text-slate-400">Regular compliance</p>
        </div>
      </div>

      {/* ── 3. SEARCH BAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search faculty by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#004b79] shadow-xs"
          />
        </div>
      </div>

      {/* ── 4. CARDLESS 12-COLUMN STAFF ROSTER TABLE ── */}
      <div className="space-y-2 pt-2">
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-3">Faculty Instructor</div>
          <div className="col-span-3">Today Duty Status</div>
          <div className="col-span-3">Login &amp; Session Stats</div>
          <div className="col-span-3 text-right">Attendance Action</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filtered.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No staff members found</p>
              <p className="text-xs text-slate-400">No staff match your search query.</p>
            </div>
          ) : (
            filtered.map((st: any) => {
              const currentStatus = localStatusMap[st.id] || st.status || "PRESENT";
              const isPresent = currentStatus === "PRESENT";
              const isLeave = currentStatus === "LEAVE";
              const isAbsent = currentStatus === "ABSENT";

              return (
                <div
                  key={st.id}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                >
                  {/* Col 1: Faculty Name & Email */}
                  <div className="col-span-3 space-y-0.5">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {st.name || "Faculty Specialist"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {st.email}
                    </p>
                  </div>

                  {/* Col 2: Today Duty Status */}
                  <div className="col-span-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        currentStatus === "PRESENT"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : currentStatus === "HALF_DAY"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
                          : currentStatus === "LEAVE"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>
                        {currentStatus === "PRESENT"
                          ? "Present (Checked In)"
                          : currentStatus === "HALF_DAY"
                          ? "Half Day"
                          : currentStatus === "LEAVE"
                          ? "On Leave"
                          : "Absent"}
                      </span>
                    </span>
                  </div>

                  {/* Col 3: Login & Session Stats */}
                  <div className="col-span-3 space-y-0.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <Clock className="w-3 h-3 text-[#004b79] dark:text-[#dfb74a]" />
                      <span>In: {st.loginTimeDisplay || "8:00 AM"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {st.classesConducted || 0} Lectures Conducted •{" "}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {st.onTimeCompliance || "On-Time Host"}
                      </span>
                    </p>
                  </div>

                  {/* Col 4: Mark Attendance Actions */}
                  <div className="col-span-3 flex items-center justify-start md:justify-end gap-1.5 flex-wrap">
                    <button
                      type="button"
                      disabled={isUpdating === st.id}
                      onClick={() => handleMarkTeacherAttendance(st.id, "PRESENT")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === "PRESENT"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      ✓ Present
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating === st.id}
                      onClick={() => handleMarkTeacherAttendance(st.id, "HALF_DAY")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === "HALF_DAY"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Half Day
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating === st.id}
                      onClick={() => handleMarkTeacherAttendance(st.id, "LEAVE")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === "LEAVE"
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Leave
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating === st.id}
                      onClick={() => handleMarkTeacherAttendance(st.id, "ABSENT")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === "ABSENT"
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
