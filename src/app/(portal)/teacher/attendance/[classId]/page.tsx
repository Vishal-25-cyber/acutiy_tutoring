import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
  Save,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { invalidateCache } from "@/lib/api-cache";

export default function TeacherClassAttendanceDetailPage(props?: {
  params?: Promise<{ classId: string }> | { classId: string };
}) {
  const routerParams = useParams<{ classId: string }>();
  const classId = routerParams?.classId || "acuity-live-classroom";

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "duration" | "joinTime">("duration");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Interactive Staff Attendance Marking State
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
          // Initialize student status map
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
        invalidateCache("/api/teacher");
        invalidateCache("/api/classes");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const json = await res.json();
        alert(json.error || "Failed to save attendance");
      }
    } catch (e) {
      console.error("Save attendance error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculated Stats based on current edits
  const totalStudents = roster.length;
  const presentCount = Object.values(studentStatusMap).filter((s) => s === "PRESENT" || s === "LATE").length;
  const absentCount = totalStudents - presentCount;
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Filter & Sort Roster
  const filteredRoster = roster
    .filter((student) => {
      const currentStatus = studentStatusMap[student.studentId] || student.status;
      const matchesSearch =
        !searchQuery.trim() ||
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "PRESENT"
          ? currentStatus === "PRESENT" || currentStatus === "LATE"
          : currentStatus === "ABSENT" || currentStatus === "PARTIAL";

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
      studentStatusMap[s.studentId] || s.status || "ABSENT",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/teacher/attendance">
            <Button variant="ghost" size="sm" className="rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {liveClass?.subject} — {liveClass?.topic}
              </h1>
              <Badge variant="default" className="text-[10px] font-bold">
                {liveClass?.date}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Batch: <strong>{liveClass?.batch?.name || "Assigned Batch"}</strong> ({liveClass?.startTime} – {liveClass?.endTime})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("PRESENT")}
            className="text-xs font-semibold rounded-xl"
          >
            Mark All Present
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="text-xs font-bold gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Attendance Saved!</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Attendance</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs font-semibold gap-1.5 rounded-xl"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase">Enrolled Students</span>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {totalStudents}
            </p>
            <p className="text-[11px] text-slate-400">Total in batch</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Present</span>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {presentCount}
            </p>
            <p className="text-[11px] text-slate-400">Students attending</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Absent</span>
          <div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {absentCount}
            </p>
            <p className="text-[11px] text-slate-400">Students not present</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Turnout Rate</span>
          <div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {attendancePercentage}%
            </p>
            <p className="text-[11px] text-slate-400">Batch average</p>
          </div>
        </Card>
      </div>

      {/* Roster Table Card */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Table Filter / Search Strip */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Staff Attendance Marking Roster ({filteredRoster.length})
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
                <th className="p-4">Student</th>
                <th className="p-4">Join Time</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-right">Staff Attendance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No students match your filter.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((student, idx) => {
                  const currentStatus = studentStatusMap[student.studentId] || student.status || "ABSENT";

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
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {student.durationMinutes} min
                      </td>
                      <td className="p-4 text-right">
                        {/* Interactive Staff Attendance Switcher */}
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              currentStatus === "PRESENT"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-emerald-600"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, "LATE")}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              currentStatus === "LATE"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-amber-600"
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              currentStatus === "ABSENT"
                                ? "bg-rose-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-rose-600"
                            }`}
                          >
                            Absent
                          </button>
                        </div>
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
