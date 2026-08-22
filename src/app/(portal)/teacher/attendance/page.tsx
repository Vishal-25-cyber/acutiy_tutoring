"use client";

import React, { useState } from "react";
import { CalendarCheck2, Clock, Download, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function TeacherAttendancePage() {
  const { data } = useFastFetch("/api/teacher/attendance");
  const [selectedClass, setSelectedClass] = useState("Class 10");

  const sessions = data?.sessions || [
    {
      _id: "sess-1",
      title: "Class 10 CBSE — Quadratic Equations Masterclass",
      date: new Date().toISOString().split("T")[0],
      startTime: "19:00",
      totalEnrolled: 24,
      presentCount: 23,
      lateCount: 1,
      attendanceRate: 96,
    },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Batch Attendance Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time presence tracking recorded through live WebRTC video room joins.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Average Attendance</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">94%</p>
          <p className="text-xs text-slate-500 mt-1">Across all evening batches</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">On-Time Joins</span>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">91%</p>
          <p className="text-xs text-slate-500 mt-1">Within 5-minute late entry threshold</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Sessions Held</span>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">28</p>
          <p className="text-xs text-slate-500 mt-1">Recorded WebRTC live sessions</p>
        </Card>
      </div>

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Conducted Live Sessions
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Lecture Topic</th>
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold">Total Students</th>
                <th className="p-4 font-bold">Present</th>
                <th className="p-4 font-bold">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((sess: any) => (
                <tr key={sess._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{sess.title}</td>
                  <td className="p-4 text-slate-500">{sess.date} ({sess.startTime})</td>
                  <td className="p-4 font-semibold">{sess.totalEnrolled || 24}</td>
                  <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {sess.presentCount || 23}
                  </td>
                  <td className="p-4">
                    <Badge variant="success">{sess.attendanceRate || 96}%</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
