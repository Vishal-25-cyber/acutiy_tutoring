"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Edit,
  CheckCircle2,
  AlertCircle,
  Clock,
  School,
  GraduationCap,
  ShieldCheck,
  FileText,
  UserCheck,
  Eye,
  Check,
} from "lucide-react";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLASS_LIST } from "@/lib/curriculum";
import { formatStudentId } from "@/lib/id-generator";

export default function TeacherStudentsPage() {
  const { data, refetch, isLoading } = useFastFetch("/api/teacher/students");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");

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
      batchId: student.batchId?._id || student.batchId || "",
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
      const res = await fetch(`/api/teacher/students`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId: editingStudent._id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          currentClass: formData.currentClass,
          board: formData.board,
          schoolName: formData.schoolName.trim(),
          batchId: formData.batchId,
          parentName: formData.parentName.trim(),
          parentPhone: formData.parentPhone.trim(),
        }),
      });

      if (res.ok) {
        setStatusMessage({ type: "success", text: "Student profile updated successfully!" });
        invalidateCache("/api/teacher/students");
        refetch();
        setTimeout(() => {
          setEditingStudent(null);
          setStatusMessage(null);
        }, 800);
      } else {
        const d = await res.json();
        setStatusMessage({ type: "error", text: d.error || "Failed to update profile." });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter students based on search
  const matchesSearch = (s: any) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.userId?.name?.toLowerCase().includes(q) ||
      s.userId?.email?.toLowerCase().includes(q) ||
      s.schoolName?.toLowerCase().includes(q) ||
      s.parentName?.toLowerCase().includes(q) ||
      s.userId?.phone?.includes(q) ||
      s.parentPhone?.includes(q) ||
      s.currentClass?.toLowerCase().includes(q)
    );
  };

  // Get distinct classes present in the students dataset in descending grade order
  const distinctClasses: string[] = Array.from(
    new Set<string>(students.map((s: any) => (s.currentClass || "Class 10") as string))
  ).sort((a: string, b: string) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
    return numB - numA;
  });

  // Active classes to display based on classFilter
  const displayClasses: string[] = classFilter === "ALL" ? distinctClasses : [classFilter];

  const totalFilteredCount = students.filter((s: any) => {
    const matchesClass = classFilter === "ALL" || s.currentClass === classFilter;
    return matchesClass && matchesSearch(s);
  }).length;

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Batch Student Roster &amp; Academic Dossier
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Class-wise directory of enrolled students across your live batches. Monitor attendance turnout, track submitted homework, and inspect student profiles.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 font-bold shrink-0">
          {totalFilteredCount} of {students.length} Students Enrolled
        </div>
      </div>

      {/* ── 2. SEARCH & FILTER CONTROLS (CARDLESS) ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by student name, email, school, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#004b79] shadow-xs transition-colors"
            />
          </div>

          {(classFilter !== "ALL" || search.trim()) && (
            <button
              onClick={() => {
                setClassFilter("ALL");
                setSearch("");
              }}
              className="h-10 px-3 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Class-wise Filter Tabs / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Class Filter:
          </span>

          <button
            onClick={() => setClassFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              classFilter === "ALL"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All Classes ({students.length})
          </button>

          {distinctClasses.map((cls) => {
            const count = students.filter((s: any) => s.currentClass === cls).length;
            return (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  classFilter === cls
                    ? "bg-[#004b79] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cls} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. CLASS-WISE ROSTER SECTIONS ── */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading live student roster...</div>
        ) : totalFilteredCount === 0 ? (
          <div className="py-16 px-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] mx-auto flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                No Students Found in {classFilter !== "ALL" ? classFilter : "this filter"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                There are currently no active students enrolled in {classFilter !== "ALL" ? classFilter : "the selected criteria"}.
              </p>
            </div>
          </div>
        ) : (
          displayClasses.map((cls) => {
            const classStudents = students.filter(
              (s: any) => (s.currentClass || "Class 10") === cls && matchesSearch(s)
            );

            if (classStudents.length === 0) return null;

            return (
              <div key={cls} className="space-y-3">
                {/* Class Section Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] flex items-center justify-center font-black text-xs">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                        {cls} Roster
                      </h2>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-400">
                    {classStudents.length} {classStudents.length === 1 ? "Student" : "Students"} Enrolled
                  </span>
                </div>

                {/* Class Student Rows / Modern Roster Cards */}
                <div className="space-y-3">
                  {classStudents.map((s: any, idx: number) => {
                    const studentId = s.studentId || formatStudentId(s, idx);
                    const formattedId = studentId.startsWith("#") ? studentId : `#${studentId}`;
                    const initials = (s.userId?.name || "Student")
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <div
                        key={s._id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Col 1: Avatar, Number, Name, ID & Status */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004b79] to-[#002137] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-slate-400">
                                #{idx + 1}
                              </span>
                              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                                {s.userId?.name || "Student"}
                              </h3>
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                {formattedId}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                Active
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <School className="w-3.5 h-3.5 text-slate-400" />
                                <strong className="text-slate-700 dark:text-slate-300">{s.schoolName || "School Not Specified"}</strong>
                              </span>
                              <span>·</span>
                              <span>{s.board || "State Board"} ({s.district || s.userId?.district || "District"})</span>
                              {s.userId?.email && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px]">
                                    {s.userId.email}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Col 2: Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenView(s)}
                            className="font-bold text-xs flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#004b79] dark:text-[#dfb74a] cursor-pointer shadow-2xs px-3.5 py-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(s)}
                            className="font-bold text-xs flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs px-3 py-1.5"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Edit</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 4. VIEW STUDENT ACADEMIC & FEE DOSSIER MODAL ── */}
      {viewingStudent && (
        <Modal
          isOpen={!!viewingStudent}
          onClose={() => setViewingStudent(null)}
          title={`Student Dossier: ${viewingStudent.userId?.name || "Student"}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
            {/* Header summary banner */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            {/* 3 Metric Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Live Attendance
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {viewingStudent.attendancePercentage}%
                </p>
                <p className="text-[10px] text-slate-400">
                  {viewingStudent.attendedCount ?? 1} of {viewingStudent.totalSessions ?? 1} Sessions
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Allocated Batch
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                  {viewingStudent.batchId?.name || "6:00 PM – 7:00 PM"}
                </p>
                <p className="text-[10px] text-slate-400">Assigned Schedule</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  Homework Done
                </span>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {viewingStudent.homeworkSubmitted ?? 0} Done
                </p>
                <p className="text-[10px] text-slate-400">Tracked in Portal</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Contact &amp; Guardian Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingStudent.userId?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Student Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingStudent.userId?.phone || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Parent / Guardian</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingStudent.parentName || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Parent Contact</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingStudent.parentPhone || "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 5. EDIT STUDENT PROFILE MODAL ── */}
      {editingStudent && (
        <Modal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          title={`Edit Student Profile: ${editingStudent.userId?.name || "Student"}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveStudent} className="space-y-4 pt-1 text-xs">
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Class Level</label>
                <select
                  value={formData.currentClass}
                  onChange={(e) => setFormData((p) => ({ ...p, currentClass: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  {CLASS_LIST.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Board</label>
                <select
                  value={formData.board}
                  onChange={(e) => setFormData((p) => ({ ...p, board: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="CBSE">CBSE</option>
                  <option value="State Board">State Board</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">School Name</label>
              <Input
                value={formData.schoolName}
                onChange={(e) => setFormData((p) => ({ ...p, schoolName: e.target.value }))}
                className="rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Parent Name</label>
                <Input
                  value={formData.parentName}
                  onChange={(e) => setFormData((p) => ({ ...p, parentName: e.target.value }))}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Parent Phone</label>
                <Input
                  value={formData.parentPhone}
                  onChange={(e) => setFormData((p) => ({ ...p, parentPhone: e.target.value }))}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingStudent(null)}
                className="font-bold text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="font-bold text-xs bg-[#004b79] hover:bg-[#003b60] text-white rounded-xl shadow-sm"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
