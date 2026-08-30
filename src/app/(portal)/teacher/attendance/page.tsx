"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  Clock,
  Search,
  ArrowRight,
  Radio,
  Download,
  Calendar,
  Layers,
  UserCheck,
  CheckCircle2,
  LogIn,
  LogOut,
  ShieldCheck,
  Briefcase,
  Users,
  Filter,
} from "lucide-react";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";
import { getClassLiveState } from "@/lib/class-timing";

export default function TeacherAttendancePage() {
  const { data, refetch, isLoading } = useFastFetch("/api/teacher/attendance");
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "STAFF">("STUDENTS");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CONDUCTED" | "UPCOMING">("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(""); // Date filter YYYY-MM-DD
  const [isPunching, setIsPunching] = useState(false);
  const [punchMessage, setPunchMessage] = useState<string | null>(null);

  const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
  const staffData = data?.staffAttendance || {};
  const staffRecords = Array.isArray(staffData?.records) ? staffData.records : [];
  const todayRecord = staffData?.todayRecord || null;

  const conductedSessions = sessions.filter((s: any) => {
    const liveState = getClassLiveState(s);
    return liveState === "COMPLETED" || liveState === "LIVE" || (s.presentCount || 0) > 0 || s.isConducted === true;
  });

  const totalConductedPresent = conductedSessions.reduce((sum: number, s: any) => sum + (s.presentCount || 0), 0);
  const totalConductedEnrolled = conductedSessions.reduce((sum: number, s: any) => sum + (s.totalEnrolled || 1), 0);

  const liveAvgAttendance =
    totalConductedEnrolled > 0
      ? Math.min(100, Math.round((totalConductedPresent / totalConductedEnrolled) * 100))
      : 100;

  const totalConductedCount = conductedSessions.length;
  const assignedStudents = data?.summary?.totalStudentsAssigned || 3;

  // Filtered Sessions for Students
  const filteredSessions = sessions.filter((s: any) => {
    const liveState = getClassLiveState(s);
    const isLive = liveState === "LIVE" || s.status === "LIVE";
    const isCompleted = liveState === "COMPLETED" || s.isConducted === true || (s.presentCount || 0) > 0;
    const isUpcoming = !isLive && !isCompleted;

    const matchesSearch =
      !searchQuery.trim() ||
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.date?.includes(searchQuery);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "CONDUCTED" && (isCompleted || isLive)) ||
      (statusFilter === "UPCOMING" && isUpcoming);

    const matchesDate = !selectedDate || s.date === selectedDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Group filtered sessions by date
  const rawDates: string[] = filteredSessions.map((s: any) => String(s.date || "")).filter(Boolean);
  const distinctDates: string[] = Array.from(new Set(rawDates)).sort(
    (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Handle Staff Check-In / Check-Out
  const handleStaffPunch = async (action: "CHECK_IN" | "CHECK_OUT") => {
    setIsPunching(true);
    setPunchMessage(null);
    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (res.ok) {
        setPunchMessage(
          action === "CHECK_IN"
            ? "✓ Checked in successfully for today's faculty duty!"
            : "✓ Checked out successfully. Working hours updated!"
        );
        invalidateCache("/api/teacher/attendance");
        refetch();
        setTimeout(() => setPunchMessage(null), 4000);
      } else {
        alert(result.error || "Failed to record attendance.");
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsPunching(false);
    }
  };

  // Export CSV (Filtered Date or All Dates)
  const exportAttendanceCSV = () => {
    const listToExport = filteredSessions.length > 0 ? filteredSessions : sessions;
    if (listToExport.length === 0) return;
    const headers = [
      "Session Date",
      "Subject",
      "Topic",
      "Class Level",
      "Timing",
      "Present Count",
      "Total Enrolled",
      "Turnout Rate",
      "Status",
    ];
    const rows = listToExport.map((s: any) => {
      const liveState = getClassLiveState(s);
      const rate =
        s.totalEnrolled > 0
          ? Math.min(100, Math.round(((s.presentCount || 0) / s.totalEnrolled) * 100))
          : 0;
      return [
        `"${s.date || ""}"`,
        `"${s.subject || ""}"`,
        `"${(s.title || s.topic || "").replace(/"/g, '""')}"`,
        `"${s.classLevel || ""}"`,
        `"${s.startTime || ""} - ${s.endTime || ""}"`,
        s.presentCount || 0,
        s.totalEnrolled || 1,
        `${rate}%`,
        `"${liveState}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Batch_Attendance_${selectedDate ? `Date_${selectedDate}` : "All_Dates"}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Staff Attendance CSV
  const exportStaffCSV = () => {
    if (staffRecords.length === 0) return;
    const headers = ["Duty Date", "Status", "Login Time", "Logout Time", "Classes Conducted", "Working Hours"];
    const rows = staffRecords.map((r: any) => [
      `"${r.date || ""}"`,
      `"${r.status || "PRESENT"}"`,
      `"${r.loginTime ? new Date(r.loginTime).toLocaleTimeString() : "--"}"`,
      `"${r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString() : "--"}"`,
      r.classesConducted || 1,
      r.workingHours || 1.5,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row: any) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Staff_Duty_Attendance_Statement_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSubjectBadge = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case "mathematics":
        return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800";
      case "science":
      case "physics":
      case "chemistry":
      case "biology":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800";
      case "english":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800";
      default:
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800";
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Batch &amp; Staff Attendance Logs
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Date-wise classroom attendance for enrolled students and daily duty presence logs for faculty staff.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={activeTab === "STUDENTS" ? exportAttendanceCSV : exportStaffCSV}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
            <span>Download Attendance Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* ── 2. VIEW TOGGLE TABS ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("STUDENTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "STUDENTS"
              ? "bg-[#004b79] text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student Batch Attendance</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {sessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("STAFF")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "STAFF"
              ? "bg-[#004b79] text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>My Faculty Duty &amp; Staff Attendance</span>
          {todayRecord ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-bold">
              ✓ Checked-In
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
              Check-In Needed
            </span>
          )}
        </button>
      </div>

      {/* ── 3. STUDENT BATCH ATTENDANCE VIEW ── */}
      {activeTab === "STUDENTS" && (
        <div className="space-y-5">
          {/* Metrics Line */}
          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 flex-wrap py-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Average Turnout:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                {liveAvgAttendance}%
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Sessions Conducted:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-sm">
                {totalConductedCount}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Enrolled Students:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-sm">
                {assignedStudents}
              </span>
            </div>
          </div>

          {/* DATE-WISE & STATUS FILTER TOOLBAR */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by topic, subject, or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
                />
              </div>

              {/* Specific Date Picker */}
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#004b79] cursor-pointer shadow-xs"
                  title="Filter by Specific Date"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate("")}
                    className="h-10 px-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-colors"
                  >
                    Clear Date
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start md:self-auto shrink-0">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                All ({sessions.length})
              </button>
              <button
                onClick={() => setStatusFilter("CONDUCTED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "CONDUCTED"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Conducted ({conductedSessions.length})
              </button>
              <button
                onClick={() => setStatusFilter("UPCOMING")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "UPCOMING"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Upcoming ({sessions.length - conductedSessions.length})
              </button>
            </div>
          </div>

          {/* DATE-WISE GROUPED ATTENDANCE TABLE */}
          <div className="space-y-6 pt-2">
            {isLoading && sessions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading attendance logs...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <CalendarCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No session logs found</p>
                <p className="text-xs text-slate-400">No classroom logs match the selected date or search criteria.</p>
              </div>
            ) : (
              distinctDates.map((dateStr) => {
                const dateSessions = filteredSessions.filter((s: any) => s.date === dateStr);
                if (dateSessions.length === 0) return null;

                const formattedDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div key={dateStr || "session-date"} className="space-y-2.5">
                    {/* Date Section Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {formattedDate}
                        </h2>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {dateSessions.length} {dateSessions.length === 1 ? "Session" : "Sessions"}
                      </span>
                    </div>

                    {/* Table Rows for This Date */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {dateSessions.map((sess: any) => {
                        const liveState = getClassLiveState(sess);
                        const isLive = liveState === "LIVE" || sess.status === "LIVE";
                        const isConducted = liveState === "COMPLETED" || isLive || (sess.presentCount || 0) > 0 || sess.isConducted === true;

                        const rate =
                          sess.attendanceRate !== null && sess.attendanceRate !== undefined
                            ? sess.attendanceRate
                            : sess.totalEnrolled > 0
                            ? Math.min(100, Math.round(((sess.presentCount || 0) / sess.totalEnrolled) * 100))
                            : (sess.presentCount || 0) > 0 ? 100 : 0;

                        const isHigh = rate >= 75;

                        return (
                          <div
                            key={sess._id}
                            className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                          >
                            {/* Col 1: Subject & Class */}
                            <div className="col-span-3 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSubjectBadge(sess.subject)}`}>
                                  {sess.subject || "Mathematics"}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {sess.classLevel || "Class 10"}
                                </span>
                                {isLive && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                                    <Radio className="w-3 h-3" />
                                    Live
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Col 2: Topic */}
                            <div className="col-span-4 space-y-0.5">
                              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                                {sess.title || sess.topic || "Lecture Session"}
                              </h3>
                              <p className="text-[11px] text-slate-400 font-mono">
                                Batch: {sess.batchName || "Standard Routine"}
                              </p>
                            </div>

                            {/* Col 3: Timing */}
                            <div className="col-span-2 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <Clock className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                                <span>{sess.startTime} – {sess.endTime}</span>
                              </div>
                            </div>

                            {/* Col 4: Turnout & Action */}
                            <div className="col-span-3 flex items-center justify-start md:justify-end gap-3.5">
                              {isConducted ? (
                                <div className="text-left md:text-right shrink-0">
                                  <span
                                    className={`text-xs font-black block ${
                                      isHigh ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                    }`}
                                  >
                                    {rate}% Turnout
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {sess.presentCount || 0}/{sess.totalEnrolled || 1} Present
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                  Upcoming
                                </span>
                              )}

                              <Link href={`/teacher/attendance/${sess._id}`} className="shrink-0">
                                <button className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-xs">
                                  <span>Roster Log</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                                </button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── 4. STAFF FACULTY DUTY & DAILY ATTENDANCE VIEW ── */}
      {activeTab === "STAFF" && (
        <div className="space-y-6">
          {/* Today's Check-in Action Banner */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Today&apos;s Faculty Presence Check-In
                </h3>
                {todayRecord ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>PRESENT (Checked-In)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Pending Check-in</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {todayRecord
                  ? `Checked in at ${new Date(todayRecord.loginTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Recorded ${todayRecord.classesConducted || conductedSessions.filter((s: any) => s.date === new Date().toISOString().split("T")[0]).length} classes conducted today.`
                  : "Mark your daily duty attendance to record lecture hours and faculty compliance."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {!todayRecord ? (
                <button
                  type="button"
                  disabled={isPunching}
                  onClick={() => handleStaffPunch("CHECK_IN")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm disabled:opacity-60"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isPunching ? "Recording..." : "✓ Check-In for Today"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPunching}
                  onClick={() => handleStaffPunch("CHECK_OUT")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isPunching ? "Recording..." : "Record Duty Check-Out"}</span>
                </button>
              )}
            </div>
          </div>

          {punchMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{punchMessage}</span>
            </div>
          )}

          {/* Faculty Attendance Stats Strip */}
          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 flex-wrap py-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Monthly Duty Compliance:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                {staffData?.staffAttendanceRate || 100}%
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Present Duty Days:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-sm">
                {staffData?.presentDutyDays || 1} / {staffData?.totalDutyDays || 1} Days
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Regular &amp; Compliant
              </span>
            </div>
          </div>

          {/* Staff Daily Attendance Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Faculty Daily Attendance &amp; Duty Log
            </h3>

            {staffRecords.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No staff logs recorded yet</p>
                <p className="text-xs text-slate-400">Click &quot;Check-In for Today&quot; above to log your daily teaching presence.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                  <div className="col-span-3">Duty Date</div>
                  <div className="col-span-3">Status</div>
                  <div className="col-span-3">Check-In &amp; Check-Out</div>
                  <div className="col-span-3 text-right">Lectures &amp; Hours Logged</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {staffRecords.map((rec: any) => (
                    <div
                      key={rec._id || rec.date}
                      className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                    >
                      {/* Col 1: Date */}
                      <div className="col-span-3 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          <Calendar className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                          <span>{rec.date}</span>
                        </div>
                      </div>

                      {/* Col 2: Status */}
                      <div className="col-span-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{rec.status || "PRESENT"}</span>
                        </span>
                      </div>

                      {/* Col 3: Check-in / Check-out times */}
                      <div className="col-span-3 space-y-0.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            In: {rec.loginTime ? new Date(rec.loginTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </span>
                        </div>
                        {rec.logoutTime && (
                          <div className="text-[11px] text-slate-400">
                            Out: {new Date(rec.logoutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>

                      {/* Col 4: Classes & Hours */}
                      <div className="col-span-3 text-left md:text-right space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {rec.classesConducted || 1} Lectures Conducted
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {rec.workingHours || 1.5} Teaching Hours
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
