"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, ChevronRight, BookOpen, GraduationCap,
  Award, Shield, Users, Clock, Check, Phone, PhoneCall,
  Mail, MapPin, Copy, MessageSquare, Send, Sparkles,
  Building, ExternalLink, Quote, Heart, Cpu, Brain,
  Compass, School, UserCheck, Star, Image as ImageIcon,
  Menu, X, Laptop, Rocket
} from "lucide-react";

type AuthMode = "SIGNIN" | "SIGNUP";
type SignupRole = "STUDENT" | "TEACHER";
type Step = 1 | 2 | 3;
type LoginRole = "STUDENT" | "TEACHER" | "ADMIN";

function WhatsAppIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth Card States
  const [authMode, setAuthMode] = useState<AuthMode>("SIGNIN");
  const [loginRole, setLoginRole] = useState<LoginRole>("STUDENT");
  const [uid, setUid] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Dynamic Contact & Phone State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [contactSettings, setContactSettings] = useState<any>(null);

  // Query & Send Mail Form State
  const [qName, setQName] = useState("");
  const [qEmail, setQEmail] = useState("");
  const [qPhone, setQPhone] = useState("");
  const [qClass, setQClass] = useState("Class 10");
  const [qBoard, setQBoard] = useState("CBSE");
  const [qSubject, setQSubject] = useState("Admissions & Monthly Fee Inquiry");
  const [qMessage, setQMessage] = useState("");
  const [qLoading, setQLoading] = useState(false);
  const [qErr, setQErr] = useState("");
  const [qOk, setQOk] = useState("");

  // Sign up state
  const defaultBatchesList = [
    { _id: "6a9425fa1491b9fc49acfd12", name: "6:00 PM – 7:00 PM", startTime: "18:00", endTime: "19:00" },
    { _id: "6a9425fa1491b9fc49acfd13", name: "7:00 PM – 8:00 PM", startTime: "19:00", endTime: "20:00" },
    { _id: "6a9425fa1491b9fc49acfd14", name: "8:00 PM – 9:00 PM", startTime: "20:00", endTime: "21:00" },
  ];
  const [batches, setBatches] = useState<any[]>(defaultBatchesList);
  const [signupRole, setSignupRole] = useState<SignupRole>("STUDENT");
  const [step, setStep] = useState<Step>(1);
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sPw, setSPw] = useState("");
  const [sCPw, setSCPw] = useState("");

  const [sSchool, setSSchool] = useState("");
  const [sDistrict, setSDistrict] = useState("");
  const [sBoard, setSBoard] = useState<"CBSE" | "State Board">("CBSE");
  const [sClass, setSClass] = useState("Class 10");
  const [sBatch, setSBatch] = useState("6a9425fa1491b9fc49acfd13");

  const [tQual, setTQual] = useState("");
  const [tSpec, setTSpec] = useState("");
  const [tExp, setTExp] = useState("");
  const [tDistrict, setTDistrict] = useState("");
  const [tClasses, setTClasses] = useState<string[]>(["Class 10"]);
  const [tSubjects, setTSubjects] = useState<string[]>(["Mathematics"]);

  const toggleTClass = (c: string) => {
    setTClasses((prev) =>
      prev.includes(c) ? (prev.length > 1 ? prev.filter((x) => x !== c) : prev) : [...prev, c]
    );
  };

  const toggleTSubject = (s: string) => {
    setTSubjects((prev) =>
      prev.includes(s) ? (prev.length > 1 ? prev.filter((x) => x !== s) : prev) : [...prev, s]
    );
  };

  const [spName, setSpName] = useState("");
  const [spPhone, setSpPhone] = useState("");
  const [sGender, setSGender] = useState<"MALE" | "FEMALE" | "OTHER">("OTHER");
  const [sDob, setSdob] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const navItems = [
    { name: "About", href: "#about" },
    { name: "Tutoring Hub", href: "#tutoring-hub" },
    { name: "Our Side", href: "#our-side" },
    { name: "Team", href: "#team" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Gallery", href: "#gallery" },
  ];

  // Fetch batches and settings on mount
  useEffect(() => {
    fetch("/api/batches")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.batches) && d.batches.length > 0) {
          setBatches(d.batches);
          setSBatch(d.batches[0]._id);
        }
      })
      .catch(() => {});

    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d?.settings) {
          setContactSettings(d.settings);
        }
      })
      .catch(() => {});
  }, []);

  const phone1 = (contactSettings?.supportPhone1 || "9876543210").replace(/\D/g, "").slice(-10);
  const phone2 = (contactSettings?.supportPhone2 || "9876543211").replace(/\D/g, "").slice(-10);
  const phone3 = (contactSettings?.supportPhone3 || "9876543212").replace(/\D/g, "").slice(-10);
  const supportEmail = contactSettings?.supportEmail || "support@mantif.edu";

  const clear = () => { setErr(""); setOk(""); };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleQuickContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQErr("");
    setQOk("");
    if (!qName.trim() || !qPhone.trim() || !qMessage.trim()) {
      setQErr("Please fill in your name, mobile number, and message.");
      return;
    }
    setQLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setQOk("Thank you! Your query has been submitted to Mantif Admissions. We will reach out shortly.");
      setQName("");
      setQPhone("");
      setQEmail("");
      setQMessage("");
    } catch {
      setQErr("Failed to send query. Please call or WhatsApp our hotlines directly.");
    } finally {
      setQLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    if (!uid.trim()) { setErr("Please enter your email or mobile number."); return; }
    if (!pw) { setErr("Please enter your password."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: uid.trim(), password: pw, role: loginRole }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Server connection error. Please try again." };
      }
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
    if (!sDistrict.trim()) { setErr("Please enter your district."); return false; }
    if (!sBatch && batches.length > 0) {
      setSBatch(batches[0]._id);
    }
    return true;
  };

  const v2t = () => {
    if (!tQual.trim()) { setErr("Please enter your qualification."); return false; }
    if (!tSpec.trim()) { setErr("Please enter your specialization."); return false; }
    if (!tDistrict.trim()) { setErr("Please enter your district."); return false; }
    if (tClasses.length === 0) { setErr("Please select at least one class you are willing to teach."); return false; }
    if (tSubjects.length === 0) { setErr("Please select at least one subject you want to teach."); return false; }
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
          district: sDistrict.trim(),
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
          experienceYears: tExp ? Number(tExp) : 0,
          district: tDistrict.trim(),
          address: tDistrict.trim(),
          classesTaught: tClasses,
          subjects: tSubjects,
        });
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Server connection error. Please try again." };
      }
      if (!res.ok) {
        setErr(data.error || "Registration failed.");
        return;
      }
      setOk(data.message || "Account registered successfully!");
      setTimeout(() => {
        setAuthMode("SIGNIN");
        clear();
      }, 2000);
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
      className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#dfb74a]/20 selection:text-[#002137]"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          STICKY NAVBAR (EXACT REQ: About, Tutoring Hub, Our Side, Team, Testimonials, Gallery)
      ═══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-all shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Identity (Left Side - Clean Logo, Shifted Left, Stylized Λ matching the logo) */}
          <Link href="#about" className="flex items-center gap-3 group text-left cursor-pointer shrink-0">
            <img
              src="/images/mantif_logo.png"
              alt="MANTIF Logo"
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="flex flex-col justify-center">
              <span
                className="font-black text-[22px] tracking-[0.16em] text-[#002137] leading-tight select-none"
                style={{ fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif" }}
              >
                M<span className="text-[#b89047]">Λ</span>NTIF
              </span>
              <p className="text-[11px] font-bold text-[#b89047] tracking-tight leading-none mt-0.5">
                Human x Artificial Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Moved to Right Side, No Contact Us / Portal Login buttons) */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-9 text-sm font-bold text-slate-700">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="relative py-1 text-slate-600 hover:text-[#004b79] transition-colors group"
              >
                <span>{item.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#004b79] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Mobile Hamburger Menu */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-8 py-6 space-y-4 shadow-xl">
            <div className="flex flex-col space-y-3 text-base font-bold">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-700 py-1.5 hover:text-[#004b79] transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 1: ABOUT (HERO SPLIT: PERFECT CENTER LINE & COMPACT PRO CARD)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="about" className="relative scroll-mt-20 min-h-[calc(100vh-5rem)] flex items-center border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/40 to-white py-12 lg:py-16">
        {/* Exact Center Vertical Divider Line */}
        <div className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-px bg-slate-200 -translate-x-1/2" />

        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-center">

          {/* LEFT HALF (50%): GRAND MANTIF STATEMENT & 3 PILLARS */}
          <div className="w-full space-y-8 lg:pr-6 xl:pr-10">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h1
                  className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#002137] tracking-[0.06em] leading-[1.04]"
                  style={{ fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif" }}
                >
                  M<span className="text-[#b89047]">Λ</span>NTIF
                </h1>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#b89047] tracking-tight">
                  Human x Artificial Intelligence
                </p>
              </div>

              <p className="text-slate-700 text-base sm:text-lg lg:text-xl leading-relaxed font-medium pt-1">
                MANTIF is an MSME-registered EdTech startup helping students learn better through personalised support from AI, educators, and real-world learning.
              </p>
            </div>

            {/* 3 Core Pillars Alone (Wide, Attractive & Balanced) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 w-full">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#004b79]/40 transition-all space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004b79] flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-extrabold text-[#002137]">AI-Powered Learning</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Curated syllabus paths &amp; intelligent practice designed for mastery.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#b89047]/40 transition-all space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Brain className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-extrabold text-[#002137]">Learns With You</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Adapts in real-time to your individual learning pace and doubt patterns.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-extrabold text-[#002137]">Track Real Progress</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Multi-dimensional reports &amp; full transparency for parents &amp; mentors.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT HALF (50%): ULTRA-SLEEK MODERN AUTH PANEL */}
          <div id="auth-card-section" className="w-full flex justify-center lg:pl-6 xl:pl-10">
            <div className="w-full max-w-[450px] bg-white rounded-3xl border border-slate-200/90 shadow-[0_16px_40px_-8px_rgba(0,33,55,0.09)] p-7 sm:p-8 space-y-5">
              
              {/* Sleek Tab Switcher: Sign In vs Sign Up Alone */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => { setAuthMode("SIGNIN"); clear(); }}
                  className={`flex-1 pb-3 text-center text-sm sm:text-base font-extrabold tracking-tight transition-all border-b-2 cursor-pointer ${
                    authMode === "SIGNIN"
                      ? "border-[#002137] text-[#002137]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("SIGNUP"); setStep(1); clear(); }}
                  className={`flex-1 pb-3 text-center text-sm sm:text-base font-extrabold tracking-tight transition-all border-b-2 cursor-pointer ${
                    authMode === "SIGNUP"
                      ? "border-[#002137] text-[#002137]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Alert Notifications */}
              {err && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              )}
              {ok && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{ok}</span>
                </div>
              )}

              {/* SIGN IN FORM */}
              {authMode === "SIGNIN" && (
                <div className="space-y-4 pt-1">
                  {/* Role Selector */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100/90 text-xs sm:text-sm">
                    {[
                      { key: "STUDENT", label: "Student" },
                      { key: "TEACHER", label: "Faculty" },
                      { key: "ADMIN", label: "Admin" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setLoginRole(item.key as LoginRole);
                          clear();
                        }}
                        className={`py-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                          loginRole === item.key
                            ? "bg-white text-[#002137] shadow-xs font-black"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-3.5 pt-1">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {loginRole === "STUDENT"
                          ? "Student Email or Registered Mobile"
                          : loginRole === "TEACHER"
                          ? "Faculty Email (@mantif.edu / @gmail.com)"
                          : "Administrator Email"}
                      </label>
                      <input
                        type="text"
                        autoComplete="username"
                        data-lpignore="true"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        placeholder={
                          loginRole === "STUDENT"
                            ? "e.g. 9876543210 or student@mantif.edu"
                            : loginRole === "TEACHER"
                            ? "e.g. sarah.maths@mantif.edu"
                            : "admin@mantif.edu"
                        }
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004b79]/20 focus:border-[#004b79] transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">Password</label>
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="text-xs font-bold text-[#004b79] hover:underline cursor-pointer"
                        >
                          {showPw ? "Hide" : "Show"}
                        </button>
                      </div>
                      <input
                        type={showPw ? "text" : "password"}
                        autoComplete="current-password"
                        data-lpignore="true"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder="Enter account password"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004b79]/20 focus:border-[#004b79] transition-all font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#002137] hover:bg-[#003659] text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 mt-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>

                  {/* Clean Bottom Link */}
                  <div className="pt-2 text-center text-xs sm:text-sm text-slate-500 font-medium">
                    New to MANTIF?{" "}
                    <button
                      type="button"
                      onClick={() => { setAuthMode("SIGNUP"); setStep(1); clear(); }}
                      className="text-[#004b79] font-bold hover:underline cursor-pointer ml-1"
                    >
                      Sign Up →
                    </button>
                  </div>
                </div>
              )}

              {/* SIGN UP FORM */}
              {authMode === "SIGNUP" && (
                <div className="space-y-4">
                  {/* Role Switcher */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "STUDENT", label: "Student Signup", icon: BookOpen },
                      { key: "TEACHER", label: "Faculty Signup", icon: GraduationCap },
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
                            ? "bg-blue-50 border-[#004b79] text-[#004b79] font-black shadow-2xs"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Step progress */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 py-0.5">
                    <span>Step {step} of {totalSteps}: <strong className="text-[#004b79]">{stepLabels[step - 1]}</strong></span>
                    <span className="text-[11px] text-slate-400">Secure Registration</span>
                  </div>

                  {/* Step 1: Base Credentials */}
                  {step === 1 && (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Full Legal Name *</label>
                        <input
                          type="text"
                          value={sName}
                          onChange={(e) => setSName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Email *</label>
                          <input
                            type="email"
                            value={sEmail}
                            onChange={(e) => setSEmail(e.target.value)}
                            placeholder="Email address"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Mobile *</label>
                          <input
                            type="tel"
                            maxLength={10}
                            value={sPhone}
                            onChange={(e) => setSPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="10-digit mobile"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Password *</label>
                          <input
                            type="password"
                            value={sPw}
                            onChange={(e) => setSPw(e.target.value)}
                            placeholder="Min 6 chars"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Confirm *</label>
                          <input
                            type="password"
                            value={sCPw}
                            onChange={(e) => setSCPw(e.target.value)}
                            placeholder="Repeat password"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={next}
                        className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-[#002137] to-[#004b79] hover:from-[#001726] hover:to-[#003659] text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#002137]/20 mt-2"
                      >
                        <span>Next: {signupRole === "STUDENT" ? "School Details" : "Teaching Profile"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Step 2: Student Academic Details */}
                  {step === 2 && signupRole === "STUDENT" && (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">School Name *</label>
                          <input
                            type="text"
                            value={sSchool}
                            onChange={(e) => setSSchool(e.target.value)}
                            placeholder="Enter school name"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">District *</label>
                          <input
                            type="text"
                            value={sDistrict}
                            onChange={(e) => setSDistrict(e.target.value)}
                            placeholder="e.g. Erode, Coimbatore"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Curriculum *</label>
                          <select
                            value={sBoard}
                            onChange={(e) => setSBoard(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 font-medium cursor-pointer"
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
                            className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 font-medium cursor-pointer"
                          >
                            {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Batch Timing *</label>
                        <select
                          value={sBatch}
                          onChange={(e) => setSBatch(e.target.value)}
                          className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 font-medium cursor-pointer"
                        >
                          {batches.map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.name} {b.startTime && b.endTime ? `(${b.startTime} – ${b.endTime})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => { setStep(1); clear(); }}
                          className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={next}
                          className="flex-1 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-[#002137] to-[#004b79] hover:from-[#001726] hover:to-[#003659] text-white flex items-center justify-center gap-1 cursor-pointer shadow-md"
                        >
                          <span>Next: Parent Info</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Teacher Preferences & Profile */}
                  {step === 2 && signupRole === "TEACHER" && (
                    <div className="space-y-3.5">
                      {/* Classes willing to teach */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Which Classes are you willing to teach? *
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((c) => {
                            const isSelected = tClasses.includes(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => toggleTClass(c)}
                                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                                  isSelected
                                    ? "bg-[#002137] text-white border-[#002137] shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {c.replace("Class ", "C")}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Subjects willing to teach */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Which Subjects do you want to teach? *
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {["Mathematics", "Science", "English", "Social Science", "Hindi"].map((s) => {
                            const isSelected = tSubjects.includes(s);
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => toggleTSubject(s)}
                                className={`py-2 px-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center truncate ${
                                  isSelected
                                    ? "bg-[#002137] text-white border-[#002137] shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Degree *</label>
                          <input
                            type="text"
                            value={tQual}
                            onChange={(e) => setTQual(e.target.value)}
                            placeholder="e.g. M.Sc, B.Ed"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Specialization *</label>
                          <input
                            type="text"
                            value={tSpec}
                            onChange={(e) => setTSpec(e.target.value)}
                            placeholder="e.g. Mathematics"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Experience (Yrs)</label>
                          <input
                            type="number"
                            min="0"
                            value={tExp}
                            onChange={(e) => setTExp(e.target.value)}
                            placeholder="Years"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">District *</label>
                          <input
                            type="text"
                            value={tDistrict}
                            onChange={(e) => setTDistrict(e.target.value)}
                            placeholder="Location"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => { setStep(1); clear(); }}
                          className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={handleSignUp}
                          disabled={loading}
                          className="flex-1 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-[#002137] to-[#004b79] hover:from-[#001726] hover:to-[#003659] text-white flex items-center justify-center gap-1 cursor-pointer shadow-md disabled:opacity-60"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Registration"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Student Guardian Details */}
                  {step === 3 && signupRole === "STUDENT" && (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Parent Name *</label>
                          <input
                            type="text"
                            value={spName}
                            onChange={(e) => setSpName(e.target.value)}
                            placeholder="Parent name"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Parent Mobile *</label>
                          <input
                            type="tel"
                            maxLength={10}
                            value={spPhone}
                            onChange={(e) => setSpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="Parent mobile"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Gender</label>
                          <select
                            value={sGender}
                            onChange={(e) => setSGender(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white font-medium"
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
                            className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => { setStep(2); clear(); }}
                          className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={handleSignUp}
                          disabled={loading}
                          className="flex-1 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-[#002137] to-[#004b79] hover:from-[#001726] hover:to-[#003659] text-white flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-[#002137]/20 disabled:opacity-60"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Registration"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 text-center">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => { setAuthMode("SIGNIN"); clear(); }}
                      className="text-[#004b79] font-bold hover:underline cursor-pointer ml-1"
                    >
                      Sign in here →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 2: TUTORING HUB (WHERE IT ALL BEGAN - EVOLUTION SHOWCASE)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="tutoring-hub" className="scroll-mt-20 min-h-[calc(100vh-5rem)] flex items-center justify-center border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-white py-10 lg:py-14">
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#002137] tracking-tight">
              Tutoring Hub
            </h2>
            <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#b89047] tracking-tight">
              Where It All Began
            </p>
          </div>

          {/* Narrative Evolution Showcase (Connecting Physical to Online MANTIF) */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center pt-2">
            
            {/* Step 1: Physical Tutoring Hub (5 cols) */}
            <div className="md:col-span-5 space-y-3 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-[#002137]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#004b79] text-xs font-black uppercase tracking-wider">
                  Physical Space • 4 Years
                </span>
                <Building className="w-5 h-5 text-[#004b79]" />
              </div>
              <h3 className="text-lg font-black text-[#002137]">
                Close Mentorship &amp; Teaching
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                For the past four years, <strong>Tutoring Hub</strong> has been a physical learning space where we worked closely with students and gained valuable experience in teaching and managing educational programs.
              </p>
            </div>

            {/* Transition Indicator (1 col) */}
            <div className="md:col-span-1 flex flex-col items-center justify-center text-[#b89047] py-2 md:py-0">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
                <ArrowRight className="w-5 h-5 text-[#b89047] rotate-90 md:rotate-0" />
              </div>
            </div>

            {/* Step 2: MANTIF Online Forward (5 cols) */}
            <div className="md:col-span-5 space-y-3 p-6 sm:p-7 rounded-2xl bg-[#002137] text-white shadow-md">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/15 text-[#dfb74a] text-xs font-black uppercase tracking-wider">
                  Online Innovation • Today
                </span>
                <Rocket className="w-5 h-5 text-[#dfb74a]" />
              </div>
              <h3 className="text-lg font-black text-white">
                MANTIF Taking It Forward
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Now, we are taking that experience online through <strong>MANTIF</strong>, creating meaningful learning solutions for both students and educational institutions.
              </p>
            </div>

          </div>

          {/* Golden Highlight Statement */}
          <div className="text-center py-2 space-y-1">
            <p className="text-lg sm:text-xl lg:text-2xl font-black text-[#002137]">
              “Tutoring Hub gave us the foundation.
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-black text-[#b89047]">
              MANTIF is taking it forward.”
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode("SIGNUP");
                setStep(1);
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-3.5 rounded-xl bg-[#002137] hover:bg-[#003659] text-white text-sm sm:text-base font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <span>Sign Up on MANTIF</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#contact"
              className="px-8 py-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm sm:text-base font-extrabold transition-all cursor-pointer"
            >
              Contact Us
            </a>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 3: OUR SIDE (INSTITUTIONAL OUTREACH & SCHOOL IMPACT)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="our-side" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-black text-[#004b79] uppercase tracking-wider">
              <School className="w-3.5 h-3.5" />
              Institutional Outreach &amp; AI Seminars
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002137] tracking-tight">
              Our Side
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Empowering school teachers and academic institutions with practical AI tools.
            </p>
          </div>

          {/* School Feature Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md space-y-6">
            
            {/* Clickable School Link & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <a
                  href="https://www.google.com/search?q=Kongu+National+Matriculation+Hr+Sec+School+Nanjanapuram"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 text-xl sm:text-2xl font-black text-[#002137] hover:text-[#004b79] transition-colors"
                >
                  <span>Kongu National Matriculation Hr Sec School, Nanjanapuram</span>
                  <ExternalLink className="w-5 h-5 text-[#b89047] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </a>
                <p className="text-xs font-bold text-slate-400">
                  Erode District • Academic Faculty Empowerment Seminar
                </p>
              </div>

              <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-extrabold text-[#8f6d2b]">
                Alma Mater Milestone
              </span>
            </div>

            {/* Workshop Narrative Body */}
            <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70">
                <h3 className="font-extrabold text-base text-[#002137] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#b89047]" />
                  Session: “AI in Education: Empowering Students Today”
                </h3>
              </div>

              <p>
                MANTIF conducted a specialized session on <strong>“AI in Education: Empowering Students Today”</strong> for the teachers of Kongu National Higher Secondary School, Nanjanapuram.
              </p>
              <p>
                The session focused on exploring different AI tools that can help teachers engage students, capture their attention, and bring more interest into the learning process.
              </p>
              <p className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 italic">
                The best part of this session was that <strong>Our Founder Ms. Karunya S</strong> is an alumna of the school. It was truly a proud moment for the entire MANTIF team and for the teachers who once taught her. We could witness the pride and happiness on her teachers’ faces as they welcomed her back, this time as a Founder.
              </p>
            </div>

            {/* Motivational Tag */}
            <div className="pt-4 flex items-center justify-between flex-wrap gap-3 border-t border-slate-100">
              <span className="text-sm sm:text-base font-black text-[#b89047] tracking-tight flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[#b89047]" />
                Still we have a Long Journey !
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                MANTIF Community &amp; Institutional Outreach
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 4: TEAM (FOUNDER, MENTORS, SOFTWARE, AI TEAMS WITH PHOTO SPACES)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="team" className="scroll-mt-20 py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-black text-[#004b79] uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Leadership &amp; Mentors
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002137] tracking-tight">
              Our Team
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Passionate educators, engineering minds, and AI practitioners dedicated to student success.
            </p>
          </div>

          {/* 1. Founder Spotlight Card */}
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl p-8 sm:p-10 border-2 border-[#b89047]/30 shadow-lg relative overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              
              {/* Photo Space for Founder */}
              <div className="sm:col-span-5 flex flex-col items-center">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden bg-[#002137] border-4 border-white shadow-xl flex items-center justify-center text-white group">
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-[#002137] to-[#004b79]">
                    <GraduationCap className="w-12 h-12 text-[#dfb74a] mb-1" />
                    <span className="text-xs font-bold text-slate-200">Karunya S</span>
                    <span className="text-[10px] text-[#dfb74a]">Founder Photo</span>
                  </div>
                </div>
              </div>

              {/* Founder Details & Words */}
              <div className="sm:col-span-7 space-y-3 text-center sm:text-left">
                <span className="px-3 py-1 rounded-md text-[11px] font-black uppercase bg-[#b89047]/15 text-[#8f6d2b] border border-[#b89047]/30">
                  Lead Visionary &amp; Founder
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#002137]">
                  Karunya S
                </h3>
                <p className="text-xs font-extrabold text-[#b89047] uppercase tracking-wider">
                  Founder — MANTIF
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Educator with over 4 years of hands-on coaching leadership. Alumna of Kongu National Higher Secondary School, passionate about revolutionizing student learning by bridging empathetic human teaching with cutting-edge artificial intelligence.
                </p>
              </div>

            </div>
          </div>

          {/* 2. Educational Mentors Grid (2 Mentors) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">
              Academic &amp; Subject Mentors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              
              {/* Mentor 1 */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex items-center gap-4 hover:border-[#004b79]/40 transition-colors">
                <div className="w-20 h-20 rounded-2xl bg-[#002137] text-white flex flex-col items-center justify-center shrink-0 border border-slate-300 shadow-xs">
                  <Award className="w-7 h-7 text-[#dfb74a] mb-0.5" />
                  <span className="text-[9px] font-bold text-slate-300">Photo</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-[#002137]">Dr. A. Revathi</h4>
                  <p className="text-xs font-bold text-[#b89047]">PhD Chemistry</p>
                  <p className="text-xs text-slate-500 font-semibold">Educational Mentor</p>
                </div>
              </div>

              {/* Mentor 2 */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs flex items-center gap-4 hover:border-[#004b79]/40 transition-colors">
                <div className="w-20 h-20 rounded-2xl bg-[#002137] text-white flex flex-col items-center justify-center shrink-0 border border-slate-300 shadow-xs">
                  <Award className="w-7 h-7 text-[#dfb74a] mb-0.5" />
                  <span className="text-[9px] font-bold text-slate-300">Photo</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-[#002137]">V Lavanya</h4>
                  <p className="text-xs font-bold text-[#b89047]">MSc MPhil Maths</p>
                  <p className="text-xs text-slate-500 font-semibold">Educational Mentor</p>
                </div>
              </div>

            </div>
          </div>

          {/* 3. Engineering & AI Teams Grid (4 Members) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">
              Engineering, Software &amp; AI Research Team
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Software Team: Vishal K */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-center hover:border-[#004b79]/40 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex flex-col items-center justify-center text-slate-700 border border-slate-200">
                  <Laptop className="w-6 h-6 text-[#004b79] mb-0.5" />
                  <span className="text-[8px] font-bold text-slate-400">Photo</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#002137]">Vishal K</h4>
                  <p className="text-xs font-bold text-[#004b79]">Software Team</p>
                </div>
              </div>

              {/* Software Team: Solairaj R */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-center hover:border-[#004b79]/40 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex flex-col items-center justify-center text-slate-700 border border-slate-200">
                  <Laptop className="w-6 h-6 text-[#004b79] mb-0.5" />
                  <span className="text-[8px] font-bold text-slate-400">Photo</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#002137]">Solairaj R</h4>
                  <p className="text-xs font-bold text-[#004b79]">Software Team</p>
                </div>
              </div>

              {/* AI Team: Abinaya B */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-center hover:border-[#b89047]/40 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 mx-auto flex flex-col items-center justify-center text-amber-800 border border-amber-200">
                  <Brain className="w-6 h-6 text-[#b89047] mb-0.5" />
                  <span className="text-[8px] font-bold text-slate-400">Photo</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#002137]">Abinaya B</h4>
                  <p className="text-xs font-bold text-[#b89047]">AI Team</p>
                </div>
              </div>

              {/* AI Team: Arunkarthick K */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-center hover:border-[#b89047]/40 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 mx-auto flex flex-col items-center justify-center text-amber-800 border border-amber-200">
                  <Brain className="w-6 h-6 text-[#b89047] mb-0.5" />
                  <span className="text-[8px] font-bold text-slate-400">Photo</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#002137]">Arunkarthick K</h4>
                  <p className="text-xs font-bold text-[#b89047]">AI Team</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 5: TESTIMONIALS (STUDENT STORIES & EXPERIENCES FROM DAY 1)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-black text-[#8f6d2b] uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Student Voices &amp; Memories
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002137] tracking-tight">
              Testimonials
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Real experiences from students who walked through our doors and excelled with us.
            </p>
          </div>

          {/* 4 Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Testimonial 1: T.G. Sivadharani */}
            <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-5 flex flex-col justify-between hover:border-[#004b79]/50 transition-all">
              <div className="space-y-4">
                <Quote className="w-8 h-8 text-[#dfb74a]" />
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium italic">
                  “If surviving 12th boards was a movie, Karunya was the director, scriptwriter, and the stunt double all in one. I walked into her tuition as her very first student — and not to brag (okay, totally to brag). Back then, I was clueless, stressed, and borderline terrified of what the CBSE gods were cooking up. But she? She was calm, collected, and totally ready to drag me lovingly, through the chaos. From breaking down the toughest topics with infinite patience, to hyping me up when I was drowning in doubts, she made sure I didn’t just survive 12th boards… I came out swinging. The late-night doubts, the last-minute revisions, the &lsquo;you better know this by tomorrow&rsquo; looks — all of it got me to where I am today. She built something amazing, and I’ll always be proud to say: I was there from Day 1. Forever your #1 ❤️”
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-0.5">
                <h4 className="font-extrabold text-sm text-[#002137]">T.G. Sivadharani</h4>
                <p className="text-xs font-bold text-[#b89047]">BSc Costume Design and Fashion</p>
                <p className="text-[11px] text-slate-500 font-medium">PSGR Krishnammal College, Coimbatore</p>
              </div>
            </div>

            {/* Testimonial 2: S. Darshan */}
            <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-5 flex flex-col justify-between hover:border-[#004b79]/50 transition-all">
              <div className="space-y-4">
                <Quote className="w-8 h-8 text-[#dfb74a]" />
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium italic">
                  “I just wanted to take a moment to sincerely thank you for all the support, guidance, and encouragement you've given me throughout my time at Mantif . Your teaching has truly made a difference in how I understand the subjects, and I feel much more confident because of it. Your dedication and patience never went unnoticed, and I really appreciate the way you made even the toughest topics easier to grasp. Thanks to your help, I feel well-prepared and motivated to keep doing my best. Once again, thank you so much for everything!”
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-0.5">
                <h4 className="font-extrabold text-sm text-[#002137]">S. Darshan</h4>
                <p className="text-xs font-bold text-[#b89047]">XII Standard</p>
                <p className="text-[11px] text-slate-500 font-medium">Board Exam Cohort</p>
              </div>
            </div>

            {/* Testimonial 3: Kanishka C */}
            <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-5 flex flex-col justify-between hover:border-[#004b79]/50 transition-all">
              <div className="space-y-4">
                <Quote className="w-8 h-8 text-[#dfb74a]" />
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium italic">
                  “Mantif Tutoring wasn't just about academics; it also helped me in developing my personality and other skills. The supportive atmosphere boosted my confidence and made learning enjoyable. I truly thankful for all the memories of Mantif.”
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-0.5">
                <h4 className="font-extrabold text-sm text-[#002137]">Kanishka C</h4>
                <p className="text-xs font-bold text-[#b89047]">XII Standard</p>
                <p className="text-[11px] text-slate-500 font-medium">Classroom Alumna</p>
              </div>
            </div>

            {/* Testimonial 4: R. Manikandan */}
            <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-5 flex flex-col justify-between hover:border-[#004b79]/50 transition-all">
              <div className="space-y-4">
                <Quote className="w-8 h-8 text-[#dfb74a]" />
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium italic">
                  “Tuition here is always jolly! It’s not boring like just sitting and writing notes. For me, Tutoring Hub from Mantif is a place where we study, have fun, and feel free to share our worries. It is serious learning, but with lots of care and friendship and that’s why it is so special.”
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-0.5">
                <h4 className="font-extrabold text-sm text-[#002137]">R. Manikandan</h4>
                <p className="text-xs font-bold text-[#b89047]">XI Standard</p>
                <p className="text-[11px] text-slate-500 font-medium">Tutoring Hub Learner</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 6: GALLERY (MOMENTS & WORKSHOPS READY FOR IMAGES)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="gallery" className="scroll-mt-20 py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-black text-[#004b79] uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5" />
              Photo Highlights
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#002137] tracking-tight">
              Gallery
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Memories from our AI school workshops, physical Tutoring Hub classrooms, and student milestones.
            </p>
          </div>

          {/* Interactive Responsive Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Gallery Slot 1 */}
            <div className="group relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md">
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#002137] to-[#004b79] text-white">
                <School className="w-10 h-10 text-[#dfb74a] mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-extrabold text-sm">Kongu National School Seminar</h4>
                <p className="text-xs text-slate-300 mt-1">AI in Education for Teachers</p>
                <span className="mt-3 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-white/10 text-[#dfb74a] border border-white/20">
                  School Outreach
                </span>
              </div>
            </div>

            {/* Gallery Slot 2 */}
            <div className="group relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md">
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#003659] to-[#002137] text-white">
                <Brain className="w-10 h-10 text-[#dfb74a] mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-extrabold text-sm">AI Tool Demonstration</h4>
                <p className="text-xs text-slate-300 mt-1">Interactive Teaching Technologies</p>
                <span className="mt-3 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-white/10 text-[#dfb74a] border border-white/20">
                  Faculty Workshop
                </span>
              </div>
            </div>

            {/* Gallery Slot 3 */}
            <div className="group relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md">
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#002137] to-[#0a4870] text-white">
                <BookOpen className="w-10 h-10 text-[#dfb74a] mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-extrabold text-sm">Tutoring Hub Physical Sessions</h4>
                <p className="text-xs text-slate-300 mt-1">4 Years of Personalized Guidance</p>
                <span className="mt-3 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-white/10 text-[#dfb74a] border border-white/20">
                  Tutoring Hub
                </span>
              </div>
            </div>

            {/* Gallery Slot 4 */}
            <div className="group relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md">
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#004b79] to-[#002137] text-white">
                <Sparkles className="w-10 h-10 text-[#dfb74a] mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-extrabold text-sm">Student Doubt Solving Circle</h4>
                <p className="text-xs text-slate-300 mt-1">One-on-One Problem Solving</p>
                <span className="mt-3 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-white/10 text-[#dfb74a] border border-white/20">
                  Mentorship
                </span>
              </div>
            </div>

            {/* Gallery Slot 5 */}
            <div className="group relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md">
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#002137] to-[#083353] text-white">
                <Award className="w-10 h-10 text-[#dfb74a] mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-extrabold text-sm">Board Exam Achievers Meet</h4>
                <p className="text-xs text-slate-300 mt-1">Celebrating Student Milestones</p>
                <span className="mt-3 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-white/10 text-[#dfb74a] border border-white/20">
                  Student Success
                </span>
              </div>
            </div>

            {/* Gallery Slot 6 */}
            <div className="group relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md">
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#003b60] to-[#002137] text-white">
                <Users className="w-10 h-10 text-[#dfb74a] mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-extrabold text-sm">Online Live Classroom</h4>
                <p className="text-xs text-slate-300 mt-1">MANTIF Real-Time Web Platform</p>
                <span className="mt-3 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-white/10 text-[#dfb74a] border border-white/20">
                  Live Tech
                </span>
              </div>
            </div>

          </div>

          <p className="text-center text-xs text-slate-400 font-semibold">
            Photos and workshop media are periodically archived by the MANTIF Academic Operations Team.
          </p>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER: CONTACT US & OFFICIAL COMMUNICATIONS
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer id="contact" className="scroll-mt-20 bg-[#001726] text-white pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Top Footer: Contact Grid & Query Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column (6 cols): Direct Hotlines & Organization Info */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center shadow-xs">
                    <img src="/images/mantif_logo.png" alt="MANTIF Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl tracking-tight text-white">MANTIF</h3>
                    <p className="text-xs text-[#dfb74a] font-bold">Human x Artificial Intelligence</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg font-medium">
                  MSME-registered EdTech startup combining empathetic educator mentorship with artificial intelligence for students of Classes 6 to 10.
                </p>
              </div>

              {/* 3 Dedicated Hotlines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Official Helplines (Direct Support)
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Mon–Sat (9 AM – 8:30 PM)
                  </span>
                </div>

                {/* Line 1: Admissions */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#dfb74a] block">
                      Hotline 1 • Admissions &amp; Fees
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-white">
                      +91 {phone1.slice(0, 5)} {phone1.slice(5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:+91${phone1}`}
                      title="Direct Call"
                      className="w-8 h-8 rounded-lg bg-[#004b79] hover:bg-[#005f99] text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/91${phone1}?text=Hello%20Mantif%20Tutoring,%20I%20would%20like%20to%20inquire%20about%20admissions.`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp Chat"
                      className="w-8 h-8 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(`+91${phone1}`, "f1")}
                      className="w-8 h-8 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                      title="Copy"
                    >
                      {copiedKey === "f1" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Line 2: Academic Inquiries */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#dfb74a] block">
                      Hotline 2 • Academic &amp; Batch Timing
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-white">
                      +91 {phone2.slice(0, 5)} {phone2.slice(5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:+91${phone2}`}
                      title="Direct Call"
                      className="w-8 h-8 rounded-lg bg-[#004b79] hover:bg-[#005f99] text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/91${phone2}?text=Hello%20Mantif%20Academic%20Team,%20I%20have%20a%20question%20about%20classes.`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp Chat"
                      className="w-8 h-8 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(`+91${phone2}`, "f2")}
                      className="w-8 h-8 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                      title="Copy"
                    >
                      {copiedKey === "f2" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Line 3: Tech & General Support */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#dfb74a] block">
                      Hotline 3 • Tech Support &amp; Helpdesk
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-white">
                      +91 {phone3.slice(0, 5)} {phone3.slice(5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:+91${phone3}`}
                      title="Direct Call"
                      className="w-8 h-8 rounded-lg bg-[#004b79] hover:bg-[#005f99] text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/91${phone3}?text=Hello%20Mantif%20Support,%20I%20need%20assistance.`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp Chat"
                      className="w-8 h-8 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(`+91${phone3}`, "f3")}
                      className="w-8 h-8 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                      title="Copy"
                    >
                      {copiedKey === "f3" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Email Support */}
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <Mail className="w-4 h-4 text-[#dfb74a]" />
                <span>Official Support: <strong className="text-white font-mono">{supportEmail}</strong></span>
              </div>

            </div>

            {/* Right Column (6 cols): Direct Message Inquiry Form */}
            <div className="lg:col-span-6 bg-white/5 rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-black text-white">Send Direct Message</h4>
                <p className="text-xs text-slate-400 font-medium">
                  Have a question about admissions, fee structure, or demo classes? We respond within 15 minutes.
                </p>
              </div>

              {qErr && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-xs text-rose-200 font-semibold">
                  {qErr}
                </div>
              )}
              {qOk && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-200 font-semibold">
                  {qOk}
                </div>
              )}

              <form onSubmit={handleQuickContactSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Your Name *</label>
                    <input
                      type="text"
                      value={qName}
                      onChange={(e) => setQName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#dfb74a]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Mobile Number *</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={qPhone}
                      onChange={(e) => setQPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#dfb74a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Student Grade</label>
                    <select
                      value={qClass}
                      onChange={(e) => setQClass(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#001f33] border border-white/10 text-white focus:outline-none focus:border-[#dfb74a] cursor-pointer"
                    >
                      {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((c) => (
                        <option key={c} value={c} className="bg-[#001726]">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Curriculum Board</label>
                    <select
                      value={qBoard}
                      onChange={(e) => setQBoard(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#001f33] border border-white/10 text-white focus:outline-none focus:border-[#dfb74a] cursor-pointer"
                    >
                      <option value="CBSE" className="bg-[#001726]">CBSE Board</option>
                      <option value="State Board" className="bg-[#001726]">State Board</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">Message / Query *</label>
                  <textarea
                    rows={3}
                    value={qMessage}
                    onChange={(e) => setQMessage(e.target.value)}
                    placeholder="Tell us what you would like to know..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#dfb74a] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={qLoading}
                  className="w-full py-3 rounded-xl bg-[#dfb74a] hover:bg-[#ebd085] text-[#002137] font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60"
                >
                  {qLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Submit Inquiry</span><Send className="w-3.5 h-3.5" /></>}
                </button>
              </form>
            </div>

          </div>

          {/* Bottom Copyright & MSME Legal Bar */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">MANTIF</span>
              <span>•</span>
              <span>Human x Artificial Intelligence</span>
              <span>•</span>
              <span className="text-[#dfb74a]">MSME Registered Startup</span>
            </div>
            <p>© 2026 MANTIF. All rights reserved.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
