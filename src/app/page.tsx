"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearAuthAndCaches } from "@/lib/api-cache";
import {
  AlertCircle, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, ChevronRight, ChevronLeft, BookOpen, GraduationCap,
  Award, Shield, Users, Clock, Check, Phone, PhoneCall,
  Mail, MapPin, Copy, MessageSquare, Send, Sparkles,
  Building, ExternalLink, Quote, Heart, Cpu, Brain,
  Compass, School, UserCheck, Star, Image as ImageIcon,
  Menu, X, Laptop, Rocket, Maximize2, Play, Video, Film,
  ChevronDown, ChevronUp, Plus
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

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function YouTubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function XTwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function getEmbedVideoUrl(url: string) {
  if (!url) return "";
  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }
  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }
  if (url.includes("youtube.com/embed/")) {
    return url;
  }
  return url;
}

// ─── Our Side / Schools Outreach List (Easily Add More Schools Here) ───
const outreachSchools = [
  {
    id: "kongu-school",
    name: "Kongu National Matriculation Hr Sec School, Nanjanapuram",
    district: "Erode District",
    tag: "Academic Faculty Empowerment Seminar",
    sessionTitle: "AI in Education: Empowering Students Today",
    bannerImage: "/images/ai_seminar_banner.png",
    subtitle: "From Everyday AI Tools to Transformative Learning Experiences",
    summary:
      "MANTIF conducted a specialized session on “AI in Education: Empowering Students Today” for the teachers of Kongu National Higher Secondary School, Nanjanapuram.",
    description:
      "The session focused on exploring different AI tools that can help teachers engage students, capture their attention, and bring more interest into the learning process.",
    milestoneTitle: "Alma Mater Milestone",
    milestoneQuote:
      "The best part of this session was that Our Founder Ms. Karunya S is an alumini of the school. It was truly a proud moment for the entire MANTIF team and for the teachers who once taught her. We could witness the pride and happiness on her teachers’ faces as they welcomed her back, this time as a Founder.",
    schoolUrl: "https://www.google.com/search?q=Kongu+National+Matriculation+Hr+Sec+School+Nanjanapuram",
    videoTitle1: "Session Video 1: Faculty AI Workshop & Teacher Participation",
    videoUrl1: "/videos/session_video_2.mp4",
    videoTitle2: "Session Video 2: Founder Address & Live Demonstration",
    videoUrl2: "/videos/session_video_1.mp4",
  },
  // To add another school, simply copy and paste the block below:
  /*
  {
    id: "next-school-id",
    name: "Next School / Institution Name Here",
    district: "District / City",
    tag: "Faculty AI Workshop / Seminar",
    sessionTitle: "Session Title Here",
    summary: "Brief overview of what MANTIF conducted for this school.",
    description: "Detailed session contents, AI tools introduced, and outcomes.",
    milestoneTitle: "Alma Mater Milestone",
    milestoneQuote: "Memorable milestone quote or key reflection from this session.",
    schoolUrl: "https://school-website-or-link.com",
    videoTitle1: "Session Video 1: Workshop Highlights",
    videoUrl1: "",
    videoTitle2: "Session Video 2: Interactive Q&A",
    videoUrl2: "",
  },
  */
];

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

  // Gallery Lightbox Modal State
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number | null>(null);

  // Our Side / Schools Section State
  const [selectedSchoolModal, setSelectedSchoolModal] = useState<any | null>(null);
  const [customVideoUrls, setCustomVideoUrls] = useState<Record<string, string>>({});
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideoSlotKey, setActiveVideoSlotKey] = useState("");
  const [activeVideoSlotLabel, setActiveVideoSlotLabel] = useState("");
  const [videoInputUrl, setVideoInputUrl] = useState("");
  const [playingVideoSlotId, setPlayingVideoSlotId] = useState<string | null>(null);
  const [fullscreenVideo, setFullscreenVideo] = useState<{ url: string; title: string } | null>(null);

  const handleSaveVideoUrl = () => {
    if (activeVideoSlotKey && videoInputUrl.trim()) {
      setCustomVideoUrls((prev) => ({ ...prev, [activeVideoSlotKey]: videoInputUrl.trim() }));
      setPlayingVideoSlotId(activeVideoSlotKey);
      setFullscreenVideo({
        url: videoInputUrl.trim(),
        title: activeVideoSlotLabel || "School Session Video",
      });
      setVideoModalOpen(false);
      setVideoInputUrl("");
    }
  };

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
      .catch(() => { });

    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d?.settings) {
          setContactSettings(d.settings);
        }
      })
      .catch(() => { });
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
      clearAuthAndCaches();
      if (data.token && typeof window !== "undefined") {
        try {
          localStorage.setItem("acuity_auth_token", data.token);
          if (data.user?.name) localStorage.setItem("acuity_user_name", data.user.name);
          if (data.user?.role) localStorage.setItem("acuity_user_role", data.user.role);
          sessionStorage.setItem("acuity_auth_token", data.token);
        } catch { }
      }
      setOk("Login verified. Redirecting…");
      setTimeout(() => {
        const resolvedRole = data.user?.role || loginRole;
        const targetUrl =
          resolvedRole === "TEACHER"
            ? "/teacher/dashboard"
            : resolvedRole === "ADMIN"
              ? "/admin/dashboard"
              : "/student/dashboard";
        window.location.href = targetUrl;
      }, 250);
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
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Skip to Main Content for Accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#002137] focus:text-white focus:rounded-xl focus:shadow-2xl focus:font-bold focus:outline-none focus:ring-2 focus:ring-[#dfb74a]"
      >
        Skip to main content
      </a>

      {/* ═══════════════════════════════════════════════════════════════════════
          STICKY NAVBAR (EXACT REQ: About, Tutoring Hub, Our Side, Team, Testimonials, Gallery)
      ═══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-all shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-20 flex items-center justify-between">

          {/* Logo & Brand Identity (Left Side - Clean Logo, Shifted Left, Stylized Λ matching the logo) */}
          <Link href="#about" className="flex items-center gap-3.5 group text-left cursor-pointer shrink-0">
            <img
              src="/images/mantif_logo.png"
              alt="MANTIF Logo"
              width={50}
              height={50}
              fetchPriority="high"
              className="w-12 h-12 sm:w-[50px] sm:h-[50px] object-contain group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="flex flex-col justify-center">
              <span
                className="font-black text-[22px] tracking-[0.16em] text-[#002137] leading-tight select-none"
                style={{ fontFamily: "'Montserrat', 'Outfit', 'Inter', sans-serif" }}
              >
                M<span className="text-[#8c6924]">Λ</span>NTIF
              </span>
              <p className="text-[11px] font-bold text-[#8c6924] tracking-tight leading-none mt-0.5">
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
            className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
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

      {/* Semantic Main Landmark for Accessibility (WCAG 1.3.1) */}
      <main id="main-content">

        {/* ═══════════════════════════════════════════════════════════════════════
            PAGE 1: ABOUT (HERO SPLIT: PERFECT CENTER LINE & COMPACT PRO CARD)
        ═══════════════════════════════════════════════════════════════════════ */}
        <section id="about" className="relative scroll-mt-20 min-h-[calc(100vh-5rem)] flex items-center border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/40 to-white py-12 lg:py-16">
        {/* Exact Center Vertical Divider Line */}
        <div className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-px bg-slate-200 -translate-x-1/2" />

        <div className="w-full px-4 sm:px-10 lg:px-14 xl:px-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-center">

          {/* LEFT HALF (50%): GRAND MANTIF STATEMENT & 3 PILLARS */}
          <div className="w-full space-y-8 lg:pr-6 xl:pr-10">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#002137] tracking-[0.06em] leading-[1.04]"
                  style={{ fontFamily: "'Montserrat', 'Outfit', 'Inter', sans-serif" }}
                >
                  M<span className="text-[#8c6924]">Λ</span>NTIF
                  <span className="sr-only"> — Intelligent Online Tutoring &amp; Learning Platform for Classes 6 to 10</span>
                </h1>
                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#8c6924] tracking-tight">
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
            <div className="w-full max-w-[450px] bg-white rounded-3xl border border-slate-200/90 shadow-[0_16px_40px_-8px_rgba(0,33,55,0.09)] p-5 sm:p-8 space-y-5">

              {/* Sleek Tab Switcher: Sign In vs Sign Up Alone */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => { setAuthMode("SIGNIN"); clear(); }}
                  className={`flex-1 pb-3 text-center text-sm sm:text-base font-extrabold tracking-tight transition-all border-b-2 cursor-pointer ${authMode === "SIGNIN"
                    ? "border-[#002137] text-[#002137]"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("SIGNUP"); setStep(1); clear(); }}
                  className={`flex-1 pb-3 text-center text-sm sm:text-base font-extrabold tracking-tight transition-all border-b-2 cursor-pointer ${authMode === "SIGNUP"
                    ? "border-[#002137] text-[#002137]"
                    : "border-transparent text-slate-600 hover:text-slate-900"
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
                        className={`py-2 rounded-lg font-bold transition-all cursor-pointer text-center ${loginRole === item.key
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
                      <label htmlFor="signin-identifier" className="block text-xs font-bold text-slate-700">
                        {loginRole === "STUDENT"
                          ? "Student Email or Registered Mobile"
                          : loginRole === "TEACHER"
                            ? "Faculty Email (@mantif.edu / @gmail.com)"
                            : "Administrator Email"}
                      </label>
                      <input
                        id="signin-identifier"
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
                        <label htmlFor="signin-password" className="block text-xs font-bold text-slate-700">Password</label>
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="text-xs font-bold text-[#004b79] hover:underline cursor-pointer"
                        >
                          {showPw ? "Hide" : "Show"}
                        </button>
                      </div>
                      <input
                        id="signin-password"
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
                        className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${signupRole === item.key
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
                    <span className="text-[11px] text-slate-500 font-medium">Secure Registration</span>
                  </div>

                  {/* Step 1: Base Credentials */}
                  {step === 1 && (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label htmlFor="signup-name" className="block text-xs font-bold text-slate-700">Full Legal Name *</label>
                        <input
                          id="signup-name"
                          type="text"
                          value={sName}
                          onChange={(e) => setSName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label htmlFor="signup-email" className="block text-xs font-bold text-slate-700">Email *</label>
                          <input
                            id="signup-email"
                            type="email"
                            value={sEmail}
                            onChange={(e) => setSEmail(e.target.value)}
                            placeholder="Email address"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="signup-phone" className="block text-xs font-bold text-slate-700">Mobile *</label>
                          <input
                            id="signup-phone"
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
                          <label htmlFor="signup-password" className="block text-xs font-bold text-slate-700">Password *</label>
                          <input
                            id="signup-password"
                            type="password"
                            value={sPw}
                            onChange={(e) => setSPw(e.target.value)}
                            placeholder="Min 6 chars"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="signup-confirm-password" className="block text-xs font-bold text-slate-700">Confirm *</label>
                          <input
                            id="signup-confirm-password"
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
                          <label htmlFor="signup-school" className="block text-xs font-bold text-slate-700">School Name *</label>
                          <input
                            id="signup-school"
                            type="text"
                            value={sSchool}
                            onChange={(e) => setSSchool(e.target.value)}
                            placeholder="Enter school name"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="signup-district" className="block text-xs font-bold text-slate-700">District *</label>
                          <input
                            id="signup-district"
                            type="text"
                            value={sDistrict}
                            onChange={(e) => setSDistrict(e.target.value)}
                            placeholder="e.g. Erode, Coimbatore"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-[#004b79]/15 focus:border-[#004b79] transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label htmlFor="signup-curriculum" className="block text-xs font-bold text-slate-700">Curriculum *</label>
                          <select
                            id="signup-curriculum"
                            value={sBoard}
                            onChange={(e) => setSBoard(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 font-medium cursor-pointer"
                          >
                            <option value="CBSE">CBSE Board</option>
                            <option value="State Board">State Board</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="signup-class" className="block text-xs font-bold text-slate-700">Class *</label>
                          <select
                            id="signup-class"
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
                        <label htmlFor="signup-batch" className="block text-xs font-bold text-slate-700">Batch Timing *</label>
                        <select
                          id="signup-batch"
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
                                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${isSelected
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

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label htmlFor="signup-teacher-degree" className="block text-xs font-bold text-slate-700">Degree *</label>
                          <input
                            id="signup-teacher-degree"
                            type="text"
                            value={tQual}
                            onChange={(e) => setTQual(e.target.value)}
                            placeholder="e.g. M.Sc, B.Ed"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="signup-teacher-spec" className="block text-xs font-bold text-slate-700">Specialization *</label>
                          <input
                            id="signup-teacher-spec"
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
                          <label htmlFor="signup-teacher-exp" className="block text-xs font-bold text-slate-700">Experience (Yrs)</label>
                          <input
                            id="signup-teacher-exp"
                            type="number"
                            min="0"
                            value={tExp}
                            onChange={(e) => setTExp(e.target.value)}
                            placeholder="Years"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="signup-teacher-district" className="block text-xs font-bold text-slate-700">District *</label>
                          <input
                            id="signup-teacher-district"
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label htmlFor="signup-parent-name" className="block text-xs font-bold text-slate-700">Parent Name *</label>
                          <input
                            id="signup-parent-name"
                            type="text"
                            value={spName}
                            onChange={(e) => setSpName(e.target.value)}
                            placeholder="Parent name"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="signup-parent-phone" className="block text-xs font-bold text-slate-700">Parent Mobile *</label>
                          <input
                            id="signup-parent-phone"
                            type="tel"
                            maxLength={10}
                            value={spPhone}
                            onChange={(e) => setSpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="Parent mobile"
                            className="w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label htmlFor="signup-gender" className="block text-xs font-bold text-slate-700">Gender</label>
                          <select
                            id="signup-gender"
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
                          <label htmlFor="signup-dob" className="block text-xs font-bold text-slate-700">Date of Birth</label>
                          <input
                            id="signup-dob"
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
          PAGE 2: TUTORING HUB (WHERE IT ALL BEGAN - SEAMLESS SINGLE-PAGE DIVIDER)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="tutoring-hub" className="relative scroll-mt-20 min-h-[calc(100vh-5rem)] flex items-center justify-center border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/40 to-white py-10 sm:py-14 px-6 sm:px-10 lg:px-16">
        <div className="w-full max-w-5xl mx-auto space-y-7 sm:space-y-8">

          {/* Section Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#002137] tracking-tight">
              Tutoring Hub
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[#8c6924] tracking-tight">
              Where It All Began
            </p>
          </div>

          {/* 2-Column Split With Center Vertical Divider (NO CARDS) */}
          <div className="relative py-2 sm:py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 lg:gap-32 items-start">

              {/* LEFT: Tutoring Hub (The Foundation) */}
              <div className="space-y-3 text-left md:pr-8">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8c6924] bg-amber-50 px-2.5 py-0.5 rounded-md border border-[#8c6924]/40">
                    2020 – 2024 • Physical Classroom
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#002137]">
                  Tutoring Hub
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  For four continuous years, Tutoring Hub served as our dedicated physical learning space. Working side-by-side with students, we refined our teaching methodology, observed real classroom challenges, and built an empathetic foundation for how students truly understand concepts.
                </p>
              </div>

              {/* CENTER DIVIDER */}
              {/* Desktop Vertical Dividing Line */}
              <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col items-center justify-center pointer-events-none">
                <div className="w-[1px] flex-1 bg-gradient-to-b from-transparent via-slate-300 to-slate-300" />
                <div className="my-3 px-3.5 py-1 rounded-full bg-[#002137] text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 shrink-0 border border-[#b89047]/40 ring-4 ring-white">
                  <ArrowRight className="w-3 h-3 text-[#dfb74a]" />
                  <span>Evolved Into</span>
                </div>
                <div className="w-[1px] flex-1 bg-gradient-to-b from-slate-300 via-slate-300 to-transparent" />
              </div>

              {/* Mobile Horizontal Divider */}
              <div className="md:hidden flex items-center gap-3 my-1">
                <div className="h-[1px] flex-1 bg-slate-200" />
                <span className="px-3 py-1 rounded-full bg-[#002137] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-[#dfb74a]" />
                  <span>Evolved Into</span>
                </span>
                <div className="h-[1px] flex-1 bg-slate-200" />
              </div>

              {/* RIGHT: MANTIF (Taking It Forward) */}
              <div className="space-y-3 text-left md:pl-8">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#004b79] bg-blue-50 px-2.5 py-0.5 rounded-md border border-[#004b79]/30">
                    Present &amp; Beyond • Digital Platform
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#002137]">
                  MANTIF
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Today, we have evolved that foundational experience into MANTIF. We take the genuine pedagogy and mentorship learned in the physical classroom and scale it with modern learning tools, proctored assessments, and teacher workflows for students and institutions.
                </p>
              </div>

            </div>
          </div>

          {/* Foundation Quote (Directly on canvas with light accent divider line) */}
          <div className="pt-2 border-t border-slate-200/80 text-center space-y-1">
            <p className="text-lg sm:text-xl lg:text-2xl font-black text-[#002137] tracking-tight">
              “Tutoring Hub gave us the foundation.
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-black text-[#8c6924] tracking-tight">
              MANTIF is taking it forward.”
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode("SIGNUP");
                setStep(1);
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-3 rounded-xl bg-[#002137] hover:bg-[#003659] text-white text-sm sm:text-base font-extrabold transition-all shadow-md shadow-[#002137]/15 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 group"
            >
              <span>Sign Up on MANTIF</span>
              <ArrowRight className="w-4 h-4 text-[#dfb74a] group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#contact"
              className="px-8 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm sm:text-base font-extrabold transition-all shadow-2xs hover:-translate-y-0.5 cursor-pointer"
            >
              Contact Us
            </a>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 3: OUR SIDE (ALL-IN-ONE SINGLE VIEWPORT MATCHED SHOWCASE)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="our-side"
        className="relative scroll-mt-20 min-h-[calc(100vh-5rem)] lg:h-[calc(100vh-5rem)] border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/40 to-white py-6 lg:py-8 flex flex-col justify-center"
      >
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-14 flex flex-col justify-center space-y-6 lg:space-y-7">

          {/* Section Heading */}
          <div className="text-center space-y-1">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#002137] tracking-tight">
              Our Side
            </h2>
            <p className="text-xs sm:text-sm lg:text-base font-bold text-[#8c6924] tracking-normal max-w-xl mx-auto">
              Empowering school teachers and academic institutions with practical AI tools.
            </p>
          </div>

          {/* Direct Matched Presentation: Image Height Matches Opposite Content */}
          <div>
            {outreachSchools.map((school: any) => (
              <div
                key={school.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center"
              >
                {/* Image Side: Full Perfect Image Without Any Cropping */}
                <div className="lg:col-span-6 flex items-center justify-center">
                  <div className="relative w-full rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-200/90 bg-white group">
                    <img
                      src={school.bannerImage || "/images/ai_seminar_banner.png"}
                      alt={school.sessionTitle}
                      className="w-full h-auto block object-contain group-hover:scale-[1.01] transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Opposite Side: Perfectly Aligned Content (No Top Pill Badge) */}
                <div className="lg:col-span-6 flex flex-col justify-center space-y-3.5 text-left">
                  <h3 className="text-2xl sm:text-3xl lg:text-[30px] font-black text-[#002137] tracking-tight leading-tight">
                    {school.name}
                  </h3>

                  <div className="space-y-0.5">
                    <h4 className="text-base sm:text-lg font-extrabold text-[#004b79]">
                      {school.sessionTitle}
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 italic">
                      {school.subtitle || "From Everyday AI Tools to Transformative Learning Experiences"}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm lg:text-[14.5px] text-slate-600 leading-relaxed font-medium">
                    MANTIF conducted an interactive faculty empowerment seminar exploring practical AI tools, empowering teachers to enhance student engagement and modernize classroom learning.
                  </p>

                  <div className="pt-1">
                    <button
                      onClick={() => setSelectedSchoolModal(school)}
                      className="group inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-[#002137] hover:bg-[#004b79] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-[#dfb74a]" />
                      <span>View Session Story &amp; Video</span>
                      <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Animated Loading Symbol for "Still more" (Clean Loading Animation, No AI Symbols) */}
          <div className="pt-2 flex items-center justify-center">
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white border border-slate-200/90 shadow-xs text-slate-700 hover:border-[#b89047]/70 transition-all">
              <Loader2 className="w-4 h-4 text-[#b89047] animate-spin shrink-0" />
              <span className="text-xs font-bold text-[#002137] tracking-wide">
                Still more...
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 4: TEAM (FOUNDER SPOTLIGHT - MATCHING TEAM CARD DESIGN)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="team" className="scroll-mt-20 min-h-[calc(100vh-5rem)] flex items-center justify-center border-b border-slate-200/80 bg-white py-10 lg:py-16">
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-10 lg:px-14 space-y-8 lg:space-y-10 text-center">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-1.5">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#002137] tracking-tight">
              Our Team
            </h2>
            <p className="text-sm sm:text-base lg:text-lg font-bold text-[#8c6924] tracking-normal max-w-2xl mx-auto">
              Passionate educators, engineering minds, and AI practitioners dedicated to student success.
            </p>
          </div>

          {/* Centered Founder Card in Optimal Size Matching Team Cards */}
          <div className="flex justify-center items-center">
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#b89047]/40 transition-all flex flex-col items-center text-center space-y-3 w-full max-w-[245px] sm:max-w-[265px]">
              <div className="w-full aspect-4/5 rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 bg-slate-100 relative group">
                <img
                  src="/images/founder_karunya.png"
                  alt="Karunya S - Founder of MANTIF"
                  loading="lazy"
                  decoding="async"
                  width={265}
                  height={331}
                  className="w-full h-full object-cover object-[center_16%] group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="space-y-0.5 pt-0.5">
                <h3 className="font-black text-lg sm:text-xl text-[#002137]">Karunya S</h3>
                <p className="text-xs sm:text-sm font-extrabold text-[#8c6924]">Founder</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 5: MENTORS & TECH TEAM (EDUCATIONAL MENTORS, SOFTWARE TEAM, AI TEAM)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="mentors" className="scroll-mt-20 min-h-[calc(100vh-5rem)] flex items-center justify-center border-b border-slate-200/80 bg-slate-50/60 py-6 lg:py-8">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 xl:px-20 space-y-6 lg:space-y-8">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-1">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#002137] tracking-tight">
              Mentors &amp; Tech Teams
            </h2>
            <p className="text-sm sm:text-base lg:text-lg font-bold text-[#8c6924] tracking-normal max-w-2xl mx-auto">
              Experienced educators, software engineers, and AI researchers shaping the future of learning.
            </p>
          </div>

          {/* Categories with Centered Headings & Symmetrical Full-Width Layout */}
          <div className="space-y-8 max-w-7xl mx-auto w-full">

            {/* 1. Educational Mentors */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-black text-[#002137] tracking-tight">
                  Educational Mentors
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
                {/* Dr. A. Revathi */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#004b79]/40 transition-all flex flex-col items-center text-center space-y-3">
                  <div className="w-full max-w-[240px] aspect-4/5 rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 bg-slate-100 relative group">
                    <img
                      src="/images/mentor_revathi.jpg"
                      alt="Dr. A. Revathi - Educational Mentor"
                      loading="lazy"
                      decoding="async"
                      width={240}
                      height={300}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base sm:text-lg text-[#002137]">Dr. A. Revathi</h4>
                    <p className="text-xs sm:text-sm font-extrabold text-[#8c6924]">PhD Chemistry</p>
                  </div>
                </div>

                {/* V Lavanya */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#004b79]/40 transition-all flex flex-col items-center text-center space-y-3">
                  <div className="w-full max-w-[240px] aspect-4/5 rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 bg-slate-100 relative group">
                    <img
                      src="/images/mentor_lavanya.jpg"
                      alt="V Lavanya - Educational Mentor"
                      loading="lazy"
                      decoding="async"
                      width={240}
                      height={300}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base sm:text-lg text-[#002137]">V Lavanya</h4>
                    <p className="text-xs sm:text-sm font-extrabold text-[#8c6924]">MSc MPhil Maths</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Combined: Software Teams & AI Teams (Identical Image Sizes Across All 4) */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-black text-[#002137] tracking-tight">
                  Software Teams &amp; AI Teams
                </h3>
              </div>

              {/* 4 Cards Grid Full Width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 xl:gap-6 w-full">

                {/* 1. Vishal K */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#004b79]/40 transition-all flex flex-col items-center text-center space-y-3">
                  <div className="w-full aspect-4/5 rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 bg-slate-100 relative group">
                    <img
                      src="/images/team_vishal.jpg"
                      alt="Vishal K - Software Team"
                      loading="lazy"
                      decoding="async"
                      width={240}
                      height={300}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base sm:text-lg text-[#002137]">Vishal K</h4>
                    <p className="text-xs sm:text-sm font-extrabold text-[#004b79]">Software Team</p>
                  </div>
                </div>

                {/* 2. Solairaj R */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#004b79]/40 transition-all flex flex-col items-center text-center space-y-3">
                  <div className="w-full aspect-4/5 rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 bg-slate-100 relative group">
                    <img
                      src="/images/team_solairaj.jpg"
                      alt="Solairaj R - Software Team"
                      loading="lazy"
                      decoding="async"
                      width={240}
                      height={300}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base sm:text-lg text-[#002137]">Solairaj R</h4>
                    <p className="text-xs sm:text-sm font-extrabold text-[#004b79]">Software Team</p>
                  </div>
                </div>

                {/* 3. Abinaya B */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#b89047]/40 transition-all flex flex-col items-center text-center space-y-3">
                  <div className="w-full aspect-4/5 rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 bg-slate-100 relative group">
                    <img
                      src="/images/team_abinaya.png"
                      alt="Abinaya B - AI Team"
                      loading="lazy"
                      decoding="async"
                      width={240}
                      height={300}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base sm:text-lg text-[#002137]">Abinaya B</h4>
                    <p className="text-xs sm:text-sm font-extrabold text-[#8c6924]">AI Team</p>
                  </div>
                </div>

                {/* 4. Arunkarthick K */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#b89047]/40 transition-all flex flex-col items-center text-center space-y-3">
                  <div className="w-full aspect-4/5 rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 bg-slate-100 relative group">
                    <img
                      src="/images/team_arunkarthick.png"
                      alt="Arunkarthick K - AI Team"
                      loading="lazy"
                      decoding="async"
                      width={240}
                      height={300}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base sm:text-lg text-[#002137]">Arunkarthick K</h4>
                    <p className="text-xs sm:text-sm font-extrabold text-[#8c6924]">AI Team</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 6: TESTIMONIALS (STUDENT STORIES & EXPERIENCES SLOW CAROUSEL)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="scroll-mt-20 min-h-[calc(100vh-5rem)] flex items-center justify-center py-8 lg:py-10 bg-slate-50 border-b border-slate-200/80 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 lg:space-y-8">

          <div className="text-center max-w-3xl mx-auto space-y-1.5">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#002137] tracking-tight">
              Testimonials
            </h2>
            <p className="text-sm sm:text-base lg:text-lg font-bold text-[#8c6924] tracking-normal max-w-2xl mx-auto">
              Real experiences from students who walked through our doors and excelled with us.
            </p>
          </div>

          {/* Smooth Slow-Moving Carousel Container */}
          <div className="relative w-full overflow-hidden py-2">
            {/* Left & Right Fade Masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-slate-50 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-slate-50 to-transparent z-10" />

            {/* Continuous Marquee Track */}
            <div className="animate-marquee-slow flex items-stretch gap-6 sm:gap-8 cursor-grab active:cursor-grabbing hover:[animation-play-state:paused]">
              {[
                {
                  quote: "If surviving 12th boards was a movie, Karunya was the director, scriptwriter, and stunt double all in one. From breaking down the toughest topics with infinite patience to hyping me up when I had doubts, she made sure I came out swinging. Proud to be student #1! ❤️",
                  name: "T.G. Sivadharani",
                  role: "BSc Costume Design & Fashion",
                  sub: "PSGR Krishnammal College"
                },
                {
                  quote: "Thank you for all the support and guidance throughout my time at Mantif. Your teaching made a huge difference in how I understand subjects. Your patience and dedication made tough topics easy to grasp, and I feel confident for my future!",
                  name: "S. Darshan",
                  role: "XII Standard",
                  sub: "Board Exam Cohort"
                },
                {
                  quote: "Mantif Tutoring wasn't just about academics; it helped me develop my personality, confidence, and key skills. The supportive atmosphere made learning enjoyable. I truly thankful for all the memories of Mantif.",
                  name: "Kanishka C",
                  role: "XII Standard",
                  sub: "Classroom Alumna"
                },
                {
                  quote: "Tuition here is always jolly! It’s not boring notes; Mantif Tutoring Hub is a place where we study, have fun, and share our thoughts freely. Serious learning with lots of care and friendship — that’s why it’s so special.",
                  name: "R. Manikandan",
                  role: "XI Standard",
                  sub: "Tutoring Hub Learner"
                },
                {
                  quote: "If surviving 12th boards was a movie, Karunya was the director, scriptwriter, and stunt double all in one. From breaking down the toughest topics with infinite patience to hyping me up when I had doubts, she made sure I came out swinging. Proud to be student #1! ❤️",
                  name: "T.G. Sivadharani",
                  role: "BSc Costume Design & Fashion",
                  sub: "PSGR Krishnammal College"
                },
                {
                  quote: "Thank you for all the support and guidance throughout my time at Mantif. Your teaching made a huge difference in how I understand subjects. Your patience and dedication made tough topics easy to grasp, and I feel confident for my future!",
                  name: "S. Darshan",
                  role: "XII Standard",
                  sub: "Board Exam Cohort"
                },
                {
                  quote: "Mantif Tutoring wasn't just about academics; it helped me develop my personality, confidence, and key skills. The supportive atmosphere made learning enjoyable. I truly thankful for all the memories of Mantif.",
                  name: "Kanishka C",
                  role: "XII Standard",
                  sub: "Classroom Alumna"
                },
                {
                  quote: "Tuition here is always jolly! It’s not boring notes; Mantif Tutoring Hub is a place where we study, have fun, and share our thoughts freely. Serious learning with lots of care and friendship — that’s why it’s so special.",
                  name: "R. Manikandan",
                  role: "XI Standard",
                  sub: "Tutoring Hub Learner"
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="w-[300px] sm:w-[340px] md:w-[380px] min-h-[300px] sm:min-h-[320px] shrink-0 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#004b79]/40 transition-all flex flex-col justify-between space-y-4 select-none"
                >
                  <div className="space-y-3">
                    <Quote className="w-6 h-6 text-[#dfb74a] shrink-0" />
                    <p className="text-slate-700 text-xs sm:text-[13.5px] leading-relaxed font-medium italic">
                      “{item.quote.replace(/^“|”$/g, '')}”
                    </p>
                  </div>
                  <div className="pt-3.5 border-t border-slate-100 space-y-0.5 shrink-0">
                    <h3 className="font-black text-sm sm:text-base text-[#002137]">{item.name}</h3>
                    <p className="text-xs sm:text-sm font-bold text-[#8c6924]">{item.role}</p>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAGE 7: GALLERY (LARGE-SCALE INTERACTIVE BENTO SHOWCASE + LIGHTBOX)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="gallery" className="scroll-mt-20 py-20 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#002137] tracking-tight">
              Gallery
            </h2>
          </div>

          {/* Large-Format Responsive Dynamic Photo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { id: 1, src: "/images/gallery_1.jpg", title: "Creative Learning & Activity Circles", sub: "Hands-on collaborative drawing and color studies at Tutoring Hub." },
              { id: 2, src: "/images/gallery_2.jpg", title: "Interactive Reading & Discovery", sub: "Young students exploring science and nature literature together." },
              { id: 3, src: "/images/gallery_3.jpg", title: "Early Focus & Skill Building", sub: "Individual care and guided creative practice for young minds." },
              { id: 4, src: "/images/gallery_4.jpg", title: "Classroom Problem Solving", sub: "In-depth whiteboard concept breakdown and formula analysis." },
              { id: 5, src: "/images/gallery_5.jpg", title: "Whiteboard Algebraic Practice", sub: "Student deriving step-by-step solutions to linear algebraic problems." },
              { id: 6, src: "/images/gallery_6.jpg", title: "Peer Camaraderie & Support", sub: "Celebratory fist-bump milestone between learning peers." },
              { id: 7, src: "/images/gallery_7.jpg", title: "Hands-on Creative Teamwork", sub: "Collaborative rainbow art and sensory craft session." },
              { id: 8, src: "/images/gallery_8.jpg", title: "Senior Board Exam Cohort", sub: "Dedicated revision, mock testing, and core subject preparation." },
              { id: 9, src: "/images/gallery_9.jpg", title: "MANTIF Friendship Circle", sub: "Lifelong student bonds, peer encouragement, and mutual support." },
            ].map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedGalleryIdx(idx)}
                className="group relative h-[300px] sm:h-[340px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md hover:shadow-2xl hover:border-[#b89047]/80 transition-all duration-500 cursor-pointer flex flex-col justify-end transform hover:-translate-y-1.5"
              >
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />

                {/* Subtle Gradient Backplate */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#001726]/95 via-[#001726]/40 to-transparent transition-opacity duration-300 group-hover:from-[#001726]/98" />

                {/* Top Floating Expand Button */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 shadow-sm">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom Text Content */}
                <div className="relative z-10 p-5 sm:p-6 space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-white leading-snug group-hover:text-[#dfb74a] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed font-normal">
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Compact, High-Aesthetic Lightbox Modal */}
        {selectedGalleryIdx !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-all"
            onClick={() => setSelectedGalleryIdx(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-[#001726] rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Floating Top Controls (Counter Badge + Glass Close) */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 border border-white/10 pointer-events-auto">
                  {selectedGalleryIdx + 1} / 9
                </span>
                <button
                  onClick={() => setSelectedGalleryIdx(null)}
                  className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15 pointer-events-auto shadow-md hover:scale-105"
                  title="Close (Esc)"
                  aria-label="Close photo gallery"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Seamless Aspect-Ratio Photo Container */}
              <div className="relative aspect-[4/3] w-full bg-black overflow-hidden flex items-center justify-center">
                <img
                  src={[
                    "/images/gallery_1.jpg",
                    "/images/gallery_2.jpg",
                    "/images/gallery_3.jpg",
                    "/images/gallery_4.jpg",
                    "/images/gallery_5.jpg",
                    "/images/gallery_6.jpg",
                    "/images/gallery_7.jpg",
                    "/images/gallery_8.jpg",
                    "/images/gallery_9.jpg",
                  ][selectedGalleryIdx]}
                  alt="Gallery Moment"
                  className="w-full h-full object-cover"
                />

                {/* Left/Right Smooth Navigation Arrows */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGalleryIdx((prev) => (prev !== null ? (prev === 0 ? 8 : prev - 1) : 0));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15 shadow-md hover:scale-110"
                  title="Previous photo"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGalleryIdx((prev) => (prev !== null ? (prev === 8 ? 0 : prev + 1) : 0));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15 shadow-md hover:scale-110"
                  title="Next photo"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Compact Sleek Bottom Caption */}
              <div className="p-4 sm:p-5 bg-[#001726] border-t border-white/10 space-y-1 text-left">
                <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                  {[
                    "Creative Learning & Activity Circles",
                    "Interactive Reading & Discovery",
                    "Early Focus & Skill Building",
                    "Classroom Problem Solving",
                    "Whiteboard Algebraic Practice",
                    "Peer Camaraderie & Support",
                    "Hands-on Creative Teamwork",
                    "Senior Board Exam Cohort",
                    "MANTIF Friendship Circle",
                  ][selectedGalleryIdx]}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {[
                    "Hands-on collaborative drawing and color studies at Tutoring Hub.",
                    "Young students exploring science and nature literature together.",
                    "Individual care and guided creative practice for young minds.",
                    "In-depth whiteboard concept breakdown and formula analysis.",
                    "Student deriving step-by-step solutions to linear algebraic problems.",
                    "Celebratory fist-bump milestone between learning peers.",
                    "Collaborative rainbow art and sensory craft session.",
                    "Dedicated revision, mock testing, and core subject preparation.",
                    "Lifelong student bonds, peer encouragement, and mutual support.",
                  ][selectedGalleryIdx]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── School Detail Modal (Professional Editorial Layout with 2 Video Players & Compact Proportions) ─── */}
        {selectedSchoolModal && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            onClick={() => setSelectedSchoolModal(null)}
          >
            <div
              className="relative w-full max-w-3xl lg:max-w-4xl max-h-[88vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-5 sm:p-7 space-y-5 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Header (Clean Single-Line School Name + Unique Signature Close Button) */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                <div className="space-y-0.5">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#002137] tracking-tight leading-snug">
                    {selectedSchoolModal.name}
                  </h3>
                </div>

                {/* Unique Signature Designed Close Button */}
                <button
                  onClick={() => setSelectedSchoolModal(null)}
                  className="group relative inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-[#002137] hover:bg-[#004b79] text-white border-2 border-[#dfb74a]/60 shadow-md hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shrink-0"
                  title="Close Dialog"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#dfb74a] hidden sm:inline-block">
                    Close
                  </span>
                  <div className="w-6 h-6 rounded-full bg-[#dfb74a] text-[#002137] group-hover:bg-white flex items-center justify-center shadow-inner transition-colors">
                    <X className="w-3.5 h-3.5 stroke-[3] transition-transform duration-300 group-hover:rotate-90" />
                  </div>
                </button>
              </div>

              {/* Unified Full-Width Narrative Paragraph */}
              <div className="space-y-2.5">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#004b79]">
                    Academic Focus &amp; Practical Training
                  </p>
                  <h4 className="text-base sm:text-lg lg:text-xl font-black text-[#002137] leading-snug">
                    “{selectedSchoolModal.sessionTitle}”
                  </h4>
                </div>

                <p className="text-slate-700 text-xs sm:text-sm lg:text-[15px] leading-relaxed font-normal">
                  {selectedSchoolModal.summary}{" "}
                  {selectedSchoolModal.description}{" "}
                  {selectedSchoolModal.milestoneQuote}
                </p>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#b89047]" />
                  <p className="text-xs font-extrabold text-[#002137] tracking-wide">
                    — Ms. Karunya S, Founder (Alumna)
                  </p>
                </div>
              </div>

              {/* ─── DUAL VIDEO SHOWCASE (2 DEDICATED VIDEOS) ─── */}
              <div className="space-y-3.5 pt-4 border-t border-slate-200/80">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#002137] text-[#dfb74a] flex items-center justify-center shadow-xs">
                      <Video className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-[#002137]">
                        Session Video Recordings
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        2 Dedicated video streams covering workshop highlights &amp; founder interactions
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2-Column Responsive Video Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

                  {/* VIDEO SLOT 1 */}
                  {(() => {
                    const slotKey = `${selectedSchoolModal.id}_1`;
                    const effectiveVid1 = customVideoUrls[slotKey] || selectedSchoolModal.videoUrl1 || selectedSchoolModal.videoUrl || "";
                    const isVidPlaying1 = playingVideoSlotId === slotKey;
                    const slotTitle1 = selectedSchoolModal.videoTitle1 || "Session Video 1: Faculty AI Workshop";

                    return (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black uppercase text-[#002137] tracking-wide truncate max-w-full">
                            {slotTitle1}
                          </span>
                        </div>

                        {/* Player Container */}
                        <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-slate-300 bg-black aspect-video flex items-center justify-center group">
                          {effectiveVid1 && isVidPlaying1 ? (
                            <div className="relative w-full h-full bg-black">
                              {effectiveVid1.includes("youtube.com") || effectiveVid1.includes("youtu.be") ? (
                                <iframe
                                  src={`${getEmbedVideoUrl(effectiveVid1)}?autoplay=1`}
                                  title={slotTitle1}
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                  allowFullScreen
                                />
                              ) : (
                                <video
                                  src={effectiveVid1}
                                  controls
                                  autoPlay
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="relative w-full h-full flex items-center justify-center p-4 text-white select-none overflow-hidden">
                              {/* Video Real Thumbnail Background */}
                              {effectiveVid1 && !effectiveVid1.includes("youtube.com") && !effectiveVid1.includes("youtu.be") ? (
                                <video
                                  src={`${effectiveVid1}#t=0.5`}
                                  preload="metadata"
                                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                />
                              ) : null}

                              {/* Dark Gradient Overlay over Thumbnail */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50 group-hover:via-black/10 transition-all duration-300" />

                              {/* Center Play Button */}
                              <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-2">
                                <button
                                  onClick={() => {
                                    if (effectiveVid1) {
                                      setPlayingVideoSlotId(slotKey);
                                    }
                                  }}
                                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#b89047] to-[#dfb74a] text-[#002137] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer group-hover:ring-4 group-hover:ring-amber-300/50"
                                  title="Play Video"
                                >
                                  <Play className="w-6 h-6 fill-current ml-0.5" />
                                </button>
                                <p className="text-xs font-black text-white drop-shadow-md">
                                  Click to Play Video
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* VIDEO SLOT 2 */}
                  {(() => {
                    const slotKey2 = `${selectedSchoolModal.id}_2`;
                    const effectiveVid2 = customVideoUrls[slotKey2] || selectedSchoolModal.videoUrl2 || "";
                    const isVidPlaying2 = playingVideoSlotId === slotKey2;
                    const slotTitle2 = selectedSchoolModal.videoTitle2 || "Session Video 2: Founder Address & Q&A";

                    return (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black uppercase text-[#002137] tracking-wide truncate max-w-full">
                            {slotTitle2}
                          </span>
                        </div>

                        {/* Player Container */}
                        <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-slate-300 bg-black aspect-video flex items-center justify-center group">
                          {effectiveVid2 && isVidPlaying2 ? (
                            <div className="relative w-full h-full bg-black">
                              {effectiveVid2.includes("youtube.com") || effectiveVid2.includes("youtu.be") ? (
                                <iframe
                                  src={`${getEmbedVideoUrl(effectiveVid2)}?autoplay=1`}
                                  title={slotTitle2}
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                  allowFullScreen
                                />
                              ) : (
                                <video
                                  src={effectiveVid2}
                                  controls
                                  autoPlay
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="relative w-full h-full flex items-center justify-center p-4 text-white select-none overflow-hidden">
                              {/* Video Real Thumbnail Background */}
                              {effectiveVid2 && !effectiveVid2.includes("youtube.com") && !effectiveVid2.includes("youtu.be") ? (
                                <video
                                  src={`${effectiveVid2}#t=0.5`}
                                  preload="metadata"
                                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                />
                              ) : null}

                              {/* Dark Gradient Overlay over Thumbnail */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50 group-hover:via-black/10 transition-all duration-300" />

                              {/* Center Play Button */}
                              <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-2">
                                <button
                                  onClick={() => {
                                    if (effectiveVid2) {
                                      setPlayingVideoSlotId(slotKey2);
                                    }
                                  }}
                                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#b89047] to-[#dfb74a] text-[#002137] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer group-hover:ring-4 group-hover:ring-amber-300/50"
                                  title="Play Video"
                                >
                                  <Play className="w-6 h-6 fill-current ml-0.5" />
                                </button>
                                <p className="text-xs font-black text-white drop-shadow-md">
                                  Click to Play Video
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── Cinema Fullscreen Video Lightbox ─── */}
        {fullscreenVideo && (
          <div
            className="fixed inset-0 z-60 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={() => setFullscreenVideo(null)}
          >
            <div
              className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fullscreen Player Top Bar */}
              <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-auto">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    Cinema Player
                  </span>
                  <h3 className="text-white text-xs sm:text-sm md:text-base font-black truncate max-w-[280px] sm:max-w-[500px]">
                    {fullscreenVideo.title}
                  </h3>
                </div>

                <button
                  onClick={() => setFullscreenVideo(null)}
                  className="group relative inline-flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-black/70 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Close Fullscreen Video"
                >
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300">Exit Fullscreen</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>

              {/* Video Screen Frame */}
              {fullscreenVideo.url.includes("youtube.com") || fullscreenVideo.url.includes("youtu.be") ? (
                <iframe
                  src={`${getEmbedVideoUrl(fullscreenVideo.url)}?autoplay=1`}
                  title={fullscreenVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  src={fullscreenVideo.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        )}

        {/* ─── School Video URL Modal ─── */}
        {videoModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setVideoModalOpen(false)}
          >
            <div
              className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-[#8c6924] border border-amber-200">
                    <Video className="w-3.5 h-3.5" />
                    <span>School Session Video Stream</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#002137]">
                    Add / Configure Video URL
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {activeVideoSlotLabel ? `Configuring: ${activeVideoSlotLabel}` : "Enter YouTube link or MP4 direct video URL."}
                  </p>
                </div>
                <button
                  onClick={() => setVideoModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <label htmlFor="video-url-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Video URL (YouTube or Direct Video Stream):
                </label>
                <div className="relative">
                  <input
                    id="video-url-input"
                    type="url"
                    value={videoInputUrl}
                    onChange={(e) => setVideoInputUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#004b79] focus:ring-2 focus:ring-[#004b79]/20 outline-none text-xs sm:text-sm text-slate-800 font-medium transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Supported formats: YouTube URLs, YouTube Shorts, MP4 video links
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setVideoModalOpen(false);
                    setVideoInputUrl("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveVideoUrl}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#002137] hover:bg-[#004b79] text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Save &amp; Play Video
                </button>
              </div>
            </div>
          </div>
        )}

        </section>

      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER: PROFESSIONAL CONTACT FOOTER (HELPLINES, EMAIL, INSTA & LINKEDIN)
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer id="contact" className="scroll-mt-20 bg-[#00111f] border-t border-white/10 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* 2-Equal-Column Grid with divider */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/15 items-center">

            {/* Col 1: Helplines */}
            <div className="flex justify-center items-center py-4 px-4 sm:px-6">
              <div className="space-y-2 text-center md:text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#dfb74a]">Helplines</p>
                <div>
                  {[
                    { num: "+91 98427 43538", tel: "tel:+919842743538" },
                    { num: "+91 80564 53211", tel: "tel:+918056453211" },
                    { num: "+91 63811 80488", tel: "tel:+916381180488" },
                  ].map((h, i) => (
                    <div key={i}>
                      <a
                        href={h.tel}
                        className="block py-1.5 text-sm font-black font-mono text-slate-100 hover:text-[#dfb74a] transition-colors tracking-wide"
                      >
                        {h.num}
                      </a>
                      {i < 2 && <div className="h-px bg-white/8" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Col 2: Email + Connect With Us (Insta & LinkedIn) */}
            <div className="flex justify-center items-center py-4 px-4 sm:px-6">
              <div className="space-y-4 text-center md:text-left">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#dfb74a]">Official Email</p>
                  <a
                    href="mailto:info@mantif.com"
                    className="inline-flex items-center gap-2 text-sm font-bold font-mono text-slate-100 hover:text-[#dfb74a] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#dfb74a] shrink-0" />
                    info@mantif.com
                  </a>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#dfb74a]">Connect With Us</p>
                  <div className="flex items-center justify-center md:justify-start gap-2.5">
                    <a
                      href="https://www.instagram.com/mantif.ai?igsi=NHoxb2J2cWdrNG5q"
                      target="_blank"
                      rel="noreferrer"
                      title="Follow MANTIF on Instagram"
                      aria-label="Follow MANTIF on Instagram"
                      className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-sm"
                    >
                      <InstagramIcon className="w-4 h-4" />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/acuity-learning-hub-871102401/"
                      target="_blank"
                      rel="noreferrer"
                      title="Connect with MANTIF on LinkedIn"
                      aria-label="Connect with MANTIF on LinkedIn"
                      className="w-8 h-8 rounded-lg bg-[#0077b5] text-white flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-sm"
                    >
                      <LinkedInIcon className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Copyright */}
          <div className="mt-7 pt-5 border-t border-white/8 text-center text-xs text-slate-400 font-medium">
            <p>© 2026 @mantif.All Rights Reserved.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
