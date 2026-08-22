"use client";

import React from "react";
import { TrendingUp, Award, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentPerformancePage() {
  const { data } = useFastFetch("/api/student/performance");

  const subjectData = data?.subjectBreakdown || [
    { subject: "Mathematics", score: 88, fullMark: 100 },
    { subject: "Science", score: 84, fullMark: 100 },
    { subject: "English", score: 92, fullMark: 100 },
    { subject: "Social Science", score: 79, fullMark: 100 },
  ];

  const monthlyTrend = data?.monthlyProgress || [
    { month: "Sep", score: 72 },
    { month: "Oct", score: 78 },
    { month: "Nov", score: 82 },
    { month: "Dec", score: 85 },
    { month: "Jan", score: 89 },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Performance & Progress
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Continuous performance analytics across live quizzes and assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-xs font-bold px-3 py-1">
            +14% Growth This Term
          </Badge>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Breakdown Chart */}
        <Card className="p-6">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
            Subject-Wise Score Breakdown
          </h2>
          <p className="text-xs text-slate-500 mb-6">Aggregate score across homework & tests</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Trend Chart */}
        <Card className="p-6">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
            Monthly Progress Curve
          </h2>
          <p className="text-xs text-slate-500 mb-6">Learning trajectory over the academic session</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Strengths & Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
              Key Academic Strengths
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-emerald-800 dark:text-emerald-300">
            <li>• Strong algebraic foundation in Mathematics (Quadratic Equations & AP).</li>
            <li>• Accurate ray diagrams and conceptual clarity in Physics.</li>
            <li>• 96% on-time attendance in evening batch live classes.</li>
          </ul>
        </Card>

        <Card className="p-6 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
              Recommended Areas to Practice
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-amber-800 dark:text-amber-300">
            <li>• Practice additional speed-distance word problems in Mathematics.</li>
            <li>• Review historical timeline map markers in Social Science.</li>
            <li>• Revise NCERT exemplar questions in the Learning Hub before unit tests.</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
