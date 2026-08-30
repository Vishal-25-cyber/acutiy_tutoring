"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Video,
  X,
  Flame,
  Award,
  Zap,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const router = useRouter();

  // Floating Auth Panel visibility
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auth Mode: "LOGIN" vs "SIGNUP"
  const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");

  // Login State
  const [loginRole, setLoginRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
  const [identifier, setIdentifier] = useState("aravind.class10@acuity.edu");
  const [password, setPassword] = useState("Student@123");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);

  // Sign Up State
  const [signupRole, setSignupRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [signupName, setSignupName] = useState("");
  const [signupClass, setSignupClass] = useState("Class 10");
  const [signupBoard, setSignupBoard] = useState("CBSE");

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch batches on mount
  useEffect(() => {
    fetch("/api/batches")
      .then((res) => res.json())
      .then((data) => {
        if (data.batches && data.batches.length > 0) {
          setAvailableBatches(data.batches);
          const defaultBatch =
            data.batches.find((b: any) => b.name.includes("7:00")) || data.batches[0];
          setSelectedBatchId(defaultBatch._id);
        }
      })
      .catch(() => {});
  }, []);

  // Update credentials when login tab changes
  const handleRoleTabChange = (role: "STUDENT" | "TEACHER" | "ADMIN") => {
    setLoginRole(role);
    setErrorMessage("");
    setSuccessMessage("");
    if (role === "STUDENT") {
      setIdentifier("aravind.class10@acuity.edu");
      setPassword("Student@123");
    } else if (role === "TEACHER") {
      setIdentifier("sarah.maths@acuity.edu");
      setPassword("Teacher@123");
    } else {
      setIdentifier("admin@acuity.edu");
      setPassword("Admin@123");
    }
  };

  // Open auth card in specific mode
  const openAuth = (mode: "LOGIN" | "SIGNUP", role?: "STUDENT" | "TEACHER" | "ADMIN") => {
    setAuthMode(mode);
    setErrorMessage("");
    setSuccessMessage("");
    if (role) {
      if (mode === "LOGIN") {
        handleRoleTabChange(role);
      } else {
        setSignupRole(role === "ADMIN" ? "STUDENT" : role);
      }
    }
    setShowAuthModal(true);
  };

  // Direct Sign In Form Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      let body: any = { role: loginRole, password };
      if (loginRole === "STUDENT") {
        body.identifier = identifier;
        body.batchId = selectedBatchId || availableBatches[0]?._id;
      } else {
        body.email = identifier;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes("Invalid")) {
          await fetch("/api/seed", { method: "POST" });
          const res2 = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data2 = await res2.json();
          if (!res2.ok) {
            setErrorMessage(data2.error || "Authentication failed.");
            return;
          }
        } else {
          setErrorMessage(data.error || "Authentication failed.");
          return;
        }
      }

      setSuccessMessage("Authentication successful! Redirecting...");
      setTimeout(() => {
        if (loginRole === "STUDENT") router.push("/student/dashboard");
        else if (loginRole === "TEACHER") router.push("/teacher/dashboard");
        else router.push("/admin/dashboard");
      }, 200);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Quick Sign Up Form Submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (signupRole === "TEACHER") {
      router.push("/register/teacher");
      return;
    }

    router.push("/register/student");
  };

  // Instant 1-Click Demo Login
  const handleInstantDemo = async (role: "STUDENT" | "TEACHER" | "ADMIN") => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      let body: any = {};
      if (role === "STUDENT") {
        const batch2 =
          availableBatches.find((b: any) => b.name.includes("7:00")) ||
          availableBatches[1] ||
          availableBatches[0];
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

      if (res.ok) {
        if (role === "STUDENT") router.push("/student/dashboard");
        else if (role === "TEACHER") router.push("/teacher/dashboard");
        else router.push("/admin/dashboard");
      } else {
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
        } else {
          setErrorMessage("Failed to launch demo. Please try regular login.");
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to launch demo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-slate-50 dark:bg-[#00101a] text-slate-900 dark:text-slate-100 flex flex-col justify-between overflow-hidden selection:bg-[#002137] selection:text-white no-scrollbar">
      {/* ── TOP HEADER (Official Logo at Left Top) ── */}
      <header className="w-full pt-3 sm:pt-4 px-6 sm:px-10 lg:px-14 flex items-center justify-between z-20 shrink-0">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white dark:bg-[#002137] p-1.5 shadow-md border border-slate-200/80 dark:border-[#b89047]/30 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/images/acuity_logo.png"
              alt="Acuity Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-[#002137] dark:text-white block leading-none">
                ACUITY
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#b89047]/15 text-[#8f6d2b] dark:text-[#dfb74a] border border-[#b89047]/30">
                Classes 1–10
              </span>
            </div>
            <p className="text-xs font-semibold text-[#b89047] dark:text-[#dfb74a] mt-1 leading-none tracking-tight">
              Where Accuracy Meets Knowledge
            </p>
          </div>
        </Link>
      </header>

      {/* ── MAIN HERO STATIC SPLIT CONTAINER ── */}
      <main className="relative flex-1 flex items-center px-6 sm:px-10 lg:px-14 py-2 sm:py-3 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Subtle Background Glows matching Deep Navy & Gold */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-[#002137]/10 dark:bg-[#002137]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-[#b89047]/10 dark:bg-[#b89047]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* LEFT COLUMN: Brand, Headlines & Action Buttons */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#002137]/5 dark:bg-[#002842] border border-[#b89047]/30 text-[#002137] dark:text-[#dfb74a] text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#b89047] dark:text-[#dfb74a]" />
              <span>Next-Gen Live Tuition Platform • Classes 1 to 10</span>
            </div>

            {/* Headline */}
            <div className="space-y-2.5">
              <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-black tracking-tight leading-[1.08] text-[#002137] dark:text-white">
                Where Accuracy <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#002137] via-[#004b79] to-[#b89047] dark:from-[#fdf8e6] dark:via-[#dfb74a] dark:to-[#b89047]">
                  Meets Knowledge.
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Premium online tutoring built for academic mastery from <strong className="font-semibold text-[#002137] dark:text-white">Class 1 to Class 10</strong>. Experience high-definition interactive live classes, automated attendance, structured formula sheets, and verified master faculty.
              </p>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 max-w-lg">
              <div className="p-3 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-[#002137] dark:text-[#dfb74a] leading-tight">
                  1,200+
                </p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Enrolled Students
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-[#b89047] dark:text-[#dfb74a] leading-tight">
                  98.4%
                </p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Exam Pass Rate
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-[#004b79] dark:text-sky-400 leading-tight">
                  1–10
                </p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  CBSE & State
                </p>
              </div>
            </div>

            {/* CTA ACTION BUTTONS: "Get Started" & "Faculty Sign Up" */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1.5">
              <Button
                variant="primary"
                size="lg"
                onClick={() => openAuth("LOGIN", "STUDENT")}
                className="bg-[#002137] hover:bg-[#083353] dark:bg-[#dfb74a] dark:text-[#002137] dark:hover:bg-[#f7d87c] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-[#002137]/25 flex items-center gap-2 text-sm transition-all cursor-pointer hover:scale-[1.02]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => openAuth("LOGIN", "TEACHER")}
                className="bg-white dark:bg-[#001726] border border-slate-300 dark:border-slate-700 text-[#002137] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold px-6 py-3.5 rounded-2xl text-sm shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
              >
                <span>Faculty Sign Up</span>
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Educational Animation / Floating Auth Portal */}
          <div className="lg:col-span-6 relative">
            {/* ───────────────────────────────────────────────────────────── */}
            {/* STATE 1: EDUCATIONAL LIVE LEARNING ANIMATION SHOWCASE */}
            {/* ───────────────────────────────────────────────────────────── */}
            {!showAuthModal ? (
              <div
                onClick={() => openAuth("LOGIN")}
                className="group relative bg-white/95 dark:bg-[#001726]/95 p-5 sm:p-6 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-[#b89047]/30 backdrop-blur-xl overflow-hidden cursor-pointer transition-all hover:border-[#b89047]/60 hover:shadow-2xl"
              >
                {/* Floating ambient glow bubbles */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#b89047]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#002137]/10 rounded-full blur-2xl pointer-events-none" />

                {/* Showcase Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-[#002137] dark:text-white flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-rose-500" />
                        <span>Interactive Live Class in Session</span>
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Class 1 to 10 • Mathematics & Sciences
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>28 Students Active</span>
                  </span>
                </div>

                {/* 3D Student Studying Animation Stage */}
                <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#b89047]/20 group-hover:scale-[1.01] transition-transform">
                  <img
                    src="/images/student_study_hero.jpg"
                    alt="Student Studying Online"
                    className="w-full h-64 sm:h-72 object-cover object-center rounded-2xl"
                  />

                  {/* Gradient Overlay for Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002137]/80 via-transparent to-black/20 rounded-2xl" />

                  {/* Floating Micro-Animation Badge 1 (Top Left) */}
                  <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-[#002137]/90 backdrop-blur-md border border-[#b89047]/40 text-[#002137] dark:text-[#dfb74a] text-[11px] font-bold shadow-md animate-float-slow flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#b89047] dark:text-[#dfb74a]" />
                    <span>Live 1:1 Doubt Clearing</span>
                  </div>

                  {/* Floating Micro-Animation Badge 2 (Top Right) */}
                  <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-[#002137]/90 backdrop-blur-md border border-[#b89047]/40 text-[#002137] dark:text-[#dfb74a] text-[11px] font-bold shadow-md animate-float-delayed flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#b89047] dark:text-[#dfb74a]" />
                    <span>98.4% Top Scores</span>
                  </div>

                  {/* Bottom Image Floating Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1.5 border border-white/10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Curriculum: Classes 1 to 10</span>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-[#b89047]/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Flame className="w-3.5 h-3.5 text-amber-200" />
                      <span>Daily Study Streak 🔥</span>
                    </div>
                  </div>
                </div>

                {/* Floating Click-to-Open Callout Banner */}
                <div className="mt-3.5 p-3 rounded-2xl bg-gradient-to-r from-[#002137] to-[#003b60] text-white flex items-center justify-between text-xs shadow-md group-hover:scale-[1.01] transition-transform">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#dfb74a] animate-pulse" />
                    <span className="font-bold text-xs">Ready to Learn? Click to Sign In & Access Portal</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#dfb74a] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ) : (
              /* ───────────────────────────────────────────────────────────── */
              /* STATE 2: FLOATING AUTH MODAL / PORTAL CARD */
              /* ───────────────────────────────────────────────────────────── */
              <div className="relative bg-white dark:bg-[#001726] p-7 sm:p-8 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl animate-in zoom-in-95 fade-in duration-200">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Clean Header */}
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Sign in to Acuity
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select your account role to access your dashboard
                  </p>
                </div>

                {/* Status Alerts */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Sleek Segmented Role Switcher */}
                <div className="p-1 bg-slate-100 dark:bg-[#00101a] rounded-xl flex items-center mb-5">
                  <button
                    type="button"
                    onClick={() => handleRoleTabChange("STUDENT")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      loginRole === "STUDENT"
                        ? "bg-white dark:bg-[#002137] text-[#002137] dark:text-[#dfb74a] shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleTabChange("TEACHER")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      loginRole === "TEACHER"
                        ? "bg-white dark:bg-[#002137] text-[#002137] dark:text-[#dfb74a] shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleTabChange("ADMIN")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      loginRole === "ADMIN"
                        ? "bg-white dark:bg-[#002137] text-[#002137] dark:text-[#dfb74a] shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    Admin
                  </button>
                </div>

                {/* Clean Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {loginRole === "STUDENT" ? "Email or Mobile Number" : "Email Address"}
                    </label>
                    <Input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        loginRole === "STUDENT"
                          ? "aravind.class10@acuity.edu"
                          : "name@acuity.edu"
                      }
                      className="h-11 text-sm rounded-xl bg-white dark:bg-[#00101a] border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="h-11 text-sm rounded-xl pr-10 bg-white dark:bg-[#00101a] border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Specific Scope Selector (Keeps constant height across roles) */}
                  <div>
                    {loginRole === "STUDENT" ? (
                      <>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Assigned Batch
                        </label>
                        <select
                          value={selectedBatchId}
                          onChange={(e) => setSelectedBatchId(e.target.value)}
                          className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#00101a] px-3.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#002137] text-slate-900 dark:text-slate-100"
                        >
                          {availableBatches.length > 0 ? (
                            availableBatches.map((b) => (
                              <option key={b._id} value={b._id}>
                                {b.name} ({b.startTime} - {b.endTime})
                              </option>
                            ))
                          ) : (
                            <option value="">6:00 PM – 7:00 PM (Batch A)</option>
                          )}
                        </select>
                      </>
                    ) : loginRole === "TEACHER" ? (
                      <>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Teaching Scope
                        </label>
                        <div className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#00101a] px-3.5 flex items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                          Mathematics & Sciences (Classes 1–10)
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Admin Authorization
                        </label>
                        <div className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#00101a] px-3.5 flex items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                          Super Administrator (Full System Access)
                        </div>
                      </>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    isLoading={isLoading}
                    className="w-full h-11 text-sm font-semibold rounded-xl bg-[#002137] hover:bg-[#083353] dark:bg-[#dfb74a] dark:text-[#002137] dark:hover:bg-[#f7d87c] text-white shadow-md shadow-[#002137]/15 transition-all cursor-pointer pt-0"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </form>

                {/* Clean Onboarding Guide */}
                <div className="pt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  <span>New to Acuity? </span>
                  <span className="font-semibold text-[#002137] dark:text-[#dfb74a]">
                    Select your role above to enter the portal
                  </span>
                </div>

                {/* Instant Demo Quick Access */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Quick Demo:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleInstantDemo("STUDENT")}
                      className="px-2 py-0.5 rounded-md font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Student
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleInstantDemo("TEACHER")}
                      className="px-2 py-0.5 rounded-md font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Faculty
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleInstantDemo("ADMIN")}
                      className="px-2 py-0.5 rounded-md font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── MINIMAL CLEAN FOOTER NOTE (Non-intrusive) ── */}
      <footer className="w-full py-2.5 px-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} Acuity Tutoring Management Platform • Where Accuracy Meets Knowledge
      </footer>
    </div>
  );
}
