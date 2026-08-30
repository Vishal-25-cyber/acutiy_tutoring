"use client";

import React from "react";
import { Activity, TrendingUp, Users, BookOpen, Layers, UserCheck } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

const EMPTY_DISTRIBUTION = [
  { class: "Class 1", count: 0 },
  { class: "Class 2", count: 0 },
  { class: "Class 3", count: 0 },
  { class: "Class 4", count: 0 },
  { class: "Class 5", count: 0 },
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
    <main className="p-6 sm:p-8 space-y-6 max-w-7xl animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Platform Growth & Academic Analytics
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              ● LIVE DB SYNC
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time enrollment distribution across Class 1 to 10, faculty staff, and live batch occupancy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Enrolled Students: <strong className="text-slate-900 dark:text-slate-100">{totalStudents}</strong></span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Faculty Staff: <strong className="text-slate-900 dark:text-slate-100">{totalTeachers}</strong></span>
          </div>
        </div>
      </div>

      {/* ── CHARTS GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Enrollment Distribution */}
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-0.5">
            Student Enrollment by Class (Grade 1 to 10)
          </h2>
          <p className="text-xs text-slate-500 mb-6">Real-time distribution across active CBSE & State Board classes</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="class" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} Enrolled`, "Students"]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Enrolled Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Growth Curve */}
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-0.5">
            Monthly Student & Teacher Growth
          </h2>
          <p className="text-xs text-slate-500 mb-6">Live cumulative expansion metrics over the session</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Registered`, name]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#6366f1"
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
        </Card>
      </div>

      {/* ── BATCH OCCUPANCY BREAKDOWN ── */}
      {batchOccupancy.length > 0 && (
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Live Classroom Slot Occupancy
            </h2>
            <p className="text-xs text-slate-500">Real-time student batch capacity utilization</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {batchOccupancy.map((b: any, idx: number) => {
              const pct = b.capacity > 0 ? Math.round((b.enrolled / b.capacity) * 100) : 0;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{b.name}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {b.enrolled} / {b.capacity} Students Enrolled
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </main>
  );
}
