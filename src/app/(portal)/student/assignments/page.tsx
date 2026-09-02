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
  ShieldAlert,
  Eye,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Paperclip,
  Download,
  Maximize2,
  Minimize2,
  SplitSquareHorizontal,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
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

  // ── LIVE PROCTORED FULL-SCREEN EXAMINATION STATE ──
  const [activeProctoredTest, setActiveProctoredTest] = useState<any>(null);
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(45 * 60);
  const [isTestLocked, setIsTestLocked] = useState(false);
  const [capturedProctoringSnapshot, setCapturedProctoringSnapshot] = useState<string | null>(null);

  // Security & Attention Monitor State
  const [isExamFullscreen, setIsExamFullscreen] = useState<boolean>(false);
  const [splitViewMode, setSplitViewMode] = useState<"SPLIT" | "PDF_FULL" | "SUBMIT_FULL">("SPLIT");
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [warningCount, setWarningCount] = useState<number>(0);
  const [activeWarning, setActiveWarning] = useState<{
    type: "TAB_SWITCH" | "LOOK_AWAY" | "CAMERA_LOST";
    message: string;
    timestamp: number;
  } | null>(null);
  const [awaySeconds, setAwaySeconds] = useState<number>(0);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(true);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastSoundRef = useRef<number>(0);

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

  // ── SOUND ALARM SYNTHESIZER (WEB AUDIO API) ──
  const playWarningSound = (type: "ALARM" | "BEEP" = "ALARM") => {
    if (isSoundMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === "ALARM") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (err) {
      console.warn("Proctoring sound warning playback error:", err);
    }
  };

  // ── PROCTORING VIOLATION TRIGGER ──
  const triggerProctoringViolation = (
    type: "TAB_SWITCH" | "LOOK_AWAY" | "CAMERA_LOST",
    message: string
  ) => {
    setWarningCount((prev) => prev + 1);
    setActiveWarning({
      type,
      message,
      timestamp: Date.now(),
    });

    const now = Date.now();
    if (now - lastSoundRef.current > 2500) {
      lastSoundRef.current = now;
      playWarningSound("ALARM");
    }
  };

  // ── FULLSCREEN TOGGLE HELPER ──
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsExamFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsExamFullscreen(false);
    }
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
    setWarningCount(0);
    setActiveWarning(null);
    setAwaySeconds(0);
    setIsFaceDetected(true);
    setSplitViewMode("SPLIT");
    const duration = (test.durationMinutes || 45) * 60;
    setTimeLeftSeconds(duration);
    await startCamera();

    // Auto-request browser fullscreen for maximum exam integrity
    try {
      if (document.documentElement && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsExamFullscreen(true);
      }
    } catch (e) {
      console.warn("Fullscreen request:", e);
    }
  };

  // Close Proctored Test Room
  const handleCloseTestRoom = () => {
    stopCamera();
    setActiveProctoredTest(null);
    setIsTestLocked(false);
    setActiveWarning(null);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsExamFullscreen(false);
    }
  };

  // ── TAB SWITCH & WINDOW FOCUS LOST PROCTORING LISTENER ──
  useEffect(() => {
    if (!activeProctoredTest) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerProctoringViolation(
          "TAB_SWITCH",
          "⚠️ Tab Switch Violation: Navigating away from the test tab is strictly prohibited & recorded!"
        );
      }
    };

    const handleBlur = () => {
      triggerProctoringViolation(
        "TAB_SWITCH",
        "⚠️ Window Focus Lost: Please return and keep the examination window active on your screen!"
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [activeProctoredTest]);

  // ── WEBCAM ATTENTION & 5-SECOND LOOK-AWAY TRACKER ──
  useEffect(() => {
    if (!activeProctoredTest || !isCameraStarted) return;

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const canvas = canvasRef.current || document.createElement("canvas");
          canvas.width = 64;
          canvas.height = 48;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 64, 48);
            const imgData = ctx.getImageData(0, 0, 64, 48);
            const data = imgData.data;

            // Sample brightness and variance in central face zone
            let totalLuma = 0;
            let centerVariance = 0;
            let sampledPixels = 0;

            for (let y = 12; y < 36; y++) {
              for (let x = 16; x < 48; x++) {
                const i = (y * 64 + x) * 4;
                const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                totalLuma += luma;
                sampledPixels++;
              }
            }
            const avgLuma = totalLuma / (sampledPixels || 1);

            for (let y = 12; y < 36; y++) {
              for (let x = 16; x < 48; x++) {
                const i = (y * 64 + x) * 4;
                const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                centerVariance += Math.abs(luma - avgLuma);
              }
            }
            const avgVariance = centerVariance / (sampledPixels || 1);

            // If camera covered or face absent
            const facePresent = avgLuma > 15 && avgLuma < 245 && avgVariance > 10;

            if (facePresent) {
              setIsFaceDetected(true);
              setAwaySeconds(0);
            } else {
              setIsFaceDetected(false);
              setAwaySeconds((prev) => {
                const next = prev + 1;
                if (next >= 5) {
                  triggerProctoringViolation(
                    "LOOK_AWAY",
                    "⚠️ Attention Warning: Candidate looking away or absent from camera frame for 5+ seconds! Keep eyes on screen."
                  );
                }
                return next;
              });
            }
          }
        } catch (e) {
          console.warn("Proctoring frame analysis warning:", e);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeProctoredTest, isCameraStarted]);

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
            playWarningSound("ALARM");
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
              const isPastDeadline = task.dueDate ? new Date() > new Date(task.dueDate) : false;
              // Allow student to resubmit/retake any assignment, test, or homework before deadline as long as it is not graded yet
              const canResubmit = isSubmitted && !isEvaluated && !isPastDeadline;

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
                    ) : canResubmit ? (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs text-[#004b79] dark:text-blue-300 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>Awaiting Faculty Review</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            Open for Edit
                          </span>
                        </div>

                        {isTest ? (
                          <button
                            type="button"
                            onClick={() => handleStartTest(task)}
                            className="w-full py-2.5 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retake / Resubmit Test</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTask(task);
                              setSelectedFile(
                                sub.fileUrl
                                  ? {
                                      url: sub.fileUrl,
                                      name: sub.fileName || (sub.fileUrl.split("/").pop() || "Submitted Attachment"),
                                      isImage: /\.(png|jpe?g|webp|gif)$/i.test(sub.fileUrl),
                                    }
                                  : null
                              );
                              setSubmissionText(sub.submissionText || "");
                              setErrorMessage("");
                              setSuccessMessage("");
                            }}
                            className="w-full py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#004b79] dark:text-[#dfb74a] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Resubmit / Update Work</span>
                          </button>
                        )}
                      </div>
                    ) : isSubmitted ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                        <span>Submitted (Deadline Closed)</span>
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
                          setErrorMessage("");
                          setSuccessMessage("");
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

      {/* ── 4. FULL-SCREEN SECURE PROCTORED EXAMINATION SUITE ── */}
      {activeProctoredTest && (
        <div className="fixed inset-0 z-50 bg-[#060d17] text-white flex flex-col h-screen w-screen overflow-hidden select-none">
          {/* Top Secure Examination Control Bar */}
          <div className="h-16 px-4 sm:px-6 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-20">
            {/* Left: Test Identification & Live Security Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black tracking-tight truncate">
                    {activeProctoredTest.title}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white flex items-center gap-1 animate-pulse shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> Proctored
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
                  <span>{activeProctoredTest.subject}</span>
                  <span>•</span>
                  <span>Max: {activeProctoredTest.maxMarks} Marks</span>
                  <span>•</span>
                  {isFaceDetected ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> In Frame
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Away ({awaySeconds}s)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Live Timer & Violation Badges */}
            <div className="flex items-center gap-2.5">
              {/* Timer Pill */}
              <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                timeLeftSeconds <= 300
                  ? "bg-rose-950/70 border-rose-600 text-rose-300 animate-pulse"
                  : "bg-amber-950/40 border-amber-500/50 text-amber-300"
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-black text-sm sm:text-base">
                  {formatTime(timeLeftSeconds)}
                </span>
              </div>

              {/* Warnings Pill */}
              <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                warningCount > 0
                  ? "bg-rose-900/60 border-rose-600 text-rose-200 animate-pulse"
                  : "bg-slate-800/80 border-slate-700 text-slate-400"
              }`}>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Warnings:</span>
                <span className="font-mono font-bold">{warningCount}</span>
              </div>

              {/* Split View Switcher */}
              <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSplitViewMode("PDF_FULL")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    splitViewMode === "PDF_FULL"
                      ? "bg-[#004b79] text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Paper Only
                </button>
                <button
                  type="button"
                  onClick={() => setSplitViewMode("SPLIT")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    splitViewMode === "SPLIT"
                      ? "bg-[#004b79] text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Split View
                </button>
                <button
                  type="button"
                  onClick={() => setSplitViewMode("SUBMIT_FULL")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    splitViewMode === "SUBMIT_FULL"
                      ? "bg-[#004b79] text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Proctor &amp; Upload
                </button>
              </div>
            </div>

            {/* Right: Audio, Fullscreen, and Exit Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                title={isSoundMuted ? "Unmute Proctoring Alarm" : "Mute Proctoring Alarm"}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isSoundMuted
                    ? "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                    : "bg-emerald-950/40 border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/50"
                }`}
              >
                {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                title="Toggle Fullscreen Lockdown"
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition-all"
              >
                {isExamFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleCloseTestRoom}
                className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Finish / Exit</span>
              </button>
            </div>
          </div>

          {/* High-Visibility Floating Warning Banner */}
          {activeWarning && (
            <div className="px-4 py-2.5 bg-rose-600 text-white flex items-center justify-between gap-3 shadow-lg animate-bounce z-30 shrink-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{activeWarning.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveWarning(null)}
                className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-xs font-bold cursor-pointer shrink-0"
              >
                Acknowledge
              </button>
            </div>
          )}

          {/* Main Examination Workspace: Split Screen Layout */}
          <div className="flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── LEFT PANE: QUESTION PAPER / INTERACTIVE PDF VIEWER ── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {(splitViewMode === "SPLIT" || splitViewMode === "PDF_FULL") && (
              <div className={`${
                splitViewMode === "PDF_FULL" ? "lg:col-span-12" : "lg:col-span-7"
              } h-full flex flex-col rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl`}>
                {/* PDF Viewer Header Toolbar */}
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white shrink-0">
                      PDF
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {activeProctoredTest.attachmentName || `${activeProctoredTest.title} Question Paper`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPdfZoom((prev) => Math.max(50, prev - 15))}
                      title="Zoom Out"
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-slate-400 w-10 text-center font-bold">
                      {pdfZoom}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPdfZoom((prev) => Math.min(200, prev + 15))}
                      title="Zoom In"
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfZoom(100)}
                      title="Reset Zoom"
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {activeProctoredTest.attachmentUrl && (
                      <a
                        href={activeProctoredTest.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in Full Browser Tab"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#004b79] hover:bg-[#003b60] text-white text-[11px] font-bold cursor-pointer ml-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">Popout</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* PDF Interactive Frame / Question Content */}
                <div className="flex-1 bg-slate-950 overflow-hidden relative flex flex-col">
                  {activeProctoredTest.attachmentUrl ? (
                    <div className="w-full h-full flex-1 overflow-auto bg-slate-800 flex items-center justify-center p-2">
                      <iframe
                        src={`${activeProctoredTest.attachmentUrl}#toolbar=0&navpanes=0`}
                        title="Question Paper PDF"
                        className="w-full h-full rounded-xl bg-white border-0 shadow-lg"
                        style={{
                          transform: pdfZoom !== 100 ? `scale(${pdfZoom / 100})` : undefined,
                          transformOrigin: "top center",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono leading-relaxed text-slate-200">
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <h4 className="font-bold text-sm text-amber-400 mb-2">Instructions &amp; Questions:</h4>
                        <p className="whitespace-pre-wrap">{activeProctoredTest.description || "Answer all questions clearly on your blank paper. Show complete working steps."}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── RIGHT PANE: LIVE AI PROCTORING & ANSWER SUBMISSION ── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {(splitViewMode === "SPLIT" || splitViewMode === "SUBMIT_FULL") && (
              <div className={`${
                splitViewMode === "SUBMIT_FULL" ? "lg:col-span-12" : "lg:col-span-5"
              } h-full flex flex-col gap-3 overflow-y-auto no-scrollbar pr-0.5`}>
                {/* 1. Live Camera Feed & AI Security Monitor Card */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shrink-0 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Live Webcam Proctoring</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isFaceDetected ? "● Candidate Focused" : `⚠️ Look Away: ${awaySeconds}s`}
                    </span>
                  </div>

                  {/* Video Stream with Face Frame Crosshairs */}
                  <div className="relative w-full aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Face Guide Target Overlay */}
                    {isCameraStarted && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className={`w-36 h-48 sm:w-44 sm:h-56 rounded-3xl border-2 border-dashed transition-all duration-300 ${
                          isFaceDetected
                            ? "border-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.15)]"
                            : "border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-pulse"
                        }`} />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-slate-400">
                          AI Focus Guard: {isFaceDetected ? "100% In View" : "Attention Diverted"}
                        </div>
                      </div>
                    )}

                    {!isCameraStarted && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs text-slate-400 bg-slate-950">
                        <Camera className="w-8 h-8 text-amber-400 animate-pulse" />
                        <span>Camera stream initializing…</span>
                        {cameraError && <p className="text-[11px] text-rose-400 font-bold">{cameraError}</p>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Continuous Security Guard Active</span>
                    </div>
                    <p className="text-slate-400 leading-tight">
                      Write your answers on paper. Keep your face inside the target frame. Looking away for 5 seconds or switching tabs will trigger audio security alarms.
                    </p>
                  </div>
                </div>

                {/* 2. Answer Sheet Photo & File Upload Card */}
                <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/60 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#dfb74a] flex items-center gap-1.5">
                        <Upload className="w-4 h-4" />
                        <span>Upload Handwritten Solutions</span>
                      </span>
                      {isTestLocked && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-500/40">
                          Time Completed — Upload Now
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
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold truncate text-slate-200">
                            {selectedFile.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({selectedFile.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-blue-500/40 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs text-[#dfb74a] font-bold hover:bg-slate-900 cursor-pointer transition-all"
                      >
                        <Camera className="w-5 h-5 text-blue-400" />
                        <span>Take Photo / Upload Solution Sheet</span>
                        <span className="text-[10px] text-slate-400 font-normal">PNG, JPG or PDF up to 25MB</span>
                      </button>
                    )}

                    <textarea
                      rows={2}
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Optional final answers or working notes..."
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#004b79]"
                    />

                    {successMessage && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{successMessage}</span>
                      </div>
                    )}

                    {errorMessage && (
                      <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-200 font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || (!selectedFile && !submissionText.trim())}
                    onClick={(e) => handleSubmitWork(e, true)}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg disabled:opacity-50 mt-2"
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
            )}
          </div>
        </div>
      )}

      {/* ── 5. STANDARD ASSIGNMENT / HOMEWORK SUBMISSION MODAL ── */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.submission ? `Resubmit ${activeCategory === "HOMEWORK" ? "Homework" : "Assignment"}` : `Submit ${activeCategory === "HOMEWORK" ? "Homework" : "Assignment"}`}
        >
          <form onSubmit={(e) => handleSubmitWork(e, false)} className="space-y-4 pt-2">
            {selectedTask.submission && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-xs text-[#004b79] dark:text-blue-300 flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a] shrink-0" />
                <span>
                  <strong>Resubmission Mode:</strong> You can update your solution and attachments anytime before the deadline. Your latest submission will replace the previous one.
                </span>
              </div>
            )}

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
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!selectedFile && !submissionText.trim())}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#004b79] text-white hover:bg-[#003b60] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{selectedTask.submission ? "Update & Resubmit Work" : "Submit Solution"}</span>
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
