"use client";

import React, { useState } from "react";
import { Activity, TrendingUp, Users, BookOpen, Layers } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminAnalyticsPage() {
  const { data } = useFastFetch("/api/admin/analytics");
  const [timeRange, setTimeRange] = useState("This Month");

  const classDistribution = data?.classDistribution || [
    { class: "Class 1", count: 8 },
    { class: "Class 2", count: 9 },
    { class: "Class 3", count: 12 },
    { class: "Class 4", count: 14 },
    { class: "Class 5", count: 16 },
    { class: "Class 6", count: 22 },
    { class: "Class 7", count: 25 },
    { class: "Class 8", count: 32 },
    { class: "Class 9", count: 38 },
    { class: "Class 10", count: 44 },
  ];

  const enrollmentGrowth = data?.enrollmentGrowth || [
    { month: "Aug", students: 110, teachers: 8 },
    { month: "Sep", students: 145, teachers: 10 },
    { month: "Oct", students: 172, teachers: 12 },
    { month: "Nov", students: 195, teachers: 12 },
    { month: "Dec", students: 220, teachers: 14 },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-7xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Platform Growth & Academic Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enrollment distribution from Class 1 to 10, faculty ratios, and retention curves.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Enrollment Distribution */}
        <Card className="p-6">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
            Student Enrollment by Class (Grade 1 to 10)
          </h2>
          <p className="text-xs text-slate-500 mb-6">Distribution across active CBSE & State Board batches</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="class" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Enrolled Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Growth Curve */}
        <Card className="p-6">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
            Monthly Student & Teacher Growth
          </h2>
          <p className="text-xs text-slate-500 mb-6">Platform expansion metrics over the session</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} name="Students" />
                <Line type="monotone" dataKey="teachers" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Faculty" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </main>
  );
}
