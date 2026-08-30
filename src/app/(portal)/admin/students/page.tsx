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
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";
import { sanitize10DigitPhone, isValid10DigitPhone, isValidAcuityOrGmail } from "@/lib/validations/phone";

const CLASS_OPTIONS = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

const BOARD_OPTIONS = ["CBSE", "State Board", "ICSE", "Matriculation"];

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedBoard, setSelectedBoard] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [selectedRisk, setSelectedRisk] = useState("ALL");

  // Construct query url for useFastFetch
  const query = new URLSearchParams();
  if (selectedClass !== "ALL") query.append("classLevel", selectedClass);
  if (selectedBoard !== "ALL") query.append("board", selectedBoard);
  if (selectedBatch !== "ALL") query.append("batchId", selectedBatch);
  if (selectedRisk !== "ALL") query.append("riskLevel", selectedRisk);
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
    schoolName: "National Public School",
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
      alert("Email address must end with @acuity.edu or @gmail.com.");
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

      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "Failed to delete student");
        return;
      }

      setDeleteStudent(null);
      invalidateCache(studentsApiUrl);
      invalidateCache("/api/admin/students");
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

    if (!isValidAcuityOrGmail(newStudent.email)) {
      alert("Email address must end with @acuity.edu or @gmail.com.");
      return;
    }
    if (!isValid10DigitPhone(newStudent.phone)) {
      alert("Student mobile number must be exactly 10 digits and cannot start with 0.");
      return;
    }
    if (!isValid10DigitPhone(newStudent.parentPhone)) {
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
        schoolName: "National Public School",
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

  const filtered = students.filter((st: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const u = st.userId || {};
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      st.schoolName?.toLowerCase().includes(q) ||
      st.parentName?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Student Directory & Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Filter, edit student profiles, update live batch schedules, and manage database records.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer self-start sm:self-auto"
          onClick={() => setIsAddModal(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by student name, email, phone, school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Classes (1-10)</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
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
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Student Name</th>
                <th className="p-4 font-bold">Contact Info</th>
                <th className="p-4 font-bold">Grade & Board</th>
                <th className="p-4 font-bold">Batch Time</th>
                <th className="p-4 font-bold">Parent Contact</th>
                <th className="p-4 font-bold">Risk Level</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No students matching the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((st: any) => {
                  const u = st.userId || {};
                  return (
                    <tr key={st._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{st.schoolName}</p>
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        <p>{u.email}</p>
                        <p className="text-[10px]">{u.phone}</p>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        {st.currentClass} • {st.board}
                      </td>
                      <td className="p-4 text-slate-500">{st.batchId?.name || "7:00 PM – 8:00 PM"}</td>
                      <td className="p-4 text-slate-500">
                        <p className="font-medium text-slate-700 dark:text-slate-300">{st.parentName || "Parent"}</p>
                        <p className="font-mono text-[10px]">{st.parentPhone}</p>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            st.attendanceRiskLevel === "LOW"
                              ? "riskLow"
                              : st.attendanceRiskLevel === "MEDIUM"
                              ? "riskMedium"
                              : "riskHigh"
                          }
                        >
                          {st.attendanceRiskLevel || "LOW"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={u.status === "ACTIVE" ? "success" : "destructive"}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1"
                            onClick={() => openEditModal(st)}
                          >
                            <Edit2 className="w-3 h-3 text-indigo-600" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                            onClick={() => setDeleteStudent(st)}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Comprehensive Edit Student Modal ── */}
      {editStudent && (
        <Modal
          isOpen={!!editStudent}
          onClose={() => setEditStudent(null)}
          title={`Edit Student: ${editStudent.userId?.name}`}
          description="Update personal information, academic grade, batch assignment, or reset password."
        >
          <form onSubmit={handleUpdateStudent} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Student Full Name *</label>
                <Input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Email Address *</label>
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
                <label className="block font-bold mb-1">Phone Number *</label>
                <Input
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">School Name</label>
                <Input
                  value={editForm.schoolName}
                  onChange={(e) => setEditForm({ ...editForm, schoolName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Grade Level *</label>
                <select
                  value={editForm.currentClass}
                  onChange={(e) => setEditForm({ ...editForm, currentClass: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Education Board *</label>
                <select
                  value={editForm.board}
                  onChange={(e) => setEditForm({ ...editForm, board: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  {BOARD_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Reassign Batch Time</label>
                <select
                  value={editForm.batchId}
                  onChange={(e) => setEditForm({ ...editForm, batchId: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  {batches.map((b: any) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Account Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  <option value="ACTIVE">ACTIVE (Can Access Portal)</option>
                  <option value="SUSPENDED">SUSPENDED (Access Blocked)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Parent / Guardian Name</label>
                <Input
                  value={editForm.parentName}
                  onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Parent Contact Phone</label>
                <Input
                  value={editForm.parentPhone}
                  onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Reset Password (Optional)</label>
              <Input
                type="password"
                placeholder="Leave blank to keep existing password"
                value={editForm.resetPassword}
                onChange={(e) => setEditForm({ ...editForm, resetPassword: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setEditStudent(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving} className="font-bold">
                {isSaving ? "Saving..." : "Save Student Changes"}
              </Button>
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
        >
          <div className="space-y-4 pt-2 text-xs">
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

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeleteStudent(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDeleteStudent}
                className="font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? "Deleting from DB..." : "Confirm & Permanently Delete"}
              </Button>
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
        >
          <form onSubmit={handleAddStudent} className="space-y-4 pt-2 text-xs">
            <div>
              <label className="block font-bold mb-1">Student Full Name *</label>
              <Input
                required
                placeholder="e.g. Priya Sharma"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Email Address *</label>
                <Input
                  required
                  type="email"
                  placeholder="priya@acuity.edu"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Phone Number (10 Digits) *</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Class Level *</label>
                <select
                  value={newStudent.currentClass}
                  onChange={(e) => setNewStudent({ ...newStudent, currentClass: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Board *</label>
                <select
                  value={newStudent.board}
                  onChange={(e) => setNewStudent({ ...newStudent, board: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  {BOARD_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">School Name</label>
                <Input
                  placeholder="e.g. DAV Senior Secondary"
                  value={newStudent.schoolName}
                  onChange={(e) => setNewStudent({ ...newStudent, schoolName: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Batch Schedule Slot *</label>
                <select
                  value={newStudent.batchId}
                  onChange={(e) => setNewStudent({ ...newStudent, batchId: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  {batches.map((b: any) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Parent Name *</label>
                <Input
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={newStudent.parentName}
                  onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Parent Phone (10 Digits) *</label>
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

            <div>
              <label className="block font-bold mb-1">Temporary Login Password</label>
              <Input
                type="text"
                value={newStudent.password}
                onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setIsAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving} className="font-bold">
                {isSaving ? "Enrolling..." : "Enroll Student"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
