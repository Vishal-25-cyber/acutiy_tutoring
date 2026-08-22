"use client";

import React, { useState } from "react";
import { BookOpen, Download, Search, FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSubjectsForClassAndBoard } from "@/lib/curriculum";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentMaterialsPage() {
  const { data } = useFastFetch("/api/student/materials");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selectedSubject, setSelectedSubject] = useState("ALL");

  const studentClass = "Class 10";
  const studentBoard = "CBSE";
  const syllabusSubjects = ["ALL", ...getSubjectsForClassAndBoard(studentClass, studentBoard)];

  const categories = [
    { id: "ALL", label: "All Formats" },
    { id: "NOTES", label: "Class Notes" },
    { id: "PDF", label: "PDF Handbooks" },
    { id: "WORKSHEET", label: "Worksheets & Diagrams" },
    { id: "QUESTION_PAPER", label: "Model Papers" },
  ];

  const materials = data?.materials || [
    {
      _id: "1",
      title: "Class 10 Mathematics — Quadratic Equations Complete Formulas & Derivations",
      subject: "Mathematics",
      classLevel: "Class 10",
      category: "NOTES",
      fileUrl: "https://acuity.edu/materials/class10-maths-sample.pdf",
      fileSize: "2.1 MB",
      description: "Comprehensive formula sheet with step-by-step solved derivation problems.",
    },
    {
      _id: "2",
      title: "Class 10 Science — Light Reflection & Refraction Ray Diagrams",
      subject: "Science",
      classLevel: "Class 10",
      category: "WORKSHEET",
      fileUrl: "https://acuity.edu/materials/class10-science-sample.pdf",
      fileSize: "3.4 MB",
      description: "Concave and convex lens ray diagram workbook with practice problems.",
    },
    {
      _id: "3",
      title: "Class 10 English — Grammar, Clauses & Formal Letter Writing Templates",
      subject: "English Language & Literature",
      classLevel: "Class 10",
      category: "PDF",
      fileUrl: "https://acuity.edu/materials/class10-english-sample.pdf",
      fileSize: "1.2 MB",
      description: "High-scoring formal letter and analytical paragraph writing templates.",
    },
  ];

  const filtered = materials.filter((m: any) => {
    const matchesSearch =
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "ALL" || m.category === category;
    const matchesSubject =
      selectedSubject === "ALL" ||
      m.subject === selectedSubject ||
      m.subject?.includes(selectedSubject);
    return matchesSearch && matchesCat && matchesSubject;
  });

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Learning Hub & Materials
            </h1>
            <Badge variant="default" className="text-[10px]">
              {studentClass} {studentBoard}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Curated notes, Ray Diagrams, formula sheets, and past question papers for {studentClass} {studentBoard}.
          </p>
        </div>
      </div>

      {/* Search, Category & Subject Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search materials by title or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  category === c.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Syllabus Subject Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Subjects:</span>
          {syllabusSubjects.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedSubject === s
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {s === "ALL" ? "All Subjects" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No study materials matching the selected filters.
          </div>
        ) : (
          filtered.map((mat: any) => (
            <Card key={mat._id} className="p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-[10px]">
                    {mat.category}
                  </Badge>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {mat.subject}
                  </span>
                </div>

                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">{mat.title}</h2>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {mat.description || "Downloadable learning material strictly aligned with school syllabus."}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Size: {mat.fileSize || "1.8 MB"}</span>
                <a href={mat.fileUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary" className="rounded-xl font-semibold gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </Button>
                </a>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
