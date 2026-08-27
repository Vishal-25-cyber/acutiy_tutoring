"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  CameraOff,
  Image as ImageIcon,
  FileText,
  User,
  GraduationCap,
  Calendar,
  X,
  Check,
  Send,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentAssignmentsPage() {
  const { data, refetch, isLoading } = useFastFetch("/api/student/assignments");
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const studentClass = data?.studentClass || "Class 10";
  const studentBoard = data?.board || "CBSE";
  const assignments = Array.isArray(data?.assignments) ? data.assignments : [];

  // Stop camera on modal close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera access was denied or unavailable. You can also select a photo from your files.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const openSubmissionModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setSubmissionText(assignment.submission?.submissionText || "");
    setCapturedImage(assignment.submission?.fileUrl || null);
    setErrorMessage("");
    setIsCameraActive(false);
  };

  const closeSubmissionModal = () => {
    stopCamera();
    setSelectedAssignment(null);
    setCapturedImage(null);
    setSubmissionText("");
    setErrorMessage("");
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!capturedImage && !submissionText.trim()) {
      setErrorMessage("Please capture/upload an image of your solution or enter notes.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/student/submit-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment._id,
          submissionText,
          fileUrl: capturedImage || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit assignment.");
      }

      setSuccessMessage(`Solution for "${selectedAssignment.title}" submitted successfully!`);
      closeSubmissionModal();
      refetch();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to submit assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubjectColor = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case "mathematics":
        return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800";
      case "science":
      case "physics":
      case "chemistry":
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
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* 1. CLEAN OPEN-SPACE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Assignments & Homework Tasks
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{studentClass} ({studentBoard})</span>
            </span>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submit homework solutions by capturing handwritten pages, worksheets, and review faculty evaluations.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 self-start md:self-auto">
          {assignments.length} Tasks Assigned
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3 font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. CARDLESS MASTER ASSIGNMENTS TABLE (Clean 12-Column Grid Rows) */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
              Assigned Tasks & Submission Status
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Real Database Records</span>
        </div>

        {/* Column Headers for Desktop */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
          <div className="col-span-2">Subject & Due Date</div>
          <div className="col-span-5">Task Details & Description</div>
          <div className="col-span-2">Faculty Instructor</div>
          <div className="col-span-3 text-right">Status & Action</div>
        </div>

        {/* Assignments List */}
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
          {assignments.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                No assignments currently posted for {studentClass}.
              </p>
              <p className="text-xs text-slate-400">
                When your instructor assigns homework, worksheets, or practice sets, they will appear here.
              </p>
            </div>
          ) : (
            assignments.map((item: any) => {
              const isSubmitted = Boolean(item.submission);
              const isEvaluated = item.submission?.status === "EVALUATED";
              const formattedDueDate = item.dueDate
                ? new Date(item.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                : "No due date";

              const facultyName =
                typeof item.teacher === "object" && item.teacher?.name
                  ? item.teacher.name
                  : "Faculty Instructor";

              return (
                <div
                  key={item._id}
                  className="py-4 sm:py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors rounded-2xl"
                >
                  {/* Column 1: Subject & Due Date (col-span-2) */}
                  <div className="col-span-2 space-y-1">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getSubjectColor(item.subject)}`}>
                      {item.subject}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Due: {formattedDueDate}</span>
                    </div>
                  </div>

                  {/* Column 2: Task Title & Description (col-span-5) */}
                  <div className="col-span-5 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-400">
                        ({item.maxMarks} Marks)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Teacher Feedback if Evaluated */}
                    {isEvaluated && item.submission?.feedback && (
                      <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            Teacher Feedback:
                          </span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            Score: {item.submission.marksObtained} / {item.maxMarks}
                          </span>
                        </div>
                        <p className="text-emerald-800 dark:text-emerald-300 italic">
                          "{item.submission.feedback}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Faculty (col-span-2) */}
                  <div className="col-span-2 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                        {facultyName}
                      </p>
                      <p className="text-[10px] text-slate-400">Faculty Specialist</p>
                    </div>
                  </div>

                  {/* Column 4: Status & Action (col-span-3 text-right) */}
                  <div className="col-span-3 flex items-center justify-start md:justify-end gap-3 pt-2 md:pt-0">
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${isEvaluated
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : isSubmitted
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                    >
                      {isEvaluated ? "EVALUATED" : isSubmitted ? "SUBMITTED" : "PENDING"}
                    </span>

                    <Button
                      size="sm"
                      variant={isSubmitted ? "outline" : "glow"}
                      onClick={() => openSubmissionModal(item)}
                      className={`font-bold text-xs gap-1.5 rounded-xl h-9 px-4 ${!isSubmitted ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs" : ""
                        }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isSubmitted ? "Resubmit / Update" : "Submit Solution"}</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. INTERACTIVE CAMERA CAPTURE & SUBMISSION MODAL */}
      {selectedAssignment && (
        <Modal
          isOpen={!!selectedAssignment}
          maxWidth="2xl"
          onClose={closeSubmissionModal}
          title={`Turn in Solution: ${selectedAssignment.title}`}
          description={`Subject: ${selectedAssignment.subject} • Max Marks: ${selectedAssignment.maxMarks}`}
        >
          <form onSubmit={handleSubmitWork} className="space-y-4 pt-2 text-xs">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Assignment Prompt Recap */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment Prompt</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                {selectedAssignment.description}
              </p>
            </div>

            {/* CAMERA / IMAGE CAPTURE SECTION */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                Capture Solution Page or Upload Image
              </label>

              {/* Live Camera Viewfinder */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-indigo-500 shadow-md">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="glow"
                      onClick={capturePhoto}
                      className="font-extrabold text-xs px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Snap Photo</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={stopCamera}
                      className="font-bold text-xs bg-black/60 text-white border-white/20 hover:bg-black/80 rounded-xl"
                    >
                      <CameraOff className="w-4 h-4" />
                      <span>Cancel</span>
                    </Button>
                  </div>
                </div>
              ) : capturedImage ? (
                /* Captured Image Preview */
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 max-h-60 flex items-center justify-center group">
                  <img
                    src={capturedImage}
                    alt="Captured Solution"
                    className="max-h-60 w-auto object-contain rounded-xl"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setCapturedImage(null)}
                      className="text-xs h-7 px-2.5 rounded-lg bg-black/70 hover:bg-black text-white"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      <span>Retake</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Action buttons: Open Camera vs Upload from Files */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-4 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs">Capture Photo via Camera</span>
                    <span className="text-[10px] text-slate-400">Snap handwritten solution page</span>
                  </button>

                  <label className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-2 text-slate-600 dark:text-slate-400 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="font-bold text-xs">Upload Photo / PDF</span>
                    <span className="text-[10px] text-slate-400">Select file from device storage</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {cameraError && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-1 font-medium">
                  {cameraError}
                </p>
              )}
            </div>

            {/* SOLUTION NOTES TEXTAREA */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                Solution Notes & Remarks (Optional)
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Type any working explanation, step references, or questions for your faculty..."
                rows={3}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeSubmissionModal}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="glow"
                size="sm"
                disabled={isSubmitting}
                className="font-bold text-xs gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5"
              >
                {isSubmitting ? (
                  <span className="animate-spin text-xs">⏳ Submitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Assignment</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
