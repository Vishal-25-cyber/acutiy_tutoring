"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, ChevronRight, BookOpen, GraduationCap,
  Award, Shield, Users, Clock, Check, Phone, PhoneCall,
  Mail, MapPin, Copy, X, MessageSquare, ExternalLink, Sparkles
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

  // Contact Us Modal & Numbers State
  const [showContactModal, setShowContactModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [contactSettings, setContactSettings] = useState<any>(null);
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackClass, setCallbackClass] = useState("Class 10");
  const [callbackSent, setCallbackSent] = useState(false);

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

    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setContactSettings(d.settings);
        }
      })
      .catch(() => {});
  }, []);

  const phone1 = (contactSettings?.supportPhone1 || "9876543210").replace(/\D/g, "").slice(-10);
  const phone2 = (contactSettings?.supportPhone2 || "9876543211").replace(/\D/g, "").slice(-10);
  const phone3 = (contactSettings?.supportPhone3 || "9876543212").replace(/\D/g, "").slice(-10);
  const emailSupport = contactSettings?.supportEmail || "support@gmail.com";

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackName.trim() || callbackPhone.replace(/\D/g, "").length < 10) return;
    setCallbackSent(true);
    setTimeout(() => {
      setCallbackSent(false);
      setCallbackName("");
      setCallbackPhone("");
      setShowContactModal(false);
    }, 2500);
  };

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

        {/* Right Nav Actions */}
        <div className="flex items-center gap-5 text-sm font-bold">
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-[#004b79] transition-all cursor-pointer shadow-2xs"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#004b79]" />
            <span>Contact Us</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Auth Toggle */}
          <div className="flex items-center gap-6">
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

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Dedicated faculty mentorship • Regular mock tests • Board preparation</span>
              </div>
              
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004b79] hover:underline cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Helpline: +91 {phone1.slice(0, 5)} {phone1.slice(5)}</span>
              </button>
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
        <button
          type="button"
          onClick={() => setShowContactModal(true)}
          className="text-[#004b79] font-bold hover:underline cursor-pointer"
        >
          Contact Helplines &amp; Support
        </button>
      </footer>

      {/* ── CONTACT US MODAL WITH 3 DEDICATED PHONE NUMBERS & ACUITY DETAILS ── */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#004b79] flex items-center justify-center text-white font-black text-sm shadow-2xs">
                  A
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#002137] tracking-tight">
                    Contact Acuity Tutoring
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct Admissions, Academic Coordination &amp; Student Support Helplines
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* ── SECTION 1: 3 DEDICATED PHONE HELPLINES ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Official Support &amp; Inquiry Hotlines
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Available Mon–Sat (9 AM – 8:30 PM)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Line 1: Primary Admissions */}
                  <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#004b79]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-[#004b79] border border-blue-200/60">
                          Hotline 1 • Admissions
                        </span>
                        <span className="text-xs font-bold text-slate-900">New Enrollments &amp; Fee Inquiries</span>
                      </div>
                      <p className="text-sm font-black font-mono text-[#002137]">
                        +91 {phone1.slice(0, 5)} {phone1.slice(5)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:+91${phone1}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#004b79] hover:bg-[#003b60] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Now</span>
                      </a>
                      <a
                        href={`https://wa.me/91${phone1}?text=Hello%20Acuity%20Tutoring,%20I%20would%20like%20to%20inquire%20about%20admissions.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(`+91${phone1}`, "p1")}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copy number"
                      >
                        {copiedKey === "p1" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Line 2: Academic Coordinator */}
                  <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#004b79]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200/60">
                          Hotline 2 • Academics
                        </span>
                        <span className="text-xs font-bold text-slate-900">Batch Timing &amp; Syllabus Coordinator</span>
                      </div>
                      <p className="text-sm font-black font-mono text-[#002137]">
                        +91 {phone2.slice(0, 5)} {phone2.slice(5)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:+91${phone2}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#004b79] hover:bg-[#003b60] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Now</span>
                      </a>
                      <a
                        href={`https://wa.me/91${phone2}?text=Hello,%20I%20have%20a%20query%20regarding%20batch%20timings%20and%20curriculum.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(`+91${phone2}`, "p2")}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copy number"
                      >
                        {copiedKey === "p2" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Line 3: Student Helpdesk */}
                  <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#004b79]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-50 text-purple-800 border border-purple-200/60">
                          Hotline 3 • Helpdesk
                        </span>
                        <span className="text-xs font-bold text-slate-900">Live Class Access &amp; Technical Support</span>
                      </div>
                      <p className="text-sm font-black font-mono text-[#002137]">
                        +91 {phone3.slice(0, 5)} {phone3.slice(5)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:+91${phone3}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#004b79] hover:bg-[#003b60] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Now</span>
                      </a>
                      <a
                        href={`https://wa.me/91${phone3}?text=Hello%20Acuity%20Support,%20I%20need%20assistance%20with%20live%20class%20login.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(`+91${phone3}`, "p3")}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copy number"
                      >
                        {copiedKey === "p3" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: ACADEMY DETAILS & SCHEDULE ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#002137]">
                    <Clock className="w-4 h-4 text-[#004b79]" />
                    <span>Center &amp; Support Hours</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">Monday – Saturday:</strong> 9:00 AM – 8:30 PM
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">Sunday:</strong> 10:00 AM – 2:00 PM (Inquiries)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#002137]">
                    <Mail className="w-4 h-4 text-[#004b79]" />
                    <span>Email &amp; Curriculum</span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono">
                    {emailSupport}
                  </p>
                  <p className="text-xs text-slate-600">
                    Classes 1 to 10 • CBSE &amp; State Board
                  </p>
                </div>
              </div>

              {/* ── SECTION 3: REQUEST A QUICK CALLBACK FORM ── */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#002137] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#004b79]" />
                    Request a Fast Admissions Callback
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Response within 15 mins</span>
                </div>

                {callbackSent ? (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Thank you! Our admissions coordinator will call you shortly.</span>
                  </div>
                ) : (
                  <form onSubmit={handleCallbackSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      required
                      type="text"
                      placeholder="Student/Parent Name"
                      value={callbackName}
                      onChange={(e) => setCallbackName(e.target.value)}
                      className="sm:col-span-4 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79]"
                    />
                    <input
                      required
                      type="tel"
                      placeholder="10-Digit Mobile"
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value)}
                      className="sm:col-span-4 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79]"
                    />
                    <select
                      value={callbackClass}
                      onChange={(e) => setCallbackClass(e.target.value)}
                      className="sm:col-span-2 px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#004b79] cursor-pointer"
                    >
                      {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="sm:col-span-2 px-3 py-2 rounded-lg bg-[#004b79] hover:bg-[#003b60] text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Submit
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>Acuity Tutoring Center • 4+ Years of Offline Excellence</span>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="px-3.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
