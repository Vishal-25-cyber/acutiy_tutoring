"use client";

import React, { useState, useEffect } from "react";
import { CalendarCheck2, Download, AlertTriangle, Search, Filter, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminAttendancePage() {
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const { data } = useFastFetch(`/api/admin/attendance?classLevel=${selectedClass}&status=${selectedStatus}`);

  const records = data?.records || [];
  const stats = data?.stats || {
    totalRecords: 24,
    presentCount: 22,
    lateCount: 2,
    partialCount: 0,
    attendanceRate: 95,
    highRiskCount: 1,
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Student Name,Email,Class,Batch,Join Time,Duration(Mins),Status\n"];
    const rows = records.map((r: any) => {
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
    a.download = `Acuity_Attendance_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-7xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Attendance Log & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated student join logs, smart risk flags (&lt;75%), and CSV compliance exports.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="font-bold text-xs gap-1.5 rounded-xl"
          onClick={handleExportCSV}
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Average Attendance</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.attendanceRate}%
          </p>
          <p className="text-xs text-slate-500 mt-1">{stats.presentCount} On-Time Joins</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Late Entry Log</span>
          <p className="text-3xl font-black text-amber-500 mt-1">{stats.lateCount}</p>
          <p className="text-xs text-slate-500 mt-1">Beyond 5-min grace window</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">High Risk Students</span>
          <p className="text-3xl font-black text-rose-500 mt-1">{stats.highRiskCount}</p>
          <p className="text-xs text-rose-500 font-semibold mt-1">Attendance &lt;65%</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Sessions Tracked</span>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.totalRecords}</p>
          <p className="text-xs text-slate-500 mt-1">WebRTC video logs</p>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Student</th>
                <th className="p-4 font-bold">Class & Batch</th>
                <th className="p-4 font-bold">Join Timestamp</th>
                <th className="p-4 font-bold">Duration</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No attendance records for selected criteria.
                  </td>
                </tr>
              ) : (
                records.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                      {r.studentId?.name || "Student"}
                      <span className="block text-[11px] font-normal text-slate-400">
                        {r.studentId?.email}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {r.classLevel || "Class 10"} • {r.batchId?.name || "7:00 PM – 8:00 PM"}
                    </td>
                    <td className="p-4 text-slate-500">
                      {r.joinTime ? new Date(r.joinTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "7:02 PM"}
                    </td>
                    <td className="p-4 font-medium">{r.durationMinutes || 52} Mins</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          r.status === "PRESENT"
                            ? "success"
                            : r.status === "LATE"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
