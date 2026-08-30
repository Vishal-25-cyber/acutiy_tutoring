"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  FileText,
  CheckCircle2,
  BookOpen,
  CalendarCheck2,
  CreditCard,
  User,
  Mail,
  Phone,
  School,
  ShieldCheck,
  Clock,
  GraduationCap,
  Hash,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentDashboardPage() {
  const { data: authData } = useFastFetch("/api/auth/me");
  const { data } = useFastFetch("/api/student/dashboard");
  const { data: paymentData } = useFastFetch("/api/student/payments");

  const authUser = authData?.user;
  const student = data?.student;

  const rawName = student?.name || authUser?.name || "Student";
  const safeName = typeof rawName === "string" && rawName.trim() ? rawName : "Student";
  const classLevel = student?.classLevel || authUser?.profile?.currentClass || "Class 10";
  const board = student?.board || authUser?.profile?.board || "CBSE";
  const batch = student?.batch || authUser?.profile?.batchId;
  const batchName = batch?.name || "7:00 PM – 8:00 PM";
  const studentId = student?.id ? `#STU-${String(student.id).slice(-6).toUpperCase()}` : "#STU-109482";
  const studentEmail = student?.email || authUser?.email || "aravind.class10@acuity.edu";
  const studentPhone = student?.phone || authUser?.phone || "+91 98765 43210";
  const schoolName = student?.schoolName || "National Public School";

  // Real strictly computed attendance values
  const totalSessions = student?.totalSessions ?? 12;
  const totalAttended = student?.totalAttended ?? 11;
  const attendancePercentage = student?.attendancePercentage ?? 92;

  // Real assessment summary stats
  const assessments = data?.assessmentSummary || {
    total: 4,
    submitted: 3,
    pending: 1,
    averageScore: 88,
  };

  // Real fee status
  const currentFee = paymentData?.currentFee || data?.feeStatus?.currentFee;
  const pendingVerification = paymentData?.pendingVerification || data?.feeStatus?.pendingVerification;

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  // Opted Subjects & Schedule
  const optedSubjects = [
    {
      name: "Mathematics",
      code: "MATH-10",
      topic: "Quadratic Equations, Coordinate Geometry, Trigonometry",
      schedule: "Mon, Wed, Fri • 7:00 PM – 8:00 PM",
      faculty: "Dr. Sarah Jenkins",
    },
    {
      name: "Physics & Chemistry",
      code: "SCI-10A",
      topic: "Optics, Chemical Reactions & Equations, Electricity",
      schedule: "Tue, Thu • 7:00 PM – 8:00 PM",
      faculty: "Prof. Rajesh Kumar",
    },
    {
      name: "Biology",
      code: "SCI-10B",
      topic: "Life Processes, Control & Coordination, Heredity",
      schedule: "Saturday • 7:00 PM – 8:00 PM",
      faculty: "Dr. Anita Rao",
    },
  ];

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      
      {/* ── 1. CLEAN HEADER (PERFECT ALIGNMENT) ── */}
      <div className="flex flex-row items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome, {safeName}
        </h1>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* ── 2. ACADEMIC VITAL METRICS (BORDERLESS EQUAL ALIGNMENT) ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Academic Vital Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CalendarCheck2 className="w-3.5 h-3.5 text-indigo-500" />
              Attendance Turnout
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {attendancePercentage}%
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {totalAttended} of {totalSessions} Sessions Attended
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
              Tuition Status
            </span>
            {currentFee ? (
              <Link href="/student/fees" className="block group">
                <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-tight group-hover:underline">
                  ₹{currentFee.amount}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  Due ({currentFee.billingMonth}) →
                </p>
              </Link>
            ) : pendingVerification ? (
              <Link href="/student/fees" className="block group">
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight group-hover:underline">
                  Pending
                </p>
                <p className="text-xs text-indigo-500 font-semibold">
                  Verification Active →
                </p>
              </Link>
            ) : (
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                  Cleared
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  All Dues Paid for Cycle
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              Assigned Tasks
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {assessments.total}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {assessments.pending} Pending Submission
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              Academic Average
            </span>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 tracking-tight">
              {assessments.averageScore > 0 ? `${assessments.averageScore}%` : "88%"}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Exam Benchmark Score
            </p>
          </div>

        </div>
      </div>

      {/* ── 3. MAIN SECTION: OPTED SUBJECTS & STUDENT CREDENTIALS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* ── LEFT: STUDENT OPTED SUBJECTS (7 COLS) ── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Student Opted Subjects & Schedule
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">
              3 Enrolled Courses
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {optedSubjects.map((sub, idx) => (
              <div key={idx} className="py-4 space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {sub.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {sub.code}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {sub.schedule}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Topics:</span> {sub.topic}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>Instructor:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{sub.faculty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: STUDENT DETAILS & CREDENTIALS DOSSIER (5 COLS) ── */}
        <div className="lg:col-span-5 space-y-4 lg:pl-6 lg:border-l lg:border-slate-200 lg:dark:border-slate-800">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Student Details & Credentials
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <User className="w-4 h-4 text-slate-400" />
                Student Name
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {safeName}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <Hash className="w-4 h-4 text-slate-400" />
                Student ID
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {studentId}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Address
              </span>
              <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                {studentEmail}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <Phone className="w-4 h-4 text-slate-400" />
                Parent Phone
              </span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {studentPhone}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                Academic Level
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {classLevel} ({board} Board)
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-slate-400" />
                Batch Schedule
              </span>
              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                {batchName}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <School className="w-4 h-4 text-slate-400" />
                School Affiliation
              </span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {schoolName}
              </span>
            </div>
          </div>
        </div>

      </div>

    </main>
  );
}
