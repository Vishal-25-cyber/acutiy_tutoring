"use client";

import React, { useState } from "react";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Plus,
  BookOpen,
  GraduationCap,
  Download,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";
import { sanitize10DigitPhone, isValid10DigitPhone, isValidAcuityOrGmail } from "@/lib/validations/phone";

const ALL_CLASSES = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

export default function AdminTeachersPage() {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const apiUrl = `/api/admin/teachers${filterStatus !== "ALL" ? `?status=${filterStatus}` : ""}`;
  const { data, refetch } = useFastFetch(apiUrl);
  const { data: allData } = useFastFetch("/api/admin/teachers?status=ALL");

  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [editTeacher, setEditTeacher] = useState<any>(null);
  const [deleteTeacher, setDeleteTeacher] = useState<any>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    qualification: "",
    specialization: "",
    experienceYears: 0,
    subjects: [] as string[],
    subjectsInput: "",
    classesTaught: [] as string[],
    status: "ACTIVE",
    resetPassword: "",
  });

  const teachers = Array.isArray(data?.teachers) ? data.teachers : [];
  const allTeachers = Array.isArray(allData?.teachers) ? allData.teachers : teachers;

  const pendingCount = allTeachers.filter(
    (t: any) => t.approvalStatus === "PENDING_APPROVAL" || t.userId?.status === "PENDING_APPROVAL"
  ).length;

  const approvedCount = allTeachers.filter(
    (t: any) => t.approvalStatus === "ACTIVE" || t.userId?.status === "ACTIVE"
  ).length;

  const rejectedCount = allTeachers.filter(
    (t: any) => t.approvalStatus === "REJECTED" || t.userId?.status === "REJECTED"
  ).length;

  const openEditModal = (t: any) => {
    setEditTeacher(t);
    setEditForm({
      name: t.userId?.name || "",
      email: t.userId?.email || "",
      phone: t.userId?.phone || "",
      qualification: t.qualification || "",
      specialization: t.specialization || "",
      experienceYears: t.experienceYears || 0,
      subjects: t.subjects || [],
      subjectsInput: (t.subjects || []).join(", "),
      classesTaught: t.classesTaught || [],
      status: t.approvalStatus || t.userId?.status || "ACTIVE",
      resetPassword: "",
    });
  };

  const handleUpdateStatus = async (teacherUserId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: teacherUserId, status: newStatus }),
      });

      if (res.ok) {
        setSelectedTeacher(null);
        invalidateCache(apiUrl);
        invalidateCache("/api/admin/teachers?status=ALL");
        invalidateCache("/api/admin/dashboard");
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTeacherEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacher) return;

    if (editForm.email && !isValidAcuityOrGmail(editForm.email)) {
      alert("Email address must end with @acuity.edu or @gmail.com.");
      return;
    }
    if (editForm.phone && !isValid10DigitPhone(editForm.phone)) {
      alert("Teacher mobile number must be exactly 10 digits and cannot start with 0.");
      return;
    }

    setIsSaving(true);
    try {
      const subjectsArray = editForm.subjectsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const teacherUserId = editTeacher.userId?._id || editTeacher._id;

      const res = await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: teacherUserId,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          qualification: editForm.qualification,
          specialization: editForm.specialization,
          experienceYears: Number(editForm.experienceYears),
          subjects: subjectsArray,
          classesTaught: editForm.classesTaught,
          status: editForm.status,
          resetPassword: editForm.resetPassword || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "Failed to save teacher changes");
        return;
      }

      setEditTeacher(null);
      invalidateCache(apiUrl);
      invalidateCache("/api/admin/teachers?status=ALL");
      invalidateCache("/api/admin/dashboard");
      refetch();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while saving teacher changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deleteTeacher) return;
    setIsDeleting(true);
    try {
      const teacherUserId =
        deleteTeacher.userId?._id ||
        (typeof deleteTeacher.userId === "string" ? deleteTeacher.userId : "") ||
        deleteTeacher._id;

      const res = await fetch(`/api/admin/teachers?id=${teacherUserId}`, {
        method: "DELETE",
      });

      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "Failed to delete teacher");
        return;
      }

      setDeleteTeacher(null);
      invalidateCache(apiUrl);
      invalidateCache("/api/admin/teachers?status=ALL");
      invalidateCache("/api/admin/dashboard");
      refetch();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while deleting teacher");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleClassTaught = (cls: string) => {
    setEditForm((prev) => {
      const exists = prev.classesTaught.includes(cls);
      return {
        ...prev,
        classesTaught: exists
          ? prev.classesTaught.filter((c) => c !== cls)
          : [...prev.classesTaught, cls],
      };
    });
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Faculty Staff &amp; Approvals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {allTeachers.length} Faculty
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Review teacher qualifications, credentials, edit subjects/classes, and manage database records.
          </p>
        </div>

        {/* Status Filter Tabs with Counts */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-x-auto self-start sm:self-auto shrink-0">
          {[
            { id: "ALL", label: `All Staff (${allTeachers.length})` },
            {
              id: "PENDING_APPROVAL",
              label: "Pending Review",
              count: pendingCount,
            },
            { id: "ACTIVE", label: `Approved (${approvedCount})` },
            { id: "REJECTED", label: `Rejected (${rejectedCount})` },
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white animate-pulse">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. CARDLESS 12-COLUMN MASTER TEACHERS TABLE ── */}
      <div className="space-y-2 pt-2">
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-3">Faculty Name &amp; Contact</div>
          <div className="col-span-3">Qualification &amp; Experience</div>
          <div className="col-span-3">Classes &amp; Subjects</div>
          <div className="col-span-3 text-right">Status &amp; Verification Actions</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {teachers.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {filterStatus === "PENDING_APPROVAL"
                  ? "No pending approvals. All faculty profiles are up to date."
                  : "No faculty records in this category"}
              </p>
              <p className="text-xs text-slate-400">Try selecting another filter tab above.</p>
            </div>
          ) : (
            teachers.map((t: any) => {
              const isPending = t.approvalStatus === "PENDING_APPROVAL" || t.userId?.status === "PENDING_APPROVAL";
              const isApproved = t.approvalStatus === "ACTIVE" || t.userId?.status === "ACTIVE";

              return (
                <div
                  key={t._id}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                >
                  {/* Col 1: Name & Contact */}
                  <div className="col-span-3 space-y-0.5">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {t.userId?.name || "Faculty Specialist"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {t.userId?.email} • {t.userId?.phone || "—"}
                    </p>
                  </div>

                  {/* Col 2: Qualification & Experience */}
                  <div className="col-span-3 space-y-0.5 text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {t.qualification || "M.Sc. / B.Ed. Specialist"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {t.experienceYears || 5} Years Experience
                    </p>
                  </div>

                  {/* Col 3: Classes & Subjects */}
                  <div className="col-span-3 space-y-1">
                    <p className="text-xs font-bold text-[#004b79] dark:text-[#dfb74a] truncate">
                      {t.subjects?.join(", ") || "Mathematics, Science"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {t.classesTaught?.map((c: string) => (
                        <span key={c} className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Col 4: Status & Actions */}
                  <div className="col-span-3 flex items-center justify-start md:justify-end gap-1.5 flex-wrap">
                    {isPending ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 animate-pulse flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending Review</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(t.userId._id, "ACTIVE")}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(t.userId._id, "REJECTED")}
                          className="px-2 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {isApproved ? "Approved" : "Rejected"}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Edit2 className="w-3 h-3 text-[#004b79] dark:text-[#dfb74a]" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTeacher(t)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                    >
                      Docs
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTeacher(t)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Edit Faculty Modal ── */}
      {editTeacher && (
        <Modal
          isOpen={!!editTeacher}
          onClose={() => setEditTeacher(null)}
          title={`Edit Faculty: ${editTeacher.userId?.name}`}
          description="Update credentials, qualification, assigned classes, or subjects taught."
          maxWidth="lg"
        >
          <form onSubmit={handleSaveTeacherEdit} className="space-y-4 pt-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Teacher Name *</label>
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
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Phone Number (10 Digits) *</label>
                <Input
                  required
                  type="tel"
                  maxLength={10}
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: sanitize10DigitPhone(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Teaching Status / Approval</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#004b79]"
                >
                  <option value="ACTIVE">ACTIVE (Approved &amp; Teaching)</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL (Under Review)</option>
                  <option value="REJECTED">REJECTED (Access Suspended)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Qualification Degree</label>
                <Input
                  value={editForm.qualification}
                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Years Experience</label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.experienceYears}
                  onChange={(e) =>
                    setEditForm({ ...editForm, experienceYears: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Subjects Taught (Comma Separated)</label>
              <Input
                value={editForm.subjectsInput}
                onChange={(e) => setEditForm({ ...editForm, subjectsInput: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">Assigned Class Levels</label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                {ALL_CLASSES.map((cls) => {
                  const selected = editForm.classesTaught.includes(cls);
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => toggleClassTaught(cls)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selected
                          ? "bg-[#004b79] text-white shadow-2xs"
                          : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Reset Password (Optional)</label>
              <Input
                type="password"
                placeholder="Leave blank to keep existing password"
                value={editForm.resetPassword}
                onChange={(e) => setEditForm({ ...editForm, resetPassword: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditTeacher(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Faculty Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Document Inspection Modal ── */}
      {selectedTeacher && (
        <Modal
          isOpen={!!selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          title={`Faculty Documents: ${selectedTeacher.userId?.name}`}
          description="Inspect uploaded certificates, identity proofs, and credentials."
          maxWidth="md"
        >
          <div className="space-y-4 pt-1 text-xs">
            <div className="space-y-2">
              <p className="font-bold text-slate-900 dark:text-slate-100">Identity &amp; Degree Verification:</p>
              {selectedTeacher.documents && selectedTeacher.documents.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {selectedTeacher.documents.map((doc: any, i: number) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{doc.name || `Document #${i + 1}`}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{doc.type || "PDF / Image Verification"}</p>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                      >
                        Inspect
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-slate-500">
                  No separate document files uploaded. Verified via system registration.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTeacher(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTeacher && (
        <Modal
          isOpen={!!deleteTeacher}
          onClose={() => setDeleteTeacher(null)}
          title="Permanently Delete Faculty Profile"
          description="This action cannot be undone."
          maxWidth="md"
        >
          <div className="space-y-4 pt-1 text-xs">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  Delete &quot;{deleteTeacher.userId?.name}&quot; from Database?
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  This will permanently delete this faculty staff account, assigned classes, study materials uploaded, and teaching presence logs from the database.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTeacher(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteTeacher}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-sm disabled:opacity-60"
              >
                {isDeleting ? "Deleting from DB..." : "Confirm & Permanently Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
