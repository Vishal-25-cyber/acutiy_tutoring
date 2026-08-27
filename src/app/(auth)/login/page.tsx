"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  Phone,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Zap,
  Eye,
  EyeOff,
  BookOpen,
  Target,
  Trophy,
  Lightbulb,
  HeartHandshake,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { warmupPortalCache } from "@/lib/api-cache";

const DEFAULT_BATCHES = [
  { _id: "batch-6pm", name: "6:00 PM – 7:00 PM", startTime: "18:00", endTime: "19:00" },
  { _id: "batch-7pm", name: "7:00 PM – 8:00 PM", startTime: "19:00", endTime: "20:00" },
  { _id: "batch-8pm", name: "8:00 PM – 9:00 PM", startTime: "20:00", endTime: "21:00" },
];

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");

  // Form State
  const [identifier, setIdentifier] = useState("aravind.class10@acuity.edu");
  const [password, setPassword] = useState("Student@123");
  const [selectedBatchId, setSelectedBatchId] = useState("batch-7pm");
  const [availableBatches, setAvailableBatches] = useState<any[]>(DEFAULT_BATCHES);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState("");

  // Fetch batches for student login validation
  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/batches");
        if (res.ok) {
          const data = await res.json();
          if (data.batches && data.batches.length > 0) {
            setAvailableBatches(data.batches);
            const batch7pm = data.batches.find((b: any) => b.name?.includes("7:00")) || data.batches[0];
            setSelectedBatchId(batch7pm._id);
          }
        }
      } catch (err) {
        console.warn("Using fallback batches:", err);
      }
    }
    loadBatches();
  }, []);

  const handleTabSwitch = (tab: "STUDENT" | "TEACHER" | "ADMIN") => {
    setActiveTab(tab);
    setErrorMessage("");
    setErrorDetail("");
    if (tab === "STUDENT") {
      setIdentifier("aravind.class10@acuity.edu");
      setPassword("Student@123");
    } else if (tab === "TEACHER") {
      setIdentifier("sarah.maths@acuity.edu");
      setPassword("Teacher@123");
    } else {
      setIdentifier("admin@acuity.edu");
      setPassword("Admin@123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setErrorDetail("");

    if (!identifier || !password) {
      setErrorMessage("Please fill all required login fields.");
      return;
    }

    if (activeTab === "STUDENT" && !selectedBatchId) {
      setErrorMessage("Please select your assigned batch time.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        role: activeTab,
        password,
      };

      if (activeTab === "STUDENT") {
        payload.identifier = identifier.trim();
        payload.batchId = selectedBatchId;
      } else {
        payload.email = identifier.trim().toLowerCase();
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. Please check credentials.");
        if (data.detail) setErrorDetail(data.detail);
        return;
      }

      warmupPortalCache(activeTab);

      if (activeTab === "STUDENT") {
        router.push("/student/dashboard");
      } else if (activeTab === "TEACHER") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* ── LEFT PANEL: BRIGHT, COOL, INSPIRATIONAL STUDENT SHOWCASE ── */}
      <div className="lg:col-span-6 relative min-h-[520px] lg:min-h-screen flex flex-col justify-between p-8 lg:p-12 overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50/40 to-indigo-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-950">
        {/* Full-bleed bright hero artwork */}
        <img
          src="/images/acuity_cool_hero.jpg"
          alt="Acuity Student Learning with Joy"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-85 dark:opacity-70"
        />

        {/* Clean, light, cool gradient scrim so text is crisp and vivid */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-slate-950/60 pointer-events-none" />

        {/* TOP: Brand Header & Motivational Words */}
        <div className="relative z-10 space-y-6">
          <Link href="/" prefetch={true} className="flex items-center gap-3.5 w-fit group">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-xl flex items-center justify-center border border-white/80">
              <img
                src="/images/acuity_logo.png"
                alt="Acuity Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-black text-2xl tracking-tight text-white flex items-center gap-1.5">
                ACUITY
              </span>
              <p className="text-xs text-[#fde047] font-semibold tracking-wide">
                Where Accuracy Meets Knowledge
              </p>
            </div>
          </Link>

          {/* Inspirational Words */}
          <div className="space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/25 border border-sky-300/40 text-sky-200 text-xs font-bold backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Classes 1 to 10 Live Masterclasses</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
              Dream Big. Learn Deeply. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-sky-200 to-white">
                Achieve Excellence.
              </span>
            </h1>

            <p className="text-slate-100 text-xs sm:text-sm leading-relaxed max-w-lg drop-shadow-sm font-medium">
              Every expert was once a beginner. With dedicated faculty, step-by-step concept clarity, and daily practice, you can achieve mastery in every school subject.
            </p>
          </div>

          {/* 3 Cool Motivational Feature Cards */}
          <div className="space-y-2.5 pt-2 max-w-lg">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-white/60 dark:border-slate-700/60 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-0.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Master Concepts with Clarity</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Mathematics and Science made engaging, simple, and visual so you never fear complex formulas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-white/60 dark:border-slate-700/60 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-0.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Every Question Matters</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dedicated faculty mentors who encourage you to ask doubts and guide you step by step.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-white/60 dark:border-slate-700/60 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-0.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Target className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Continuous Growth & Pride</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Watch your test scores rise and make your parents proud with verified daily attendance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Quote & CTA */}
        <div className="relative z-10 pt-6 border-t border-white/20 flex items-center justify-between text-xs text-slate-200">
          <span className="italic text-yellow-300 font-medium">"Where Accuracy Meets Knowledge"</span>
          <Link
            href="/register/student"
            className="font-bold text-white hover:text-yellow-300 flex items-center gap-1.5 transition-colors underline-offset-4 hover:underline"
          >
            <span>Join Class 1 to 10 Tuition</span>
            <ArrowRight className="w-3.5 h-3.5 text-yellow-300" />
          </Link>
        </div>
      </div>

      {/* ── RIGHT PANEL: CLEAN, COOL SIGN IN FORM ── */}
      <div className="lg:col-span-6 p-6 sm:p-10 lg:p-14 flex flex-col justify-center max-w-lg mx-auto w-full">
        <div className="space-y-6">
          {/* Header & Role Switcher */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Sign In to Portal
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your credentials to access your classroom and materials.
              </p>
            </div>

            {/* Role Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => handleTabSwitch("STUDENT")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "STUDENT"
                    ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                🎓 Student
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("TEACHER")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "TEACHER"
                    ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                👨‍🏫 Faculty
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("ADMIN")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "ADMIN"
                    ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                🛡️ Admin
              </button>
            </div>
          </div>

          {/* Active Credentials Hint Box */}
          <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs font-mono shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                {activeTab} Login ID:
              </span>
              <span className="font-semibold text-blue-900 dark:text-blue-200">{identifier}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Password:</span>
              <span className="font-semibold text-blue-900 dark:text-blue-200">{password}</span>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Email Address or Phone Number
              </label>
              <Input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter registered email or phone"
                className="h-11 text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-11 text-xs rounded-xl pr-10 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Batch Selection for Student */}
            {activeTab === "STUDENT" && (
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Assigned Batch Time
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 shadow-xs"
                >
                  {availableBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.startTime} - {b.endTime})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              {isLoading ? "Signing In..." : `Enter ${activeTab} Portal →`}
            </Button>
          </form>

          {/* Registration & Teacher Links */}
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <p>
              New student from Class 1 to 10?{" "}
              <Link href="/register/student" className="font-bold text-blue-600 dark:text-sky-400 hover:underline">
                Register for your grade here
              </Link>
            </p>
            <p>
              Applying as faculty?{" "}
              <Link href="/register/teacher" className="font-bold text-slate-700 dark:text-slate-300 hover:underline">
                Teacher Application
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
