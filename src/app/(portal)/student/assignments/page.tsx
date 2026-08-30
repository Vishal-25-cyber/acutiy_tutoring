"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  FileText,
  User,
  GraduationCap,
  Calendar,
  X,
  Check,
  Send,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    name: string;
    size?: string;
    isImage: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const studentClass = data?.studentClass || "Class 10";
  const studentBoard = data?.board || "CBSE";

  const defaultAssignments = [
    {
      _id: "asg-math-1",
      title: "Quadratic Equations — Practice Worksheet 4",
      subject: "Mathematics",
      description: "Solve all 10 word problems regarding speed/distance and work-done. Show full working steps.",
      maxMarks: 20,
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      teacher: { name: "Dr. Sarah Jenkins" },
      submission: {
        status: "SUBMITTED",
        submissionText: "Completed word problems 1 to 10 with verified discriminant steps.",
        submittedAt: new Date().toISOString(),
      },
    },
    {
      _id: "asg-sci-1",
      title: "Ray Optics — Concave & Convex Mirror Ray Tracing Worksheet",
      subject: "Science",
      description: "Draw accurate ray diagrams for object positions at C, F, and between P and F with sign conventions.",
      maxMarks: 20,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      teacher: { name: "Prof. Rajesh Kumar" },
      submission: {
        status: "EVALUATED",
        marksObtained: 19,
        feedback: "Excellent precision in focal point ray tracing. Remember to write final magnification with sign.",
      },
    },
    {
      _id: "asg-eng-1",
      title: "Analytical Paragraph — Data Interpretation on Renewable Energy",
      subject: "English",
      description: "Draft a 120-word analytical paragraph based on the comparative pie chart data provided in class.",
      maxMarks: 10,
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      teacher: { name: "Ms. Anita Desai" },
      submission: null,
    },
    {
      _id: "asg-sst-1",
      title: "Nationalism in India — Non-Cooperation Movement Timeline Analysis",
      subject: "Social Science",
      description: "Map key historical events from 1919 to 1922 and explain economic impact of foreign cloth boycott.",
      maxMarks: 15,
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      teacher: { name: "Prof. Rajesh Kumar" },
      submission: null,
    },
  ];

  const rawAssignments = Array.isArray(data?.assignments) && data.assignments.length > 0
    ? data.assignments
    : defaultAssignments;

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const isPastDeadline = (dueDate?: string) => {
    if (!dueDate) return false;
    const d = new Date(dueDate);
    d.setHours(23, 59, 59, 999);
    return Date.now() > d.getTime();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.72));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

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
      setCameraError("Camera access unavailable. Please browse and attach your solution file.");
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
    const maxDim = 1200;
    let w = video.videoWidth || 1280;
    let h = video.videoHeight || 720;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      const approxSize = Math.round((dataUrl.length * 0.75) / 1024);
      setSelectedFile({
        url: dataUrl,
        name: `Solution_Photo_${new Date().toLocaleTimeString("en-US", { hour12: false }).replace(/:/g, "-")}.jpg`,
        size: `${approxSize} KB`,
        isImage: true,
      });
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    const isImg = file.type.startsWith("image/");

    if (isImg) {
      const compressedDataUrl = await compressImage(file);
      const approxSize = Math.round((compressedDataUrl.length * 0.75) / 1024);
      setSelectedFile({
        url: compressedDataUrl,
        name: file.name,
        size: `${approxSize} KB`,
        isImage: true,
      });
      setCapturedImage(compressedDataUrl);
    } else {
      const fileSizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const fileDataUrl = event.target.result as string;
          setSelectedFile({
            url: fileDataUrl,
            name: file.name,
            size: fileSizeStr,
            isImage: false,
          });
          setCapturedImage(fileDataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
    stopCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const openSubmissionModal = (assignment: any) => {
    if (assignment.submission?.status === "EVALUATED" || assignment.submission?.marksObtained !== undefined) {
      return;
    }
    setSelectedAssignment(assignment);
    // Pre-populate if editing pending submission
    setSubmissionText(assignment.submission?.submissionText || "");
    if (assignment.submission?.fileUrl) {
      setSelectedFile({
        url: assignment.submission.fileUrl,
        name: "Attached_Solution.pdf",
        size: "Attached",
        isImage: assignment.submission.fileUrl.startsWith("data:image"),
      });
      setCapturedImage(assignment.submission.fileUrl);
    } else {
      setSelectedFile(null);
      setCapturedImage(null);
    }
    setErrorMessage("");
    setIsCameraActive(false);
  };

  const closeSubmissionModal = () => {
    stopCamera();
    setSelectedAssignment(null);
    setSelectedFile(null);
    setCapturedImage(null);
    setSubmissionText("");
    setErrorMessage("");
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!capturedImage && !submissionText.trim()) {
      setErrorMessage("Please attach an image/file or write solution remarks.");
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

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to submit assignment.");
      }

      const isResubmit = Boolean(selectedAssignment.submission);
      setSuccessMessage(
        isResubmit
          ? `Revised solution for "${selectedAssignment.title}" resubmitted successfully!`
          : `Solution for "${selectedAssignment.title}" turned in successfully!`
      );
      closeSubmissionModal();
      refetch();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Solution submission failed. Please try again.");
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
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      
      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Assignments & Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Assigned homework worksheets, submission status, and faculty evaluations for <span className="font-semibold text-slate-700 dark:text-slate-300">{studentClass} ({studentBoard})</span>.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 shrink-0">
          {rawAssignments.length} Tasks Listed
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── 2. CARDLESS ASSIGNMENTS DIRECTORY TABLE ── */}
      <div className="space-y-2 pt-1">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-2">Subject & Due Date</div>
          <div className="col-span-5">Assignment Task & Problem Details</div>
          <div className="col-span-3">Faculty Instructor</div>
          <div className="col-span-2 text-right">Status & Action</div>
        </div>

        {/* Assignments List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-850">
          {rawAssignments.map((item: any) => {
            const isSubmitted = Boolean(item.submission);
            const isEvaluated = item.submission?.status === "EVALUATED";
            const isClosed = isPastDeadline(item.dueDate) && !isSubmitted;

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
                : "Faculty Specialist";

            return (
              <div
                key={item._id}
                className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
              >
                {/* Column 1: Subject & Due Date */}
                <div className="col-span-2 space-y-1">
                  <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${getSubjectColor(item.subject)}`}>
                    {item.subject}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${isClosed ? "text-rose-500" : "text-slate-400"}`} />
                    {isClosed ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">Closed</span>
                    ) : (
                      <span className="text-slate-500">Due: {formattedDueDate}</span>
                    )}
                  </div>
                </div>

                {/* Column 2: Title & Details */}
                <div className="col-span-5 space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug">
                      {item.title}
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.maxMarks} Marks
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Teacher Feedback if evaluated */}
                  {isEvaluated && item.submission?.feedback && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">Feedback:</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          Score: {item.submission.marksObtained} / {item.maxMarks}
                        </span>
                      </div>
                      <p className="text-emerald-800 dark:text-emerald-300 text-[11px] italic">
                        "{item.submission.feedback}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Column 3: Faculty Instructor */}
                <div className="col-span-3">
                  <p className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    {facultyName}
                  </p>
                  <p className="text-[10px] text-slate-400">Faculty Specialist</p>
                </div>

                {/* Column 4: Status & Actions */}
                <div className="col-span-2 flex flex-col md:items-end justify-center gap-1.5">
                  <span
                    className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isEvaluated
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                        : isSubmitted
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
                        : isClosed
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {isEvaluated ? "Evaluated" : isSubmitted ? "Submitted" : isClosed ? "Closed" : "Pending"}
                  </span>

                  {!isEvaluated && !isClosed && (
                    <button
                      onClick={() => openSubmissionModal(item)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isSubmitted
                          ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800"
                          : "bg-[#004b79] hover:bg-[#003b60] text-white shadow-2xs"
                      }`}
                    >
                      {isSubmitted ? <RefreshCw className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                      <span>{isSubmitted ? "Edit Solution" : "Turn In"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. RECTANGULAR SUBMISSION & RESUBMISSION MODAL ── */}
      {selectedAssignment && (
        <Modal
          isOpen={!!selectedAssignment}
          maxWidth="3xl"
          onClose={closeSubmissionModal}
          title=""
          description=""
        >
          <form onSubmit={handleSubmitWork} className="space-y-4 text-slate-900 dark:text-slate-100 select-none pr-7">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getSubjectColor(selectedAssignment.subject)}`}>
                  {selectedAssignment.subject}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedAssignment.submission ? "Resubmit / Update Solution" : "Turn in Solution"} • {selectedAssignment.maxMarks} Marks
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Due: {selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString() : "No deadline"}
              </span>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Assignment Prompt Overview */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                {selectedAssignment.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {selectedAssignment.description}
              </p>
            </div>

            {/* Camera / Upload Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                  {selectedAssignment.submission ? "Replace Solution File / Worksheet" : "Attach Handwritten Solution / File"}
                </label>
                {selectedAssignment.submission && (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    Resubmission Allowed
                  </span>
                )}
              </div>

              {isCameraActive ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-indigo-500">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Snap Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 rounded-xl bg-black/60 text-white font-semibold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : selectedFile || capturedImage ? (
                <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                        {selectedFile?.name || "Attached Solution"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{selectedFile?.size || "Ready"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      Change File
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-500">Attach revised worksheet photo, scanned PDF, or solution sheet:</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse New File</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Use Camera</span>
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Remarks Textarea */}
            <div className="space-y-1">
              <label className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                Student Notes / Working Explanations
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Add your working steps, revised corrections, or notes for the faculty..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={closeSubmissionModal}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : selectedAssignment.submission ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resubmit Solution</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Turn In Solution</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </main>
  );
}
