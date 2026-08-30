"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Download,
  Search,
  FileText,
  Filter,
  Check,
  User,
  Calendar,
  Sparkles,
  ExternalLink,
  Eye,
  FileCheck,
  GraduationCap,
  Printer,
  ChevronRight,
  Layers,
  Lock,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useFastFetch } from "@/lib/api-cache";
import { downloadMaterial, DownloadableMaterial } from "@/lib/download";

export default function StudentMaterialsPage() {
  const { data, isLoading } = useFastFetch("/api/student/materials");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<DownloadableMaterial | null>(null);

  const studentClass = data?.studentClass || "Class 10";
  const studentBoard = data?.board || "CBSE";

  const categories = [
    { id: "ALL", label: "All Formats" },
    { id: "NOTES", label: "Class Notes" },
    { id: "PDF", label: "PDF Handbooks" },
    { id: "WORKSHEET", label: "Worksheets & Diagrams" },
    { id: "QUESTION_PAPER", label: "Model Papers" },
  ];

  const rawMaterials: DownloadableMaterial[] = Array.isArray(data?.materials)
    ? data.materials
    : [];

  // Filter strictly by student's class
  const classMaterials = rawMaterials.filter((m: any) => {
    return !m.classLevel || m.classLevel === studentClass;
  });

  // Extract clean available subjects
  const availableSubjects = Array.from(
    new Set([
      "Mathematics",
      "Science",
      "Social Science",
      "English",
      ...classMaterials.map((m: any) => m.subject).filter(Boolean),
    ])
  );
  const subjectFilterOptions = ["ALL", ...availableSubjects];

  const isSubjectMatch = (matSub: string, filterSub: string) => {
    if (!filterSub || filterSub === "ALL") return true;
    const m = (matSub || "").trim().toLowerCase();
    const f = (filterSub || "").trim().toLowerCase();

    if (m === f) return true;

    if (f === "social science") {
      return (
        m.includes("social") ||
        m.includes("history") ||
        m.includes("geography") ||
        m.includes("civics") ||
        m.includes("economics")
      );
    }

    if (f === "science") {
      if (m.includes("social")) return false;
      return (
        m === "science" ||
        m.includes("physics") ||
        m.includes("chemistry") ||
        m.includes("biology")
      );
    }

    if (f === "mathematics") {
      return m.includes("math") || m.includes("algebra") || m.includes("geometry");
    }

    if (f === "english") {
      return m.includes("english") || m.includes("grammar") || m.includes("literature");
    }

    return m.includes(f) || f.includes(m);
  };

  const filtered = classMaterials.filter((m: any) => {
    const matchesSearch =
      !search.trim() ||
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      (typeof m.uploadedBy === "object" && m.uploadedBy?.name?.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = category === "ALL" || m.category === category;
    const matchesSubject = isSubjectMatch(m.subject, selectedSubject);

    return matchesSearch && matchesCat && matchesSubject;
  });

  const handleDownload = async (mat: DownloadableMaterial) => {
    const matId = mat._id || mat.title;
    setDownloadingId(matId);
    try {
      await downloadMaterial(mat);
      setDownloadedId(matId);
      setTimeout(() => setDownloadedId(null), 3000);
    } catch (e) {
      console.error(e);
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
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* 1. CLEAN OPEN-SPACE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Learning Hub & Study Materials
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{studentClass} ({studentBoard})</span>
            </span>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Official staff uploaded notes, Ray Diagrams, formula handbooks, and model question papers for <strong>{studentClass}</strong>.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 self-start md:self-auto">
          {filtered.length} of {classMaterials.length} Resources Shown
        </div>
      </div>

      {/* ── TUITION FEE LOCK PAYWALL (WHEN FEE UNPAID OR UNDER REVIEW) ── */}
      {data?.locked ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-transparent border-2 border-amber-500/30 text-center space-y-6 shadow-xl shadow-amber-500/5">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-500/10">
            {data.isUnderReview ? <Clock className="w-8 h-8 animate-spin text-amber-600" /> : <Lock className="w-8 h-8 text-amber-600" />}
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 inline-block">
              {data.isUnderReview ? "Payment Under Review" : "Tuition Payment Required"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {data.isUnderReview ? "Awaiting Administrator Confirmation" : "Study Notes & Learning Hub Locked"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {data.isUnderReview
                ? `Your tuition payment of ₹${data.pendingVerification?.amount || 2500} for ${data.pendingVerification?.billingMonth || "August 2026"} (Ref: ${data.pendingVerification?.transactionId || "Submitted"}) has been received and is currently under review by the administrator. Full access to download notes and study materials will be unlocked once confirmed.`
                : `Your monthly tuition fee of ₹${data.unpaidFee?.amount || 2500} for ${data.unpaidFee?.billingMonth || "Current Month"} is pending. Please complete fee payment to submit for admin confirmation and unlock materials.`}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/student/fees">
              <Button size="lg" className="font-extrabold text-sm bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 px-8 py-3 rounded-2xl cursor-pointer">
                {data.isUnderReview ? "View Payment Status & Invoice →" : `Pay Tuition Fee (₹${data.unpaidFee?.amount || 2500}) to Unlock Materials →`}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 2. SEARCH & SUBJECT FILTERS */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder={`Search ${studentClass} materials by title, topic, or keywords...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-11 w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

        {/* Clean Syllabus Subject Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">SUBJECTS:</span>
          {subjectFilterOptions.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedSubject === s
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                }`}
            >
              {s === "ALL" ? "All Subjects" : s}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CARDLESS MASTER MATERIALS TABLE (Clean 12-Column Grid Rows) */}
      <div className="space-y-4">
        <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
          <div className="col-span-2">Subject & Format</div>
          <div className="col-span-5">Study Material Title & Description</div>
          <div className="col-span-2">Faculty Uploader</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                No study materials found matching "{selectedSubject !== "ALL" ? selectedSubject : search || category}".
              </p>
              <p className="text-xs text-slate-400">
                Click <strong>"All Subjects"</strong> or clear search keywords to view all available resources.
              </p>
            </div>
          ) : (
            filtered.map((mat: DownloadableMaterial) => {
              const matId = mat._id || mat.title;
              const isDownloading = downloadingId === matId;
              const isDownloaded = downloadedId === matId;
              const facultyName =
                typeof mat.uploadedBy === "object" && mat.uploadedBy?.name
                  ? mat.uploadedBy.name
                  : typeof mat.uploadedBy === "string"
                    ? mat.uploadedBy
                    : "Faculty Specialist";

              return (
                <div
                  key={matId}
                  className="py-4 sm:py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors rounded-2xl"
                >
                  {/* Column 1: Subject & Format (col-span-2) */}
                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getSubjectBadge(mat.subject)}`}>
                        {mat.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{mat.category || "NOTES"}</span>
                      <span>•</span>
                      <span>{mat.fileSize || "1.8 MB"}</span>
                    </div>
                  </div>

                  {/* Column 2: Title & Description (col-span-5) */}
                  <div className="col-span-5 space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                      {mat.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {mat.description || `Official study material and notes for ${studentClass}.`}
                    </p>
                  </div>

                  {/* Column 3: Faculty Uploader (col-span-2) */}
                  <div className="col-span-2 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                        {facultyName}
                      </p>
                      <p className="text-[10px] text-slate-400">Staff Faculty</p>
                    </div>
                  </div>

                  {/* Column 4: Actions (col-span-3 text-right) */}
                  <div className="col-span-3 flex items-center justify-start md:justify-end gap-2.5 pt-2 md:pt-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewMaterial(mat)}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 gap-1.5 rounded-xl h-9 px-3"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </Button>

                    <Button
                      size="sm"
                      variant={isDownloaded ? "secondary" : "glow"}
                      onClick={() => handleDownload(mat)}
                      disabled={isDownloading}
                      className={`font-bold text-xs gap-1.5 rounded-xl h-9 px-4 transition-all ${isDownloaded
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
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
                          <span>Download Note</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. FULL DOCUMENT & NOTES INTERACTIVE PREVIEW READER MODAL */}
      {previewMaterial && (
        <Modal
          isOpen={!!previewMaterial}
          maxWidth="4xl"
          onClose={() => setPreviewMaterial(null)}
          title={previewMaterial.title}
          description={`Subject: ${previewMaterial.subject} • Class: ${studentClass} • Format: ${previewMaterial.category || "NOTES"}`}
        >
          <div className="space-y-4 pt-2 text-xs">
            {/* Header actions */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getSubjectBadge(previewMaterial.subject)}`}>
                  {previewMaterial.subject}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  By {typeof previewMaterial.uploadedBy === "object" ? previewMaterial.uploadedBy?.name : previewMaterial.uploadedBy || "Faculty Specialist"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (previewMaterial.fileUrl && previewMaterial.fileUrl.startsWith("data:")) {
                      const win = window.open();
                      if (win) win.document.write(`<iframe src="${previewMaterial.fileUrl}" style="width:100%; height:100vh; border:none;"></iframe>`);
                    } else {
                      handleDownload(previewMaterial);
                    }
                  }}
                  className="text-xs font-bold gap-1.5 h-8 rounded-xl bg-white dark:bg-slate-900 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Window ↗</span>
                </Button>

                <Button
                  size="sm"
                  variant="glow"
                  onClick={() => {
                    handleDownload(previewMaterial);
                  }}
                  className="text-xs font-bold gap-1.5 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Note</span>
                </Button>
              </div>
            </div>

            {/* Document Content View */}
            {previewMaterial.fileUrl && previewMaterial.fileUrl.startsWith("data:application/pdf") ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 shadow-inner">
                <iframe
                  src={previewMaterial.fileUrl}
                  title="PDF Note Preview"
                  className="w-full h-[540px] rounded-2xl"
                />
              </div>
            ) : previewMaterial.fileUrl && previewMaterial.fileUrl.startsWith("data:image") ? (
              <div className="max-h-[540px] overflow-auto p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <img
                  src={previewMaterial.fileUrl}
                  alt={previewMaterial.title}
                  className="max-w-full h-auto mx-auto rounded-xl shadow-md"
                />
              </div>
            ) : (
              /* Rich Formatted Interactive Notes Reader */
              <div className="p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[540px] overflow-y-auto space-y-6 shadow-xs font-sans">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                      ACUITY TUTORING • VERIFIED STUDY PACK
                    </span>
                    <span className="text-xs text-slate-400">
                      Grade: {studentClass} ({studentBoard})
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    {previewMaterial.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {previewMaterial.description || `Official reference study material compiled for ${studentClass} curriculum.`}
                  </p>
                </div>

                {/* Section 1: Core Concepts */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>1. Core Concepts & Theoretical Foundations</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    <li>Comprehensive syllabus definitions and standard terminology.</li>
                    <li>Step-by-step conceptual breakdowns with NCERT guideline mapping.</li>
                    <li>Highlighted examination marking criteria and key definitions.</li>
                  </ul>
                </div>

                {/* Section 2: Formulas & Important Rules */}
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                  <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                    2. Formulas, Derivations & Key Examination Rules
                  </h4>
                  <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-emerald-200 dark:border-emerald-900 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                    • Standard Form: Ax + By = C | ax² + bx + c = 0<br />
                    • Discriminant Formula: D = b² - 4ac (D &gt; 0: Real & Distinct, D = 0: Equal roots)<br />
                    • Verification Rule: Always verify dimensional units and step substitutions before final values.
                  </div>
                </div>

                {/* Section 3: Solved Exemplar Practice Questions */}
                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 space-y-2">
                  <h4 className="font-bold text-sm text-purple-800 dark:text-purple-300">
                    3. Solved Step-by-Step Exemplar Practice Problems
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <p><strong>Example 1 (Direct Application):</strong> Substituting standard parameters into general boundary condition formulas.</p>
                    <p><strong>Example 2 (Board Exam Style HOTS):</strong> Multi-step derivation problem with full breakdown.</p>
                  </div>
                </div>

                {/* Section 4: Home Revision Checklist */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    4. Student Self-Study & Revision Checklist
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Review classroom live lecture recording notes before tests.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Solve practice questions in the Assignments section.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ask any doubts directly in the upcoming live interactive batch session.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMaterial(null)}
                className="rounded-xl"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
      </>
      )}
    </main>
  );
}
