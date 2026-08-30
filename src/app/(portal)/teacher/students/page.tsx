"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Edit,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  School,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  FileText,
  UserCheck,
  Eye,
  CreditCard,
  Check,
  Copy,
  Receipt,
  Award,
  BookOpen,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TeacherStudentsPage() {
  const { data, refetch, isLoading } = useFastFetch("/api/teacher/students");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [feeFilter, setFeeFilter] = useState("ALL");
  
  // Modals state
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    currentClass: "Class 10",
    board: "CBSE",
    schoolName: "",
    batchId: "",
    parentName: "",
    parentPhone: "",
  });

  const students = Array.isArray(data?.students) ? data.students : [];
  const batches = Array.isArray(data?.batches) ? data.batches : [];

  const handleOpenView = (student: any) => {
    setViewingStudent(student);
    setCopiedPhone(false);
  };

  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      name: student.userId?.name || "",
      phone: student.userId?.phone || "",
      currentClass: student.currentClass || "Class 10",
      board: student.board || "CBSE",
      schoolName: student.schoolName || "",
      batchId: student.batchId?._id || student.batchId || (batches[0]?._id ?? ""),
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
    });
    setStatusMessage(null);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/teacher/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId: editingStudent._id,
          ...formData,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: result.error || "Failed to update student profile." });
        return;
      }

      setStatusMessage({ type: "success", text: "Student profile updated successfully!" });
      setTimeout(() => {
        setEditingStudent(null);
        if (typeof refetch === "function") refetch();
      }, 1000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Network error while saving." });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter((s: any) => {
    const matchesClass = classFilter === "ALL" || s.currentClass === classFilter;
    const matchesFee =
      feeFilter === "ALL" ||
      (feeFilter === "PAID" && s.feeStatus?.isPaid && !s.feeStatus?.isUnderVerification) ||
      (feeFilter === "VERIFICATION" && s.feeStatus?.isUnderVerification) ||
      (feeFilter === "UNPAID" && !s.feeStatus?.isPaid && !s.feeStatus?.isUnderVerification);

    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.userId?.name?.toLowerCase().includes(q) ||
      s.userId?.email?.toLowerCase().includes(q) ||
      s.schoolName?.toLowerCase().includes(q) ||
      s.parentName?.toLowerCase().includes(q) ||
      s.userId?.phone?.includes(q) ||
      s.parentPhone?.includes(q);

    return matchesClass && matchesFee && matchesSearch;
  });

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Batch Student Roster & Academic Dossier
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Directory
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Directory of enrolled students across your live batches. Monitor real-time attendance turnout, track submitted homework, view monthly fee payment status, and inspect detailed student profiles.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 font-semibold self-start md:self-auto">
          {filteredStudents.length} of {students.length} Students Enrolled
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by student name, email, school, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500 shadow-xs transition-colors"
          />
        </div>

        {/* Compact Filters */}
        <div className="flex items-center gap-2.5">
          {/* Grade Select */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-10 px-3.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">All Grades</option>
            <option value="Class 10">Class 10</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 8">Class 8</option>
          </select>

          {/* Fee Status Select */}
          <select
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value)}
            className="h-10 px-3.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">All Fees</option>
            <option value="PAID">Fee Paid</option>
            <option value="VERIFICATION">Under Verification</option>
            <option value="UNPAID">Unpaid / Dues</option>
          </select>

          {(classFilter !== "ALL" || feeFilter !== "ALL" || search.trim()) && (
            <button
              onClick={() => {
                setClassFilter("ALL");
                setFeeFilter("ALL");
                setSearch("");
              }}
              className="h-10 px-3 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── ROSTER TABLE ── */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading live student roster...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 bg-white dark:bg-slate-900/30">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No students found</p>
            <p className="text-xs text-slate-400">No enrolled student profiles match your search criteria.</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50 shadow-xs">
            {filteredStudents.map((s: any) => {
              const attPct = typeof s.attendancePercentage === "number" ? s.attendancePercentage : 100;
              const isCompliant = attPct >= 75;
              const fee = s.feeStatus;
              const isFeePaid = fee?.isPaid;
              const isUnderVerification = fee?.isUnderVerification;

              return (
                <div
                  key={s._id}
                  className="p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        {s.userId?.name || "Student"}
                      </h3>

                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
                        {s.currentClass} • {s.board}
                      </span>

                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Batch: {s.batchId?.name || "7:00 PM – 8:00 PM"}
                      </span>

                      {/* Fee Status Badge */}
                      {isUnderVerification ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                          <span>Under Verification ({fee?.billingMonth || "Aug 2026"})</span>
                        </span>
                      ) : isFeePaid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>₹{fee?.amount || 2500} Paid ({fee?.billingMonth || "Aug 2026"})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>₹{fee?.amount || 2500} Due ({fee?.billingMonth || "Aug 2026"})</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.schoolName || "DAV Senior Secondary School"}</span>
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.userId?.email}</span>
                      </span>

                      {s.userId?.phone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.userId?.phone}</span>
                        </span>
                      )}

                      {s.parentName && (
                        <span className="text-slate-400">
                          Parent: <strong className="text-slate-600 dark:text-slate-300 font-sans">{s.parentName}</strong> {s.parentPhone && `(${s.parentPhone})`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Attendance & Homework Stats + Actions */}
                  <div className="flex items-center gap-4 shrink-0 flex-wrap justify-between sm:justify-end">
                    <div className="text-left sm:text-right space-y-0.5">
                      <div className="flex items-center gap-1.5 sm:justify-end">
                        <span className={`text-sm font-black ${isCompliant ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {attPct}% Live Attendance
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {s.attendedCount ?? 1}/{s.totalSessions ?? 1} Sessions • {s.homeworkSubmitted ?? 0} Homework Done
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenView(s)}
                        className="font-bold text-xs flex items-center gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>View Details</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(s)}
                        className="font-bold text-xs flex items-center gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                        <span>Edit Student</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 1. VIEW STUDENT ACADEMIC & FEE DOSSIER MODAL ── */}
      {viewingStudent && (
        <Modal
          isOpen={!!viewingStudent}
          onClose={() => setViewingStudent(null)}
          title={`Student Dossier: ${viewingStudent.userId?.name || "Student"}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
            {/* Header summary banner */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {viewingStudent.userId?.name}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                    {viewingStudent.currentClass} • {viewingStudent.board}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {viewingStudent.schoolName || "DAV Senior Secondary School"}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block font-mono">ENROLLMENT ID</span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {viewingStudent._id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Attendance */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Live Attendance
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {viewingStudent.attendancePercentage}%
                </p>
                <p className="text-[10px] text-slate-400">
                  {viewingStudent.attendedCount ?? 1} of {viewingStudent.totalSessions ?? 1} Sessions Attended
                </p>
              </div>

              {/* Card 2: Tuition Fee Status */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                  Tuition Fee Status
                </span>
                <p className={`text-xl font-black ${
                  viewingStudent.feeStatus?.isUnderVerification
                    ? "text-amber-600 dark:text-amber-400"
                    : viewingStudent.feeStatus?.isPaid
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}>
                  {viewingStudent.feeStatus?.isUnderVerification
                    ? "UNDER VERIFICATION"
                    : viewingStudent.feeStatus?.isPaid
                    ? "PAID"
                    : "UNPAID DUE"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {viewingStudent.feeStatus?.isUnderVerification
                    ? `₹${viewingStudent.feeStatus?.amount || 2500} for ${viewingStudent.feeStatus?.billingMonth} (Awaiting Admin Approval)`
                    : `₹${viewingStudent.feeStatus?.amount || 2500} for ${viewingStudent.feeStatus?.billingMonth || "August 2026"}`}
                </p>
              </div>

              {/* Card 3: Homework Submissions */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  Homework & Tests
                </span>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {viewingStudent.homeworkSubmitted ?? 0} Done
                </p>
                <p className="text-[10px] text-slate-400">
                  {viewingStudent.averageScore ? `Avg Score: ${viewingStudent.averageScore}%` : "Turned in & Tracked"}
                </p>
              </div>
            </div>

            {/* Tuition Fee Breakdown & Payment History */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Tuition Invoices & Payment Ledger</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Monthly Rate: ₹2,500
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                {(viewingStudent.feeStatus?.allPayments || []).map((p: any) => {
                  const isPendingVerif = p.status === "PENDING_VERIFICATION";
                  const isPaid = p.status === "PAID";

                  return (
                    <div key={p._id} className="p-3 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.billingMonth}</span>
                          <span className="text-[10px] font-mono text-slate-400">({p.receiptNumber})</span>
                          {p.transactionId && (
                            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                              UTR: {p.transactionId}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{p.paymentMethod || "Online Transfer"}</span>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-xs block text-slate-900 dark:text-slate-100">₹{p.amount}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                          isPaid
                            ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800"
                            : isPendingVerif
                            ? "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 animate-pulse"
                            : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800"
                        }`}>
                          {isPaid ? "✓ Paid" : isPendingVerif ? "⏳ Under Verification" : "⚠ Pending Due"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Batch Timing & Live Class Details */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
              <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Live Batch Schedule & Timing</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">BATCH TIMING</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {viewingStudent.batchId?.name || "7:00 PM – 8:00 PM"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">MEET ROOM ID</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    acuity-batch-1900-{viewingStudent._id.slice(-6)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact & Parent Guardian Details */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
              <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Contact & Guardian Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold block">STUDENT CONTACT</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewingStudent.userId?.email}</span>
                  </p>
                  {viewingStudent.userId?.phone && (
                    <p className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{viewingStudent.userId?.phone}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold block">PARENT / GUARDIAN</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {viewingStudent.parentName || "Parent Guardian"}
                  </p>
                  {viewingStudent.parentPhone && (
                    <p className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{viewingStudent.parentPhone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const toEdit = viewingStudent;
                  setViewingStudent(null);
                  handleOpenEdit(toEdit);
                }}
                className="text-xs font-bold gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit This Student</span>
              </Button>

              <Button
                variant="glow"
                size="sm"
                onClick={() => setViewingStudent(null)}
                className="text-xs font-bold px-6 bg-[#002137] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 2. EDIT STUDENT PROFILE MODAL ── */}
      {editingStudent && (
        <Modal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          title={`Edit Student Record: ${editingStudent.userId?.name || "Student"}`}
        >
          <form onSubmit={handleSaveStudent} className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                    : "bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Student Full Name *</label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aravind Swaminathan"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Student Contact Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="h-10 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Class / Grade *</label>
                <select
                  value={formData.currentClass}
                  onChange={(e) => setFormData({ ...formData, currentClass: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none"
                >
                  {["Class 8", "Class 9", "Class 10"].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Educational Board *</label>
                <select
                  value={formData.board}
                  onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none"
                >
                  <option value="CBSE">CBSE Board</option>
                  <option value="Matriculation">Matriculation</option>
                  <option value="ICSE">ICSE Board</option>
                  <option value="State Board">State Board</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">School / Institution Name *</label>
              <Input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="e.g. DAV Senior Secondary School"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Assigned Live Daily Batch Timing *</label>
              <select
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none"
              >
                {batches.map((b: any) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.startTime} – {b.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block font-bold mb-1">Parent / Guardian Name</label>
                <Input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="e.g. Swaminathan R"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Parent Phone Number</label>
                <Input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="e.g. 9876543220"
                  className="h-10 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingStudent(null)}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="text-xs font-bold bg-[#002137] dark:bg-[#004b79] hover:bg-[#001726] dark:hover:bg-[#0284c7] text-white flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Student Record"}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
