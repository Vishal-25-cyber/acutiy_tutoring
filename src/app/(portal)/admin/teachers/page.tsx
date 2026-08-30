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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";
import { sanitize10DigitPhone, isValid10DigitPhone, isValidAcuityOrGmail } from "@/lib/validations/phone";

const ALL_CLASSES = [
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

export default function AdminTeachersPage() {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const apiUrl = `/api/admin/teachers${filterStatus !== "ALL" ? `?status=${filterStatus}` : ""}`;
  const { data, refetch } = useFastFetch(apiUrl);

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
      invalidateCache("/api/admin/teachers");
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
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Faculty & Teacher Approvals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review teacher qualifications, credentials, edit subjects/classes, and manage database records.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
          {[
            { id: "ALL", label: "All Staff" },
            { id: "PENDING_APPROVAL", label: "Pending Review" },
            { id: "ACTIVE", label: "Approved" },
            { id: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers List Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Teacher Name & Info</th>
                <th className="p-4 font-bold">Qualification & Experience</th>
                <th className="p-4 font-bold">Assigned Classes</th>
                <th className="p-4 font-bold">Subjects</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No teacher profiles found in this category.
                  </td>
                </tr>
              ) : (
                teachers.map((t: any) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{t.userId?.name}</p>
                      <p className="text-slate-400 text-[11px] font-mono">{t.userId?.email} • {t.userId?.phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{t.qualification}</p>
                      <p className="text-slate-400 text-[11px]">{t.experienceYears} Years Experience</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {t.classesTaught?.map((c: string) => (
                          <span key={c} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      {t.subjects?.join(", ")}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          t.approvalStatus === "ACTIVE"
                            ? "success"
                            : t.approvalStatus === "PENDING_APPROVAL"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {t.approvalStatus === "PENDING_APPROVAL" ? "PENDING REVIEW" : t.approvalStatus}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1"
                          onClick={() => openEditModal(t)}
                        >
                          <Edit2 className="w-3 h-3 text-indigo-600" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                          onClick={() => setSelectedTeacher(t)}
                        >
                          Inspect Docs
                        </Button>
                        {t.approvalStatus === "PENDING_APPROVAL" && (
                          <Button
                            size="sm"
                            variant="success"
                            className="text-xs font-bold h-8"
                            onClick={() => handleUpdateStatus(t.userId._id, "ACTIVE")}
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                          onClick={() => setDeleteTeacher(t)}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Comprehensive Edit Faculty / Teacher Modal ── */}
      {editTeacher && (
        <Modal
          isOpen={!!editTeacher}
          onClose={() => setEditTeacher(null)}
          title={`Edit Teacher: ${editTeacher.userId?.name}`}
          description="Update personal details, qualifications, taught subjects, assigned grade levels, or account status."
        >
          <form onSubmit={handleSaveTeacherEdit} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Full Name *</label>
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
                <label className="block font-bold mb-1">Phone Number (10 Digits) *</label>
                <Input
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="9876543213"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: sanitize10DigitPhone(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Experience (Years) *</label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.experienceYears}
                  onChange={(e) => setEditForm({ ...editForm, experienceYears: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Highest Qualification *</label>
                <Input
                  required
                  placeholder="e.g. M.Sc. Mathematics, B.Ed"
                  value={editForm.qualification}
                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Specialization</label>
                <Input
                  placeholder="e.g. Higher Secondary Mathematics"
                  value={editForm.specialization}
                  onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">
                Assigned Subjects (comma-separated) *
              </label>
              <Input
                required
                placeholder="e.g. Mathematics, Science, Physics"
                value={editForm.subjectsInput}
                onChange={(e) => setEditForm({ ...editForm, subjectsInput: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5">
                Assigned Classes / Grades Taught *
              </label>
              <div className="grid grid-cols-5 gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                {ALL_CLASSES.map((cls) => {
                  const isChecked = editForm.classesTaught.includes(cls);
                  return (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => toggleClassTaught(cls)}
                      className={`p-1.5 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer border ${
                        isChecked
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                      }`}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Approval & Account Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  <option value="ACTIVE">ACTIVE (Approved & Verified)</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL (Under Review)</option>
                  <option value="SUSPENDED">SUSPENDED (Access Blocked)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Reset Password (Optional)</label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editForm.resetPassword}
                  onChange={(e) => setEditForm({ ...editForm, resetPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setEditTeacher(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSaving} className="font-bold">
                {isSaving ? "Saving..." : "Save Teacher Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTeacher && (
        <Modal
          isOpen={!!deleteTeacher}
          onClose={() => setDeleteTeacher(null)}
          title="Permanently Delete Faculty Profile"
          description="This action cannot be undone."
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  Delete &quot;{deleteTeacher.userId?.name}&quot; from Database?
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  This will permanently delete this faculty member&apos;s login account, qualification profile, and staff records from the database.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeleteTeacher(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDeleteTeacher}
                className="font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? "Deleting from DB..." : "Confirm & Permanently Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Inspect Teacher Application Modal ── */}
      {selectedTeacher && (
        <Modal
          isOpen={!!selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          title={`Teacher Profile: ${selectedTeacher.userId?.name}`}
          description="Verification of educational degrees, identity records, and assigned classes."
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div>
                <span className="text-slate-400">Full Name</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedTeacher.userId?.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Email Address</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedTeacher.userId?.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Phone Number</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedTeacher.userId?.phone}</p>
              </div>
              <div>
                <span className="text-slate-400">Experience</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedTeacher.experienceYears} Years</p>
              </div>
            </div>

            <div>
              <span className="font-bold block mb-1">Highest Educational Qualification</span>
              <p className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                {selectedTeacher.qualification} • Specialization: {selectedTeacher.specialization || "Higher Secondary Sciences"}
              </p>
            </div>

            <div>
              <span className="font-bold block mb-1.5 text-slate-800 dark:text-slate-200">
                Uploaded Verification Documents & Resume
              </span>

              {selectedTeacher.resumeUrl ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          Teacher Curriculum Vitae (Resume / CV)
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Uploaded by {selectedTeacher.userId?.name} during registration
                        </p>
                      </div>
                    </div>

                    <a
                      href={selectedTeacher.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={`Resume_${selectedTeacher.userId?.name || "Teacher"}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Open Full Document ↗</span>
                    </a>
                  </div>

                  {/* Embedded In-Modal Viewer */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-900">
                    {selectedTeacher.resumeUrl.startsWith("data:image") ? (
                      <div className="max-h-96 overflow-auto p-2 text-center">
                        <img
                          src={selectedTeacher.resumeUrl}
                          alt="Teacher Resume"
                          className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={selectedTeacher.resumeUrl}
                        title="Resume Document Preview"
                        className="w-full h-80 rounded-xl"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400">
                  No resume file uploaded for this faculty account.
                </div>
              )}

              {selectedTeacher.certificateUrl && (
                <div className="pt-2">
                  <a
                    href={selectedTeacher.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Degree Certificate / Academic Proof
                    </span>
                    <span className="text-indigo-600 font-bold">View Certificate ↗</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                className="text-xs gap-1"
                onClick={() => {
                  const t = selectedTeacher;
                  setSelectedTeacher(null);
                  openEditModal(t);
                }}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Full Profile</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setSelectedTeacher(null)}>
                  Close
                </Button>
                {selectedTeacher.approvalStatus === "PENDING_APPROVAL" && (
                  <Button
                    variant="success"
                    className="font-bold"
                    onClick={() => handleUpdateStatus(selectedTeacher.userId._id, "ACTIVE")}
                  >
                    Approve Teacher
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
