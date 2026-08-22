"use client";

import React, { useState } from "react";
import { Users2, Search, Mail, Phone, CalendarCheck2, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function TeacherStudentsPage() {
  const { data } = useFastFetch("/api/teacher/students");
  const [search, setSearch] = useState("");

  const students = data?.students || [
    {
      _id: "stud-1",
      userId: { name: "Aravind Swaminathan", email: "aravind@example.com", phone: "9876543210" },
      currentClass: "Class 10",
      board: "CBSE",
      schoolName: "DAV Senior Secondary School",
      attendancePercentage: 96,
      attendanceRiskLevel: "LOW",
    },
    {
      _id: "stud-2",
      userId: { name: "Sneha Murugan", email: "sneha@example.com", phone: "9876543212" },
      currentClass: "Class 10",
      board: "State Board",
      schoolName: "St. Joseph's Matriculation Higher Secondary",
      attendancePercentage: 92,
      attendanceRiskLevel: "LOW",
    },
  ];

  const filtered = students.filter(
    (s: any) =>
      s.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.schoolName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Enrolled Students Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Directory of students across your assigned Class 8, 9, and 10 live batches.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search students by name, email, or school..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Student Name</th>
                <th className="p-4 font-bold">Class & Board</th>
                <th className="p-4 font-bold">School</th>
                <th className="p-4 font-bold">Attendance Rate</th>
                <th className="p-4 font-bold">Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s: any) => (
                <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                    {s.userId?.name || "Student"}
                    <span className="block text-[11px] font-normal text-slate-400">
                      {s.userId?.email}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-indigo-600 dark:text-indigo-400">
                    {s.currentClass} ({s.board})
                  </td>
                  <td className="p-4 text-slate-500">{s.schoolName || "State Board School"}</td>
                  <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {s.attendancePercentage || 94}%
                  </td>
                  <td className="p-4">
                    <Badge variant={s.attendanceRiskLevel === "LOW" ? "riskLow" : "riskMedium"}>
                      {s.attendanceRiskLevel || "LOW"} RISK
                    </Badge>
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
