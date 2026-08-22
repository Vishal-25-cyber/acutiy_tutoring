"use client";

import React from "react";
import { Clock, UserCheck, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminStaffAttendancePage() {
  const { data } = useFastFetch("/api/admin/staff-attendance");

  const stats = data?.stats || {
    totalTeachers: 12,
    todayPresent: 11,
    attendancePercentage: 94,
    monthlyAverage: 95,
  };

  const sampleStaff = [
    { name: "Dr. Sarah Jenkins", email: "sarah.maths@acuity.edu", classesConducted: 2, hours: "3.5 hrs", status: "PRESENT", login: "5:45 PM" },
    { name: "Prof. Rajesh Kumar", email: "rajesh.science@acuity.edu", classesConducted: 2, hours: "3.0 hrs", status: "PRESENT", login: "5:50 PM" },
    { name: "Anita Natarajan", email: "anita.english@acuity.edu", classesConducted: 1, hours: "1.5 hrs", status: "PRESENT", login: "6:45 PM" },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Staff Attendance Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track faculty presence, live classes conducted, and working hour logs.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Teacher Attendance Today</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.todayPresent} / {stats.totalTeachers}
          </p>
          <p className="text-xs text-slate-500 mt-1">Faculty logged in for evening batches</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Staff Attendance Rate</span>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.attendancePercentage}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Overall monthly metric</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Class Turnout Ratio</span>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">100%</p>
          <p className="text-xs text-slate-500 mt-1">0 scheduled lectures missed</p>
        </Card>
      </div>

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Faculty Roster & Attendance
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Faculty Name</th>
                <th className="p-4 font-bold">Login Timestamp</th>
                <th className="p-4 font-bold">Lectures Today</th>
                <th className="p-4 font-bold">Teaching Hours</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sampleStaff.map((st, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                    {st.name}
                    <span className="block text-[11px] font-normal text-slate-400">{st.email}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-500">{st.login}</td>
                  <td className="p-4 font-semibold">{st.classesConducted} Classes</td>
                  <td className="p-4 font-medium text-indigo-600 dark:text-indigo-400">{st.hours}</td>
                  <td className="p-4">
                    <Badge variant="success">{st.status}</Badge>
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
