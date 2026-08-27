"use client";

import React, { useState } from "react";
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

  const defaultCurriculumMaterials: DownloadableMaterial[] = [
    {
      _id: "mat-1",
      title: `${studentClass} Mathematics — Quadratic Equations Formulas & Derivations`,
      subject: "Mathematics",
      classLevel: studentClass,
      category: "NOTES",
      fileUrl: "https://acuity.edu/materials/class10-maths-sample.pdf",
      fileName: `${studentClass}_Mathematics_Formulas.pdf`,
      fileSize: "2.1 MB",
      description: "Comprehensive formula sheet with step-by-step solved derivation problems and discriminant rules.",
      uploadedBy: { name: "Dr. Sarah Jenkins" },
      createdAt: new Date().toISOString(),
    },
    {
      _id: "mat-2",
      title: `${studentClass} Science — Light: Reflection & Refraction Ray Diagrams`,
      subject: "Science",
      classLevel: studentClass,
      category: "WORKSHEET",
      fileUrl: "https://acuity.edu/materials/class10-science-sample.pdf",
      fileName: `${studentClass}_Science_Ray_Diagrams.pdf`,
      fileSize: "3.4 MB",
      description: "Concave and convex lens ray diagram workbook with solved NCERT exemplar questions.",
      uploadedBy: { name: "Prof. Rajesh Kumar" },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: "mat-3",
      title: `${studentClass} English — Grammar, Clauses & Formal Letter Writing Templates`,
      subject: "English",
      classLevel: studentClass,
      category: "PDF",
      fileUrl: "https://acuity.edu/materials/class10-english-sample.pdf",
      fileName: `${studentClass}_English_Grammar_Templates.pdf`,
      fileSize: "1.2 MB",
      description: "High-scoring formal letter and analytical paragraph writing templates with examiner tips.",
      uploadedBy: { name: "Ms. Anita Desai" },
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: "mat-4",
      title: `${studentClass} Social Science — Nationalism in India Map & Timeline Guide`,
      subject: "Social Science",
      classLevel: studentClass,
      category: "NOTES",
      fileUrl: "https://acuity.edu/materials/class10-social-sample.pdf",
      fileName: `${studentClass}_SocialScience_Timeline.pdf`,
      fileSize: "2.8 MB",
      description: "Key dates, Congress sessions, Satyagraha movements and map pointing questions.",
      uploadedBy: { name: "Prof. Rajesh Kumar" },
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const rawMaterials: DownloadableMaterial[] = Array.isArray(data?.materials) && data.materials.length > 0
    ? data.materials
    : defaultCurriculumMaterials;

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

      {/* 2. SEARCH & FORMAT/SUBJECT FILTERS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder={`Search ${studentClass} materials by title, topic, or keywords...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${category === c.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>
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

      {/* 4. INTERACTIVE PREVIEW MODAL */}
      {previewMaterial && (
        <Modal
          isOpen={!!previewMaterial}
          maxWidth="2xl"
          onClose={() => setPreviewMaterial(null)}
          title={previewMaterial.title}
          description={`Subject: ${previewMaterial.subject} • Class: ${studentClass} • Format: ${previewMaterial.category || "NOTES"}`}
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Document Overview</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {previewMaterial.description || `Official syllabus study material and structured reference notes designed for ${studentClass} Acuity Tutoring students.`}
              </p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-slate-400 text-xs">
                <span>File Size: <strong className="font-mono text-slate-700 dark:text-slate-300">{previewMaterial.fileSize || "1.8 MB"}</strong></span>
                <span>
                  Faculty: <strong className="text-slate-700 dark:text-slate-300">{typeof previewMaterial.uploadedBy === "object" ? previewMaterial.uploadedBy?.name : previewMaterial.uploadedBy || "Faculty Specialist"}</strong>
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setPreviewMaterial(null)} className="rounded-xl">
                Close
              </Button>
              <Button
                variant="glow"
                size="sm"
                onClick={() => {
                  handleDownload(previewMaterial);
                  setPreviewMaterial(null);
                }}
                className="font-bold gap-1.5 rounded-xl bg-indigo-600 text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
