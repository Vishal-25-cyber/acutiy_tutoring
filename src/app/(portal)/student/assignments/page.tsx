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
  Timer,
  Play,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Paperclip,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";

export default function StudentAssignmentsPage() {
  // Category Tab: "ASSIGNMENT" | "TEST" | "HOMEWORK"
  const [activeCategory, setActiveCategory] = useState<"ASSIGNMENT" | "TEST" | "HOMEWORK">("ASSIGNMENT");

  const { data, refetch, isLoading } = useFastFetch("/api/student/assignments");

  // Standard Submission Modal State
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ── LIVE PROCTORED TEST ROOM STATE ──
  const [activeProctoredTest, setActiveProctoredTest] = useState<any>(null);
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(45 * 60);
  const [isTestLocked, setIsTestLocked] = useState(false);
  const [capturedProctoringSnapshot, setCapturedProctoringSnapshot] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    name: string;
    size?: string;
    isImage: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const studentClass = data?.studentClass || "Class 10";
  const studentBoard = data?.board || "CBSE";

  const allAssignments = Array.isArray(data?.assignments) ? data.assignments : [];

  // Filter tasks for active category
  const filteredTasks = allAssignments.filter(
    (a: any) => (a.type || "ASSIGNMENT") === activeCategory
  );

  const formatDueDateTime = (dStr: string | Date) => {
    if (!dStr) return "No deadline";
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return "No deadline";
    const datePart = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const hours = d.getHours();
    const mins = d.getMinutes();
    if (hours === 0 && mins === 0) {
      return `Due: ${datePart}`;
    }
    const timePart = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
    return `Due: ${datePart} at ${timePart}`;
  };

  // ── WEBCAM PROCTORING STREAM LIFECYCLE ──
  const startCamera = async () => {
    setCameraError("");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraStarted(true);
      } else {
        setCameraError("Webcam is not supported on this browser device.");
      }
    } catch (err: any) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraError("Camera permission required for proctored tests. Please enable camera access.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {
          console.warn("Track stop error:", e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraStarted(false);
  };

  const captureSnapshot = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setCapturedProctoringSnapshot(dataUrl);
        return dataUrl;
      }
    }
    return null;
  };

  // Launch Proctored Test Room
  const handleStartTest = async (test: any) => {
    setActiveProctoredTest(test);
    setIsTestLocked(false);
    setCapturedProctoringSnapshot(null);
    setSelectedFile(null);
    setSubmissionText("");
    const duration = (test.durationMinutes || 45) * 60;
    setTimeLeftSeconds(duration);
    await startCamera();
  };

  // Close Proctored Test Room
  const handleCloseTestRoom = () => {
    stopCamera();
    setActiveProctoredTest(null);
    setIsTestLocked(false);
  };

  // Live Countdown Timer for Proctored Test
  useEffect(() => {
    let interval: any = null;
    if (activeProctoredTest && !isTestLocked && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTestLocked(true);
            captureSnapshot();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeProctoredTest, isTestLocked, timeLeftSeconds]);

  // Cleanup camera stream when component unmounts or window closes
  useEffect(() => {
    const handleLeave = () => {
      stopCamera();
    };
    window.addEventListener("beforeunload", handleLeave);
    window.addEventListener("pagehide", handleLeave);

    return () => {
      window.removeEventListener("beforeunload", handleLeave);
      window.removeEventListener("pagehide", handleLeave);
      stopCamera();
    };
  }, []);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Standard File Select Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        url: reader.result as string,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        isImage,
      });
    };
    reader.readAsDataURL(file);
  };

  // Submit Answer for Task or Test
  const handleSubmitWork = async (e: React.FormEvent, isProctoredTest = false) => {
    e.preventDefault();
    const currentTask = isProctoredTest ? activeProctoredTest : selectedTask;
    if (!currentTask) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Take snapshot if proctored test and camera is active
    let snapshotUrl = capturedProctoringSnapshot;
    if (isProctoredTest && !snapshotUrl) {
      snapshotUrl = captureSnapshot();
    }

    try {
      const res = await fetch("/api/student/submit-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: currentTask._id,
          submissionText: submissionText.trim(),
          fileUrl: selectedFile?.url || "",
          proctoringSnapshotUrl: snapshotUrl || "",
          type: activeCategory,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setSuccessMessage(
          isProctoredTest
            ? "Proctored test answers & webcam snapshot submitted successfully!"
            : "Work submitted successfully!"
        );
        invalidateCache("/api/student/assignments");
        invalidateCache("/api/student/performance");
        invalidateCache("/api/teacher/assignments");
        refetch();

        setTimeout(() => {
          if (isProctoredTest) {
            handleCloseTestRoom();
          } else {
            setSelectedTask(null);
          }
          setSuccessMessage("");
        }, 1500);
      } else {
        setErrorMessage(result.error || "Failed to submit work.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none pb-24">
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Tasks, Tests &amp; Homework Portal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Submit coursework worksheets, take live camera-proctored chapter tests, and upload daily homework.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── 2. CATEGORY SWITCHER (ASSIGNMENTS vs PROCTORED TESTS vs HOMEWORK) ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveCategory("ASSIGNMENT")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeCategory === "ASSIGNMENT"
              ? "bg-[#004b79] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <FileCheck className="w-4 h-4 text-blue-300" />
          <span>Assignments</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {allAssignments.filter((a: any) => (a.type || "ASSIGNMENT") === "ASSIGNMENT").length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("TEST")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeCategory === "TEST"
              ? "bg-[#004b79] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Timer className="w-4 h-4 text-[#dfb74a]" />
          <span>Proctored Tests &amp; Exams</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {allAssignments.filter((a: any) => a.type === "TEST").length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("HOMEWORK")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeCategory === "HOMEWORK"
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

      {/* ── 3. TASK LIST FOR SELECTED CATEGORY ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {activeCategory === "TEST"
                ? "Timed Proctored Tests & Assessments"
                : activeCategory === "HOMEWORK"
                ? "Daily Homework Worksheets"
                : "Coursework Assignments"}
            </h2>
            <p className="text-xs text-slate-500">
              {activeCategory === "TEST"
                ? "Requires camera proctoring. Answer upload unlocks after test time concludes."
                : "Review instructions, attach solutions, and submit before due date."}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {filteredTasks.length} {filteredTasks.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No {activeCategory.toLowerCase()} tasks assigned
            </p>
            <p className="text-xs text-slate-400">
              You are all caught up! Check back when your teacher publishes new {activeCategory.toLowerCase()} items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task: any) => {
              const sub = task.submission;
              const isEvaluated = sub?.status === "EVALUATED";
              const isSubmitted = sub && !isEvaluated;
              const isTest = task.type === "TEST";

              return (
                <div
                  key={task._id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#001726] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-[#004b79] dark:text-[#dfb74a]">
                        {task.subject}
                      </span>
                      {isTest ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-amber-600" />
                          {task.durationMinutes || 45} Mins
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          {formatDueDateTime(task.dueDate)}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>

                    {task.attachmentUrl && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-blue-900/60">
                        <Paperclip className="w-3 h-3" />
                        <span>Question Paper Attached</span>
                      </div>
                    )}
                  </div>

                  {/* Submission Status & Action Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Max Marks: {task.maxMarks}</span>
                      {isEvaluated ? (
                        <span className="text-emerald-600 font-bold">
                          Score: {sub.marksObtained} / {task.maxMarks}
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-blue-600 font-bold">Submitted</span>
                      ) : (
                        <span className="text-amber-600 font-bold">Pending</span>
                      )}
                    </div>

                    {isEvaluated ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Graded by Faculty</span>
                        </div>
                        {sub.feedback && <p className="text-[11px] opacity-90">{sub.feedback}</p>}
                      </div>
                    ) : isSubmitted ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                        <span>Awaiting Faculty Review</span>
                        <Check className="w-4 h-4 text-blue-500" />
                      </div>
                    ) : isTest ? (
                      <button
                        type="button"
                        onClick={() => handleStartTest(task)}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 text-emerald-300 fill-emerald-300" />
                        <span>Start Proctored Test</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(task);
                          setSelectedFile(null);
                          setSubmissionText("");
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Submit {activeCategory === "HOMEWORK" ? "Homework" : "Assignment"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. LIVE PROCTORED TEST ROOM MODAL ── */}
      {activeProctoredTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden">
          <div className="w-full max-w-4xl bg-white dark:bg-[#001726] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Proctored Room Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-[#002137] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black tracking-tight">
                      {activeProctoredTest.title}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> Proctored Session
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Subject: {activeProctoredTest.subject} • Max Marks: {activeProctoredTest.maxMarks}
                  </p>
                </div>
              </div>

              {/* Countdown Timer Display */}
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-mono font-black text-sm sm:text-base text-amber-300">
                    {formatTime(timeLeftSeconds)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseTestRoom}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Proctored Room Body Grid */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden flex-1">
              {/* Left Column: Test Instructions & Question Paper */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Test Questions &amp; Paper
                    </span>
                    {activeProctoredTest.attachmentUrl && (
                      <a
                        href={activeProctoredTest.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004b79] hover:bg-[#003b60] text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Question Paper PDF</span>
                      </a>
                    )}
                  </div>

                  {activeProctoredTest.description && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                      {activeProctoredTest.description}
                    </div>
                  )}

                  {activeProctoredTest.attachmentUrl && (
                    <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white shrink-0 uppercase tracking-wider">
                          PDF
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {activeProctoredTest.attachmentName || "Official Question Paper.pdf"}
                        </span>
                        {activeProctoredTest.attachmentSize && (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            ({activeProctoredTest.attachmentSize})
                          </span>
                        )}
                      </div>
                      <a
                        href={activeProctoredTest.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#004b79] dark:text-[#dfb74a] hover:underline shrink-0"
                      >
                        View Questions
                      </a>
                    </div>
                  )}
                </div>

                {/* Answer Upload Section (Active or unlocked when timer completes) */}
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#004b79] dark:text-[#dfb74a] flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>Upload Handwritten Answer Sheet Photos / PDF</span>
                    </span>
                    {isTestLocked && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Time Ended — Upload Answers
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold truncate text-slate-800 dark:text-slate-200">
                          {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({selectedFile.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs text-[#004b79] dark:text-[#dfb74a] font-bold hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition-all"
                    >
                      <Camera className="w-5 h-5 text-blue-500" />
                      <span>Take Photo / Upload Answer Sheet</span>
                      <span className="text-[10px] text-slate-400 font-normal">PNG, JPG or PDF up to 25MB</span>
                    </button>
                  )}

                  <textarea
                    rows={2}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Optional answer notes or key final values..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />

                  {successMessage && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-xs text-rose-800 dark:text-rose-200 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isSubmitting || (!selectedFile && !submissionText.trim())}
                    onClick={(e) => handleSubmitWork(e, true)}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-emerald-300" />
                    )}
                    <span>Submit Proctored Test Answers</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Camera Video Stream & Proctoring Monitor */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Live Camera Feed</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Proctoring AI Active</span>
                  </div>

                  {/* Video Stream Element */}
                  <div className="relative w-full aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {!isCameraStarted && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs text-slate-400 bg-slate-950">
                        <Camera className="w-8 h-8 text-amber-400" />
                        <span>Camera stream activating…</span>
                        {cameraError && <p className="text-[11px] text-rose-400 font-bold">{cameraError}</p>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Focus Guard Active</span>
                    </div>
                    <p>
                      Keep your face within camera view while writing solutions on paper. Snapshot verified upon answer submission.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 font-medium">
                  <strong>Note:</strong> When the countdown timer completes, the test paper locks and you have 10 minutes to take and upload photos of your answer sheets.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. STANDARD ASSIGNMENT / HOMEWORK SUBMISSION MODAL ── */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Submit ${activeCategory === "HOMEWORK" ? "Homework" : "Assignment"}`}
        >
          <form onSubmit={(e) => handleSubmitWork(e, false)} className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#004b79] dark:text-[#dfb74a]">
                  {selectedTask.subject} • {selectedTask.title}
                </span>
                <span className="text-slate-500 font-semibold">Max: {selectedTask.maxMarks} Marks</span>
              </div>
              {selectedTask.description && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                  {selectedTask.description}
                </div>
              )}
              {selectedTask.attachmentUrl && (
                <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white shrink-0 uppercase">
                      PDF
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {selectedTask.attachmentName || "Question Paper Attachment"}
                    </span>
                    {selectedTask.attachmentSize && (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        ({selectedTask.attachmentSize})
                      </span>
                    )}
                  </div>
                  <a
                    href={selectedTask.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#004b79] dark:text-[#dfb74a] hover:underline shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Questions</span>
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Attach Answer Sheet / Worksheet Photo
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />

              {selectedFile ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold truncate text-slate-800 dark:text-slate-200">
                      {selectedFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all"
                >
                  <Upload className="w-5 h-5 text-[#004b79]" />
                  <span className="font-bold">Click to Upload Document / Photo</span>
                  <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 25MB</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Solution Notes / Typed Answers
              </label>
              <textarea
                rows={3}
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Type your final answers or working steps here..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            {successMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-xs text-rose-800 dark:text-rose-200 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!selectedFile && !submissionText.trim())}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#004b79] text-white hover:bg-[#003b60] disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Solution"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
