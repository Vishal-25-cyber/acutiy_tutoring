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
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { getSubjectsForClassAndBoard, CLASS_LIST } from "@/lib/curriculum";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";

export default function TeacherAssignmentsPage() {
  const { data, refetch, isLoading } = useFastFetch("/api/teacher/assignments");
  const [isCreateModal, setIsCreateModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const [marks, setMarks] = useState<number | string>(18);
  const [feedback, setFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "Mathematics",
    classLevel: "Class 10",
    batchId: "",
    dueDate: "",
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
    if (!formData.title.trim() || !formData.batchId || !formData.dueDate) {
      alert("Please fill in the title, target batch, and due date.");
      return;
    }

    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim(),
        }),
      });
      if (res.ok) {
        setIsCreateModal(false);
        setFormData({
          title: "",
          description: "",
          subject: "Mathematics",
          classLevel: "Class 10",
          batchId: batches[0]?._id || "",
          dueDate: "",
          maxMarks: 20,
        });
        invalidateCache("/api/teacher/assignments");
        invalidateCache("/api/student/assignments");
        refetch();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create assignment");
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

  const getSubjectBadge = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case "mathematics":
        return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800";
      case "science":
      case "physics":
      case "chemistry":
      case "biology":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800";
      case "english":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800";
      case "social science":
        return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800";
      default:
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800";
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Assignments &amp; Grading Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Publish homework assignments for batches, review student solution uploads, and award marks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setFormData({
                title: "",
                description: "",
                subject: "Mathematics",
                classLevel: "Class 10",
                batchId: batches[0]?._id || "",
                dueDate: "",
                maxMarks: 20,
              });
              setIsCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm shadow-[#004b79]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {/* ── 2. STUDENT HOMEWORK SUBMISSIONS (CARDLESS TABLE) ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Student Homework Submissions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluate student uploads, award marks, and provide constructive feedback.
            </p>
          </div>

          {/* Submission Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
            <button
              onClick={() => setSubTab("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                subTab === "PENDING"
                  ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Awaiting Evaluation</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  pendingSubmissions.length > 0
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}
              >
                {pendingSubmissions.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab("COMPLETED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                subTab === "COMPLETED"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Graded &amp; Completed</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  gradedSubmissions.length > 0
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}
              >
                {gradedSubmissions.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subTab === "ALL"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              All ({submissions.length})
            </button>
          </div>
        </div>

        {/* Submissions Table */}
        {filteredSubmissions.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            {subTab === "PENDING" ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">All submissions evaluated!</p>
                <p className="text-xs text-slate-400">No student homework submissions are currently waiting for grading.</p>
              </>
            ) : subTab === "COMPLETED" ? (
              <>
                <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No evaluated submissions yet</p>
                <p className="text-xs text-slate-400">Completed grades and feedback will appear here.</p>
              </>
            ) : (
              <>
                <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No student submissions received</p>
                <p className="text-xs text-slate-400">Submissions from students in your batch will appear here automatically.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
              <div className="col-span-3">Student &amp; Subject</div>
              <div className="col-span-3">Assignment Task</div>
              <div className="col-span-2">Uploaded Answer / File</div>
              <div className="col-span-2">Score &amp; Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredSubmissions.map((sub: any) => {
                const isEvaluated = sub.status === "EVALUATED";
                const maxMarks = sub.assignmentId?.maxMarks || 20;
                const hasFile = Boolean(sub.fileUrl);

                return (
                  <div
                    key={sub._id}
                    className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                  >
                    {/* Col 1: Student & Subject */}
                    <div className="col-span-3 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {sub.studentId?.name || sub.studentId?.email || "Student"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSubjectBadge(
                            sub.assignmentId?.subject
                          )}`}
                        >
                          {sub.assignmentId?.subject || "Curriculum"}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400">
                        Submitted: {new Date(sub.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Col 2: Task Title */}
                    <div className="col-span-3 space-y-0.5">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        {sub.assignmentId?.title || "Homework Assignment"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {sub.submissionText || "Student uploaded solution document."}
                      </p>
                    </div>

                    {/* Col 3: Uploaded Answer File Indicator */}
                    <div className="col-span-2 space-y-1">
                      {hasFile ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSub(sub);
                            setMarks(sub.marksObtained !== undefined ? sub.marksObtained : 18);
                            setFeedback(sub.feedback || "");
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60 text-[11px] font-bold hover:underline cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Solution File</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 italic">
                          Written notes only
                        </span>
                      )}
                    </div>

                    {/* Col 4: Score & Status */}
                    <div className="col-span-2 space-y-1">
                      {isEvaluated ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>COMPLETED</span>
                          </span>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {sub.marksObtained} / {maxMarks} Marks
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>AWAITING EVALUATION</span>
                          </span>
                          <p className="text-[11px] text-slate-400 pt-0.5">Max {maxMarks} Marks</p>
                        </div>
                      )}
                    </div>

                    {/* Col 5: Action Button */}
                    <div className="col-span-2 flex items-center justify-start md:justify-end">
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setMarks(sub.marksObtained !== undefined ? sub.marksObtained : 18);
                          setFeedback(sub.feedback || "");
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isEvaluated
                            ? "border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            : "bg-[#004b79] hover:bg-[#003b60] text-white shadow-sm"
                        }`}
                      >
                        {isEvaluated ? "Edit Score" : "Grade Submission"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. PUBLISHED HOMEWORK TASKS (CARDLESS TABLE) ── */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Published Homework Tasks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active assignments distributed to enrolled batch students.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{assignments.length} Tasks</span>
        </div>

        {assignments.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No assignments published yet</p>
            <p className="text-xs text-slate-400">Click &quot;Create Assignment&quot; above to publish homework for your students.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
              <div className="col-span-3">Subject &amp; Level</div>
              <div className="col-span-5">Assignment Title &amp; Instructions</div>
              <div className="col-span-2">Due Date &amp; Max Marks</div>
              <div className="col-span-2 text-right">Submissions</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {assignments.map((asg: any) => (
                <div
                  key={asg._id}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                >
                  {/* Col 1: Subject & Level */}
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSubjectBadge(asg.subject)}`}>
                        {asg.subject}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {asg.classLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{asg.batchId?.name || "Target Batch"}</p>
                  </div>

                  {/* Col 2: Title & Description */}
                  <div className="col-span-5 space-y-0.5">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {asg.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {asg.description || "Solve assigned problem sets with derivation steps."}
                    </p>
                  </div>

                  {/* Col 3: Due Date & Max Marks */}
                  <div className="col-span-2 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                      <span>{asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : "This Week"}</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">Max Marks: {asg.maxMarks || 20}</p>
                  </div>

                  {/* Col 4: Submissions Count */}
                  <div className="col-span-2 flex items-center justify-start md:justify-end">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{asg.submissionCount || 0} Submissions</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. GRADE SUBMISSION MODAL ── */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          maxWidth="3xl"
          onClose={() => setSelectedSub(null)}
          title={selectedSub.status === "EVALUATED" ? "Update Homework Evaluation" : "Grade & Complete Homework Submission"}
        >
          <form onSubmit={handleGrade} className="space-y-5 text-xs">
            {/* Header info */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Student: {selectedSub.studentId?.name || selectedSub.studentId?.email || "Student"}
                </p>
                <p className="text-[11px] text-slate-500">{selectedSub.assignmentId?.title}</p>
              </div>
              {selectedSub.status === "EVALUATED" ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  ✓ Graded ({selectedSub.marksObtained} Marks)
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                  Awaiting Evaluation
                </span>
              )}
            </div>

            {/* SEPARATE STUDENT ANSWER & SOLUTION VIEWER */}
            <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Student&apos;s Uploaded Answer &amp; Solution Worksheet
                  </h3>
                </div>

                {selectedSub.fileUrl && (
                  <a
                    href={selectedSub.fileUrl}
                    download={`submission_${selectedSub.studentId?.name || "student"}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#004b79] dark:text-[#dfb74a] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Full Screen / Download</span>
                  </a>
                )}
              </div>

              {selectedSub.fileUrl ? (
                (() => {
                  const isPdf = selectedSub.fileUrl.startsWith("data:application/pdf") || selectedSub.fileUrl.toLowerCase().includes(".pdf");
                  const isImg = selectedSub.fileUrl.startsWith("data:image/") || /\.(png|jpe?g|webp|gif)$/i.test(selectedSub.fileUrl);

                  if (isImg) {
                    return (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-2">
                        <img
                          src={selectedSub.fileUrl}
                          alt="Student Solution"
                          className="max-h-80 w-auto object-contain rounded-lg shadow-sm"
                        />
                        <a
                          href={selectedSub.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Full Size</span>
                        </a>
                      </div>
                    );
                  }

                  if (isPdf) {
                    return (
                      <div className="space-y-2">
                        <iframe
                          src={selectedSub.fileUrl}
                          className="w-full h-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-xs"
                          title="Student PDF Submission"
                        />
                      </div>
                    );
                  }

                  return (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#002137] border border-blue-200 text-[#004b79] dark:text-[#dfb74a] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            Attached Solution Document
                          </p>
                          <p className="text-[10px] text-slate-400">Click button to download and inspect student solution</p>
                        </div>
                      </div>
                      <a
                        href={selectedSub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download="student_solution"
                        className="px-3.5 py-2 rounded-xl bg-[#004b79] hover:bg-[#003b60] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Solution</span>
                      </a>
                    </div>
                  );
                })()
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                  No image or PDF attachment uploaded. See written solution notes below.
                </div>
              )}

              {selectedSub.submissionText && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Student Explanation &amp; Working Steps:
                  </span>
                  <p className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                    {selectedSub.submissionText}
                  </p>
                </div>
              )}
            </div>

            {/* FACULTY EVALUATION & MARKS */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Marks Awarded (out of {selectedSub.assignmentId?.maxMarks || 20}) <span className="text-rose-500">*</span>
                  </label>
                  {(() => {
                    const maxM = selectedSub.assignmentId?.maxMarks || 20;
                    const pct = Math.min(100, Math.max(0, Math.round((Number(marks) / maxM) * 100)));
                    const gradeTier =
                      pct >= 90
                        ? "A+ (Outstanding)"
                        : pct >= 80
                        ? "A (Excellent)"
                        : pct >= 70
                        ? "B (Very Good)"
                        : pct >= 60
                        ? "C (Pass)"
                        : "Needs Revision";

                    return (
                      <span className="text-xs font-bold text-[#004b79] dark:text-[#dfb74a] font-mono">
                        {pct}% • {gradeTier}
                      </span>
                    );
                  })()}
                </div>

                <input
                  type="number"
                  required
                  min={0}
                  max={selectedSub.assignmentId?.maxMarks || 100}
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
                />

                {/* Grace Marks Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400">Grace &amp; Quick Marks:</span>
                  <button
                    type="button"
                    onClick={() => setMarks(selectedSub.assignmentId?.maxMarks || 20)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors"
                  >
                    Full Marks ({selectedSub.assignmentId?.maxMarks || 20})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMarks((prev: any) =>
                        Math.min(selectedSub.assignmentId?.maxMarks || 20, Number(prev || 0) + 1)
                      )
                    }
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    +1 Grace Mark
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMarks((prev: any) =>
                        Math.min(selectedSub.assignmentId?.maxMarks || 20, Number(prev || 0) + 2)
                      )
                    }
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    +2 Grace Marks
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMarks((prev: any) =>
                        Math.min(selectedSub.assignmentId?.maxMarks || 20, Number(prev || 0) + 5)
                      )
                    }
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer transition-colors"
                  >
                    +5 Grace Marks
                  </button>
                </div>
              </div>

              {/* Teacher Feedback & Quick Presets */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                  Teacher Evaluation Feedback
                </label>
                <textarea
                  rows={2}
                  placeholder="Good derivation steps, review question 3..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
                />

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[
                    "Excellent working steps and accurate derivations!",
                    "Good attempt! Please review step 3.",
                    "Well solved with neat presentation. Keep it up!",
                    "Full marks awarded with grace bonus.",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFeedback(preset)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGrading}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer disabled:opacity-60 shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isGrading
                    ? "Submitting..."
                    : selectedSub.status === "EVALUATED"
                    ? "Update & Submit Evaluation"
                    : "✓ Submit Evaluation & Record Marks"}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── 5. CREATE ASSIGNMENT MODAL ── */}
      {isCreateModal && (
        <Modal
          isOpen={isCreateModal}
          maxWidth="2xl"
          onClose={() => setIsCreateModal(false)}
          title="Create New Homework Assignment"
          description="Publish exercises and tasks for your enrolled batch students to complete."
        >
          <form onSubmit={handleCreate} className="space-y-4 pt-1 text-xs">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Exercise 4.2 Quadratic Equations & Word Problems"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Grade Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.classLevel}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs cursor-pointer"
                >
                  {CLASS_LIST.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs cursor-pointer"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Batch <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData((p) => ({ ...p, batchId: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs cursor-pointer"
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Max Marks</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={formData.maxMarks}
                  onChange={(e) => setFormData((p) => ({ ...p, maxMarks: Number(e.target.value) }))}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Instructions &amp; Problem Numbers
              </label>
              <textarea
                rows={3}
                placeholder="Specify question numbers from NCERT textbook, problem statements, or assignment guidelines..."
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm"
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
