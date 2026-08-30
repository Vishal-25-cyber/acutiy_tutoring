"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, ChevronRight, BookOpen, GraduationCap,
  Award, Shield, Users, Clock, Check
} from "lucide-react";

type Mode = "SIGNIN" | "SIGNUP";
type SignupRole = "STUDENT" | "TEACHER";
type Step = 1 | 2 | 3;
type LoginRole = "STUDENT" | "TEACHER" | "ADMIN";

export default function HomePage() {
  const router = useRouter();

  // Mode & Role State
  const [mode, setMode] = useState<Mode>("SIGNIN");
  const [loginRole, setLoginRole] = useState<LoginRole>("STUDENT");
  const [uid, setUid] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Sign up state
  const [batches, setBatches] = useState<any[]>([]);
  const [signupRole, setSignupRole] = useState<SignupRole>("STUDENT");
  const [step, setStep] = useState<Step>(1);
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sPw, setSPw] = useState("");
  const [sCPw, setSCPw] = useState("");
  const [showSPw, setShowSPw] = useState(false);

  const [sSchool, setSSchool] = useState("");
  const [sBoard, setSBoard] = useState<"CBSE" | "State Board">("CBSE");
  const [sClass, setSClass] = useState("Class 10");
  const [sBatch, setSBatch] = useState("");

  const [tQual, setTQual] = useState("");
  const [tSpec, setTSpec] = useState("");
  const [tExp, setTExp] = useState("0");
  const [tCity, setTCity] = useState("");

  const [spName, setSpName] = useState("");
  const [spPhone, setSpPhone] = useState("");
  const [sGender, setSGender] = useState<"MALE" | "FEMALE" | "OTHER">("OTHER");
  const [sDob, setSdob] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    fetch("/api/batches")
      .then((r) => r.json())
      .then((d) => {
        if (d.batches?.length) {
          setBatches(d.batches);
          setSBatch(d.batches[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const clear = () => { setErr(""); setOk(""); };
  const sw = (m: Mode) => { setMode(m); clear(); setStep(1); };
  const switchRole = (r: LoginRole) => { setLoginRole(r); setUid(""); setPw(""); clear(); };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    setLoading(true);
    try {
      const body: any = { role: loginRole, password: pw };
      if (loginRole === "STUDENT") {
        body.identifier = uid;
      } else {
        body.email = uid;
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Invalid login credentials.");
        return;
      }
      setOk("Login verified. Redirecting…");
      setTimeout(() => {
        if (loginRole === "STUDENT") router.push("/student/dashboard");
        else if (loginRole === "TEACHER") router.push("/teacher/dashboard");
        else router.push("/admin/dashboard");
      }, 300);
    } catch (e: any) {
      setErr(e.message || "Network connection error.");
    } finally {
      setLoading(false);
    }
  };

  const v1 = () => {
    if (!sName.trim()) { setErr("Please enter full name."); return false; }
    if (!sEmail.includes("@")) { setErr("Please enter a valid email."); return false; }
    if (sPhone.replace(/\D/g, "").length < 10) { setErr("Please enter 10-digit phone number."); return false; }
    if (sPw.length < 6) { setErr("Password must be at least 6 characters."); return false; }
    if (sPw !== sCPw) { setErr("Passwords do not match."); return false; }
    return true;
  };

  const v2s = () => {
    if (!sSchool.trim()) { setErr("Please enter your school name."); return false; }
    if (!sBatch) { setErr("Please select a batch."); return false; }
    return true;
  };

  const v2t = () => {
    if (!tQual.trim()) { setErr("Please enter your qualification."); return false; }
    if (!tSpec.trim()) { setErr("Please enter your specialization."); return false; }
    return true;
  };

  const v3 = () => {
    if (!spName.trim()) { setErr("Please enter parent/guardian name."); return false; }
    if (spPhone.replace(/\D/g, "").length < 10) { setErr("Please enter valid parent phone number."); return false; }
    return true;
  };

  const next = () => {
    clear();
    if (step === 1 && !v1()) return;
    if (step === 2 && signupRole === "STUDENT" && !v2s()) return;
    if (step === 2 && signupRole === "TEACHER" && !v2t()) return;
    setStep((s) => ((s < 3 ? s + 1 : s) as Step));
  };

  const handleSignUp = async () => {
    clear();
    if (signupRole === "STUDENT" && !v3()) return;
    setLoading(true);
    try {
      const body: any = {
        role: signupRole,
        name: sName,
        email: sEmail,
        phone: sPhone,
        password: sPw,
      };
      if (signupRole === "STUDENT") {
        Object.assign(body, {
          schoolName: sSchool,
          board: sBoard,
          currentClass: sClass,
          batchId: sBatch,
          parentName: spName,
          parentPhone: spPhone,
          gender: sGender,
          dob: sDob,
        });
      } else {
        Object.assign(body, {
          qualification: tQual,
          specialization: tSpec,
          experienceYears: tExp,
          address: tCity,
        });
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Registration failed.");
        return;
      }
      setOk(data.message || "Account registered successfully!");
      setTimeout(() => sw("SIGNIN"), 2000);
    } catch (e: any) {
      setErr(e.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = signupRole === "STUDENT" ? 3 : 2;
  const stepLabels = signupRole === "STUDENT" ? ["Account", "School", "Parent"] : ["Account", "Profile"];

  return (
    <div
      className="fixed inset-0 flex flex-col justify-between overflow-hidden bg-white text-slate-900 select-none"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}
    >
      {/* ── TOP NAVBAR ── */}
      <header className="w-full px-8 lg:px-16 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#004b79] flex items-center justify-center text-white font-black text-lg shadow-sm">
            A
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#002137] leading-none block">
              ACUITY
            </span>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Where Accuracy Meets Knowledge</p>
          </div>
        </div>

        {/* Auth Toggle */}
        <div className="flex items-center gap-6 text-sm font-bold">
          <button
            type="button"
            onClick={() => sw("SIGNIN")}
            className={`pb-1 transition-all cursor-pointer ${
              mode === "SIGNIN"
                ? "text-[#004b79] border-b-2 border-[#004b79]"
                : "text-slate-400 hover:text-slate-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => sw("SIGNUP")}
            className={`pb-1 transition-all cursor-pointer ${
              mode === "SIGNUP"
                ? "text-[#004b79] border-b-2 border-[#004b79]"
                : "text-slate-400 hover:text-slate-800"
            }`}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* ── FULL VIEWPORT CONTENT (55% / 45% SPLIT WITH NO EMPTY VOIDS) ── */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        
        {/* ══════════════════════════════════════════════════
            LEFT SIDE (7 COLS): ABOUT ACUITY & CURRICULUM
        ══════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 h-full flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-8 border-r border-slate-100 bg-[#fafcff] overflow-y-auto">
          <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-bold text-[#004b79] uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>4+ Years of Trusted Offline Coaching</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black text-[#002137] tracking-tight leading-[1.12]">
                Quality tutoring for Classes 1 to 10.
              </h1>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Having successfully mentored students in offline coaching for over 4 years, Acuity brings structured subject mastery, personal attention, and board exam preparation to CBSE and State Board students.
              </p>
            </div>

            {/* 4 Feature Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#002137]">
                  <BookOpen className="w-4 h-4 text-[#004b79]" />
                  <span>Classes 1 to 10</span>
                </div>
                <p className="text-xs text-slate-500">Comprehensive CBSE &amp; State Board Syllabus</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#002137]">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Core Subjects</span>
                </div>
                <p className="text-xs text-slate-500">Mathematics, Science, English &amp; Social Studies</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#002137]">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>4+ Years Experience</span>
                </div>
                <p className="text-xs text-slate-500">Proven offline coaching methodology and track record</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#002137]">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Daily Batches</span>
                </div>
                <p className="text-xs text-slate-500">Personalized attention and regular assessment tests</p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Dedicated faculty mentorship • Regular mock tests • Comprehensive board preparation</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT SIDE (5 COLS): AUTHENTICATION WORKSPACE
        ══════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 h-full flex flex-col justify-center px-8 sm:px-14 lg:px-16 py-8 overflow-y-auto">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-[#002137] tracking-tight">
                {mode === "SIGNIN" ? "Sign in to portal" : "Create an account"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {mode === "SIGNIN" ? "Select your role and enter your details." : "Register student or faculty account."}
              </p>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                SIGN IN FORM (NO BATCH DROPDOWN)
            ───────────────────────────────────────────────────────────── */}
            {mode === "SIGNIN" && (
              <div className="space-y-5">
                
                {/* Role Select Bar */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                  {[
                    { key: "STUDENT", label: "Student" },
                    { key: "TEACHER", label: "Faculty" },
                    { key: "ADMIN", label: "Admin" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => switchRole(item.key as LoginRole)}
                      className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                        loginRole === item.key
                          ? "bg-white text-[#004b79] shadow-2xs font-extrabold"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Alerts */}
                {err && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                )}
                {ok && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{ok}</span>
                  </div>
                )}

                {/* Form without password autofill overlays & without batch dropdown */}
                <form onSubmit={handleSignIn} autoComplete="off" className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {loginRole === "STUDENT" ? "Phone Number or Email" : "Staff Email Address"}
                    </label>
                    <input
                      required
                      type="text"
                      name="auth_user_login_field_manual"
                      autoComplete="off"
                      data-lpignore="true"
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      placeholder={loginRole === "STUDENT" ? "Enter registered phone or email" : "e.g. staff@gmail.com"}
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#004b79] focus:ring-1 focus:ring-[#004b79] font-medium transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPw ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      required
                      type={showPw ? "text" : "password"}
                      name="auth_user_pw_field_manual"
                      autoComplete="new-password"
                      data-lpignore="true"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#004b79] focus:ring-1 focus:ring-[#004b79] font-medium transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#004b79] hover:bg-[#003b60] text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60 mt-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In to Portal</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <div className="text-xs sm:text-sm text-slate-500">
                  New to Acuity?{" "}
                  <button
                    type="button"
                    onClick={() => sw("SIGNUP")}
                    className="text-[#004b79] font-bold hover:underline cursor-pointer ml-1"
                  >
                    Create an account →
                  </button>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SIGN UP FORM
            ───────────────────────────────────────────────────────────── */}
            {mode === "SIGNUP" && (
              <div className="space-y-4">
                
                {/* Role Switcher */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "STUDENT", label: "Student", icon: BookOpen },
                    { key: "TEACHER", label: "Faculty", icon: GraduationCap },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setSignupRole(item.key as SignupRole);
                        setStep(1);
                        clear();
                      }}
                      className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                        signupRole === item.key
                          ? "bg-blue-50 border-[#004b79] text-[#004b79] font-extrabold shadow-2xs"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 py-1">
                  <span>Step {step} of {totalSteps}: <strong className="text-[#004b79]">{stepLabels[step - 1]}</strong></span>
                  <span className="text-[11px] text-slate-400">All data saved to MongoDB</span>
                </div>

                {/* Alerts */}
                {err && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                )}
                {ok && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{ok}</span>
                  </div>
                )}

                {/* Step 1: Base Information */}
                {step === 1 && (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Full Legal Name *</label>
                      <input
                        type="text"
                        autoComplete="off"
                        data-lpignore="true"
                        value={sName}
                        onChange={(e) => setSName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Email *</label>
                        <input
                          type="email"
                          autoComplete="off"
                          data-lpignore="true"
                          value={sEmail}
                          onChange={(e) => setSEmail(e.target.value)}
                          placeholder="name@email.com"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Mobile *</label>
                        <input
                          type="tel"
                          autoComplete="off"
                          data-lpignore="true"
                          value={sPhone}
                          onChange={(e) => setSPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Password *</label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          data-lpignore="true"
                          value={sPw}
                          onChange={(e) => setSPw(e.target.value)}
                          placeholder="Min 6 chars"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Confirm *</label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          data-lpignore="true"
                          value={sCPw}
                          onChange={(e) => setSCPw(e.target.value)}
                          placeholder="Re-enter"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={next}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-[#004b79] hover:bg-[#003b60] text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2 shadow-xs"
                    >
                      <span>Next: {signupRole === "STUDENT" ? "School Details" : "Teaching Profile"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Step 2: Student Academic Info */}
                {step === 2 && signupRole === "STUDENT" && (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">School Name *</label>
                      <input
                        type="text"
                        value={sSchool}
                        onChange={(e) => setSSchool(e.target.value)}
                        placeholder="Enter school name"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Curriculum *</label>
                        <select
                          value={sBoard}
                          onChange={(e) => setSBoard(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium cursor-pointer"
                        >
                          <option value="CBSE">CBSE Board</option>
                          <option value="State Board">State Board</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Class *</label>
                        <select
                          value={sClass}
                          onChange={(e) => setSClass(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium cursor-pointer"
                        >
                          {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Batch Timing *</label>
                      {batches.length === 0 ? (
                        <p className="text-xs text-slate-500 font-medium">Batch will be assigned by Administrator.</p>
                      ) : (
                        <select
                          value={sBatch}
                          onChange={(e) => setSBatch(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium cursor-pointer"
                        >
                          {batches.map((b) => (
                            <option key={b._id} value={b._id}>{b.name} ({b.classLevel || "All Classes"})</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setStep(1); clear(); }}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <button
                        type="button"
                        onClick={next}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-[#004b79] hover:bg-[#003b60] text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Next: Parent Info</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Teacher Qualifications */}
                {step === 2 && signupRole === "TEACHER" && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Degree *</label>
                        <input
                          type="text"
                          value={tQual}
                          onChange={(e) => setTQual(e.target.value)}
                          placeholder="e.g. B.Ed, M.Sc"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Specialization *</label>
                        <input
                          type="text"
                          value={tSpec}
                          onChange={(e) => setTSpec(e.target.value)}
                          placeholder="e.g. Mathematics"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Experience (Yrs)</label>
                        <input
                          type="number"
                          min="0"
                          value={tExp}
                          onChange={(e) => setTExp(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">City</label>
                        <input
                          type="text"
                          value={tCity}
                          onChange={(e) => setTCity(e.target.value)}
                          placeholder="Your city"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-amber-700 font-medium">Faculty accounts undergo admin approval before login access.</p>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setStep(1); clear(); }}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSignUp}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-[#004b79] hover:bg-[#003b60] text-white transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Registration"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Student Guardian */}
                {step === 3 && signupRole === "STUDENT" && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Parent Name *</label>
                        <input
                          type="text"
                          value={spName}
                          onChange={(e) => setSpName(e.target.value)}
                          placeholder="Parent full name"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Parent Mobile *</label>
                        <input
                          type="tel"
                          value={spPhone}
                          onChange={(e) => setSpPhone(e.target.value)}
                          placeholder="Parent phone"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Gender</label>
                        <select
                          value={sGender}
                          onChange={(e) => setSGender(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium cursor-pointer"
                        >
                          <option value="OTHER">Prefer not to say</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Date of Birth</label>
                        <input
                          type="date"
                          value={sDob}
                          onChange={(e) => setSdob(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] font-medium cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => { setStep(2); clear(); }}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSignUp}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-[#004b79] hover:bg-[#003b60] text-white transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Registration"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-xs sm:text-sm text-slate-500">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => sw("SIGNIN")}
                    className="text-[#004b79] font-bold hover:underline cursor-pointer ml-1"
                  >
                    Sign in here →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full px-8 lg:px-16 py-3 flex items-center justify-between text-slate-400 text-xs border-t border-slate-100 shrink-0">
        <p>Acuity Tutoring • CBSE &amp; State Board (Classes 1–10)</p>
        <p>© 2026 Acuity</p>
      </footer>
    </div>
  );
}
