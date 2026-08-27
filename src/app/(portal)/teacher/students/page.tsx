"use client";

import React, { useState } from "react";
import { Users, Search, Mail, Phone, CalendarCheck2 } from "lucide-react";
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
      attendancePercentage: 100,
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
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Enrolled Students Roster
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Directory of students across your assigned Class 8, 9, and 10 live batches with real attendance tracking.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          {filtered.length} of {students.length} Students Enrolled
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search students by name, email, or school..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* ── ROSTER TABLE (CARDLESS) ── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No students found</p>
            <p className="text-xs text-slate-400">No students match your search criteria.</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            {filtered.map((s: any) => (
              <div
                key={s._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {s.userId?.name || "Student"}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {s.currentClass} · {s.board}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {s.schoolName || "DAV Senior Secondary School"}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3" />
                      <span>{s.userId?.email}</span>
                    </span>
                    {s.userId?.phone && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3" />
                          <span>{s.userId?.phone}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                      {s.attendancePercentage}% Attendance
                    </span>
                    <span className="text-[10px] text-slate-400">Compliant</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
