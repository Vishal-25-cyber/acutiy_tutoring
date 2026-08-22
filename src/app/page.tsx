"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  Video,
  BookOpen,
  CheckCircle2,
  Users,
  Award,
  Flame,
  ShieldCheck,
  PhoneCall,
  Clock,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Lock,
  Layers,
  Star,
  Play,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();
  const [selectedDemoRole, setSelectedDemoRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Quick One-Click Demo Login handler
  const handleQuickDemoLogin = async (role: "STUDENT" | "TEACHER" | "ADMIN") => {
    setIsDemoLoading(true);
    try {
      let body: any = {};
      if (role === "STUDENT") {
        // Fetch batches to get valid batchId for aravind
        const bRes = await fetch("/api/batches");
        const bData = await bRes.json();
        const batch2 = bData.batches?.find((b: any) => b.name.includes("7:00")) || bData.batches?.[1] || bData.batches?.[0];

        body = {
          role: "STUDENT",
          identifier: "aravind.class10@acuity.edu",
          password: "Student@123",
          batchId: batch2?._id,
        };
      } else if (role === "TEACHER") {
        body = {
          role: "TEACHER",
          email: "sarah.maths@acuity.edu",
          password: "Teacher@123",
        };
      } else {
        body = {
          role: "ADMIN",
          email: "admin@acuity.edu",
          password: "Admin@123",
        };
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        if (role === "STUDENT") router.push("/student/dashboard");
        else if (role === "TEACHER") router.push("/teacher/dashboard");
        else router.push("/admin/dashboard");
      } else {
        // Fallback: seed and retry
        await fetch("/api/seed", { method: "POST" });
        const res2 = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res2.ok) {
          if (role === "STUDENT") router.push("/student/dashboard");
          else if (role === "TEACHER") router.push("/teacher/dashboard");
          else router.push("/admin/dashboard");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      {/* 1. HERO SECTION WITH SPLIT SCREEN CONCEPT */}
      <section className="relative overflow-hidden pt-6 pb-16 lg:py-20 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* LEFT SIDE (50% Desktop): Brand Experience */}
            <div className="lg:col-span-7 space-y-8">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Live Tuition Platform • Classes 1 to 10</span>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                  Learn • Practice <br />
                  <span className="gradient-text">Improve • Succeed</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  Premium online tuition tailored for school students from <strong>Class 1 to Class 10</strong>.
                  Experience high-definition live interactive classes, automated attendance, curated learning hub materials, and expert master faculty.
                </p>
              </div>

              {/* Trust Metrics Bar */}
              <div className="grid grid-cols-3 gap-4 pt-2 max-w-lg">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">1,200+</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Enrolled Students</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">98.4%</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Exam Pass Rate</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">1–10</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">CBSE & State Board</p>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/register/student">
                  <Button variant="primary" size="lg" className="gap-2 font-bold shadow-xl shadow-indigo-500/25">
                    <span>Enroll as Student</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/register/teacher">
                  <Button variant="outline" size="lg" className="font-semibold">
                    Apply as Teacher
                  </Button>
                </Link>
              </div>
            </div>

            {/* RIGHT SIDE (50% Desktop): SaaS Quick Access & Demo Launcher */}
            <div className="lg:col-span-5">
              <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 relative">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Live Platform Access</h3>
                    <p className="text-xs text-slate-500">Select a portal to enter or register</p>
                  </div>
                  <Badge variant="live" className="text-[10px]">
                    ONLINE
                  </Badge>
                </div>

                {/* Role Switcher */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6">
                  <button
                    onClick={() => setSelectedDemoRole("STUDENT")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      selectedDemoRole === "STUDENT"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => setSelectedDemoRole("TEACHER")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      selectedDemoRole === "TEACHER"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Teacher
                  </button>
                  <button
                    onClick={() => setSelectedDemoRole("ADMIN")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      selectedDemoRole === "ADMIN"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Admin
                  </button>
                </div>

                {/* Selected Role Card Info */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 mb-6">
                  {selectedDemoRole === "STUDENT" && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          10
                        </div>
                        <div>
                          <p className="text-sm font-bold">Class 10 Student Portal</p>
                          <p className="text-xs text-slate-500">Aravind • Batch: 7:00 PM – 8:00 PM</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Access live interactive class, download formula sheets, submit homework, view streak & attendance.
                      </p>
                    </>
                  )}

                  {selectedDemoRole === "TEACHER" && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                          SJ
                        </div>
                        <div>
                          <p className="text-sm font-bold">Teacher Workspace</p>
                          <p className="text-xs text-slate-500">Dr. Sarah Jenkins • Mathematics</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Host live WebRTC classroom, broadcast notifications, launch live concept quizzes, grade student submissions.
                      </p>
                    </>
                  )}

                  {selectedDemoRole === "ADMIN" && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          ERP
                        </div>
                        <div>
                          <p className="text-sm font-bold">Admin Command Center</p>
                          <p className="text-xs text-slate-500">Full Academic & Finance ERP</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Manage 1-10 students, approve teachers, configure dynamic batches, track attendance risk, monitor monthly revenue.
                      </p>
                    </>
                  )}
                </div>

                {/* Instant One-Click Login Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-lg shadow-indigo-500/25 mb-3"
                  isLoading={isDemoLoading}
                  onClick={() => handleQuickDemoLogin(selectedDemoRole)}
                >
                  <span>Launch {selectedDemoRole} Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <Link href="/login" className="hover:text-indigo-600 font-semibold underline">
                    Regular Login
                  </Link>
                  <Link href="/register/student" className="hover:text-indigo-600 font-semibold underline">
                    New Student Signup
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="default">Simple 4-Step Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              How Acuity Tutoring Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Designed for effortless learning from the comfort of your home with structured accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Enroll in Class & Batch", desc: "Select student's class (1–10), school board, and convenient evening batch time." },
              { step: "02", title: "Join Live Batch Classes", desc: "Enter on-time with our 5-minute smart access system and learn directly from top faculty." },
              { step: "03", title: "Practice with Learning Hub", desc: "Download curated notes, Ray Diagrams, formula cheat sheets, and solve assignments." },
              { step: "04", title: "Track Progress & Excel", desc: "Monitor test scores, maintain learning streaks, and receive weekly teacher feedback." },
            ].map((item, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-4xl font-black text-indigo-600/30 dark:text-indigo-400/30">{item.step}</span>
                <h4 className="font-bold text-base mt-2 mb-1 text-slate-900 dark:text-slate-100">{item.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CLASSES 1 TO 10 CURRICULUM */}
      <section id="classes" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Badge variant="default" className="mb-2">All Grades Covered</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Curriculum from Class 1 to Class 10
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Customized curriculum supporting CBSE (NCERT) and State Board (Samacheer Kalvi).
              </p>
            </div>
            <Link href="/register/student">
              <Button variant="primary" size="md">Enroll Your Child</Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cls) => (
              <Card key={cls} className="hover:border-indigo-500/50 hover:shadow-lg transition-all text-center p-5 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  {cls}
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Class {cls}</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  {cls >= 8 ? "Maths • Science • Eng • Social" : "Foundational Math & Science"}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LIVE INTERACTIVE CLASSROOM FEATURES */}
      <section id="live-learning" className="py-16 lg:py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="live">Production WebRTC livekit</Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Live Video Classrooms Built for Real Education
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Clear audio, high-definition teacher streams, screen sharing, and real-time interactive polls make online learning as engaging as a private tutor sitting right beside you.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "Active Speaker Highlighting & Echo Cancellation",
                  "5-Minute Late Entry Grace Period & Auto Lockout",
                  "Live Teacher Quizzes & Concept MCQs with Instant Results",
                  "Automated Attendance Tracking logged directly to MongoDB",
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Mockup Visual */}
            <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-bold">Class 10 Mathematics Live</span>
                </div>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                  Batch: 7:00 PM – 8:00 PM
                </Badge>
              </div>

              <div className="h-64 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950/60 border border-slate-800 flex flex-col items-center justify-center relative">
                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg">
                  SJ
                </div>
                <p className="text-sm font-bold text-slate-200 mt-2">Dr. Sarah Jenkins</p>
                <span className="text-[10px] text-indigo-400">Explaining Quadratic Formula</span>

                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Auto-Attendance: Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DEDICATED LEARNING HUB */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="default">Learning Hub</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Curated Materials for Every Subject
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Students get access to notes, formula sheets, ray diagrams, and test model question papers filtered strictly for their class level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg">Revision Notes & PDFs</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Comprehensive chapter summaries and step-by-step solved exemplar problems ready for offline review.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg">AI Study Assistant</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Curriculum-scoped AI tutor that explains complex concepts step-by-step strictly based on the student's enrolled grade.
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                <Flame className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg">Learning Streaks & Badges</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gamified streaks (3-day, 7-day, 30-day 🔥) and badges to build strong daily study habits.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. PARENT BENEFITS */}
      <section id="parent-benefits" className="py-16 lg:py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="default">Parent Transparency</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Complete Peace of Mind for Parents
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Track your child's daily class presence, view teacher remarks, check assignment scores, and receive instant support from our dedicated helpline numbers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Live Attendance Sync</p>
                  <p className="text-xs text-slate-500 mt-1">Real-time alerts if a student misses a class or joins late.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">3 Official Hotlines</p>
                  <p className="text-xs text-slate-500 mt-1">Direct contact with academic counselors anytime.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm">Parent Portal Preview</span>
                <Badge variant="success" className="text-[10px]">VERIFIED RECORD</Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span>Overall Attendance</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">96% (Low Risk)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span>Mathematics Unit Score</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">88% (Excellent)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span>Tuition Fee Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Paid • Receipt #REC-00189</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING & FEE STRUCTURE */}
      <section id="pricing" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="default">Transparent Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Simple, Affordable Tuition Plans
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              High quality education accessible for every student with no hidden charges.
            </p>
          </div>

          <div className="max-w-md mx-auto rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-2xl p-8 text-center relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <h3 className="font-extrabold text-2xl mt-2 text-slate-900 dark:text-slate-100">Class 1 to 10 Tuition</h3>
            <p className="text-xs text-slate-500 mt-1">All Core Subjects Included</p>

            <div className="my-6">
              <span className="text-5xl font-black text-slate-900 dark:text-slate-100">₹2,500</span>
              <span className="text-slate-500 text-sm font-semibold"> / month</span>
            </div>

            <div className="space-y-3 text-left text-xs text-slate-600 dark:text-slate-300 mb-8">
              {[
                "Daily 1-Hour Interactive Live Batch",
                "Full Access to Learning Hub Notes & Ray Diagrams",
                "Weekly Graded Assignments & Teacher Feedback",
                "AI Study Buddy Access 24/7",
                "Automated Attendance Tracking & Parent View",
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <Link href="/register/student">
              <Button variant="primary" size="lg" className="w-full font-bold shadow-lg shadow-indigo-500/25">
                Register Student Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER WITH HOTLINES */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  A
                </div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100">
                  ACUITY TUTORING
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Premium Online Live Learning Platform for Classes 1 to 10. Building solid educational foundations.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Academic Batches</h5>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>6:00 PM – 7:00 PM Evening</li>
                <li>7:00 PM – 8:00 PM Prime</li>
                <li>8:00 PM – 9:00 PM Night</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Quick Portals</h5>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li><Link href="/login" className="hover:text-indigo-600">Student Sign In</Link></li>
                <li><Link href="/register/student" className="hover:text-indigo-600">Student Registration</Link></li>
                <li><Link href="/register/teacher" className="hover:text-indigo-600">Teacher Application</Link></li>
                <li><Link href="/login" className="hover:text-indigo-600">Admin Login</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">24/7 Official Support</h5>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <p>Line 1: +91 98765 43210</p>
                <p>Line 2: +91 98765 43211</p>
                <p>Line 3: +91 98765 43212</p>
                <p className="font-sans text-[11px] text-indigo-600 dark:text-indigo-400 pt-1">support@acuity.edu</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>© {new Date().getFullYear()} Acuity Tutoring Management & Live Learning. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
