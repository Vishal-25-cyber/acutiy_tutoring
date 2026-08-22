"use client";

import React, { useState } from "react";
import { FileCheck, Clock, CheckCircle2, AlertCircle, Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentAssignmentsPage() {
  const { data, refetch } = useFastFetch("/api/student/assignments");
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const assignments = data?.assignments || [
    {
      _id: "assign-math-1",
      title: "Class 10 Mathematics — Quadratic Equations Practice Worksheet 4",
      subject: "Mathematics",
      description: "Solve all 10 word problems from Exercise 4.3 with clear working steps and discriminant verification.",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      maxMarks: 20,
      submission: {
        status: "SUBMITTED",
        submittedAt: new Date().toISOString(),
        marksObtained: 18,
        feedback: "Excellent working steps! Remember to double-check unit conversions.",
      },
    },
    {
      _id: "assign-sci-1",
      title: "Class 10 Science — Convex & Concave Lens Ray Diagrams",
      subject: "Science",
      description: "Draw neat ray diagrams for 6 object positions in front of a concave mirror with focal lengths marked.",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      maxMarks: 15,
      submission: null,
    },
  ];

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/student/submit-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment._id,
          submissionText,
          fileUrl: "https://acuity.edu/submissions/student-work-sample.pdf",
        }),
      });

      if (res.ok) {
        setSuccessMessage("Work submitted successfully! Your teacher has been notified for evaluation.");
        setSelectedAssignment(null);
        setSubmissionText("");
        refetch();
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-5xl animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Homework & Assignments
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Turn in your worksheets and receive teacher feedback with marks rubrics.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {assignments.map((item: any) => {
          const isSubmitted = Boolean(item.submission);
          const isEvaluated = item.submission?.status === "EVALUATED";

          return (
            <Card key={item._id} className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {item.subject}
                    </span>
                    <Badge variant={isEvaluated ? "success" : isSubmitted ? "warning" : "destructive"}>
                      {isEvaluated ? "EVALUATED" : isSubmitted ? "SUBMITTED" : "PENDING"}
                    </Badge>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{item.title}</h2>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>Due: {new Date(item.dueDate).toLocaleDateString()}</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Max Marks: {item.maxMarks}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.description}
              </p>

              {item.submission?.feedback && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      Teacher Feedback & Score:
                    </span>
                    <Badge variant="success">
                      {item.submission.marksObtained} / {item.maxMarks} Marks
                    </Badge>
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-300 italic">
                    "{item.submission.feedback}"
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                {!isSubmitted ? (
                  <Button
                    size="sm"
                    variant="primary"
                    className="font-bold text-xs gap-1.5"
                    onClick={() => setSelectedAssignment(item)}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Submit Solution</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-semibold"
                    onClick={() => setSelectedAssignment(item)}
                  >
                    <span>Resubmit / Update</span>
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Submit Assignment Modal */}
      {selectedAssignment && (
        <Modal
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          title={`Submit: ${selectedAssignment.title}`}
          description={`Max Marks: ${selectedAssignment.maxMarks} • Due Date: ${new Date(
            selectedAssignment.dueDate
          ).toLocaleDateString()}`}
        >
          <form onSubmit={handleSubmitWork} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold mb-1">
                Your Answer / Notes / Working Steps *
              </label>
              <Textarea
                required
                rows={4}
                placeholder="Type your final values, formulas used, or proof steps..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
              <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Upload Hand-Written Worksheet (PDF/Image)</p>
              <p className="text-[10px] text-slate-400">PDF, PNG up to 10MB</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedAssignment(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-bold">
                Turn In Work
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
