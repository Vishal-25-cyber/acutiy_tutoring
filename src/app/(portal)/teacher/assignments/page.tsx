"use client";

import React, { useState, useEffect } from "react";
import { FileCheck, Plus, CheckCircle2, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { getSubjectsForClassAndBoard, CLASS_LIST } from "@/lib/curriculum";
import { useFastFetch } from "@/lib/api-cache";

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

  const assignments = data?.assignments || [];
  const submissions = data?.submissions || [];

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
      const res = await fetch(`/api/teacher/assignments/${selectedSub.assignmentId}/grade`, {
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

      {/* ── SUBMISSIONS PENDING EVALUATION (CARDLESS) ── */}
      <div className="space-y-3">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Student Submissions Awaiting Evaluation
          </h2>
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">{submissions.length} Submissions</span>
        </div>

        {submissions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">All submissions graded!</p>
            <p className="text-[11px] text-slate-400">No student homework submissions are currently waiting for grading.</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            {submissions.map((sub: any) => (
              <div
                key={sub._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {sub.studentId?.userId?.name || "Student"}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {sub.assignmentId?.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Submitted on {new Date(sub.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedSub(sub);
                    setMarks(sub.marksObtained || 18);
                    setFeedback(sub.feedback || "");
                  }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review & Grade</span>
                </button>
              </div>
            ))}
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
          title="Grade Homework Submission"
        >
          <form onSubmit={handleGrade} className="space-y-4 text-xs">
            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Student: {selectedSub.studentId?.userId?.name || "Student"}
              </p>
              <p className="text-slate-500">{selectedSub.assignmentId?.title}</p>
            </div>

            {selectedSub.fileUrl && (
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Attached Solution Image:</label>
                <div className="max-h-60 rounded-md overflow-hidden border border-slate-700 bg-black flex items-center justify-center">
                  <img src={selectedSub.fileUrl} alt="Solution" className="max-h-60 object-contain" />
                </div>
              </div>
            )}

            {selectedSub.submissionText && (
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Student Notes:</label>
                <p className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
                className="px-4 py-2 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
              >
                {isGrading ? "Recording..." : "Save Grade"}
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
