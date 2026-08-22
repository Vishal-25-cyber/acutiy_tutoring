"use client";

import React from "react";
import Link from "next/link";
import {
  Video,
  BookOpen,
  CalendarCheck2,
  FileCheck,
  TrendingUp,
  Flame,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Download,
  Bot,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentDashboardPage() {
  const { data } = useFastFetch("/api/student/dashboard");

  const student = data?.student || {
    name: "Aravind Swaminathan",
    classLevel: "Class 10",
    board: "CBSE",
    batch: { name: "7:00 PM – 8:00 PM (Batch 2)", startTime: "19:00", endTime: "20:00" },
    streakCount: 7,
    earnedBadges: ["First Class", "7-Day Streak 🔥", "Assignment Champion"],
    attendanceRiskLevel: "LOW",
    attendancePercentage: 96,
  };

  const todayClasses = data?.todayClasses || [
    {
      _id: "acuity-class10-maths-live",
      title: "Class 10 CBSE — Quadratic Equations Masterclass",
      subject: "Mathematics",
      topic: "Discriminant Formula & Solving Complex Word Problems",
      date: new Date().toISOString().split("T")[0],
      startTime: "19:00",
      endTime: "20:00",
      status: "LIVE",
      teacherId: { name: "Dr. Sarah Jenkins" },
    },
  ];

  const pendingAssignmentsCount = data?.pendingAssignmentsCount ?? 1;
  const recentMaterials = data?.recentMaterials || [];
  const performanceScore = data?.performanceScore ?? 88;

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-6xl animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, {student.name.split(" ")[0]}! 👋
            </h1>
            <Badge variant="default" className="text-xs">
              {student.classLevel} ({student.board})
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Batch: <strong>{student.batch?.name || "7:00 PM – 8:00 PM"}</strong> • Next live session starts shortly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/student/ai-tutor" prefetch={true}>
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold text-xs rounded-xl">
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Study Buddy</span>
            </Button>
          </Link>
          <Link href="/student/parent-view" prefetch={true}>
            <Button variant="secondary" size="sm" className="gap-1.5 font-semibold text-xs rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Parent View</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Live Session Card */}
      {todayClasses.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 border border-indigo-500/30 p-6 sm:p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="live" className="text-xs font-bold px-3 py-0.5 animate-pulse">
                  LIVE RIGHT NOW
                </Badge>
                <span className="text-xs text-indigo-200 font-mono">
                  {todayClasses[0].startTime} – {todayClasses[0].endTime}
                </span>
                <span className="text-xs text-slate-400">• 5-Min Entry Grace Period</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {todayClasses[0].title}
              </h2>

              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                <strong>Topic:</strong> {todayClasses[0].topic}
                <br />
                <span className="text-slate-400">Faculty: {todayClasses[0].teacherId?.name || "Dr. Sarah Jenkins"}</span>
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href={`/student/classroom/${todayClasses[0]._id || "acuity-class10-maths-live"}`}>
                <Button
                  variant="glow"
                  size="lg"
                  className="w-full sm:w-auto font-black text-sm px-8 py-6 rounded-2xl shadow-xl shadow-emerald-500/25 gap-2"
                >
                  <Video className="w-5 h-5" />
                  <span>JOIN LIVE CLASS</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {student.attendancePercentage}%
            </p>
            <div className="mt-1">
              <Badge
                variant={student.attendanceRiskLevel === "LOW" ? "riskLow" : student.attendanceRiskLevel === "MEDIUM" ? "riskMedium" : "riskHigh"}
                className="text-[10px]"
              >
                {student.attendanceRiskLevel} RISK
              </Badge>
            </div>
          </div>
        </Card>

        {/* Learning Streak */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Learning Streak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{student.streakCount}</span>
              <span className="text-base font-semibold text-amber-500">Days 🔥</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Keep joining daily batches</p>
          </div>
        </Card>

        {/* Homework Tasks */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {pendingAssignmentsCount}
            </p>
            <Link href="/student/assignments" prefetch={true} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1 block">
              View assignments →
            </Link>
          </div>
        </Card>

        {/* Performance Index */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performance Index</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {performanceScore}%
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">+14% vs last term</p>
          </div>
        </Card>
      </div>

      {/* Two Column Grid: Today's Schedule & Learning Hub Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schedule */}
        <Card className="lg:col-span-7 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Today's Live Class Timetable
              </h3>
            </div>
            <Link href="/student/classes" prefetch={true} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Weekly Timetable
            </Link>
          </div>

          <div className="space-y-3">
            {todayClasses.map((cls: any) => (
              <div
                key={cls._id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {cls.startTime} – {cls.endTime}
                    </span>
                    <Badge variant={cls.status === "LIVE" ? "live" : "default"} className="text-[10px]">
                      {cls.status}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{cls.title}</h4>
                  <p className="text-xs text-slate-500">Subject: {cls.subject} • Faculty: {cls.teacherId?.name || "Faculty"}</p>
                </div>

                <Link href={`/student/classroom/${cls._id}`}>
                  <Button size="sm" variant={cls.status === "LIVE" ? "glow" : "outline"} className="text-xs font-bold">
                    {cls.status === "LIVE" ? "Join Now" : "Enter Room"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Learning Materials */}
        <Card className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Learning Hub Notes
              </h3>
            </div>
            <Link href="/student/materials" prefetch={true} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              All Materials
            </Link>
          </div>

          <div className="space-y-2.5">
            {[
              { title: "Quadratic Equations — Formulas & Derivations Pack", subject: "Mathematics", size: "2.1 MB", category: "NOTES" },
              { title: "Light Reflection & Refraction — Ray Diagrams Exemplar", subject: "Science", size: "3.4 MB", category: "WORKSHEET" },
              { title: "English Grammar & Formal Letter Writing Templates", subject: "English", size: "1.2 MB", category: "PDF" },
            ].map((mat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{mat.title}</p>
                  <p className="text-[11px] text-slate-400">{mat.subject} • {mat.size}</p>
                </div>
                <Button size="sm" variant="ghost" className="shrink-0 h-8 px-2">
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
