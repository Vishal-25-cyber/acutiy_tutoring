"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
  Search,
  Calendar,
  Download,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Video,
  FileCheck,
  TrendingUp,
  Sparkles,
  PhoneCall,
  Save,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Loader2,
  RefreshCw,
  Plus,
  School,
  User,
  GraduationCap,
  BarChart3,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";
import {
  generateStudentPerformanceReportPdf,
  generateSchoolPerformanceReportPdf,
} from "@/lib/download";

export default function TeacherStudentReportsPage() {
  // Mode switcher: "SCHOOL" (Default/CEO feature) vs "INDIVIDUAL"
  const [reportMode, setReportMode] = useState<"SCHOOL" | "INDIVIDUAL">("SCHOOL");

  // School Mode States
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [schoolClassFilter, setSchoolClassFilter] = useState<string>("ALL");
  const [schoolPeriodFilter, setSchoolPeriodFilter] = useState<string>("LAST_90_DAYS");
  const [isExportingSchoolPdf, setIsExportingSchoolPdf] = useState(false);

  // Individual Mode States
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("LAST_90_DAYS");
  const [isExportingStudentPdf, setIsExportingStudentPdf] = useState(false);

  // ── DATA FETCHING ──
  // 1. Fetch distinct schools list
  const {
    data: schoolsData,
    isLoading: isSchoolsLoading,
    refetch: refetchSchools,
  } = useFastFetch("/api/teacher/reports/school");

  const defaultSchools = [
    { schoolName: "Delhi Public School", studentCount: 14, district: "Metro District", board: "CBSE", classes: ["Class 8", "Class 9", "Class 10"] },
    { schoolName: "National Public School", studentCount: 11, district: "Central District", board: "CBSE", classes: ["Class 8", "Class 9", "Class 10"] },
    { schoolName: "DAV Public School", studentCount: 9, district: "South District", board: "CBSE", classes: ["Class 7", "Class 8", "Class 9", "Class 10"] },
    { schoolName: "Kendriya Vidyalaya", studentCount: 16, district: "Main District", board: "CBSE", classes: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"] },
    { schoolName: "St. Joseph's Academy", studentCount: 8, district: "North District", board: "ICSE", classes: ["Class 9", "Class 10"] },
  ];

  const schools = Array.isArray(schoolsData?.schools) && schoolsData.schools.length > 0
    ? schoolsData.schools
    : defaultSchools;

  // Auto-select first school if none selected
  useEffect(() => {
    if (!selectedSchool && schools.length > 0) {
      setSelectedSchool(schools[0].schoolName);
    }
  }, [schools, selectedSchool]);

  // 2. Fetch full School-Wise Performance Report
  const schoolReportUrl = selectedSchool
    ? `/api/teacher/reports/school?schoolName=${encodeURIComponent(
        selectedSchool
      )}&classLevel=${schoolClassFilter}&period=${schoolPeriodFilter}`
    : "";
  const {
    data: schoolReportData,
    isLoading: isSchoolReportLoading,
    refetch: refetchSchoolReport,
  } = useFastFetch(schoolReportUrl);
  const schoolReport = schoolReportData?.report;

  // 3. Fetch individual students roster for Individual Mode
  const studentListUrl = `/api/teacher/reports?classLevel=${classFilter}&batchId=${batchFilter}&search=${encodeURIComponent(
    search
  )}`;
  const {
    data: listData,
    isLoading: isListLoading,
    refetch: refetchList,
  } = useFastFetch(studentListUrl);
  const students = Array.isArray(listData?.students) ? listData.students : [];
  const classes = Array.isArray(listData?.classes) ? listData.classes : [];
  const batches = Array.isArray(listData?.batches) ? listData.batches : [];

  // Auto-select first student if none selected
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].userId);
    }
  }, [students, selectedStudentId]);

  // 4. Fetch full Individual Student Report
  const studentReportUrl = selectedStudentId
    ? `/api/teacher/reports/${selectedStudentId}?period=${periodFilter}`
    : "";
  const {
    data: studentReportData,
    isLoading: isStudentReportLoading,
    refetch: refetchStudentReport,
  } = useFastFetch(studentReportUrl);
  const studentReport = studentReportData?.report;

  // Teacher Remarks State for individual student
  const [remarksForm, setRemarksForm] = useState({
    observation: "",
    academicFeedback: "",
    participationFeedback: "",
    areasForImprovement: "",
    recommendations: "",
  });
  const [isSavingRemarks, setIsSavingRemarks] = useState(false);
  const [remarksSuccess, setRemarksSuccess] = useState(false);

  useEffect(() => {
    if (studentReport?.teacherRemarks) {
      setRemarksForm({
        observation: studentReport.teacherRemarks.observation || "",
        academicFeedback: studentReport.teacherRemarks.academicFeedback || "",
        participationFeedback: studentReport.teacherRemarks.participationFeedback || "",
        areasForImprovement: studentReport.teacherRemarks.areasForImprovement || "",
        recommendations: studentReport.teacherRemarks.recommendations || "",
      });
    }
  }, [studentReport]);

  // Parent Communication State
  const [showAddCommModal, setShowAddCommModal] = useState(false);
  const [commMethod, setCommMethod] = useState<"CALL" | "WHATSAPP" | "EMAIL" | "IN_PERSON">("CALL");
  const [commSummary, setCommSummary] = useState("");
  const [commFollowUpDate, setCommFollowUpDate] = useState("");
  const [commStatus, setCommStatus] = useState<"PENDING" | "IN_PROGRESS" | "RESOLVED">("RESOLVED");
  const [isSavingComm, setIsSavingComm] = useState(false);

  // PDF Handlers
  const handleDownloadSchoolPdf = async () => {
    if (!schoolReport) return;
    setIsExportingSchoolPdf(true);
    try {
      await generateSchoolPerformanceReportPdf(schoolReport);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingSchoolPdf(false);
    }
  };

  const handleDownloadStudentPdf = async () => {
    if (!studentReport) return;
    setIsExportingStudentPdf(true);
    try {
      await generateStudentPerformanceReportPdf(studentReport);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingStudentPdf(false);
    }
  };

  const handleSaveRemarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setIsSavingRemarks(true);
    setRemarksSuccess(false);

    try {
      const res = await fetch(`/api/teacher/reports/${selectedStudentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_REMARK",
          ...remarksForm,
        }),
      });
      if (res.ok) {
        setRemarksSuccess(true);
        invalidateCache(`/api/teacher/reports/${selectedStudentId}`);
        setTimeout(() => setRemarksSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingRemarks(false);
    }
  };

  const handleAddParentComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !commSummary.trim()) return;
    setIsSavingComm(true);

    try {
      const res = await fetch(`/api/teacher/reports/${selectedStudentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_PARENT_COMM",
          communicationMethod: commMethod,
          discussionSummary: commSummary,
          followUpDate: commFollowUpDate || undefined,
          followUpStatus: commStatus,
        }),
      });
      if (res.ok) {
        setShowAddCommModal(false);
        setCommSummary("");
        setCommFollowUpDate("");
        invalidateCache(`/api/teacher/reports/${selectedStudentId}`);
        refetchStudentReport();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingComm(false);
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none pb-24">
      {/* ── 1. PAGE HEADER & VIEW MODE SWITCHER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Academic Performance Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Consolidated school-wise cohort marksheets, multi-student performance comparative analytics, and official PDF generation.
          </p>
        </div>

        {/* View Mode Switcher Pills & Refresh */}
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setReportMode("SCHOOL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                reportMode === "SCHOOL"
                  ? "bg-[#004b79] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <School className="w-3.5 h-3.5 text-[#dfb74a]" />
              <span>School Cohort Report</span>
            </button>
            <button
              type="button"
              onClick={() => setReportMode("INDIVIDUAL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                reportMode === "INDIVIDUAL"
                  ? "bg-[#004b79] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Individual Student</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (reportMode === "SCHOOL") {
                refetchSchools();
                refetchSchoolReport();
              } else {
                refetchList();
                refetchStudentReport();
              }
            }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODE 1: SCHOOL-WISE COHORT PERFORMANCE REPORT (CEO) ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {reportMode === "SCHOOL" && (
        <div className="space-y-6 sm:space-y-8">
          {/* ── SCHOOL SELECTOR & FILTER TOOLBAR ── */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
                  <School className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
                  <span>Select School:</span>
                </span>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer min-w-[240px]"
                >
                  {schools.map((s: any) => (
                    <option key={s.schoolName} value={s.schoolName}>
                      {s.schoolName} ({s.studentCount} Students)
                    </option>
                  ))}
                </select>

                {/* Grade Filter within School */}
                <select
                  value={schoolClassFilter}
                  onChange={(e) => setSchoolClassFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer"
                >
                  <option value="ALL">All Grades (6–10)</option>
                  {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Period Filter */}
                <select
                  value={schoolPeriodFilter}
                  onChange={(e) => setSchoolPeriodFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer"
                >
                  <option value="LAST_30_DAYS">Last 30 Days</option>
                  <option value="LAST_90_DAYS">Last 90 Days (Quarterly)</option>
                  <option value="THIS_TERM">Current Academic Term</option>
                  <option value="ALL_TIME">All-Time Cumulative</option>
                </select>
              </div>

              {/* Download School PDF Button */}
              <button
                type="button"
                disabled={!schoolReport || isExportingSchoolPdf}
                onClick={handleDownloadSchoolPdf}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60 shrink-0"
              >
                {isExportingSchoolPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-300" />
                )}
                <span>Generate School PDF Report</span>
              </button>
            </div>

            {/* School Quick Pill Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-thin">
              {schools.map((sc: any) => {
                const isSelected = selectedSchool.toLowerCase() === sc.schoolName.toLowerCase();
                return (
                  <button
                    key={sc.schoolName}
                    type="button"
                    onClick={() => setSelectedSchool(sc.schoolName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#004b79] text-white border-[#004b79] shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <School className="w-3.5 h-3.5 text-[#dfb74a]" />
                    <span>{sc.schoolName}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-extrabold">
                      {sc.studentCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {isSchoolReportLoading ? (
            <div className="p-16 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-[#004b79]" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Consolidating marksheet and cohort metrics for {selectedSchool}…
              </p>
            </div>
          ) : schoolReport ? (
            <div className="space-y-6 sm:space-y-8">
              {/* ── SCHOOL OVERVIEW BANNER ── */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#002137] text-white shadow-sm border border-slate-800 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#dfb74a]/20 border border-[#dfb74a]/40 flex items-center justify-center text-xl font-black text-[#dfb74a] shrink-0 shadow-inner">
                      <School className="w-7 h-7 text-[#dfb74a]" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                          {schoolReport.schoolOverview.schoolName}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#dfb74a] text-slate-950">
                          {schoolReport.schoolOverview.totalStudents} Enrolled
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          <strong>Curriculum:</strong> {schoolReport.schoolOverview.board} Board
                        </span>
                        <span>•</span>
                        <span>
                          <strong>District:</strong> {schoolReport.schoolOverview.district}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Grades:</strong> {(schoolReport.schoolOverview.classesRepresented || []).join(", ")}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <div>
                      <span className="text-slate-400 block text-[11px]">School Overall Avg</span>
                      <strong className="font-extrabold text-emerald-400 text-sm">
                        {schoolReport.schoolMetrics.overallSchoolAverage}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Top Performer</span>
                      <strong className="font-semibold text-slate-100 truncate block max-w-[130px]">
                        {schoolReport.schoolOverview.topPerformer} ({schoolReport.schoolOverview.highestScore}%)
                      </strong>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block text-[11px]">Report Period</span>
                      <strong className="font-semibold text-blue-300">
                        {schoolReport.schoolOverview.reportPeriod}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SCHOOL SCORECARD KPIS ── */}
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-3">
                  School Cohort Performance Indicators
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    {
                      label: "School Overall Avg",
                      value: `${schoolReport.schoolMetrics.overallSchoolAverage}%`,
                      pill: "+8% vs Benchmark",
                    },
                    {
                      label: "Avg Attendance",
                      value: `${schoolReport.schoolMetrics.averageAttendance}%`,
                      pill: "Punctual Cohort",
                    },
                    {
                      label: "Test Average",
                      value: `${schoolReport.schoolMetrics.averageTestScore}%`,
                      pill: "Assessment Avg",
                    },
                    {
                      label: "HW Completion",
                      value: `${schoolReport.schoolMetrics.averageAssignmentCompletion}%`,
                      pill: "Worksheets Done",
                    },
                    {
                      label: "Top Score",
                      value: `${schoolReport.schoolMetrics.highestScore}%`,
                      pill: schoolReport.schoolMetrics.topPerformer,
                    },
                    {
                      label: "Enrolled Students",
                      value: `${schoolReport.schoolMetrics.totalStudents}`,
                      pill: "Classes 6–10",
                    },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {card.label}
                      </span>
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {card.value}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate">
                        {card.pill}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── CONSOLIDATED STUDENT MARKSHEET & ROSTER TABLE ── */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Consolidated Student Marksheet &amp; Performance Roster
                    </h3>
                    <p className="text-xs text-slate-500">
                      Individual scores and subject breakdown for all students enrolled from {selectedSchool}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {schoolReport.studentMarksheet.length} Students Listed
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                        <th className="pb-2">School Rank</th>
                        <th className="pb-2">Student Name</th>
                        <th className="pb-2">Student ID</th>
                        <th className="pb-2">Grade</th>
                        <th className="pb-2">Mathematics</th>
                        <th className="pb-2">Science</th>
                        <th className="pb-2">English</th>
                        <th className="pb-2">Social Sci</th>
                        <th className="pb-2">Attendance</th>
                        <th className="pb-2">Overall Score</th>
                        <th className="pb-2 text-right">Drill-Down</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {schoolReport.studentMarksheet.map((st: any) => {
                        const isTop = st.schoolRank === 1;
                        return (
                          <tr
                            key={st.userId}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                  isTop
                                    ? "bg-[#dfb74a] text-slate-950"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                #{st.schoolRank}
                              </span>
                            </td>
                            <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span>{st.name}</span>
                                {isTop && <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                              </div>
                            </td>
                            <td className="py-3 font-mono text-[11px] text-slate-500">{st.studentId}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#004b79] dark:text-[#dfb74a]">
                                {st.classLevel}
                              </span>
                            </td>
                            <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {st.subjectScores?.Mathematics || 80}%
                            </td>
                            <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {st.subjectScores?.Science || 80}%
                            </td>
                            <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {st.subjectScores?.English || 80}%
                            </td>
                            <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {st.subjectScores?.["Social Science"] || 80}%
                            </td>
                            <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                              {st.attendancePercentage}%
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                  st.overallScore >= 80
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : st.overallScore >= 70
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                }`}
                              >
                                {st.overallScore}%
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(st.userId);
                                  setReportMode("INDIVIDUAL");
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#004b79] dark:text-[#dfb74a] cursor-pointer"
                              >
                                View Report →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SUBJECT BENCHMARKS & GRADE DISTRIBUTION ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Subject Benchmark Comparison Table */}
                <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Subject-Wise School Averages vs Institute Benchmark
                    </h3>
                    <p className="text-xs text-slate-500">
                      Comparative variance against Mantif Tutoring overall standards
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                          <th className="pb-2">Subject</th>
                          <th className="pb-2">School Cohort Avg</th>
                          <th className="pb-2">Institute Benchmark</th>
                          <th className="pb-2">Variance</th>
                          <th className="pb-2 text-right">Cohort Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {schoolReport.subjectBenchmarks.map((sb: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{sb.subject}</td>
                            <td className="py-2.5 font-extrabold text-[#004b79] dark:text-[#dfb74a]">
                              {sb.schoolAverage}%
                            </td>
                            <td className="py-2.5 text-slate-500">{sb.instituteBenchmark}%</td>
                            <td className="py-2.5 text-emerald-600 font-bold">{sb.comparison}</td>
                            <td className="py-2.5 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sb.status === "EXCELLENT"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                }`}
                              >
                                {sb.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grade Distribution Breakdown */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Grade-Wise Distribution
                    </h3>
                    <p className="text-xs text-slate-500">Student enrollment and averages by class</p>
                  </div>

                  <div className="space-y-2.5">
                    {schoolReport.classDistribution.map((cd: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-[#004b79]" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">{cd.classLevel}</span>
                          <span className="text-[11px] text-slate-400">({cd.studentCount} Students)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">
                            Att: <strong>{cd.averageAttendance}%</strong>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            Avg: {cd.averageScore}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── COHORT STRENGTHS, FOCUS AREAS & ACTION PLAN ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cohort Strengths */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-sm">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>School Cohort Strengths</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {schoolReport.cohortStrengths.map((st: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cohort Focus Areas */}
                <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Focus &amp; Growth Areas</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {schoolReport.cohortFocusAreas.map((fa: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{fa}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Institutional Action Plan */}
                <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-[#004b79] dark:text-[#dfb74a] font-extrabold text-sm">
                    <Sparkles className="w-4 h-4 text-[#004b79]" />
                    <span>Institutional Action Plan</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {schoolReport.institutionalActionPlan.map((ap: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#004b79] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{ap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODE 2: INDIVIDUAL STUDENT PERFORMANCE REPORT ───────── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {reportMode === "INDIVIDUAL" && (
        <div className="space-y-6 sm:space-y-8">
          {/* ── STUDENT SEARCH & FILTER TOOLBAR ── */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student, ID, district..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#004b79]"
                />
              </div>

              {/* Class Filter */}
              <div>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer"
                >
                  <option value="ALL">All Classes (6-10)</option>
                  {classes.map((c: string) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Filter */}
              <div>
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer"
                >
                  <option value="ALL">All Batches</option>
                  {batches.map((b: any) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Filter */}
              <div>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer"
                >
                  <option value="LAST_30_DAYS">Last 30 Days</option>
                  <option value="LAST_90_DAYS">Last 90 Days (Quarterly)</option>
                  <option value="THIS_TERM">Current Academic Term</option>
                  <option value="ALL_TIME">All-Time Cumulative</option>
                </select>
              </div>
            </div>

            {/* Quick Student Selector Carousel */}
            {students.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-thin">
                {students.map((st: any) => {
                  const isSelected = selectedStudentId === st.userId;
                  return (
                    <button
                      key={st.userId}
                      type="button"
                      onClick={() => setSelectedStudentId(st.userId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-[#004b79] text-white border-[#004b79] shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{st.name}</span>
                      <span className="text-[10px] opacity-75 font-normal">({st.currentClass})</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-slate-400">
                No students found matching current filters.
              </div>
            )}
          </div>

          {isStudentReportLoading ? (
            <div className="p-16 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-[#004b79]" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Loading student performance data…
              </p>
            </div>
          ) : studentReport ? (
            <div className="space-y-6 sm:space-y-8">
              {/* Student Header */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#002137] text-white shadow-sm border border-slate-800 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black text-white shrink-0">
                    {studentReport.studentInfo.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                        {studentReport.studentInfo.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#dfb74a] text-slate-950">
                        {studentReport.studentInfo.studentId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        <strong>Grade:</strong> {studentReport.studentInfo.classLevel} ({studentReport.studentInfo.board} Board)
                      </span>
                      <span>•</span>
                      <span>
                        <strong>School:</strong> {studentReport.studentInfo.schoolName}
                      </span>
                      <span>•</span>
                      <span>
                        <strong>District:</strong> {studentReport.studentInfo.district}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isExportingStudentPdf}
                    onClick={handleDownloadStudentPdf}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {isExportingStudentPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-300" />}
                    <span>Download Student PDF</span>
                  </button>
                </div>
              </div>

              {/* Performance Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Overall Score", value: `${studentReport.performanceSummary.overallPerformanceScore}%` },
                  { label: "Attendance Rate", value: `${studentReport.performanceSummary.attendancePercentage}%` },
                  { label: "Test Average", value: `${studentReport.performanceSummary.testAverage}%` },
                  { label: "HW Completion", value: `${studentReport.assignmentReport.completionPercentage}%` },
                  { label: "Live Engagement", value: `${studentReport.liveClassEngagement.engagementPercentage}%` },
                  { label: "Class Rank", value: `#${studentReport.performanceSummary.currentRank}` },
                ].map((c, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">{c.label}</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Assessment Records Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Assessment &amp; Test Records
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                        <th className="pb-2">Test Title</th>
                        <th className="pb-2">Subject</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Marks</th>
                        <th className="pb-2">Percentage</th>
                        <th className="pb-2">Class Avg</th>
                        <th className="pb-2">Rank</th>
                        <th className="pb-2">Teacher Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {studentReport.testPerformance.tests.map((t: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{t.testName}</td>
                          <td className="py-2.5">{t.subject}</td>
                          <td className="py-2.5 text-slate-500">
                            {new Date(t.testDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </td>
                          <td className="py-2.5 font-mono font-bold">
                            {t.marksObtained} / {t.maxMarks}
                          </td>
                          <td className="py-2.5 font-bold text-[#004b79] dark:text-[#dfb74a]">{t.percentage}%</td>
                          <td className="py-2.5 text-slate-500">{t.classAverage}%</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                              #{t.studentRank}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                            {t.teacherRemarks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks Editor & Parent Comms */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Remarks Form */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Faculty Remarks &amp; Feedback
                    </h3>
                    {remarksSuccess && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Saved!
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveRemarks} className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Overall Observation
                      </label>
                      <textarea
                        rows={2}
                        value={remarksForm.observation}
                        onChange={(e) => setRemarksForm({ ...remarksForm, observation: e.target.value })}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Academic Feedback
                        </label>
                        <input
                          type="text"
                          value={remarksForm.academicFeedback}
                          onChange={(e) => setRemarksForm({ ...remarksForm, academicFeedback: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Recommendations
                        </label>
                        <input
                          type="text"
                          value={remarksForm.recommendations}
                          onChange={(e) => setRemarksForm({ ...remarksForm, recommendations: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79]"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingRemarks}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {isSavingRemarks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Remarks</span>
                    </button>
                  </form>
                </div>

                {/* Parent Communication */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Parent Communication History
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddCommModal(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Call</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {studentReport.parentCommunicationHistory.map((comm: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                            <PhoneCall className="w-3.5 h-3.5 text-[#004b79]" />
                            <span>{comm.communicationMethod}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comm.contactDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{comm.discussionSummary}</p>
                      </div>
                    ))}
                  </div>

                  {showAddCommModal && (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2 text-xs">
                      <textarea
                        rows={2}
                        value={commSummary}
                        onChange={(e) => setCommSummary(e.target.value)}
                        placeholder="Enter discussion summary..."
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddCommModal(false)}
                          className="px-2.5 py-1 rounded-lg border text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddParentComm}
                          disabled={isSavingComm || !commSummary.trim()}
                          className="flex-1 py-1 rounded-lg bg-[#004b79] text-white font-bold disabled:opacity-60"
                        >
                          {isSavingComm ? "Saving..." : "Save Note"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
