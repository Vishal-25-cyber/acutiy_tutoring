"use client";

import React from "react";
import Link from "next/link";
import {
  Video,
  Users2,
  FileCheck,
  BookOpen,
  CalendarCheck2,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function TeacherDashboardPage() {
  const { data } = useFastFetch("/api/teacher/dashboard");

  const teacher = data?.teacher || {
    name: "Dr. Sarah Jenkins",
    qualification: "M.Sc. Mathematics, Ph.D",
    specialization: "Class 8-10 Mathematics",
    subjects: ["Mathematics"],
    classesTaught: ["Class 8", "Class 9", "Class 10"],
  };

  const stats = data?.stats || {
    totalStudents: 45,
    todayClassesCount: 1,
    pendingEvaluations: 2,
    totalMaterials: 6,
    averageAttendance: 94,
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
      batchId: { name: "7:00 PM – 8:00 PM (Batch 2)" },
    },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-8 max-w-7xl animate-in fade-in duration-150">
      {/* Teacher Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome, {teacher.name}! 🎓
            </h1>
            <Badge variant="default" className="text-xs">
              Verified Faculty
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Subjects: <strong>{teacher.subjects.join(", ")}</strong> • Grades: <strong>{teacher.classesTaught.join(", ")}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/teacher/live-class/create" prefetch={true}>
            <Button variant="primary" size="sm" className="gap-1.5 font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20">
              <Plus className="w-4 h-4" />
              <span>Schedule Live Class</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Live Session Card */}
      {todayClasses.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 border border-indigo-500/30 p-6 sm:p-8 text-white shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <Badge variant="live" className="text-xs font-bold px-3 py-0.5 animate-pulse">
                  HOST CLASSROOM
                </Badge>
                <span className="text-xs text-indigo-200 font-mono">
                  {todayClasses[0].startTime} – {todayClasses[0].endTime}
                </span>
                <span className="text-xs text-slate-400">• {todayClasses[0].batchId?.name || "Evening Batch"}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {todayClasses[0].title}
              </h2>

              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                <strong>Topic:</strong> {todayClasses[0].topic}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Link href={`/teacher/classroom/${todayClasses[0]._id || "acuity-class10-maths-live"}`}>
                <Button
                  variant="glow"
                  size="lg"
                  className="font-black text-sm px-8 py-6 rounded-2xl shadow-xl shadow-emerald-500/25 gap-2"
                >
                  <Video className="w-5 h-5" />
                  <span>START TEACHER CLASSROOM</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Assigned Students</span>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{stats.totalStudents}</p>
          <p className="text-xs text-slate-500 mt-1">Across Class 8, 9, 10</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Today's Sessions</span>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stats.todayClassesCount}</p>
          <p className="text-xs text-slate-500 mt-1">Live WebRTC batches</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Pending Grading</span>
          <p className="text-3xl font-black text-amber-500 mt-1">{stats.pendingEvaluations}</p>
          <Link href="/teacher/assignments" prefetch={true} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1 block">
            Grade homework →
          </Link>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Class Attendance</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.averageAttendance}%</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Excellent student turnout</p>
        </Card>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/teacher/materials" prefetch={true} className="group">
          <Card className="p-5 group-hover:border-indigo-500/50 transition-all">
            <BookOpen className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Upload Learning Notes</h3>
            <p className="text-xs text-slate-500 mt-1">Share PDFs, formula sheets, and Ray Diagram workbooks.</p>
          </Card>
        </Link>

        <Link href="/teacher/assignments" prefetch={true} className="group">
          <Card className="p-5 group-hover:border-purple-500/50 transition-all">
            <FileCheck className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Create & Grade Worksheets</h3>
            <p className="text-xs text-slate-500 mt-1">Post homework problems and provide scored feedback.</p>
          </Card>
        </Link>

        <Link href="/teacher/students" prefetch={true} className="group">
          <Card className="p-5 group-hover:border-emerald-500/50 transition-all">
            <Users2 className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Student Directory & Attendance</h3>
            <p className="text-xs text-slate-500 mt-1">Inspect student profiles and export attendance records.</p>
          </Card>
        </Link>
      </div>
    </main>
  );
}
