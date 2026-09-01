"use client";

import React from "react";
import { Activity, TrendingUp, Users, BookOpen, Layers, UserCheck, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useFastFetch } from "@/lib/api-cache";

const EMPTY_DISTRIBUTION = [
  { class: "Class 6", count: 0 },
  { class: "Class 7", count: 0 },
  { class: "Class 8", count: 0 },
  { class: "Class 9", count: 0 },
  { class: "Class 10", count: 0 },
];

export default function AdminAnalyticsPage() {
  const { data } = useFastFetch("/api/admin/analytics");

  const classDistribution = Array.isArray(data?.classDistribution) && data.classDistribution.length > 0
    ? data.classDistribution
    : EMPTY_DISTRIBUTION;

  const enrollmentGrowth = Array.isArray(data?.enrollmentGrowth) ? data.enrollmentGrowth : [];
  const batchOccupancy = Array.isArray(data?.batchOccupancy) ? data.batchOccupancy : [];

  const totalStudents = data?.totalStudents ?? 0;
  const totalTeachers = data?.totalTeachers ?? 0;

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Platform Growth &amp; Academic Analytics
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live DB Analytics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time enrollment distribution across Class 6 to 10, faculty staff, and live batch occupancy.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Enrolled Students:</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono text-sm">{totalStudents}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Faculty Staff:</span>
            <span className="font-extrabold text-[#004b79] dark:text-[#dfb74a] font-mono text-sm">{totalTeachers}</span>
          </div>
        </div>
      </div>

      {/* ── 2. CHARTS GRID (CARDLESS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Class Enrollment Distribution */}
        <div className="space-y-3">
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Student Enrollment by Class (Grade 6 to 10)
            </h2>
            <p className="text-xs text-slate-500">Distribution across active CBSE &amp; State Board classes</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="class" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} Enrolled`, "Students"]}
                  contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                />
                <Bar dataKey="count" fill="#004b79" radius={[4, 4, 0, 0]} name="Enrolled Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Curve */}
        <div className="space-y-3">
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Monthly Student &amp; Teacher Growth
            </h2>
            <p className="text-xs text-slate-500">Cumulative platform expansion metrics</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Registered`, name]}
                  contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#004b79"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Students"
                />
                <Line
                  type="monotone"
                  dataKey="teachers"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Faculty"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── 3. BATCH OCCUPANCY BREAKDOWN (CARDLESS) ── */}
      {batchOccupancy.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Classroom Slot Occupancy Utilization
            </h2>
            <p className="text-xs text-slate-500">Real-time student batch capacity utilization</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            {batchOccupancy.map((b: any, idx: number) => {
              const pct = b.capacity > 0 ? Math.round((b.enrolled / b.capacity) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5 py-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{b.name}</span>
                    <span className="font-mono font-bold text-[#004b79] dark:text-[#dfb74a]">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#004b79] dark:bg-[#dfb74a] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(pct, 4))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {b.enrolled} / {b.capacity} Students Enrolled
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
