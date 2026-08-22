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
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");

  // Form State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState("");

  // Fetch batches for student login validation
  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/batches");
        const data = await res.json();
        if (data.batches) {
          setAvailableBatches(data.batches);
          if (data.batches.length > 0 && !selectedBatchId) {
            setSelectedBatchId(data.batches[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load batches:", err);
      }
    }
    loadBatches();
  }, [selectedBatchId]);

  // Handle Demo Autofill
  const handleAutofill = (role: "STUDENT" | "TEACHER" | "ADMIN") => {
    setActiveTab(role);
    setErrorMessage("");
    setErrorDetail("");

    if (role === "STUDENT") {
      setIdentifier("aravind.class10@acuity.edu");
      setPassword("Student@123");
      const batch7pm = availableBatches.find((b) => b.name.includes("7:00")) || availableBatches[1] || availableBatches[0];
      if (batch7pm) setSelectedBatchId(batch7pm._id);
    } else if (role === "TEACHER") {
      setIdentifier("sarah.maths@acuity.edu");
      setPassword("Teacher@123");
    } else {
      setIdentifier("admin@acuity.edu");
      setPassword("Admin@123");
    }
  };

  // Handle Login Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setErrorDetail("");
    setIsLoading(true);

    try {
      const payload: any = {
        role: activeTab,
        password,
      };

      if (activeTab === "STUDENT") {
        payload.identifier = identifier;
        payload.batchId = selectedBatchId;
      } else {
        payload.email = identifier;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Login failed");
        if (data.detail) setErrorDetail(data.detail);
        return;
      }

      // Route to respective portal
      if (activeTab === "STUDENT") {
        router.push("/student/dashboard");
      } else if (activeTab === "TEACHER") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950">
      {/* LEFT SIDE (50% Desktop): Brand Experience & Educational Visual */}
      <div className="lg:col-span-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-8 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white shadow-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight">ACUITY</span>
              <p className="text-xs text-indigo-300 font-medium">Classes 1 to 10 Live Platform</p>
            </div>
          </Link>
        </div>

        {/* Center Artwork & Value Proposition */}
        <div className="my-12 relative z-10 space-y-6 max-w-lg">
          <Badge variant="default" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Learn • Practice • Improve • Succeed
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Empowering students to achieve top academic ranks.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Live interactive batches with automated attendance, 5-minute late entry protection, and personalized learning materials for Classes 1 to 10.
          </p>

          {/* Highlights card */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <p className="text-xl font-bold text-emerald-400">1,200+</p>
              <p className="text-[11px] text-slate-300">Active Students</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <p className="text-xl font-bold text-indigo-400">3 Batches</p>
              <p className="text-[11px] text-slate-300">6 PM • 7 PM • 8 PM</p>
            </div>
          </div>
        </div>

        {/* Emergency Hotlines */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>Support: +91 98765 43210</span>
          </div>
          <span>Classes 1–10 CBSE & State Board</span>
        </div>
      </div>

      {/* RIGHT SIDE (50% Desktop): Authentication Panel */}
      <div className="lg:col-span-6 p-6 sm:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your role and enter your enrolled credentials to continue.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab("STUDENT");
                setErrorMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "STUDENT"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("TEACHER");
                setErrorMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "TEACHER"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("ADMIN");
                setErrorMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "ADMIN"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Admin
            </button>
          </div>

          {/* Error Display */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {errorDetail && <p className="text-[11px] pl-6 text-rose-600 dark:text-rose-400">{errorDetail}</p>}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {activeTab === "STUDENT" ? "Email Address or Phone Number" : "Email Address"}
              </label>
              <Input
                type="text"
                required
                placeholder={activeTab === "STUDENT" ? "student@acuity.edu or 9876543220" : "name@acuity.edu"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* MANDATORY BATCH VERIFICATION FOR STUDENTS */}
            {activeTab === "STUDENT" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Assigned Batch Time</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                    Server Verified
                  </span>
                </label>
                <select
                  required
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 px-3.5 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {availableBatches.length === 0 ? (
                    <option value="">Loading batches...</option>
                  ) : (
                    availableBatches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.startTime} - {b.endTime})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  You must select the batch you officially registered for.
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg shadow-indigo-500/25 mt-2"
              isLoading={isLoading}
            >
              Sign In to {activeTab} Portal
            </Button>
          </form>

          {/* Quick Autofill Buttons for Testing */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Quick Test Autofill
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => handleAutofill("STUDENT")}
              >
                Class 10 Student
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => handleAutofill("TEACHER")}
              >
                Maths Teacher
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => handleAutofill("ADMIN")}
              >
                Admin
              </Button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center text-xs text-slate-500 space-y-2 pt-2">
            <p>
              New student?{" "}
              <Link href="/register/student" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Register here
              </Link>
            </p>
            <p>
              Applying as teacher?{" "}
              <Link href="/register/teacher" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Teacher Application
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
