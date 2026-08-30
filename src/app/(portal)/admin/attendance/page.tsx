"use client";

import React, { useState, useEffect } from "react";
import { CalendarCheck2, Download, AlertTriangle, Search, Filter, ShieldCheck, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFastFetch } from "@/lib/api-cache";

const INITIAL_STATS = {
  totalRecords: 24,
  presentCount: 22,
  lateCount: 2,
  partialCount: 0,
  attendanceRate: 95,
  highRiskCount: 1,
};

const INITIAL_RECORDS = [
  {
    _id: "att-1",
    studentId: { _id: "u1", name: "Aravind Swaminathan", email: "aravind.class10@acuity.edu", phone: "9876543220" },
    sessionId: { title: "Class 10 CBSE — Quadratic Equations Masterclass", subject: "Mathematics" },
    classLevel: "Class 10",
    batchId: { name: "7:00 PM – 8:00 PM" },
    joinTime: new Date(Date.now() - 30 * 60 * 1000),
    durationMinutes: 52,
    status: "PRESENT",
  },
  {
    _id: "att-2",
    studentId: { _id: "u2", name: "Priya Sharma", email: "priya.class9@acuity.edu", phone: "9876543221" },
    sessionId: { title: "Class 9 — Laws of Motion & Momentum", subject: "Science" },
    classLevel: "Class 9",
    batchId: { name: "6:00 PM – 7:00 PM" },
    joinTime: new Date(Date.now() - 90 * 60 * 1000),
    durationMinutes: 48,
    status: "PRESENT",
  },
  {
    _id: "att-3",
    studentId: { _id: "u3", name: "Rohit Verma", email: "rohit.class8@acuity.edu", phone: "9876543222" },
    sessionId: { title: "Class 8 — Force & Pressure Fundamentals", subject: "Science" },
    classLevel: "Class 8",
    batchId: { name: "7:00 PM – 8:00 PM" },
    joinTime: new Date(Date.now() - 35 * 60 * 1000),
    durationMinutes: 42,
    status: "LATE",
  },
];

export default function AdminAttendancePage() {
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useFastFetch(`/api/admin/attendance?classLevel=${selectedClass}&status=${selectedStatus}`, {
    records: INITIAL_RECORDS,
    stats: INITIAL_STATS,
  });

  const records = data?.records || INITIAL_RECORDS;
  const stats = data?.stats || INITIAL_STATS;

  const filteredRecords = records.filter((r: any) => {
    const name = r.studentId?.name || "";
    const email = r.studentId?.email || "";
    const cls = r.classLevel || "";
    if (selectedClass !== "ALL" && cls !== selectedClass) return false;
    if (selectedStatus !== "ALL" && r.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    }
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Student Name,Email,Class,Batch,Join Time,Duration(Mins),Status\n"];
    const rows = filteredRecords.map((r: any) => {
      const name = r.studentId?.name || "Student";
      const email = r.studentId?.email || "";
      const cls = r.classLevel || "Class 10";
      const batch = r.batchId?.name || "7:00 PM – 8:00 PM";
      const joinTime = r.joinTime ? new Date(r.joinTime).toISOString() : "";
      const dur = r.durationMinutes || 50;
      const status = r.status || "PRESENT";
      return `"${name}","${email}","${cls}","${batch}","${joinTime}",${dur},"${status}"\n`;
    });

    const blob = new Blob([headers.join("") + rows.join("")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Acuity_Student_Attendance_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Student Attendance Logs &amp; Audit
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Automated student join logs, smart risk flags (&lt;75%), and CSV compliance reports.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* ── 2. CARDLESS 4-METRIC FLAT STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pb-2">
        <div className="py-2 sm:px-6 first:pl-0 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Attendance</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.attendanceRate}%
          </p>
          <p className="text-xs text-slate-400">{stats.presentCount} On-Time Joins</p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Late Entry Log</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">{stats.lateCount}</p>
          <p className="text-xs text-slate-400">Beyond 5-min grace window</p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">High Risk Students</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">{stats.highRiskCount}</p>
          <p className="text-xs text-rose-500 font-semibold">Attendance &lt;65%</p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tracked</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">{stats.totalRecords}</p>
          <p className="text-xs text-slate-400">WebRTC live logs</p>
        </div>
      </div>

      {/* ── 3. SEARCH & FILTERS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search student by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#004b79] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#004b79] shadow-xs cursor-pointer"
          >
            <option value="ALL">All Classes</option>
            <option value="Class 10">Class 10</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 8">Class 8</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#004b79] shadow-xs cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      {/* ── 4. CARDLESS 12-COLUMN ATTENDANCE TABLE ── */}
      <div className="space-y-2 pt-2">
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-4">Student &amp; Email</div>
          <div className="col-span-3">Class &amp; Batch</div>
          <div className="col-span-3">Join Time &amp; Duration</div>
          <div className="col-span-2 text-right">Attendance Status</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredRecords.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <CalendarCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No attendance logs found</p>
              <p className="text-xs text-slate-400">No records match the selected filters.</p>
            </div>
          ) : (
            filteredRecords.map((r: any) => {
              const isPresent = r.status === "PRESENT";
              const isLate = r.status === "LATE";

              return (
                <div
                  key={r._id}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                >
                  {/* Col 1: Student Name & Email */}
                  <div className="col-span-4 space-y-0.5">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {r.studentId?.name || "Student"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {r.studentId?.email}
                    </p>
                  </div>

                  {/* Col 2: Class & Batch */}
                  <div className="col-span-3 space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {r.classLevel || "Class 10"}
                    </span>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {r.batchId?.name || "7:00 PM – 8:00 PM"}
                    </p>
                  </div>

                  {/* Col 3: Join Time & Duration */}
                  <div className="col-span-3 space-y-0.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                      <span>
                        {r.joinTime ? new Date(r.joinTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "7:02 PM"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {r.durationMinutes || 50} mins in live video
                    </p>
                  </div>

                  {/* Col 4: Status */}
                  <div className="col-span-2 text-left md:text-right">
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isPresent
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : isLate
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {r.status || "PRESENT"}
                    </span>
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
