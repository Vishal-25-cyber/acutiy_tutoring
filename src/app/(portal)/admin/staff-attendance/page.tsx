"use client";

import React, { useState } from "react";
import { Clock, UserCheck, CheckCircle2, ShieldCheck, Users, Search, AlertCircle } from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";

const INITIAL_STATS = {
  totalTeachers: 3,
  todayPresent: 3,
  attendancePercentage: 100,
  monthlyAverage: 96,
};

const INITIAL_ROSTER = [
  {
    teacherId: "t1",
    name: "Dr. Sarah Jenkins",
    email: "sarah.maths@acuity.edu",
    qualification: "M.Sc. Mathematics, Ph.D, B.Ed",
    specialization: "Class 8-10 CBSE & ICSE Mathematics",
    approvalStatus: "ACTIVE",
    loginTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    classesConducted: 2,
    workingHours: 4,
    status: "PRESENT",
  },
  {
    teacherId: "t2",
    name: "Prof. Rajesh Kumar",
    email: "rajesh.science@acuity.edu",
    qualification: "M.Sc. Physics, M.Ed",
    specialization: "Experimental Physics & Chemistry",
    approvalStatus: "ACTIVE",
    loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    classesConducted: 1,
    workingHours: 3,
    status: "PRESENT",
  },
  {
    teacherId: "t3",
    name: "Ms. Anita Desai",
    email: "anita.english@acuity.edu",
    qualification: "M.A. English Literature",
    specialization: "Creative Writing and Grammar",
    approvalStatus: "PENDING_APPROVAL",
    loginTime: null,
    classesConducted: 0,
    workingHours: 0,
    status: "ABSENT",
  },
];

export default function AdminStaffAttendancePage() {
  const { data } = useFastFetch("/api/admin/staff-attendance", {
    stats: INITIAL_STATS,
    staffRoster: INITIAL_ROSTER,
  });
  const [search, setSearch] = useState("");

  const stats = data?.stats || INITIAL_STATS;
  const staffRoster = Array.isArray(data?.staffRoster) ? data.staffRoster : INITIAL_ROSTER;

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

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* ── METRIC SUMMARY (CARDLESS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Present Today</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
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

      {/* ── STAFF ATTENDANCE TABLE (CARDLESS) ── */}
      <div className="space-y-3">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Faculty Attendance Log (Today)
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
              const isPresent = st.status === "PRESENT";

              return (
                <div
                  key={st.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        {st.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        ({st.email})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>Login Timestamp: <strong className="font-mono text-slate-700 dark:text-slate-300">{st.loginTime}</strong></span>
                      <span>·</span>
                      <span>Lectures Conducted: <strong className="text-slate-700 dark:text-slate-300">{st.classesConducted}</strong></span>
                      <span>·</span>
                      <span>Active Hours: <strong className="text-indigo-600 dark:text-indigo-400">{st.hours}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        isPresent
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                      }`}
                    >
                      {isPresent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                      <span>{isPresent ? "PRESENT (Logged In)" : "PENDING LOGIN"}</span>
                    </span>
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
