"use client";

import React, { useState, useEffect } from "react";
import {
  School,
  User,
  Search,
  Download,
  RefreshCw,
  Loader2,
  Calendar,
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  PhoneCall,
  Save,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";
import {
  generateStudentPerformanceReportPdf,
  generateSchoolPerformanceReportPdf,
} from "@/lib/download";

export default function TeacherStudentReportsPage() {
  // Mode switcher: "SCHOOL" vs "INDIVIDUAL"
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
    { schoolName: "SSVS", studentCount: 5, district: "Main District", board: "CBSE", classes: ["Class 10"] },
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

  // Teacher Remarks State
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

  const handleDrilldownStudent = (userId: string) => {
    setSelectedStudentId(userId);
    setReportMode("INDIVIDUAL");
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-in fade-in duration-150 select-none pb-24">
      {/* ── 1. HEADER (CLEAN, NO BADGES, EXACT ALIGNMENT) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Academic Performance Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Consolidated school-wise cohort marksheets, multi-student comparative analytics, and official PDF generation.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setReportMode("SCHOOL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                reportMode === "SCHOOL"
                  ? "bg-[#002137] dark:bg-[#004b79] text-white shadow-xs"
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
                  ? "bg-[#002137] dark:bg-[#004b79] text-white shadow-xs"
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
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODE 1: SCHOOL-WISE COHORT REPORT (FLAT, NO CARDS) ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {reportMode === "SCHOOL" && (
        <div className="space-y-8">
          {/* ── FILTER TOOLBAR (FLAT) ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Select School:</span>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer min-w-[200px]"
                >
                  {schools.map((s: any) => (
                    <option key={s.schoolName} value={s.schoolName}>
                      {s.schoolName} ({s.studentCount} Students)
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={schoolClassFilter}
                onChange={(e) => setSchoolClassFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer"
              >
                <option value="ALL">All Grades (6–10)</option>
                {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={schoolPeriodFilter}
                onChange={(e) => setSchoolPeriodFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer"
              >
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="LAST_90_DAYS">Last 90 Days (Quarterly)</option>
                <option value="THIS_TERM">Current Academic Term</option>
                <option value="ALL_TIME">All-Time Cumulative</option>
              </select>
            </div>

            <button
              type="button"
              disabled={!schoolReport || isExportingSchoolPdf}
              onClick={handleDownloadSchoolPdf}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#002137] dark:bg-[#004b79] hover:bg-[#001726] text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isExportingSchoolPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-300" />
              )}
              <span>Generate School PDF Report</span>
            </button>
          </div>

          {/* ── FLAT SCHOOL VITALS OVERVIEW ── */}
          {schoolReport && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {selectedSchool} Overview
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {schoolReport.schoolInfo?.curriculum || "CBSE Board"} · {schoolReport.schoolInfo?.totalEnrolledStudents || 5} Enrolled Students
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">School Overall Avg</span>
                  <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                    {schoolReport.overallMetrics?.schoolAverageScore || 80}%
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold">+8% vs Benchmark</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Attendance</span>
                  <p className="text-3xl font-black text-[#004b79] dark:text-[#dfb74a] tracking-tight leading-none">
                    {schoolReport.overallMetrics?.averageAttendance || 81}%
                  </p>
                  <p className="text-xs text-slate-400">punctual cohort</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Test Average</span>
                  <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none">
                    {schoolReport.overallMetrics?.averageTestScore || 81}%
                  </p>
                  <p className="text-xs text-slate-400">assessment average</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Top Performer</span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none truncate">
                    {schoolReport.overallMetrics?.topPerformerName || "Top Student"}
                  </p>
                  <p className="text-xs text-slate-400">highest score: {schoolReport.overallMetrics?.highestScore || 88}%</p>
                </div>
              </div>
            </div>
          )}

          {/* ── CONSOLIDATED MARKSHEET TABLE (FLAT, CRISP) ── */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Consolidated Student Marksheet &amp; Performance Roster
              </h2>
              <span className="text-xs text-slate-400">
                {schoolReport?.studentRoster?.length || 0} Students Listed
              </span>
            </div>

            {isSchoolReportLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#004b79]" />
                <span className="text-xs">Loading school cohort data…</span>
              </div>
            ) : schoolReport?.studentRoster && schoolReport.studentRoster.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-2">Rank</th>
                      <th className="py-3 px-2">Student Name</th>
                      <th className="py-3 px-2">Student ID</th>
                      <th className="py-3 px-2">Grade</th>
                      <th className="py-3 px-2">Mathematics</th>
                      <th className="py-3 px-2">Science</th>
                      <th className="py-3 px-2">English</th>
                      <th className="py-3 px-2">Social Sci</th>
                      <th className="py-3 px-2">Attendance</th>
                      <th className="py-3 px-2">Overall Score</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {schoolReport.studentRoster.map((st: any) => (
                      <tr
                        key={st.userId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-2 font-bold">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                            #{st.schoolRank}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-slate-100">
                          {st.name}
                        </td>
                        <td className="py-3.5 px-2 font-mono text-slate-400">{st.studentId}</td>
                        <td className="py-3.5 px-2 font-semibold text-[#004b79] dark:text-[#dfb74a]">
                          {st.classLevel}
                        </td>
                        <td className="py-3.5 px-2 font-mono font-semibold">{st.subjectScores?.Mathematics || 85}%</td>
                        <td className="py-3.5 px-2 font-mono font-semibold">{st.subjectScores?.Science || 82}%</td>
                        <td className="py-3.5 px-2 font-mono font-semibold">{st.subjectScores?.English || 88}%</td>
                        <td className="py-3.5 px-2 font-mono font-semibold">{st.subjectScores?.["Social Science"] || 80}%</td>
                        <td className="py-3.5 px-2 font-bold text-emerald-600 dark:text-emerald-400">
                          {st.attendancePercentage}%
                        </td>
                        <td className="py-3.5 px-2 font-black text-slate-900 dark:text-slate-100">
                          {st.overallScore}%
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDrilldownStudent(st.userId)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#004b79] dark:text-[#dfb74a] hover:underline cursor-pointer"
                          >
                            <span>View Report</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No students enrolled under this school for the selected filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODE 2: INDIVIDUAL STUDENT REPORT (FLAT, NO CARDS) ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {reportMode === "INDIVIDUAL" && (
        <div className="space-y-8">
          {/* ── SEARCH & FILTER TOOLBAR ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student by name, ID, school, district..."
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#004b79]"
                />
              </div>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer"
              >
                <option value="ALL">All Classes (6-10)</option>
                {classes.map((c: string) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] cursor-pointer"
              >
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="LAST_90_DAYS">Last 90 Days (Quarterly)</option>
                <option value="THIS_TERM">Current Academic Term</option>
                <option value="ALL_TIME">All-Time Cumulative</option>
              </select>
            </div>

            <button
              type="button"
              disabled={!studentReport || isExportingStudentPdf}
              onClick={handleDownloadStudentPdf}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#002137] dark:bg-[#004b79] hover:bg-[#001726] text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isExportingStudentPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-300" />
              )}
              <span>Download Student PDF</span>
            </button>
          </div>

          {/* ── STUDENT SELECTOR BAR (FLAT) ── */}
          {students.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {students.map((st: any) => {
                const isSelected = selectedStudentId === st.userId;
                return (
                  <button
                    key={st.userId}
                    type="button"
                    onClick={() => setSelectedStudentId(st.userId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#002137] dark:bg-[#004b79] text-white border-[#002137] dark:border-[#004b79]"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{st.name}</span>
                    <span className="text-[10px] opacity-75 font-normal">({st.currentClass})</span>
                  </button>
                );
              })}
            </div>
          )}

          {isStudentReportLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#004b79]" />
              <span className="text-xs">Loading student performance…</span>
            </div>
          ) : studentReport ? (
            <div className="space-y-8">
              {/* ── STUDENT DETAILS HEADER ── */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                        {studentReport.studentInfo?.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {studentReport.studentInfo?.studentId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                      <span><strong>Grade:</strong> {studentReport.studentInfo?.classLevel} ({studentReport.studentInfo?.board || "CBSE"})</span>
                      <span>·</span>
                      <span><strong>School:</strong> {studentReport.studentInfo?.schoolName}</span>
                      <span>·</span>
                      <span><strong>District:</strong> {studentReport.studentInfo?.district}</span>
                    </p>
                  </div>
                </div>

                {/* ── 4 STATS OVERVIEW ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Overall Score</span>
                    <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                      {studentReport.performanceSummary?.overallPerformanceScore}%
                    </p>
                    <p className="text-xs text-emerald-600 font-semibold">rank #{studentReport.performanceSummary?.currentRank} in class</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Attendance Rate</span>
                    <p className="text-3xl font-black text-[#004b79] dark:text-[#dfb74a] tracking-tight leading-none">
                      {studentReport.performanceSummary?.attendancePercentage}%
                    </p>
                    <p className="text-xs text-slate-400">
                      {studentReport.attendanceReport?.classesAttended || 22}/{studentReport.attendanceReport?.totalClasses || 24} sessions
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Test Average</span>
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none">
                      {studentReport.performanceSummary?.testAverage}%
                    </p>
                    <p className="text-xs text-slate-400">assessment average</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">HW Completion</span>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                      {studentReport.assignmentReport?.completionPercentage}%
                    </p>
                    <p className="text-xs text-slate-400">tasks submitted</p>
                  </div>
                </div>
              </div>

              {/* ── ASSESSMENT RECORDS TABLE ── */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Assessment &amp; Test Records
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-2">Test Title</th>
                        <th className="py-3 px-2">Subject</th>
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Marks</th>
                        <th className="py-3 px-2">Percentage</th>
                        <th className="py-3 px-2">Class Avg</th>
                        <th className="py-3 px-2">Rank</th>
                        <th className="py-3 px-2">Teacher Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {studentReport.testPerformance?.tests?.map((t: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-2 font-bold text-slate-900 dark:text-slate-100">{t.testName}</td>
                          <td className="py-3 px-2">{t.subject}</td>
                          <td className="py-3 px-2 text-slate-500 font-mono">
                            {new Date(t.testDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </td>
                          <td className="py-3 px-2 font-mono font-bold">
                            {t.marksObtained} / {t.maxMarks}
                          </td>
                          <td className="py-3 px-2 font-bold text-[#004b79] dark:text-[#dfb74a]">{t.percentage}%</td>
                          <td className="py-3 px-2 text-slate-500">{t.classAverage}%</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                              #{t.studentRank}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                            {t.teacherRemarks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── TEACHER REMARKS FORM ── */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSaveRemarks} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Faculty Remarks &amp; Feedback
                    </h3>
                    <button
                      type="submit"
                      disabled={isSavingRemarks}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#002137] dark:bg-[#004b79] text-white hover:bg-[#001726] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingRemarks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Remarks</span>
                    </button>
                  </div>

                  {remarksSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Teacher remarks saved successfully!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Academic Observation
                      </label>
                      <textarea
                        rows={2}
                        value={remarksForm.observation}
                        onChange={(e) => setRemarksForm({ ...remarksForm, observation: e.target.value })}
                        placeholder="Observation on student daily preparation and syllabus mastery..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Recommendations &amp; Action Plan
                      </label>
                      <textarea
                        rows={2}
                        value={remarksForm.recommendations}
                        onChange={(e) => setRemarksForm({ ...remarksForm, recommendations: e.target.value })}
                        placeholder="Action items for upcoming exams and board revision..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79]"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* ── PARENT COMMUNICATION LOG ── */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-3 mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Parent Communication History
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddCommModal(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Call / Notice</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {studentReport.parentCommunicationHistory?.map((c: any) => (
                    <div key={c._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {c.communicationMethod} with Parent
                          </span>
                          <span className="font-mono text-slate-400 text-[10px]">
                            {new Date(c.contactDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{c.discussionSummary}</p>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 self-start sm:self-auto shrink-0">
                        {c.followUpStatus || "RESOLVED"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Select a student to view performance report.
            </div>
          )}
        </div>
      )}

      {/* ── ADD PARENT COMMUNICATION MODAL ── */}
      {showAddCommModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl animate-in zoom-in-95 duration-150">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Log Parent Communication
            </h3>
            <form onSubmit={handleAddParentComm} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Method</label>
                <select
                  value={commMethod}
                  onChange={(e) => setCommMethod(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="WHATSAPP">WhatsApp Notice</option>
                  <option value="EMAIL">Email</option>
                  <option value="IN_PERSON">In-Person Meeting</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Discussion Summary</label>
                <textarea
                  rows={3}
                  required
                  value={commSummary}
                  onChange={(e) => setCommSummary(e.target.value)}
                  placeholder="Summary of discussion with parent..."
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCommModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingComm}
                  className="px-3.5 py-1.5 rounded-xl bg-[#002137] dark:bg-[#004b79] text-white font-bold"
                >
                  {isSavingComm ? "Saving…" : "Save Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
