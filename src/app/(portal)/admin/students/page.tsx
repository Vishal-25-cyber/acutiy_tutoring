"use client";

import React, { useState, useEffect } from "react";
import {
  Users2,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  School,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";
import { sanitize10DigitPhone, isValid10DigitPhone, isValidAcuityOrGmail } from "@/lib/validations/phone";

const CLASS_OPTIONS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

const BOARD_OPTIONS = ["CBSE", "State Board"];

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedBoard, setSelectedBoard] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [selectedRisk, setSelectedRisk] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Construct query url for useFastFetch
  const query = new URLSearchParams();
  if (selectedClass !== "ALL") query.append("classLevel", selectedClass);
  if (selectedBoard !== "ALL") query.append("board", selectedBoard);
  if (selectedBatch !== "ALL") query.append("batchId", selectedBatch);
  if (selectedRisk !== "ALL") query.append("riskLevel", selectedRisk);
  if (selectedStatus !== "ALL") query.append("status", selectedStatus);
  const studentsApiUrl = `/api/admin/students${query.toString() ? `?${query.toString()}` : ""}`;

  const { data: sData, refetch: refetchStudents } = useFastFetch(studentsApiUrl);
  const { data: bData } = useFastFetch("/api/batches");

  const students = Array.isArray(sData?.students) ? sData.students : [];
  const batches = Array.isArray(bData?.batches) ? bData.batches : [];

  // Edit Modal State
  const [editStudent, setEditStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    schoolName: "",
    board: "CBSE",
    currentClass: "Class 10",
    batchId: "",
    parentName: "",
    parentPhone: "",
    altEmergencyPhone: "",
    attendanceRiskLevel: "LOW",
    status: "ACTIVE",
    resetPassword: "",
  });

  // Delete Modal State
  const [deleteStudent, setDeleteStudent] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add Student Modal State
  const [isAddModal, setIsAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    schoolName: "",
    board: "CBSE",
    currentClass: "Class 10",
    batchId: "",
    parentName: "",
    parentPhone: "",
    altEmergencyPhone: "",
    password: "Student@123",
  });

  useEffect(() => {
    if (batches.length > 0 && !newStudent.batchId) {
      setNewStudent((prev) => ({ ...prev, batchId: batches[0]._id }));
    }
  }, [batches]);

  const openEditModal = (st: any) => {
    setEditStudent(st);
    setEditForm({
      name: st.userId?.name || "",
      email: st.userId?.email || "",
      phone: st.userId?.phone || "",
      schoolName: st.schoolName || "",
      board: st.board || "CBSE",
      currentClass: st.currentClass || "Class 10",
      batchId: st.batchId?._id || st.batchId || (batches[0]?._id || ""),
      parentName: st.parentName || "",
      parentPhone: st.parentPhone || "",
      altEmergencyPhone: st.altEmergencyPhone || "",
      attendanceRiskLevel: st.attendanceRiskLevel || "LOW",
      status: st.userId?.status || "ACTIVE",
      resetPassword: "",
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    if (editForm.email && !isValidAcuityOrGmail(editForm.email)) {
      alert("Email address must end with @mantif.edu, @acuity.edu, or @gmail.com.");
      return;
    }
    if (editForm.phone && !isValid10DigitPhone(editForm.phone)) {
      alert("Student mobile number must be exactly 10 digits and cannot start with 0.");
      return;
    }
    if (editForm.parentPhone && !isValid10DigitPhone(editForm.parentPhone)) {
      alert("Parent mobile number must be exactly 10 digits and cannot start with 0.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: editStudent.userId._id,
          ...editForm,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "Failed to update student");
        return;
      }

      setEditStudent(null);
      invalidateCache(studentsApiUrl);
      invalidateCache("/api/admin/dashboard");
      refetchStudents();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while updating student");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;
    setIsDeleting(true);
    try {
      const studentUserId =
        deleteStudent.userId?._id ||
        (typeof deleteStudent.userId === "string" ? deleteStudent.userId : "") ||
        deleteStudent._id;

      const res = await fetch(`/api/admin/students?id=${studentUserId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Failed to delete student");
        return;
      }

      setDeleteStudent(null);
      invalidateCache(studentsApiUrl);
      invalidateCache("/api/admin/dashboard");
      refetchStudents();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while deleting student");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.email && !isValidAcuityOrGmail(newStudent.email)) {
      alert("Student email must end with @mantif.edu, @acuity.edu, or @gmail.com.");
      return;
    }
    if (newStudent.phone && !isValid10DigitPhone(newStudent.phone)) {
      alert("Student mobile number must be exactly 10 digits and cannot start with 0.");
      return;
    }
    if (newStudent.parentPhone && !isValid10DigitPhone(newStudent.parentPhone)) {
      alert("Parent mobile number must be exactly 10 digits and cannot start with 0.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });

      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "Failed to enroll student");
        return;
      }

      setIsAddModal(false);
      setNewStudent({
        name: "",
        email: "",
        phone: "",
        schoolName: "",
        board: "CBSE",
        currentClass: "Class 10",
        batchId: batches[0]?._id || "",
        parentName: "",
        parentPhone: "",
        altEmergencyPhone: "",
        password: "Student@123",
      });
      invalidateCache(studentsApiUrl);
      invalidateCache("/api/admin/dashboard");
      refetchStudents();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while enrolling student");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickApprove = async (st: any) => {
    try {
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: st.userId?._id || st.userId,
          status: "ACTIVE",
        }),
      });
      if (res.ok) {
        invalidateCache(studentsApiUrl);
        invalidateCache("/api/admin/dashboard");
        refetchStudents();
      } else {
        alert("Failed to approve student.");
      }
    } catch {
      alert("Network error while approving student.");
    }
  };

  const pendingCount = students.filter((st: any) => st.userId?.status === "PENDING_APPROVAL").length;

  const filtered = students.filter((st: any) => {
    const matchesSearch = !search || (
      st.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      st.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
      st.userId?.phone?.includes(search) ||
      st.schoolName?.toLowerCase().includes(search.toLowerCase()) ||
      st.parentName?.toLowerCase().includes(search.toLowerCase())
    );
    const matchesClass = selectedClass === "ALL" || st.currentClass === selectedClass;
    const matchesBoard = selectedBoard === "ALL" || st.board === selectedBoard;
    const matchesRisk = selectedRisk === "ALL" || st.attendanceRiskLevel === selectedRisk;
    const matchesStatus = selectedStatus === "ALL" || st.userId?.status === selectedStatus;
    return matchesSearch && matchesClass && matchesBoard && matchesRisk && matchesStatus;
  });

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Student Directory &amp; Records
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filtered.length} Enrolled
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Review pending registrations, approve student accounts, edit profiles, and manage schedules.
          </p>
        </div>

        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm self-start sm:self-auto shrink-0"
          onClick={() => setIsAddModal(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* ── Pending Approvals Banner ── */}
      {pendingCount > 0 && selectedStatus !== "PENDING_APPROVAL" && (
        <div className="py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-bold text-amber-900 dark:text-amber-200">
              {pendingCount} Student{pendingCount === 1 ? "" : "s"} awaiting your approval to access the portal.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedStatus("PENDING_APPROVAL")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          >
            Review Pending Approvals ({pendingCount})
          </button>
        </div>
      )}

      {/* ── 2. CARDLESS SEARCH & FILTERS BAR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, phone, school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#004b79] shadow-xs"
          />
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79] shadow-xs cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval ({pendingCount})</option>
            <option value="ACTIVE">Active (Approved)</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79] shadow-xs cursor-pointer"
          >
            <option value="ALL">All Classes (6-10)</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79] shadow-xs cursor-pointer"
          >
            <option value="ALL">All Boards</option>
            {BOARD_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79] shadow-xs cursor-pointer"
          >
            <option value="ALL">All Turnout Risks</option>
            <option value="LOW">Low Risk (Regular)</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk (&lt;75%)</option>
          </select>
        </div>
      </div>

      {/* ── 3. CARDLESS 12-COLUMN MASTER STUDENT TABLE ── */}
      <div className="space-y-2 pt-2">
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-3">Student &amp; School</div>
          <div className="col-span-3">Contact Details</div>
          <div className="col-span-2">Grade &amp; Batch</div>
          <div className="col-span-2">Parent Contact</div>
          <div className="col-span-2 text-right">Account Actions</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filtered.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <Users2 className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No students match your filter</p>
              <p className="text-xs text-slate-400">Try changing your search query or class selection.</p>
            </div>
          ) : (
            filtered.map((st: any) => {
              const u = st.userId || {};
              return (
                <div
                  key={st._id}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                >
                  {/* Col 1: Student Name & School */}
                  <div className="col-span-3 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {u.name || "Student"}
                      </p>
                      {u.status === "PENDING_APPROVAL" ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Pending Approval
                        </span>
                      ) : u.status === "SUSPENDED" ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {st.schoolName || "Enrolled Student"}
                    </p>
                  </div>

                  {/* Col 2: Email & Phone */}
                  <div className="col-span-3 space-y-0.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <p className="truncate text-slate-800 dark:text-slate-200">{u.email}</p>
                    <p className="text-[11px] text-slate-400">{u.phone || "—"}</p>
                  </div>

                  {/* Col 3: Grade & Batch */}
                  <div className="col-span-2 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
                        {st.currentClass || "Class 10"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">({st.board || "CBSE"})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{st.batchId?.name || "7:00 PM – 8:00 PM"}</p>
                  </div>

                  {/* Col 4: Parent Contact */}
                  <div className="col-span-2 space-y-0.5 text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {st.parentName || "Parent"}
                    </p>
                    <p className="font-mono text-[11px] text-slate-400">{st.parentPhone || "—"}</p>
                  </div>

                  {/* Col 5: Actions */}
                  <div className="col-span-2 flex items-center justify-start md:justify-end gap-1.5">
                    {u.status === "PENDING_APPROVAL" && (
                      <button
                        type="button"
                        onClick={() => handleQuickApprove(st)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        title="Approve student and enable portal login"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(st)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Edit2 className="w-3 h-3 text-[#004b79] dark:text-[#dfb74a]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteStudent(st)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Edit Student Modal ── */}
      {editStudent && (
        <Modal
          isOpen={!!editStudent}
          onClose={() => setEditStudent(null)}
          title={`Edit Student: ${editStudent.userId?.name}`}
          description="Update personal information, academic grade, batch assignment, or reset password."
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateStudent} className="space-y-4 pt-1 text-xs">
            {/* Section 1: Personal Details */}
            <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#004b79] dark:text-[#dfb74a]">
                1. Student Profile &amp; Contact
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Student Full Name *</label>
                  <Input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Email Address *</label>
                  <Input
                    required
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Phone (10 Digits) *</label>
                  <Input
                    required
                    type="tel"
                    maxLength={10}
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        phone: sanitize10DigitPhone(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Attendance Risk Level</label>
                  <select
                    value={editForm.attendanceRiskLevel}
                    onChange={(e) => setEditForm({ ...editForm, attendanceRiskLevel: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79]"
                  >
                    <option value="LOW">Low Risk (Regular Attendance)</option>
                    <option value="MEDIUM">Medium Risk (Warning)</option>
                    <option value="HIGH">High Risk (Chronic Absence &lt;75%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Academic Details */}
            <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#004b79] dark:text-[#dfb74a]">
                2. Academic &amp; Batch Assignment
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Class / Grade *</label>
                  <select
                    value={editForm.currentClass}
                    onChange={(e) => setEditForm({ ...editForm, currentClass: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79]"
                  >
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Curriculum Board *</label>
                  <select
                    value={editForm.board}
                    onChange={(e) => setEditForm({ ...editForm, board: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79]"
                  >
                    {BOARD_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">School Name</label>
                  <Input
                    value={editForm.schoolName}
                    onChange={(e) => setEditForm({ ...editForm, schoolName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Batch Schedule Slot *</label>
                  <select
                    value={editForm.batchId}
                    onChange={(e) => setEditForm({ ...editForm, batchId: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79]"
                  >
                    {batches.map((b: any) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Parent Info */}
            <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#004b79] dark:text-[#dfb74a]">
                3. Parent / Guardian Contact
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Parent Name *</label>
                  <Input
                    required
                    value={editForm.parentName}
                    onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Parent Phone (10 Digits) *</label>
                  <Input
                    required
                    type="tel"
                    maxLength={10}
                    value={editForm.parentPhone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        parentPhone: sanitize10DigitPhone(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Security & Status */}
            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#004b79] dark:text-[#dfb74a]">
                4. Account Status &amp; Password
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Student Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79]"
                  >
                    <option value="ACTIVE">ACTIVE (Approved &amp; Enrolled)</option>
                    <option value="PENDING_APPROVAL">PENDING APPROVAL (Awaiting Admin Approval)</option>
                    <option value="SUSPENDED">SUSPENDED (Access Disabled)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Reset Password (Optional)</label>
                  <Input
                    type="password"
                    placeholder="Leave blank to keep password"
                    value={editForm.resetPassword}
                    onChange={(e) => setEditForm({ ...editForm, resetPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Student Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteStudent && (
        <Modal
          isOpen={!!deleteStudent}
          onClose={() => setDeleteStudent(null)}
          title="Permanently Delete Student"
          description="This action cannot be undone."
          maxWidth="md"
        >
          <div className="space-y-4 pt-1 text-xs">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  Delete &quot;{deleteStudent.userId?.name}&quot; from Database?
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  This will permanently delete this student&apos;s user account, profile, class attendance logs, assignment submissions, and payment records from the database.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteStudent}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-sm disabled:opacity-60"
              >
                {isDeleting ? "Deleting from DB..." : "Confirm & Permanently Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add Student Modal ── */}
      {isAddModal && (
        <Modal
          isOpen={isAddModal}
          onClose={() => setIsAddModal(false)}
          title="Enroll New Student"
          description="Create verified student account and assign live batch."
          maxWidth="lg"
        >
          <form onSubmit={handleAddStudent} className="space-y-4 pt-1 text-xs">
            {/* Section 1: Student Information */}
            <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#004b79] dark:text-[#dfb74a]">
                1. Student Profile &amp; Contact
              </span>
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Student Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Priya Sharma"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Email Address *</label>
                  <Input
                    required
                    type="email"
                    placeholder="priya@mantif.edu"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Phone Number (10 Digits) *</label>
                  <Input
                    required
                    type="tel"
                    maxLength={10}
                    placeholder="9876543221"
                    value={newStudent.phone}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, phone: sanitize10DigitPhone(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Academic Details */}
            <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#004b79] dark:text-[#dfb74a]">
                2. Academic Grade &amp; Batch Routine
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Class Level *</label>
                  <select
                    value={newStudent.currentClass}
                    onChange={(e) => setNewStudent({ ...newStudent, currentClass: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79]"
                  >
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Board *</label>
                  <select
                    value={newStudent.board}
                    onChange={(e) => setNewStudent({ ...newStudent, board: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79]"
                  >
                    {BOARD_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">School Name</label>
                  <Input
                    placeholder="e.g. DAV Senior Secondary"
                    value={newStudent.schoolName}
                    onChange={(e) => setNewStudent({ ...newStudent, schoolName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Batch Schedule Slot *</label>
                  <select
                    value={newStudent.batchId}
                    onChange={(e) => setNewStudent({ ...newStudent, batchId: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79]"
                  >
                    {batches.map((b: any) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Parent Information */}
            <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#004b79] dark:text-[#dfb74a]">
                3. Parent / Guardian Contact
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Parent Name *</label>
                  <Input
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Parent Phone (10 Digits) *</label>
                  <Input
                    required
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543292"
                    value={newStudent.parentPhone}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        parentPhone: sanitize10DigitPhone(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Credentials */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#004b79] dark:text-[#dfb74a]">
                4. Temporary Login Credentials
              </span>
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Temporary Password</label>
                <Input
                  type="text"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm disabled:opacity-60"
              >
                {isSaving ? "Enrolling..." : "Enroll Student"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
