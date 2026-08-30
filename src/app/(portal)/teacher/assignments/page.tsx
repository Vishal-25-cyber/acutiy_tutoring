"use client";

import React, { useState, useEffect } from "react";
import { FileCheck, Plus, CheckCircle2, Clock, Eye, Download, ExternalLink, FileText, Image as ImageIcon, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { getSubjectsForClassAndBoard, CLASS_LIST } from "@/lib/curriculum";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";

export default function TeacherAssignmentsPage() {
  const { data, refetch } = useFastFetch("/api/teacher/assignments");
  const [isCreateModal, setIsCreateModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const [marks, setMarks] = useState(18);
  const [feedback, setFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "Mathematics",
    classLevel: "Class 10",
    batchId: "",
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    maxMarks: 20,
  });
  const [batches, setBatches] = useState<any[]>([]);

  const availableSubjects = Array.from(
    new Set([
      ...getSubjectsForClassAndBoard(formData.classLevel, "CBSE"),
      ...getSubjectsForClassAndBoard(formData.classLevel, "State Board"),
    ])
  );

  const handleClassChange = (newClass: string) => {
    const newSubjects = getSubjectsForClassAndBoard(newClass, "CBSE");
    setFormData((prev) => ({
      ...prev,
      classLevel: newClass,
      subject: newSubjects[0] || "Mathematics",
    }));
  };

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/batches");
        const bData = await res.json();
        if (bData.batches) {
          setBatches(bData.batches);
          if (bData.batches.length > 0) {
            setFormData((prev) => ({ ...prev, batchId: bData.batches[0]._id }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadBatches();
  }, []);

  const [subTab, setSubTab] = useState<"PENDING" | "COMPLETED" | "ALL">("PENDING");

  const assignments = data?.assignments || [];
  const submissions = data?.submissions || [];
  const pendingSubmissions = submissions.filter((s: any) => s.status !== "EVALUATED");
  const gradedSubmissions = submissions.filter((s: any) => s.status === "EVALUATED");

  const filteredSubmissions =
    subTab === "PENDING"
      ? pendingSubmissions
      : subTab === "COMPLETED"
      ? gradedSubmissions
      : submissions;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsCreateModal(false);
        invalidateCache("/api/teacher/assignments");
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsGrading(true);
    try {
      const res = await fetch("/api/teacher/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSub._id,
          marksObtained: Number(marks),
          feedback,
        }),
      });
      if (res.ok) {
        setSelectedSub(null);
        invalidateCache("/api/teacher/assignments");
        invalidateCache("/api/teacher/dashboard");
        refetch();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Assignments & Grading Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Publish homework assignments for batches, review student solution photo snapshots, and record scores.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Assignment</span>
        </button>
      </div>

      {/* ── SUBMISSIONS MANAGEMENT ── */}
      <div className="space-y-3">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Student Homework Submissions
            </h2>
            <p className="text-[11px] text-slate-400">
              Evaluate student uploads, award marks, and provide constructive feedback.
            </p>
          </div>

          {/* Submission Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setSubTab("PENDING")}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                subTab === "PENDING"
                  ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Awaiting Evaluation</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                pendingSubmissions.length > 0 ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}>
                {pendingSubmissions.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab("COMPLETED")}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                subTab === "COMPLETED"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Graded & Completed</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                gradedSubmissions.length > 0 ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}>
                {gradedSubmissions.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab("ALL")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                subTab === "ALL"
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              All ({submissions.length})
            </button>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5">
            {subTab === "PENDING" ? (
              <>
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All submissions evaluated!</p>
                <p className="text-[11px] text-slate-400">No student homework submissions are currently waiting for grading.</p>
              </>
            ) : subTab === "COMPLETED" ? (
              <>
                <FileCheck className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No evaluated submissions yet</p>
                <p className="text-[11px] text-slate-400">When you review and save grades for submissions, they will be listed here as completed.</p>
              </>
            ) : (
              <>
                <FileCheck className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No student submissions received</p>
                <p className="text-[11px] text-slate-400">Submissions from students in your batch will appear here automatically.</p>
              </>
            )}
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            {filteredSubmissions.map((sub: any) => {
              const isEvaluated = sub.status === "EVALUATED";
              const maxMarks = sub.assignmentId?.maxMarks || 20;

              return (
                <div
                  key={sub._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {sub.studentId?.name || sub.studentId?.email || "Student"}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {sub.assignmentId?.title}
                      </span>
                      {isEvaluated ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>COMPLETED / EVALUATED</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>AWAITING EVALUATION</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500">
                      <span>Submitted on {new Date(sub.createdAt).toLocaleDateString()}</span>
                      {isEvaluated && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Score: {sub.marksObtained} / {maxMarks} Marks
                          </span>
                          {sub.feedback && (
                            <>
                              <span className="text-slate-300 dark:text-slate-700">·</span>
                              <span className="italic text-slate-600 dark:text-slate-400 line-clamp-1">
                                Feedback: &quot;{sub.feedback}&quot;
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSub(sub);
                      setMarks(sub.marksObtained !== undefined ? sub.marksObtained : 18);
                      setFeedback(sub.feedback || "");
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0 ${
                      isEvaluated
                        ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isEvaluated ? "Review / Edit Grade" : "Review & Grade"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ACTIVE ASSIGNMENTS LIST (CARDLESS) ── */}
      <div className="space-y-3">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Published Homework Tasks
          </h2>
          <span className="text-[11px] font-mono text-slate-400">{assignments.length} Tasks</span>
        </div>

        {assignments.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No assignments created yet</p>
            <p className="text-xs text-slate-400">Click &quot;Create Assignment&quot; to assign problems to your batch.</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            {assignments.map((asg: any) => (
              <div
                key={asg._id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {asg.subject}
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {asg.classLevel}
                    </span>
                    <span className="text-xs font-mono text-slate-400">· Max Marks: {asg.maxMarks || 20}</span>
                  </div>

                  <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {asg.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {asg.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : "This Week"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500 font-mono">
                    {asg.submissionCount || 0} Submissions
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grade Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          maxWidth="2xl"
          onClose={() => setSelectedSub(null)}
          title={selectedSub.status === "EVALUATED" ? "Update Homework Evaluation" : "Grade & Complete Homework Submission"}
        >
          <form onSubmit={handleGrade} className="space-y-4 text-xs">
            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Student: {selectedSub.studentId?.name || selectedSub.studentId?.email || "Student"}
                </p>
                <p className="text-slate-500">{selectedSub.assignmentId?.title}</p>
              </div>
              {selectedSub.status === "EVALUATED" ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  ✓ Currently Graded ({selectedSub.marksObtained} Marks)
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                  Awaiting Evaluation
                </span>
              )}
            </div>

            {selectedSub.fileUrl && (() => {
              const isDataUrl = selectedSub.fileUrl.startsWith("data:");
              const isLocalFile = selectedSub.fileUrl.startsWith("/") || selectedSub.fileUrl.startsWith("blob:");
              const isExternalBroken = !isDataUrl && !isLocalFile;
              const isPdf = selectedSub.fileUrl.startsWith("data:application/pdf") ||
                (isLocalFile && selectedSub.fileUrl.toLowerCase().endsWith(".pdf"));
              const isImg = selectedSub.fileUrl.startsWith("data:image/") ||
                (isLocalFile && /\.(png|jpe?g|webp|gif)$/i.test(selectedSub.fileUrl));
              const studentLabel = selectedSub.studentId?.name || selectedSub.studentId?.email || "student";

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Attached Solution File / Worksheet:
                    </label>
                    {!isExternalBroken && (
                      <a
                        href={selectedSub.fileUrl}
                        download={`submission_${studentLabel}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in New Tab / Download</span>
                      </a>
                    )}
                  </div>

                  {isExternalBroken ? (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-amber-800 dark:text-amber-300 mb-1">
                          File submitted by student
                        </p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed break-all">
                          The file was uploaded from the student&apos;s device. To view it, ask the student to re-upload via the assignment portal, or contact them directly.
                        </p>
                        <p className="text-[10px] text-amber-500 mt-1.5 font-mono break-all">{selectedSub.fileUrl}</p>
                      </div>
                    </div>
                  ) : isImg ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-2 group">
                      <img
                        src={selectedSub.fileUrl}
                        alt="Student Solution"
                        className="max-h-72 w-auto object-contain rounded-lg shadow-sm"
                      />
                      <a
                        href={selectedSub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Full Size Preview</span>
                      </a>
                    </div>
                  ) : isPdf ? (
                    <div className="space-y-2">
                      <iframe
                        src={selectedSub.fileUrl}
                        className="w-full h-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-xs"
                        title="Student PDF Submission"
                      />
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            Student Attached Solution Document
                          </p>
                          <p className="text-[10px] text-slate-400">Click below to open and evaluate the full submission</p>
                        </div>
                      </div>
                      <a
                        href={selectedSub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download="student_assignment_solution"
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download / View</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })()}

            {selectedSub.submissionText && (
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Student Notes & Explanations:</label>
                <p className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedSub.submissionText}
                </p>
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Marks Awarded (out of {selectedSub.assignmentId?.maxMarks || 20}) *</label>
              <input
                type="number"
                required
                min={0}
                max={selectedSub.assignmentId?.maxMarks || 100}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher Feedback</label>
              <textarea
                rows={2}
                placeholder="Good derivation steps, review question 3..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-3.5 py-2 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGrading}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-60 shadow-xs flex items-center gap-1.5"
              >
                {isGrading
                  ? "Recording..."
                  : selectedSub.status === "EVALUATED"
                  ? "Update Grade & Feedback"
                  : "✓ Save Grade & Mark Completed"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Modal */}
      {isCreateModal && (
        <Modal
          isOpen={isCreateModal}
          maxWidth="2xl"
          onClose={() => setIsCreateModal(false)}
          title="Create New Homework Assignment"
        >
          <form onSubmit={handleCreate} className="space-y-4 pt-2 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Task Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Exercise 4.2 Quadratic Equations & Word Problems"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Grade Level *</label>
                <select
                  value={formData.classLevel}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {CLASS_LIST.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subject *</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Max Marks</label>
                <input
                  type="number"
                  value={formData.maxMarks}
                  onChange={(e) => setFormData((p) => ({ ...p, maxMarks: Number(e.target.value) }))}
                  className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Instructions & Problem Numbers</label>
              <textarea
                rows={3}
                placeholder="Specify question numbers from NCERT text or problem statements..."
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModal(false)}
                className="px-3.5 py-2 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Publish Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
