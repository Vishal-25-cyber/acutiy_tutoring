"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Clock,
  Download,
  Search,
  ArrowLeft,
  Save,
  Check,
  Users,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { invalidateCache } from "@/lib/api-cache";

export default function TeacherClassAttendanceDetailPage({
  params,
}: {
  params?: Promise<{ classId: string }> | { classId: string };
} = {}) {
  const nextParams = useParams();
  const classId = (nextParams?.classId as string) || "acuity-live-classroom";

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");

  // Interactive Attendance Marking State
  const [studentStatusMap, setStudentStatusMap] = useState<{ [studentId: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadClassAttendance() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/classes/${classId}/attendance`);
        const resData = await res.json();
        if (res.ok) {
          setData(resData);
          const initialMap: { [id: string]: string } = {};
          if (Array.isArray(resData.roster)) {
            resData.roster.forEach((st: any) => {
              initialMap[st.studentId] = st.status || "ABSENT";
            });
          }
          setStudentStatusMap(initialMap);
        }
      } catch (err) {
        console.error("Failed to load attendance details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadClassAttendance();
  }, [classId]);

  const liveClass = data?.class;
  const roster: any[] = data?.roster || [];

  const handleStatusChange = (studentId: string, status: string) => {
    setStudentStatusMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: "PRESENT" | "ABSENT") => {
    const updatedMap: { [id: string]: string } = {};
    roster.forEach((st) => {
      updatedMap[st.studentId] = status;
    });
    setStudentStatusMap(updatedMap);
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const updates = Object.keys(studentStatusMap).map((studentId) => ({
        studentId,
        status: studentStatusMap[studentId],
      }));

      const res = await fetch(`/api/classes/${classId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        invalidateCache("/api/teacher/attendance");
        invalidateCache("/api/teacher/dashboard");
        invalidateCache("/api/student/dashboard");
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalStudents = roster.length;
  const presentCount = Object.values(studentStatusMap).filter((st) => st === "PRESENT").length;
  const absentCount = totalStudents - presentCount;
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const filteredRoster = roster.filter((student) => {
    const currentStatus = studentStatusMap[student.studentId] || student.status || "ABSENT";
    if (statusFilter === "PRESENT" && currentStatus !== "PRESENT") return false;
    if (statusFilter === "ABSENT" && currentStatus !== "ABSENT") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        student.name?.toLowerCase().includes(q) ||
        student.email?.toLowerCase().includes(q) ||
        student.phone?.includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (!roster.length) return;

    const headers = [
      "Student Name",
      "Email",
      "Grade",
      "First Join Time",
      "Last Leave Time",
      "Total Attended (Mins)",
      "Attendance Status",
    ];

    const rows = roster.map((s) => [
      `"${s.name || ""}"`,
      `"${s.email || ""}"`,
      `"${s.currentClass || ""}"`,
      `"${s.joinTime ? new Date(s.joinTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}"`,
      `"${s.leaveTime ? new Date(s.leaveTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}"`,
      s.durationMinutes || 0,
      studentStatusMap[s.studentId] || s.status || "ABSENT",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `attendance_${liveClass?.subject || "class"}_${liveClass?.date || "today"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 text-center text-xs text-slate-400 animate-pulse">
        Loading class attendance session roster...
      </main>
    );
  }

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 animate-in fade-in duration-150 select-none">
      {/* ── 1. TOP BREADCRUMB & CONTEXT BAR ── */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <Link
          href="/teacher/attendance"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#004b79] dark:text-[#dfb74a] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Attendance Logs</span>
        </Link>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* ── 2. HERO SESSION TITLE & METADATA BAR ── */}
      <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
            {liveClass?.subject || "Mathematics"}
          </span>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {liveClass?.classLevel || "Class 10"}
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
            {liveClass?.date}
          </span>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
            Batch: {liveClass?.batch?.name || "Target Batch"} ({liveClass?.startTime} – {liveClass?.endTime})
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {liveClass?.topic || liveClass?.title || "Classroom Lecture"}
        </h1>
      </div>

      {/* ── 3. CARDLESS LIVE ATTENDANCE STATUS & ACTION TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800">
        {/* Left: Summary Metrics */}
        <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Total Enrolled:</span>
            <span className="text-slate-900 dark:text-slate-100 font-mono">{totalStudents}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Present Turnout:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">
              {presentCount} ({attendancePercentage}%)
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Absent:</span>
            <span className="text-rose-600 dark:text-rose-400 font-mono">{absentCount}</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => handleMarkAll("PRESENT")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Mark All Present
          </button>

          <button
            type="button"
            onClick={() => handleMarkAll("ABSENT")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Mark All Absent
          </button>

          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 4. SEARCH & STATUS FILTER (UNIFIED SINGLE ROW) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search student by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            All ({roster.length})
          </button>
          <button
            onClick={() => setStatusFilter("PRESENT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "PRESENT"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Present ({presentCount})
          </button>
          <button
            onClick={() => setStatusFilter("ABSENT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "ABSENT"
                ? "bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Absent ({absentCount})
          </button>
        </div>
      </div>

      {/* ── 5. STUDENT ROSTER HAIRLINE TABLE (CARDLESS) ── */}
      <div className="space-y-2 pt-2">
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-4">Enrolled Student</div>
          <div className="col-span-3">Join / Leave Timings</div>
          <div className="col-span-2">Active Duration</div>
          <div className="col-span-3 text-right">Attendance Status &amp; Action</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredRoster.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No students match your filter</p>
              <p className="text-xs text-slate-400">Try changing your search query or status filter.</p>
            </div>
          ) : (
            filteredRoster.map((student) => {
              const currentStatus = studentStatusMap[student.studentId] || student.status || "ABSENT";
              const isPresent = currentStatus === "PRESENT";

              return (
                <div
                  key={student.studentId}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                >
                  {/* Col 1: Student Name & Email */}
                  <div className="col-span-4 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {student.name || "Student"}
                      </p>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {student.currentClass || "Class 10"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {student.email || student.phone || "Enrolled in Batch"}
                    </p>
                  </div>

                  {/* Col 2: Join / Leave Timings */}
                  <div className="col-span-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {student.joinTime ? (
                      <div className="space-y-0.5">
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">
                          {new Date(student.joinTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {student.leaveTime && (
                          <span className="text-slate-400">
                            {" "}– {new Date(student.leaveTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Did not join live video</span>
                    )}
                  </div>

                  {/* Col 3: Duration */}
                  <div className="col-span-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {student.durationMinutes ? `${student.durationMinutes} mins` : "0 mins"}
                  </div>

                  {/* Col 4: Segmented Toggle Buttons (Present vs Absent) */}
                  <div className="col-span-3 flex items-center justify-start md:justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isPresent
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      ✓ Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !isPresent
                          ? "bg-rose-600 text-white shadow-xs"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      ✕ Absent
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
