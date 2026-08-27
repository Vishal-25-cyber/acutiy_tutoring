"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  Clock,
  Download,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  ArrowLeft,
  ArrowUpDown,
  Filter,
  FileSpreadsheet,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function TeacherClassAttendanceDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const resolvedParams = use(params);
  const classId = resolvedParams.classId;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "duration" | "joinTime">("duration");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function loadClassAttendance() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/classes/${classId}/attendance`);
        const resData = await res.json();
        if (res.ok) {
          setData(resData);
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
  const stats = data?.stats || {
    totalStudents: 0,
    presentCount: 0,
    absentCount: 0,
    attendancePercentage: 0,
  };
  const roster: any[] = data?.roster || [];

  // Filter & Sort Roster
  const filteredRoster = roster
    .filter((student) => {
      const matchesSearch =
        !searchQuery.trim() ||
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "PRESENT"
          ? student.status === "PRESENT" || student.status === "LATE"
          : student.status === "ABSENT" || student.status === "PARTIAL";

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortBy === "duration") {
        return sortOrder === "asc"
          ? a.durationMinutes - b.durationMinutes
          : b.durationMinutes - a.durationMinutes;
      }
      if (sortBy === "joinTime") {
        const timeA = a.joinTime ? new Date(a.joinTime).getTime() : 0;
        const timeB = b.joinTime ? new Date(b.joinTime).getTime() : 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });

  // Export CSV function
  const handleExportCSV = () => {
    if (!roster.length) return;

    const headers = [
      "Student Name",
      "Email",
      "Phone",
      "Grade",
      "First Join Time",
      "Last Leave Time",
      "Total Attended (Mins)",
      "Sessions Count",
      "Attendance Status",
    ];

    const rows = roster.map((s) => [
      `"${s.name || ""}"`,
      `"${s.email || ""}"`,
      `"${s.phone || ""}"`,
      `"${s.currentClass || ""}"`,
      `"${s.joinTime ? new Date(s.joinTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}"`,
      `"${s.leaveTime ? new Date(s.leaveTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}"`,
      s.durationMinutes || 0,
      s.sessionsCount || 0,
      s.status || "ABSENT",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${liveClass?.subject || "class"}_${liveClass?.topic || "lecture"}_${liveClass?.date || "today"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = [
    { name: "Present", value: stats.presentCount, color: "#10b981" },
    { name: "Absent", value: stats.absentCount, color: "#f43f5e" },
  ];

  if (isLoading) {
    return (
      <main className="p-8 max-w-6xl text-center text-xs text-slate-400">
        Loading class attendance logs...
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/teacher/attendance">
            <Button variant="ghost" size="sm" className="rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {liveClass?.subject} — {liveClass?.topic}
              </h1>
              <Badge variant="default" className="text-[10px] font-bold">
                {liveClass?.date}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Time: <strong>{liveClass?.startTime} – {liveClass?.endTime}</strong> • Batch: <strong>{liveClass?.batch?.name || "Assigned Batch"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/classroom/${classId}`}>
            <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5 rounded-xl">
              <Video className="w-3.5 h-3.5 text-indigo-600" />
              <span>Enter Classroom</span>
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            className="font-bold text-xs gap-1.5 rounded-xl shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards & Chart */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Students</span>
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {stats.totalStudents}
            </p>
            <p className="text-xs text-slate-500 mt-1">Enrolled in Batch</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Present</span>
          <div>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.presentCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">≥ {liveClass?.attendanceThresholdPercent || 75}% duration</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Absent</span>
          <div>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {stats.absentCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">&lt; {liveClass?.attendanceThresholdPercent || 75}% duration</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Attendance Rate</span>
          <div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.attendancePercentage}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Batch turnout</p>
          </div>
        </Card>
      </div>

      {/* Roster Table Card */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Table Filter / Search Strip */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Student Attendance Roster ({filteredRoster.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              {(["ALL", "PRESENT", "ABSENT"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    statusFilter === s
                      ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                      : "text-slate-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th
                  className="p-4 cursor-pointer hover:text-indigo-600"
                  onClick={() => {
                    setSortBy("name");
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-4 cursor-pointer hover:text-indigo-600"
                  onClick={() => {
                    setSortBy("joinTime");
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Join Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4">Leave Time</th>
                <th
                  className="p-4 cursor-pointer hover:text-indigo-600"
                  onClick={() => {
                    setSortBy("duration");
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Duration</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4">Sessions</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No students match your filter.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((student, idx) => {
                  const isPresent = student.status === "PRESENT" || student.status === "LATE";
                  return (
                    <tr
                      key={student.studentId || idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                            {student.name?.slice(0, 2).toUpperCase() || "ST"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{student.name}</p>
                            <p className="text-[10px] text-slate-400">{student.email || student.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                        {student.joinTime
                          ? new Date(student.joinTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "--"}
                      </td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                        {student.leaveTime
                          ? new Date(student.leaveTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "--"}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {student.durationMinutes} min
                      </td>
                      <td className="p-4 text-slate-500">
                        {student.sessionsCount > 1 ? (
                          <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded text-[10px]">
                            {student.sessionsCount} sessions (Rejoined)
                          </span>
                        ) : (
                          <span>{student.sessionsCount || 0}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Badge
                          variant={isPresent ? "success" : "destructive"}
                          className="text-[11px] font-bold px-2.5 py-0.5"
                        >
                          {isPresent ? "Present" : "Absent"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
