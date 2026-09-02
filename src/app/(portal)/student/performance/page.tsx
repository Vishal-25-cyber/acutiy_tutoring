"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Download,
  CalendarCheck2,
  Video,
  FileCheck,
  Sparkles,
  Loader2,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
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
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFastFetch } from "@/lib/api-cache";
import { generateStudentPerformanceReportPdf } from "@/lib/download";

export default function StudentPerformancePage() {
  const { data, isLoading } = useFastFetch("/api/student/performance");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const report = data?.report;

  const subjectData = report?.subjectBreakdown || data?.subjectBreakdown || [
    { subject: "Mathematics", averageScore: 88, fullMark: 100 },
    { subject: "Science", averageScore: 84, fullMark: 100 },
    { subject: "English", averageScore: 92, fullMark: 100 },
    { subject: "Social Science", averageScore: 79, fullMark: 100 },
  ];

  const monthlyTrend = report?.testPerformance?.monthlyProgress || data?.monthlyProgress || [
    { month: "Sep", score: 72, attendance: 88 },
    { month: "Oct", score: 78, attendance: 92 },
    { month: "Nov", score: 82, attendance: 94 },
    { month: "Dec", score: 85, attendance: 90 },
    { month: "Jan", score: 89, attendance: 96 },
  ];

  const handleDownloadPdf = async () => {
    if (!report) return;
    setIsExportingPdf(true);
    try {
      await generateStudentPerformanceReportPdf(report);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150 select-none pb-20">
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Academic Performance &amp; Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-dimensional tracking across daily attendance, weekly worksheets, and chapter test scores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success" className="text-xs font-bold px-3 py-1">
            {report?.performanceSummary?.performanceTrend || "+14%"} Growth This Term
          </Badge>

          {report && (
            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. EXECUTIVE SCORECARD CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500">Overall Score</span>
          <div className="text-2xl font-black text-[#004b79] dark:text-[#dfb74a]">
            {report?.performanceSummary?.overallPerformanceScore || data?.overallScore || 85}%
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> Top Tier Mastery
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500">Attendance Rate</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {report?.performanceSummary?.attendancePercentage || 92}%
          </div>
          <span className="text-[10px] text-slate-400">Regular live attendance</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500">Test Average</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {report?.performanceSummary?.testAverage || 84}%
          </div>
          <span className="text-[10px] text-slate-400">Chapter assessments</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500">Class Rank</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            #{report?.performanceSummary?.currentRank || 3}
          </div>
          <span className="text-[10px] text-slate-400">of {report?.performanceSummary?.totalClassStudents || 28} students</span>
        </div>
      </div>

      {/* ── 3. CHARTS GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Breakdown Chart */}
        <Card className="p-6">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
            Subject-Wise Score Breakdown
          </h2>
          <p className="text-xs text-slate-500 mb-6">Aggregate score across homework &amp; tests</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="averageScore" radius={[6, 6, 0, 0]}>
                  {subjectData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.averageScore >= 85 ? "#10b981" : entry.averageScore >= 75 ? "#004b79" : "#f59e0b"}
                    />
                  ))}
                </Bar>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" name="Test Score %" stroke="#004b79" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── 4. CHAPTER & TOPIC MASTERY PROGRESS ── */}
      {report?.topicProgress && (
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-0.5">
              Chapter &amp; Topic Learning Mastery
            </h2>
            <p className="text-xs text-slate-500">Fine-grained syllabus breakdown across core subject units</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.topicProgress.map((tp: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#004b79] dark:text-[#dfb74a]">{tp.subject}</span>
                  <span className="text-[11px] font-bold text-slate-500">Key Chapters</span>
                </div>

                <div className="space-y-2">
                  {tp.topics.map((t: any, tIdx: number) => (
                    <div key={tIdx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-700 dark:text-slate-300 truncate">{t.name}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                          {t.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            t.status === "GREEN"
                              ? "bg-emerald-500"
                              : t.status === "YELLOW"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── 5. STRENGTHS & RECOMMENDED ACTION PLAN ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
              Key Academic Strengths
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-emerald-800 dark:text-emerald-300">
            {(report?.strengths || data?.strengths || [
              "Strong conceptual understanding in Mathematics formulas and theories.",
              "Accurate problem-solving in Physics & Chemistry chapter assessments.",
              "Consistent and punctual daily evening batch attendance.",
            ]).map((s: string, idx: number) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span>•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#004b79] dark:text-[#dfb74a]" />
            <h3 className="font-bold text-sm text-[#004b79] dark:text-[#dfb74a]">
              Recommended Action Plan
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {(report?.recommendedActionPlan || data?.areasForImprovement || [
              "Practice 30 minutes daily on Mathematics NCERT exemplar problems.",
              "Submit pending worksheets to receive personalized teacher feedback.",
              "Attend Saturday live doubt-clearing sessions before monthly tests.",
            ]).map((a: string, idx: number) => (
              <li key={idx} className="flex items-start gap-1.5 font-medium">
                <span className="w-4 h-4 rounded-full bg-[#004b79] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
