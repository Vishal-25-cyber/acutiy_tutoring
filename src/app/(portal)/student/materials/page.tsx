"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Download,
  Search,
  Check,
  User,
  Eye,
  Lock,
  Clock,
  Calendar,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useFastFetch } from "@/lib/api-cache";
import { downloadMaterial, DownloadableMaterial } from "@/lib/download";

export default function StudentMaterialsPage() {
  const { data, isLoading } = useFastFetch("/api/student/materials");
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<DownloadableMaterial | null>(null);

  const studentClass = data?.studentClass || "Class 10";
  const studentBoard = data?.board || "CBSE";

  const defaultMaterials: DownloadableMaterial[] = [
    {
      _id: "mat-math-1",
      title: "Quadratic Equations — Discriminant & Real Roots Formula Handbook",
      subject: "Mathematics",
      classLevel: studentClass,
      category: "PDF HANDBOOK",
      fileSize: "1.4 MB",
      description: "Complete formula derivations, nature of roots discriminant breakdown, and NCERT exemplar solutions.",
      uploadedBy: "Dr. Sarah Jenkins",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "mat-sci-1",
      title: "Ray Optics & Mirror Formula — Step-by-Step Diagram Guide",
      subject: "Science",
      classLevel: studentClass,
      category: "STUDY NOTES",
      fileSize: "2.1 MB",
      description: "Concave & convex mirror ray diagrams, sign conventions, and high-scoring refraction problems.",
      uploadedBy: "Prof. Rajesh Kumar",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "mat-sci-2",
      title: "Chemical Reactions & Equations — Balancing & Type Identification",
      subject: "Science",
      classLevel: studentClass,
      category: "WORKSHEET",
      fileSize: "1.8 MB",
      description: "Endothermic, exothermic, redox reaction balance sheet with 30 solved board exemplar questions.",
      uploadedBy: "Prof. Rajesh Kumar",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "mat-eng-1",
      title: "Analytical Paragraph Writing & Advanced Grammar Clause Rules",
      subject: "English",
      classLevel: studentClass,
      category: "STUDY NOTES",
      fileSize: "980 KB",
      description: "High-scoring paragraph templates, active-to-passive transformation, and reported speech cheat sheet.",
      uploadedBy: "Ms. Anita Desai",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "mat-sst-1",
      title: "Nationalism in India — Timeline & Map Pointing Revision Chart",
      subject: "Social Science",
      classLevel: studentClass,
      category: "MIND MAP",
      fileSize: "2.6 MB",
      description: "Chronological events summary, Non-Cooperation Movement, Civil Disobedience, and key exam map items.",
      uploadedBy: "Prof. Rajesh Kumar",
      createdAt: new Date().toISOString(),
    },
  ];

  const rawMaterials: DownloadableMaterial[] =
    Array.isArray(data?.materials) && data.materials.length > 0
      ? data.materials
      : defaultMaterials;

  // Filter strictly by student's class
  const classMaterials = rawMaterials.filter((m: any) => {
    return !m.classLevel || m.classLevel === studentClass;
  });

  const availableSubjects = ["ALL", "Mathematics", "Science", "Social Science", "English"];

  const isSubjectMatch = (matSub: string, filterSub: string) => {
    if (!filterSub || filterSub === "ALL") return true;
    const m = (matSub || "").trim().toLowerCase();
    const f = (filterSub || "").trim().toLowerCase();
    if (m === f) return true;
    if (f === "social science") return m.includes("social") || m.includes("history") || m.includes("geography");
    if (f === "science") return m === "science" || m.includes("physics") || m.includes("chemistry") || m.includes("biology");
    if (f === "mathematics") return m.includes("math") || m.includes("algebra") || m.includes("geometry");
    if (f === "english") return m.includes("english") || m.includes("grammar");
    return m.includes(f) || f.includes(m);
  };

  const filtered = classMaterials.filter((m: any) => {
    const matchesSearch =
      !search.trim() ||
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      (typeof m.uploadedBy === "object" && (m.uploadedBy as any)?.name?.toLowerCase().includes(search.toLowerCase())) ||
      (typeof m.uploadedBy === "string" && m.uploadedBy.toLowerCase().includes(search.toLowerCase()));

    const matchesSubject = isSubjectMatch(m.subject, selectedSubject);
    return matchesSearch && matchesSubject;
  });

  const handleDownload = async (mat: DownloadableMaterial) => {
    const matId = mat._id || mat.title;
    setDownloadingId(matId);
    try {
      await downloadMaterial(mat);
      setDownloadedId(matId);
      setTimeout(() => setDownloadedId(null), 3000);
    } catch (e) {
      console.error("Download note failed", e);
    } finally {
      setDownloadingId(null);
    }
  };

  const getSubjectBadge = (subject: string) => {
    switch (subject?.toLowerCase()) {
      case "mathematics":
        return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800";
      case "science":
      case "physics":
      case "chemistry":
      case "biology":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800";
      case "english":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800";
      case "social science":
        return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800";
      default:
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800";
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      
      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Learning Hub & Study Materials
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Official verified notes, formula handbooks, and model question papers for <span className="font-semibold text-slate-700 dark:text-slate-300">{studentClass} ({studentBoard})</span>.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 shrink-0">
          {filtered.length} of {classMaterials.length} Resources Available
        </div>
      </div>

      {/* ── TUITION FEE LOCK PAYWALL (IF LOCKED & TRIAL EXPIRED) ── */}
      {data?.locked ? (
        <div className="py-6 sm:py-10 flex items-center justify-center">
          <div className="w-full max-w-xl p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center space-y-6">
            
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-50/50 dark:ring-amber-950/20">
              {data.isUnderReview ? (
                <Clock className="w-7 h-7 animate-spin text-amber-600 dark:text-amber-400" />
              ) : (
                <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {data.isUnderReview ? "Tuition Payment Under Verification" : "Monthly Tuition Fee Payment Required"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {data.isUnderReview
                  ? "Your fee submission is currently under review by admin. Full access to study notes and live recordings will unlock immediately upon approval."
                  : "Please clear your monthly tuition fee to access official verified formula handbooks, question banks, and live sessions."}
              </p>
            </div>

            {/* Fee & Month Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Due Amount: <strong className="text-slate-900 dark:text-slate-100 font-bold">₹{data.unpaidFee?.amount || 1999}</strong></span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>Billing Cycle: <strong className="text-slate-900 dark:text-slate-100 font-bold">{data.unpaidFee?.billingMonth || "Current Cycle"}</strong></span>
            </div>

            {/* Features Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-left">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">NCERT Handbooks</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Solved Exemplars</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">PDF Downloads</span>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/student/fees" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-[#004b79] hover:bg-[#003b60] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-all cursor-pointer">
                  {data.isUnderReview ? "View Payment Verification Status →" : `Pay Tuition Fee (₹${data.unpaidFee?.amount || 1999}) →`}
                </Button>
              </Link>
              <Link href="/student/fees" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">
                  View Fee Receipts & QR
                </Button>
              </Link>
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* ── 2. SEARCH & SUBJECT FILTERS (CARDLESS) ── */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={`Search ${studentClass} materials by title, topic, or keywords...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Subject Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Subjects:
              </span>
              {availableSubjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSubject(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedSubject === s
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {s === "ALL" ? "All Subjects" : s}
                </button>
              ))}
            </div>
          </div>

          {/* ── 3. CARDLESS MASTER MATERIALS TABLE ── */}
          <div className="space-y-2 pt-2">
            {/* Table Column Headers */}
            <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
              <div className="col-span-2">Subject & Format</div>
              <div className="col-span-5">Study Material Title & Summary</div>
              <div className="col-span-3">Faculty Specialist</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Materials Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No study materials found matching "{selectedSubject !== "ALL" ? selectedSubject : search}".
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Click "All Subjects" or clear search keywords to view all resources.
                  </p>
                </div>
              ) : (
                filtered.map((mat: DownloadableMaterial) => {
                  const matId = mat._id || mat.title;
                  const isDownloading = downloadingId === matId;
                  const isDownloaded = downloadedId === matId;
                  const facultyName =
                    typeof mat.uploadedBy === "object" && (mat.uploadedBy as any)?.name
                      ? (mat.uploadedBy as any).name
                      : typeof mat.uploadedBy === "string"
                      ? mat.uploadedBy
                      : "Faculty Specialist";

                  return (
                    <div
                      key={matId}
                      className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                    >
                      {/* Column 1: Subject & Format (col-span-2) */}
                      <div className="col-span-2 space-y-0.5">
                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${getSubjectBadge(mat.subject)}`}>
                          {mat.subject}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          <span>{mat.category || "NOTES"}</span>
                          <span className="mx-1">•</span>
                          <span>{mat.fileSize || "1.8 MB"}</span>
                        </div>
                      </div>

                      {/* Column 2: Title & Description (col-span-5) */}
                      <div className="col-span-5 space-y-0.5">
                        <h2 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug">
                          {mat.title}
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {mat.description || `Official study material and notes for ${studentClass}.`}
                        </p>
                      </div>

                      {/* Column 3: Faculty Uploader (col-span-3) */}
                      <div className="col-span-3">
                        <p className="font-medium text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                          {facultyName}
                        </p>
                        <p className="text-[10px] text-slate-400">Faculty Specialist</p>
                      </div>

                      {/* Column 4: Actions (col-span-2 text-right) */}
                      <div className="col-span-2 flex items-center justify-start md:justify-end gap-2">
                        <button
                          onClick={() => setPreviewMaterial(mat)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          onClick={() => handleDownload(mat)}
                          disabled={isDownloading}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            isDownloaded
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white"
                          }`}
                        >
                          {isDownloading ? (
                            <span className="animate-spin text-xs">⏳</span>
                          ) : isDownloaded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Downloaded</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── 4. SPACIOUS RECTANGULAR PDF DOSSIER MODAL ── */}
          {previewMaterial && (
            <Modal
              isOpen={!!previewMaterial}
              maxWidth="3xl"
              onClose={() => setPreviewMaterial(null)}
              title=""
              description=""
            >
              <div className="space-y-5 text-slate-900 dark:text-slate-100 select-none pr-7">
                
                {/* Top Bar: Subject Badge + Format + Date */}
                <div className="flex items-center gap-2.5">
                  <span className={`text-xs font-bold px-3 py-1 rounded-md border ${getSubjectBadge(previewMaterial.subject)}`}>
                    {previewMaterial.subject}
                  </span>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {previewMaterial.category || "PDF HANDBOOK"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-auto">
                    Mantif Verified Study Pack
                  </span>
                </div>

                {/* Main 2-Column Rectangular Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1">
                  
                  {/* Left Column: Title, Summary, Key Highlights & Download CTA (7 cols) */}
                  <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                        {previewMaterial.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {previewMaterial.description || `Official reference study material compiled for ${studentClass} curriculum.`}
                      </p>

                      {/* Syllabus Highlights */}
                      <div className="space-y-2 pt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">•</span>
                          <span><strong>Key Formulas:</strong> Standard equations & derivation rules.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">•</span>
                          <span><strong>Solved Exemplars:</strong> Step-by-step scoring solutions.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">•</span>
                          <span><strong>Practice Checklist:</strong> Board question preparation.</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Action Button */}
                    <div className="pt-3">
                      <button
                        onClick={() => handleDownload(previewMaterial)}
                        disabled={downloadingId === (previewMaterial._id || previewMaterial.title)}
                        className={`w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          downloadedId === (previewMaterial._id || previewMaterial.title)
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                        }`}
                      >
                        {downloadingId === (previewMaterial._id || previewMaterial.title) ? (
                          <span className="animate-spin text-xs">⏳ Generating PDF...</span>
                        ) : downloadedId === (previewMaterial._id || previewMaterial.title) ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>PDF Downloaded Successfully</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download Official PDF Document</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Clean Spacious Dossier Panel (5 cols) */}
                  <div className="md:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 text-xs sm:text-sm">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Faculty Specialist</span>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {typeof previewMaterial.uploadedBy === "object"
                            ? (previewMaterial.uploadedBy as any)?.name
                            : previewMaterial.uploadedBy || "Senior Faculty Specialist"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Curriculum Target</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                          {previewMaterial.classLevel || studentClass} ({studentBoard} Board)
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">File Specification</span>
                        <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          PDF Document • {previewMaterial.fileSize || "1.8 MB"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verification Status</span>
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verified Official Release</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">
                        Mantif Learning Hub
                      </span>
                      <button
                        onClick={() => setPreviewMaterial(null)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </Modal>
          )}
        </>
      )}

    </main>
  );
}
