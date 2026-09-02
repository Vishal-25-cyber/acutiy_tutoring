"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  ExternalLink,
  FileText,
  Calendar,
  Layers,
  Send,
  Sparkles,
  Maximize2,
  Image as ImageIcon,
  Check,
  Award,
  Video,
  ShieldAlert,
  Camera,
  AlertCircle,
  Timer,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { getSubjectsForClassAndBoard, CLASS_LIST } from "@/lib/curriculum";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";

export default function TeacherAssignmentsPage() {
  // Category Tab: "ASSIGNMENT" | "TEST" | "HOMEWORK"
  const [activeCategory, setActiveCategory] = useState<"ASSIGNMENT" | "TEST" | "HOMEWORK">("ASSIGNMENT");

  const { data, refetch, isLoading } = useFastFetch("/api/teacher/assignments");
  const [isCreateModal, setIsCreateModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const [marks, setMarks] = useState<number | string>(18);
  const [feedback, setFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  const [formData, setFormData] = useState({
    type: "ASSIGNMENT" as "ASSIGNMENT" | "TEST" | "HOMEWORK",
    title: "",
    description: "",
    subject: "Mathematics",
    classLevel: "Class 10",
    batchId: "",
    durationMinutes: 45,
    proctoringRequired: true,
    dueDate: "",
    maxMarks: 20,
    attachmentUrl: "",
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
        if (bData.batches && bData.batches.length > 0) {
          setBatches(bData.batches);
          if (!formData.batchId) {
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

  const allAssignments = data?.assignments || [];
  const allSubmissions = data?.submissions || [];

  // Filter tasks by selected category
  const filteredAssignments = allAssignments.filter(
    (a: any) => (a.type || "ASSIGNMENT") === activeCategory
  );
  const categoryAssignmentIds = new Set(filteredAssignments.map((a: any) => a._id?.toString()));

  const filteredCategorySubmissions = allSubmissions.filter((s: any) => {
    const aId = s.assignmentId?._id?.toString() || s.assignmentId?.toString();
    return categoryAssignmentIds.has(aId) || (s.type || "ASSIGNMENT") === activeCategory;
  });

  const pendingSubmissions = filteredCategorySubmissions.filter((s: any) => s.status !== "EVALUATED");
  const gradedSubmissions = filteredCategorySubmissions.filter((s: any) => s.status === "EVALUATED");

  const displayedSubmissions =
    subTab === "PENDING"
      ? pendingSubmissions
      : subTab === "COMPLETED"
        ? gradedSubmissions
        : filteredCategorySubmissions;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.batchId) {
      alert("Please fill in the title and select target batch.");
      return;
    }

    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim() || `${formData.classLevel} ${formData.subject} — ${formData.title.trim()}`,
          type: activeCategory,
          maxMarks: Number(formData.maxMarks) || (activeCategory === "TEST" ? 50 : 20),
          durationMinutes: activeCategory === "TEST" ? Number(formData.durationMinutes) || 45 : undefined,
          proctoringRequired: activeCategory === "TEST" ? formData.proctoringRequired : false,
        }),
      });
      if (res.ok) {
        setIsCreateModal(false);
        setFormData({
          type: activeCategory,
          title: "",
          description: "",
          subject: "Mathematics",
          classLevel: "Class 10",
          batchId: batches[0]?._id || "",
          durationMinutes: 45,
          proctoringRequired: true,
          dueDate: "",
          maxMarks: activeCategory === "TEST" ? 50 : 20,
          attachmentUrl: "",
        });
        invalidateCache("/api/teacher/assignments");
        invalidateCache("/api/student/assignments");
        refetch();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create task");
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
          feedback: feedback.trim() || "Good work, keep practicing!",
        }),
      });
      if (res.ok) {
        setSelectedSub(null);
        invalidateCache("/api/teacher/assignments");
        invalidateCache("/api/teacher/dashboard");
        invalidateCache("/api/student/assignments");
        refetch();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-in fade-in duration-150 select-none pb-24">
      {/* ── 1. HEADER & CATEGORY TABS ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Assignments, Tests &amp; Homework Hub
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
              Staff Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Publish coursework assignments, schedule live proctored tests, and review student solution uploads separately.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setFormData({
                type: activeCategory,
                title: "",
                description: "",
                subject: "Mathematics",
                classLevel: "Class 10",
                batchId: batches[0]?._id || "",
                durationMinutes: 45,
                proctoringRequired: true,
                dueDate: "",
                maxMarks: activeCategory === "TEST" ? 50 : 20,
                attachmentUrl: "",
              });
              setIsCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm shadow-[#004b79]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              Create {activeCategory === "TEST" ? "Proctored Test" : activeCategory === "HOMEWORK" ? "Daily Homework" : "Assignment"}
            </span>
          </button>
        </div>
      </div>

      {/* ── 2. CATEGORY SWITCHER (ASSIGNMENTS vs TIMED TESTS vs HOMEWORK) ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveCategory("ASSIGNMENT")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeCategory === "ASSIGNMENT"
              ? "bg-[#004b79] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
        >
          <FileCheck className="w-4 h-4 text-blue-300" />
          <span>Coursework Assignments</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {allAssignments.filter((a: any) => (a.type || "ASSIGNMENT") === "ASSIGNMENT").length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("TEST")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeCategory === "TEST"
              ? "bg-[#004b79] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
        >
          <Timer className="w-4 h-4 text-[#dfb74a]" />
          <span>Timed Proctored Tests</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {allAssignments.filter((a: any) => a.type === "TEST").length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("HOMEWORK")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeCategory === "HOMEWORK"
              ? "bg-[#004b79] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
        >
          <FileText className="w-4 h-4 text-emerald-300" />
          <span>Daily Homework</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {allAssignments.filter((a: any) => a.type === "HOMEWORK").length}
          </span>
        </button>
      </div>

      {/* ── 3. SUBMISSIONS EVALUATION TABLE ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {activeCategory === "TEST"
                ? "Proctored Test Answer Submissions"
                : activeCategory === "HOMEWORK"
                  ? "Homework Worksheet Submissions"
                  : "Assignment Solution Submissions"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review student answers, inspect webcam proctoring audit snapshots, and award marks.
            </p>
          </div>

          {/* Submission Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
            <button
              onClick={() => setSubTab("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${subTab === "PENDING"
                  ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
            >
              <span>Awaiting Evaluation</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold">
                {pendingSubmissions.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab("COMPLETED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${subTab === "COMPLETED"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
            >
              <span>Graded</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold">
                {gradedSubmissions.length}
              </span>
            </button>
          </div>
        </div>

        {/* Submissions List */}
        {displayedSubmissions.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No {activeCategory.toLowerCase()} submissions found
            </p>
            <p className="text-xs text-slate-400">
              {subTab === "PENDING"
                ? "All submitted solutions for this category have been evaluated."
                : "No submissions recorded yet for this category."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {displayedSubmissions.map((sub: any) => {
              const asg = sub.assignmentId || {};
              const student = sub.studentId || {};
              const isEvaluated = sub.status === "EVALUATED";
              const isTest = (sub.type || asg.type) === "TEST";

              return (
                <div
                  key={sub._id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors px-1"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {student.name || "Student"}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        ({asg.classLevel || "Class 10"})
                      </span>
                      {isTest && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-amber-600" />
                          Proctored Test
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {asg.title || "Assessment Title"}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span className="font-semibold text-[#004b79] dark:text-[#dfb74a]">
                        {asg.subject || "Mathematics"}
                      </span>
                      <span>•</span>
                      <span>
                        Submitted: {new Date(sub.submittedAt || sub.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {sub.proctoringSnapshotUrl && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Camera Verified
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isEvaluated ? (
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600">
                          {sub.marksObtained} / {asg.maxMarks || 20} Marks
                        </span>
                        <p className="text-[10px] text-slate-400">Graded</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSub(sub);
                          setMarks(sub.marksObtained || Math.round((asg.maxMarks || 20) * 0.85));
                          setFeedback(sub.feedback || "Good accuracy and clear step-by-step working.");
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white cursor-pointer transition-all shadow-2xs"
                      >
                        Evaluate &amp; Grade
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. PUBLISHED TASKS LIST ── */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Published {activeCategory === "TEST" ? "Proctored Tests" : activeCategory === "HOMEWORK" ? "Daily Homework Sheets" : "Assignments"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active tasks assigned to batches and student classes
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {filteredAssignments.length} Published
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((task: any) => (
            <div
              key={task._id}
              className="p-4 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-[#004b79] dark:text-[#dfb74a]">
                    {task.subject}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">{task.classLevel}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                  {task.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {task.type === "TEST" ? `${task.durationMinutes || 45} mins • ` : ""}
                  Max: <strong className="text-slate-700 dark:text-slate-300 font-bold">{task.maxMarks} Marks</strong>
                </span>
                <span className="text-[#004b79] dark:text-[#dfb74a] font-semibold">
                  {task.submissionCount || 0} Submissions
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. CREATE TASK MODAL ── */}
      {isCreateModal && (
        <Modal isOpen={isCreateModal} onClose={() => setIsCreateModal(false)} title={`Create ${activeCategory === "TEST" ? "Timed Proctored Test" : activeCategory === "HOMEWORK" ? "Daily Homework" : "Assignment"}`}>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Title / Chapter Topic *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={activeCategory === "TEST" ? "e.g. Quadratic Equations Unit Test 1" : "e.g. Worksheet #4 on Trigonometry"}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Target Grade *</label>
                <select
                  value={formData.classLevel}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {CLASS_LIST.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Subject *</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Target Batch *</label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Max Marks *</label>
                <input
                  type="number"
                  required
                  value={formData.maxMarks}
                  onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Test Specific Fields */}
            {activeCategory === "TEST" ? (
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-amber-600" />
                    <span>Test Duration (Minutes)</span>
                  </span>
                  <select
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-amber-300 bg-white text-slate-900"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.proctoringRequired}
                    onChange={(e) => setFormData({ ...formData, proctoringRequired: e.target.checked })}
                    className="w-4 h-4 rounded text-[#004b79]"
                  />
                  <span>Mandatory Webcam Proctoring (Student camera stream required)</span>
                </label>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Due Date *</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Instructions &amp; Question Paper Details
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter instructions, question points, or rubric details..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#004b79] text-white hover:bg-[#003b60]"
              >
                Publish {activeCategory === "TEST" ? "Proctored Test" : activeCategory === "HOMEWORK" ? "Homework" : "Assignment"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── 6. EVALUATION & GRADING MODAL ── */}
      {selectedSub && (
        <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title="Grade Student Submission">
          <form onSubmit={handleGrade} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-900 dark:text-slate-100">{selectedSub.studentId?.name}</span>
                <span className="text-[#004b79] dark:text-[#dfb74a]">{selectedSub.assignmentId?.title}</span>
              </div>
              {selectedSub.proctoringSnapshotUrl && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Webcam Proctoring Snapshot:</span>
                  <img
                    src={selectedSub.proctoringSnapshotUrl}
                    alt="Proctoring Snapshot"
                    className="w-36 h-28 object-cover rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>
              )}
              {selectedSub.submissionText && (
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-500">Student Notes:</span>
                  <p className="text-slate-700 dark:text-slate-300 font-normal">{selectedSub.submissionText}</p>
                </div>
              )}
              {selectedSub.fileUrl && (
                <div className="pt-1">
                  <a
                    href={selectedSub.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Submitted Answer Document</span>
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Award Marks (Out of {selectedSub.assignmentId?.maxMarks || 20}) *
              </label>
              <input
                type="number"
                required
                max={selectedSub.assignmentId?.maxMarks || 20}
                min={0}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Constructive Teacher Feedback
              </label>
              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter feedback for the student..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGrading}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#004b79] text-white hover:bg-[#003b60] disabled:opacity-60"
              >
                {isGrading ? "Saving..." : "Submit Grade & Feedback"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
