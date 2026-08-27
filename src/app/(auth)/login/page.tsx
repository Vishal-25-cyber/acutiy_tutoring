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
  UserCheck,
  Layers,
  KeyRound,
  Zap,
  Eye,
  EyeOff,
  Copy,
  Check,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { warmupPortalCache } from "@/lib/api-cache";

// Pre-defined Verified Demo Credentials
const DEMO_ACCOUNTS = [
  {
    role: "STUDENT" as const,
    label: "Class 10 Student",
    sublabel: "CBSE • 7:00 PM Batch",
    name: "Aravind Swaminathan",
    email: "aravind.class10@acuity.edu",
    password: "Student@123",
    batchName: "7:00 PM – 8:00 PM",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: GraduationCap,
  },
  {
    role: "STUDENT" as const,
    label: "Class 9 Student",
    sublabel: "CBSE • 6:00 PM Batch",
    name: "Priya Sharma",
    email: "priya.class9@acuity.edu",
    password: "Student@123",
    batchName: "6:00 PM – 7:00 PM",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: BookOpen,
  },
  {
    role: "TEACHER" as const,
    label: "Maths Faculty",
    sublabel: "Ph.D • Class 8–10",
    name: "Dr. Sarah Jenkins",
    email: "sarah.maths@acuity.edu",
    password: "Teacher@123",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    icon: UserCheck,
  },
  {
    role: "TEACHER" as const,
    label: "Science Faculty",
    sublabel: "M.Sc • Class 7–10",
    name: "Prof. Rajesh Kumar",
    email: "rajesh.science@acuity.edu",
    password: "Teacher@123",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: Sparkles,
  },
  {
    role: "ADMIN" as const,
    label: "Command Admin",
    sublabel: "Master Controls & Analytics",
    name: "Acuity Administrator",
    email: "admin@acuity.edu",
    password: "Admin@123",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    icon: ShieldCheck,
  },
];

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
  const [instantLoginLoading, setInstantLoginLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  // Copy to clipboard helper
  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Populate selected account into the form
  const handleSelectAccount = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setActiveTab(acc.role);
    setIdentifier(acc.email);
    setPassword(acc.password);
    setErrorMessage("");
    setErrorDetail("");

    if (acc.role === "STUDENT" && acc.batchName) {
      const match = availableBatches.find((b) => b.name.includes(acc.batchName.split(" ")[0])) || availableBatches[0];
      if (match) setSelectedBatchId(match._id);
    }
  };

  // Perform Instant Direct Login (One-click login with zero typing)
  const handleInstantLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    handleSelectAccount(acc);
    setInstantLoginLoading(acc.email);
    setErrorMessage("");
    setErrorDetail("");

    try {
      const payload: any = {
        role: acc.role,
        password: acc.password,
      };

      if (acc.role === "STUDENT") {
        payload.identifier = acc.email;
        const match = availableBatches.find((b) => b.name?.includes("7:00")) || availableBatches[0];
        payload.batchId = match?._id || selectedBatchId;
      } else {
        payload.email = acc.email;
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

      // Pre-warm cache for instant transition
      warmupPortalCache(acc.role);

      if (acc.role === "STUDENT") {
        router.push("/student/dashboard");
      } else if (acc.role === "TEACHER") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setInstantLoginLoading(null);
    }
  };

  // Handle Standard Form Submit
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

      // Pre-warm cache for instant transition
      warmupPortalCache(activeTab);

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
      {/* LEFT SIDE (Desktop 5-cols): Brand Experience & Live Credentials Directory */}
      <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 sm:p-10 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden border-r border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-white">ACUITY</span>
              <p className="text-xs text-indigo-300 font-medium">Classes 1 to 10 Live Platform</p>
            </div>
          </Link>
        </div>

        {/* Center: Live Credentials Card Directory */}
        <div className="my-8 relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-indigo-200 tracking-wide uppercase">
                Active Enrolled Accounts
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
              <Zap className="w-3 h-3 animate-pulse" /> 1-Click Fast Sign-In
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Click any account below to autofill or sign in instantly with verified credentials:
          </p>

          {/* Account Credential Cards */}
          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              const isCurrent = identifier === acc.email;
              const isLoggingIn = instantLoginLoading === acc.email;

              return (
                <div
                  key={acc.email}
                  className={`p-3 rounded-2xl transition-all border ${
                    isCurrent
                      ? "bg-white/15 border-indigo-400/80 shadow-md shadow-indigo-900/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-indigo-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-white">{acc.label}</span>
                          <span className="text-[10px] text-indigo-300">({acc.name})</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-300 truncate">{acc.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectAccount(acc)}
                        className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 transition-colors"
                        title="Fill into form"
                      >
                        Fill Form
                      </button>
                      <button
                        type="button"
                        disabled={isLoggingIn}
                        onClick={() => handleInstantLogin(acc)}
                        className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white transition-colors flex items-center gap-1 shadow-sm"
                      >
                        {isLoggingIn ? (
                          <span>Entering...</span>
                        ) : (
                          <>
                            <Zap className="w-3 h-3" />
                            <span>Login</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <span>Password:</span>
                      <strong className="text-indigo-200">{acc.password}</strong>
                    </span>
                    {acc.batchName && (
                      <span className="text-emerald-300 font-medium">{acc.batchName}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Hotlines Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>Support: +91 98765 43210</span>
          </div>
          <span>Classes 1–10 CBSE & State</span>
        </div>
      </div>

      {/* RIGHT SIDE (Desktop 7-cols): High-Speed Sign-In Form */}
      <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Sign In to Portal
              </h2>
              <Badge variant="outline" className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                Fast Access
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Select your role tab, view the live enrolled credentials inside, and sign in.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab("STUDENT");
                setIdentifier("aravind.class10@acuity.edu");
                setPassword("Student@123");
                setErrorMessage("");
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "STUDENT"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-800"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("TEACHER");
                setIdentifier("sarah.maths@acuity.edu");
                setPassword("Teacher@123");
                setErrorMessage("");
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "TEACHER"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-800"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("ADMIN");
                setIdentifier("admin@acuity.edu");
                setPassword("Admin@123");
                setErrorMessage("");
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "ADMIN"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-800"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>

          {/* ACTIVE ROLE CREDENTIAL BANNER (Shown inside the form box) */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Active {activeTab} Credentials
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                Verified & Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">Login ID</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                    {activeTab === "STUDENT" ? "aravind.class10@acuity.edu" : activeTab === "TEACHER" ? "sarah.maths@acuity.edu" : "admin@acuity.edu"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeTab === "STUDENT" ? "aravind.class10@acuity.edu" : activeTab === "TEACHER" ? "sarah.maths@acuity.edu" : "admin@acuity.edu", "id")}
                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Copy email"
                >
                  {copiedField === "id" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Password</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    {activeTab === "STUDENT" ? "Student@123" : activeTab === "TEACHER" ? "Teacher@123" : "Admin@123"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeTab === "STUDENT" ? "Student@123" : activeTab === "TEACHER" ? "Teacher@123" : "Admin@123", "pw")}
                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Copy password"
                >
                  {copiedField === "pw" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
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
              <div className="relative">
                <Input
                  type="text"
                  required
                  placeholder={activeTab === "STUDENT" ? "student@acuity.edu or 9876543220" : "name@acuity.edu"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 h-11 text-xs"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 text-xs font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                <div className="relative">
                  <select
                    required
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 pl-10 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {availableBatches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.startTime} - {b.endTime})
                      </option>
                    ))}
                  </select>
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg shadow-indigo-500/25 h-11 text-xs flex items-center justify-center gap-2"
              isLoading={isLoading}
            >
              <span>Sign In to {activeTab} Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Footer Links */}
          <div className="text-center text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
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
