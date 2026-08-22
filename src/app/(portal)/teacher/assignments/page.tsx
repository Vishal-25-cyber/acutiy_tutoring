"use client";

import React, { useState, useEffect } from "react";
import { FileCheck, Plus, CheckCircle2, Award, Clock, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { getSubjectsForClassAndBoard, CLASS_LIST } from "@/lib/curriculum";
import { useFastFetch } from "@/lib/api-cache";

export default function TeacherAssignmentsPage() {
  const { data, refetch } = useFastFetch("/api/teacher/assignments");
  const [isCreateModal, setIsCreateModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  // Grade Form
  const [marks, setMarks] = useState(18);
  const [feedback, setFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  // Create Assignment Form
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
      } catch (err) {
        console.error(err);
      }
    }
    loadBatches();
  }, []);

  const assignments = data?.assignments || [
    {
      _id: "assign-math-1",
      title: "Class 10 Mathematics — Quadratic Equations Practice Worksheet 4",
      subject: "Mathematics",
      classLevel: "Class 10",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      maxMarks: 20,
      description: "Solve all 10 word problems from Exercise 4.3 with clear working steps.",
    },
  ];

  const submissions = data?.submissions || [
    {
      _id: "sub-1",
      assignmentId: { title: "Class 10 Mathematics — Quadratic Equations Worksheet 4", maxMarks: 20 },
      studentId: { name: "Aravind Swaminathan", email: "aravind@example.com" },
      submissionText: "Solved all 10 quadratic word problems. Verified roots using discriminant formula.",
      marksObtained: null,
      feedback: null,
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    },
  ];

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsCreateModal(false);
        setFormData({
          title: "",
          description: "",
          subject: "Mathematics",
          classLevel: "Class 10",
          batchId: batches[0]?._id || "",
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          maxMarks: 20,
        });
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsGrading(true);
    try {
      const res = await fetch("/api/teacher/assignments/grade", {
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
        setFeedback("");
        refetch();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Homework & Grading Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish syllabus assignments, inspect student solutions, and award feedback marks.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="font-bold text-xs gap-1.5 rounded-xl"
          onClick={() => setIsCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Create Assignment</span>
        </Button>
      </div>

      {/* Submissions Pending Grading */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Student Submissions Queue
          </h3>
          <Badge variant="warning">{submissions.filter((s: any) => s.status === "SUBMITTED").length} Pending</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Student</th>
                <th className="p-4 font-bold">Assignment</th>
                <th className="p-4 font-bold">Submitted Date</th>
                <th className="p-4 font-bold">Status / Score</th>
                <th className="p-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((sub: any) => (
                <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                    {sub.studentId?.name || "Student"}
                    <span className="block text-[11px] font-normal text-slate-400">
                      {sub.studentId?.email}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                    {sub.assignmentId?.title}
                  </td>
                  <td className="p-4 text-slate-500">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    {sub.status === "EVALUATED" ? (
                      <Badge variant="success">
                        {sub.marksObtained} / {sub.assignmentId?.maxMarks || 20} Marks
                      </Badge>
                    ) : (
                      <Badge variant="warning">SUBMITTED (Needs Grading)</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant={sub.status === "EVALUATED" ? "outline" : "primary"}
                      className="text-xs font-bold"
                      onClick={() => {
                        setSelectedSub(sub);
                        setMarks(sub.marksObtained || 18);
                        setFeedback(sub.feedback || "Good work! Keep practicing.");
                      }}
                    >
                      {sub.status === "EVALUATED" ? "Edit Grade" : "Evaluate & Score"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Active Published Assignments List */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
          Active Published Assignments
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((item: any) => (
            <Card key={item._id} className="p-5 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="default" className="text-[10px]">
                  {item.classLevel} • {item.subject}
                </Badge>
                <span className="text-xs text-slate-400">
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
              <div className="pt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Max Marks: {item.maxMarks}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModal && (
        <Modal
          isOpen={isCreateModal}
          onClose={() => setIsCreateModal(false)}
          title="Create New Homework Assignment"
          description="Publish homework questions for your assigned batch."
        >
          <form onSubmit={handleCreateAssignment} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold mb-1">Assignment Title *</label>
              <Input
                required
                placeholder="e.g. Class 10 Mathematics — Quadratic Equations Worksheet 4"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Target Class *</label>
                <select
                  value={formData.classLevel}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  {CLASS_LIST.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Subject ({formData.classLevel}) *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Due Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Max Marks *</label>
                <Input
                  type="number"
                  required
                  value={formData.maxMarks}
                  onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Instructions & Problem Statement *</label>
              <Textarea
                required
                rows={3}
                placeholder="List problems or exercise numbers for students to solve..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="font-bold">
                Publish Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Grade Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Grade: ${selectedSub.studentId?.name || "Student"}`}
          description={`Assignment: ${selectedSub.assignmentId?.title} (Max: ${selectedSub.assignmentId?.maxMarks || 20})`}
        >
          <form onSubmit={handleGradeSubmission} className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">Student Answer / Working:</span>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {selectedSub.submissionText || "No text notes attached."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Awarded Marks (Out of {selectedSub.assignmentId?.maxMarks || 20}) *</label>
              <Input
                type="number"
                required
                max={selectedSub.assignmentId?.maxMarks || 20}
                min={0}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Constructive Teacher Feedback *</label>
              <Textarea
                required
                rows={3}
                placeholder="e.g. Excellent step-by-step discriminant proof! Review question 4 calculation."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedSub(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isGrading} className="font-bold">
                Submit Grade & Notify Student
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
