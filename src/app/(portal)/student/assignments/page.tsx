"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeProctoredTest) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeProctoredTest]);

  // Upload Window: 5 minutes after test ends (300 seconds countdown)
  const [uploadWindowSeconds, setUploadWindowSeconds] = useState<number>(300);
  const [uploadExpired, setUploadExpired] = useState<boolean>(false);

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

  // Safe Document Opener: prevents Chrome about:blank issues on data: URLs
  const openDocumentSafely = (fileUrl: string, fileName?: string) => {
    if (!fileUrl) return;

    if (fileUrl.startsWith("data:")) {
      try {
        const arr = fileUrl.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);

        const newWin = window.open("", "_blank");
        if (newWin) {
          if (mime.startsWith("image/")) {
            newWin.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${fileName || "Document Preview"}</title>
                  <style>
                    body { margin: 0; background: #0b1329; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
                    .wrapper { max-width: 95vw; max-height: 95vh; display: flex; flex-direction: column; align-items: center; gap: 12px; }
                    img { max-width: 92vw; max-height: 85vh; object-fit: contain; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); border: 1px solid #1e293b; background: #000; }
                    .meta { color: #94a3b8; font-size: 13px; font-weight: 600; }
                  </style>
                </head>
                <body>
                  <div class="wrapper">
                    <div class="meta">${fileName || "Question Paper / Document"}</div>
                    <img src="${blobUrl}" alt="Document" />
                  </div>
                </body>
              </html>
            `);
            newWin.document.close();
          } else {
            newWin.location.href = blobUrl;
          }
        } else {
          window.open(blobUrl, "_blank");
        }
        return;
      } catch (e) {
        console.warn("Blob conversion error:", e);
      }
    }

    // Normal URL
    window.open(fileUrl, "_blank");
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
      if (
        streamRef.current &&
        streamRef.current.active &&
        streamRef.current.getVideoTracks().some((t) => t.readyState === "live")
      ) {
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraStarted(true);
        return;
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
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

  // Re-bind video element whenever it mounts or view mode switches
  useEffect(() => {
    if (isCameraStarted && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraStarted, activeProctoredTest, splitViewMode]);

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
    if (test.dueDate && new Date() > new Date(test.dueDate)) {
      alert("This test's deadline has expired. You can no longer start or enter this test.");
      return;
    }

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
    setUploadExpired(false);
    setUploadWindowSeconds(300);
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
    setUploadExpired(false);
    setUploadWindowSeconds(300);
    setActiveWarning(null);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsExamFullscreen(false);
    }
  };

  // Finish test: lock exam, stop camera, start 5-min upload window
  const handleFinishTest = () => {
    if (!isTestLocked) {
      setIsTestLocked(true);
      captureSnapshot();
      stopCamera();
      setActiveWarning(null);
    }
  };

  // ── TAB SWITCH & WINDOW FOCUS LOST PROCTORING LISTENER ──
  useEffect(() => {
    if (!activeProctoredTest || isTestLocked) return;

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
  }, [activeProctoredTest, isTestLocked]);

  // ── WEBCAM ATTENTION & 5-SECOND LOOK-AWAY TRACKER ──
  useEffect(() => {
    if (!activeProctoredTest || isTestLocked || !isCameraStarted) return;

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
            stopCamera();
            setActiveWarning(null);
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

  // ── 5-MINUTE POST-TEST UPLOAD COUNTDOWN ──
  useEffect(() => {
    if (!isTestLocked || uploadExpired) return;
    setUploadWindowSeconds(300);
    const interval = setInterval(() => {
      setUploadWindowSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setUploadExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTestLocked]);

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
          violationCount: isProctoredTest ? warningCount : 0,
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
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-[#004b79] dark:text-[#dfb74a]">
                        {task.subject}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isTest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-amber-600" />
                            {task.durationMinutes || 45} Mins
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            isPastDeadline
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
                              : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                          }`}>
                            <Calendar className="w-3 h-3 text-[#004b79] dark:text-[#dfb74a]" />
                            <span>{formatDueDateTime(task.dueDate)}</span>
                            {isPastDeadline && (
                              <span className="text-[9px] font-black uppercase text-rose-600 ml-0.5">
                                • Expired
                              </span>
                            )}
                          </span>
                        )}
                      </div>
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
                    ) : isPastDeadline ? (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>Deadline Passed</span>
                          </div>
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded">
                            Closed
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 cursor-not-allowed shadow-none"
                          title="Due date has passed. Entry is closed."
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isTest ? "Test Closed (Deadline Expired)" : "Submissions Closed"}</span>
                        </button>
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

      {/* ── 4. FULL-SCREEN SECURE PROCTORED EXAMINATION SUITE (MOUNTED TO BODY VIA PORTAL) ── */}
      {activeProctoredTest && mounted && createPortal(
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] bg-gray-50 text-gray-900 flex flex-col h-screen w-screen overflow-hidden select-none">
          {/* Top Secure Examination Control Bar - Light Theme */}
          <div className="h-14 px-4 sm:px-6 bg-white border-b border-gray-200 shadow-xs flex items-center justify-between gap-3 shrink-0 z-20">
            {/* Left: Test ID */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-[#004b79]/10 border border-[#004b79]/20 flex items-center justify-center text-[#004b79] shrink-0">
                {isTestLocked ? <Upload className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black tracking-tight truncate text-gray-900">
                    {activeProctoredTest.title}
                  </h2>
                  {!isTestLocked ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white flex items-center gap-1 animate-pulse shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> Live
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-white shrink-0">
                      Test Ended
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 truncate">
                  <span>{activeProctoredTest.subject}</span>
                  <span>•</span>
                  <span>Max: {activeProctoredTest.maxMarks} Marks</span>
                  {!isTestLocked && (
                    <>
                      <span>•</span>
                      {isFaceDetected ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> In Frame
                        </span>
                      ) : (
                        <span className="text-rose-500 font-bold flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Away ({awaySeconds}s)
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Timer + Warnings + View switcher */}
            <div className="flex items-center gap-2">
              {!isTestLocked ? (
                <>
                  {/* Test Timer */}
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-mono font-black text-sm transition-all ${
                    timeLeftSeconds <= 300
                      ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse"
                      : "bg-amber-50 border-amber-300 text-amber-700"
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(timeLeftSeconds)}
                  </div>

                  {/* Warnings pill - ONLY show if warningCount > 0 during active test */}
                  {warningCount > 0 && (
                    <div className="px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 bg-rose-50 border-rose-300 text-rose-600 animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Warnings:</span>
                      <span>{warningCount}</span>
                    </div>
                  )}

                  {/* Split View toggle - only during active test */}
                  <div className="hidden md:flex items-center p-1 rounded-xl bg-gray-100 border border-gray-200 text-xs font-bold">
                    {(["PDF_FULL", "SPLIT", "SUBMIT_FULL"] as const).map((mode) => (
                      <button key={mode} type="button" onClick={() => setSplitViewMode(mode)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          splitViewMode === mode
                            ? "bg-[#004b79] text-white shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}>
                        {mode === "PDF_FULL" ? "Paper" : mode === "SPLIT" ? "Split" : "Camera"}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* Post-test: Big Upload Countdown */
                !uploadExpired && (
                  <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono font-black text-sm transition-all ${
                    uploadWindowSeconds <= 60
                      ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse"
                      : "bg-blue-50 border-blue-300 text-[#004b79]"
                  }`}>
                    <Timer className="w-4 h-4" />
                    <span>Upload Closes In: {Math.floor(uploadWindowSeconds / 60).toString().padStart(2, "0")}:{(uploadWindowSeconds % 60).toString().padStart(2, "0")}</span>
                  </div>
                )
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {!isTestLocked && (
                <button type="button" onClick={() => setIsSoundMuted(!isSoundMuted)}
                  title={isSoundMuted ? "Unmute" : "Mute"}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isSoundMuted
                      ? "bg-gray-100 border-gray-200 text-gray-400"
                      : "bg-emerald-50 border-emerald-200 text-emerald-600"
                  }`}>
                  {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              <button type="button" onClick={toggleFullscreen} title="Toggle Fullscreen"
                className="p-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 cursor-pointer transition-all">
                {isExamFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {!isTestLocked ? (
                <button type="button" onClick={handleFinishTest}
                  className="px-3.5 py-1.5 rounded-xl bg-[#004b79] hover:bg-[#003b60] text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>Finish Test</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseTestRoom}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200/90 hover:border-rose-200 text-slate-700 hover:text-rose-600 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-2xs hover:shadow-xs group"
                  title="Close & Exit Test Room"
                >
                  <span className="w-5 h-5 rounded-lg bg-white group-hover:bg-rose-100 flex items-center justify-center transition-colors shadow-2xs text-slate-500 group-hover:text-rose-600">
                    <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
                  </span>
                  <span>Exit Room</span>
                </button>
              )}
            </div>
          </div>

          {/* High-Visibility Floating Warning Banner */}
          {activeWarning && !isTestLocked && (
            <div className="px-4 py-2.5 bg-rose-600 text-white flex items-center justify-between gap-3 shadow-lg z-30 shrink-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                <span>{activeWarning.message}</span>
              </div>
              <button type="button" onClick={() => setActiveWarning(null)}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold cursor-pointer shrink-0 border border-white/30">
                Acknowledge
              </button>
            </div>
          )}

          {/* Main Examination Workspace */}
          {isTestLocked ? (
            /* POST-TEST VIEW: ONLY UPLOAD OPTION WITH 5 MINS ALONE — NO PROCTORING */
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gray-50">
              <div className="w-full max-w-xl bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-5 my-auto">
                {/* Status & 5-min Countdown */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  uploadExpired ? "bg-rose-50 border-rose-200" : "bg-blue-50/70 border-blue-200/80"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      uploadExpired ? "bg-rose-100 text-rose-600" : "bg-[#004b79]/10 text-[#004b79]"
                    }`}>
                      {uploadExpired ? <AlertCircle className="w-6 h-6 text-rose-500" /> : <Upload className="w-6 h-6 text-[#004b79]" />}
                    </div>
                    <div>
                      <h3 className={`text-base font-black ${uploadExpired ? "text-rose-700" : "text-[#004b79]"}`}>
                        {uploadExpired ? "Upload Window Expired" : "Upload Your Answer Sheet"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {uploadExpired
                          ? "The 5-minute submission window has closed. Contact your teacher."
                          : "Your test is finished. Take a photo or upload your scanned handwritten test pages."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!uploadExpired && (
                      <div className={`px-3.5 py-2 rounded-xl border font-mono font-black text-base shrink-0 flex items-center gap-2 ${
                        uploadWindowSeconds <= 60
                          ? "bg-rose-100 border-rose-300 text-rose-700 animate-pulse"
                          : "bg-white border-blue-200 text-[#004b79] shadow-xs"
                      }`}>
                        <Timer className="w-4 h-4" />
                        <span>{Math.floor(uploadWindowSeconds / 60).toString().padStart(2, "0")}:{(uploadWindowSeconds % 60).toString().padStart(2, "0")}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleCloseTestRoom}
                      className="w-9 h-9 rounded-xl bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs group"
                      title="Exit and Close Room"
                    >
                      <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                    </button>
                  </div>
                </div>

                {!uploadExpired ? (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <FileCheck className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-gray-800 truncate">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedFile.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Remove file"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-12 border-2 border-dashed border-blue-300 hover:border-[#004b79] bg-blue-50/20 hover:bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-[#004b79] group-hover:scale-110 transition-transform shadow-xs">
                          <Camera className="w-7 h-7" />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-bold text-[#004b79]">
                            Tap to Take Photo or Choose Files
                          </p>
                          <p className="text-xs text-gray-400">
                            Supports PNG, JPG, JPEG or PDF (Max 25 MB)
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Feedback messages */}
                    {successMessage && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-700 flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{successMessage}</span>
                      </div>
                    )}
                    {errorMessage && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-700 flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isSubmitting || !selectedFile}
                      onClick={(e) => handleSubmitWork(e, true)}
                      className="w-full py-3.5 rounded-2xl text-sm font-black bg-[#004b79] hover:bg-[#003b60] disabled:bg-gray-200 disabled:text-gray-400 text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{isSubmitting ? "Submitting Answer Sheet…" : "Submit Answer Sheet"}</span>
                    </button>

                    <div className="flex items-center justify-center pt-0.5">
                      <button
                        type="button"
                        onClick={handleCloseTestRoom}
                        className="text-xs font-semibold text-gray-400 hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 group"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-rose-500 group-hover:rotate-90 transition-transform duration-200" />
                        <span>Cancel &amp; Close Room</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <p className="text-xs text-gray-500">The upload window has expired. Please contact your instructor for assistance.</p>
                    <button
                      type="button"
                      onClick={handleCloseTestRoom}
                      className="px-6 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto shadow-2xs hover:shadow-xs group"
                    >
                      <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                      <span>Close Room</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* DURING TEST VIEW: PDF VIEWER (LEFT) + CAMERA PROCTORING (RIGHT) */
            <div className="flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
              {/* LEFT PANE: QUESTION PAPER / PDF VIEWER - light theme */}
              <div className={`${
                splitViewMode === "SUBMIT_FULL"
                  ? "hidden"
                  : splitViewMode === "PDF_FULL"
                  ? "lg:col-span-12"
                  : "lg:col-span-7"
              } h-full flex flex-col rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-lg`}>
                {/* PDF Viewer Header */}
                <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500 text-white shrink-0">PDF</span>
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {activeProctoredTest.attachmentName || `${activeProctoredTest.title} — Question Paper`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => setPdfZoom((prev) => Math.max(50, prev - 15))} title="Zoom Out"
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer transition-colors">
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-gray-500 w-10 text-center font-bold">{pdfZoom}%</span>
                    <button type="button" onClick={() => setPdfZoom((prev) => Math.min(200, prev + 15))} title="Zoom In"
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer transition-colors">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setPdfZoom(100)} title="Reset"
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* PDF Frame */}
                <div className="flex-1 overflow-hidden relative flex flex-col bg-gray-100">
                  {activeProctoredTest.attachmentUrl ? (
                    <div className="w-full h-full overflow-auto flex items-start justify-center p-2">
                      <iframe
                        src={`${activeProctoredTest.attachmentUrl}#toolbar=0&navpanes=0`}
                        title="Question Paper PDF"
                        className="w-full h-full rounded-xl bg-white border-0 shadow-md"
                        style={{ transform: pdfZoom !== 100 ? `scale(${pdfZoom / 100})` : undefined, transformOrigin: "top center" }}
                      />
                    </div>
                  ) : (
                    <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono leading-relaxed text-gray-700">
                      <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                        <h4 className="font-bold text-sm text-[#004b79] mb-2">Instructions &amp; Questions:</h4>
                        <p className="whitespace-pre-wrap">{activeProctoredTest.description || "Answer all questions clearly on your blank paper. Show complete working steps."}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT PANE: CAMERA PROCTORING - light theme */}
              <div className={`${
                splitViewMode === "PDF_FULL"
                  ? "hidden"
                  : splitViewMode === "SUBMIT_FULL"
                  ? "lg:col-span-12"
                  : "lg:col-span-5"
              } h-full flex flex-col overflow-hidden`}>
                {/* Camera card - full height, no wordings underneath */}
                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-md flex-1 flex flex-col">
                  {/* Camera Header */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between bg-gray-50 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${ isCameraStarted ? "bg-emerald-500 animate-pulse" : "bg-amber-400 animate-bounce" }`} />
                      <span className="text-[11px] font-bold text-gray-700">Live Proctoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* In Frame / Away status */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ isFaceDetected ? "text-emerald-700 bg-emerald-100" : "text-rose-600 bg-rose-100 animate-pulse" }`}>
                        {isFaceDetected ? "● In Frame" : `⚠ Away ${awaySeconds}s`}
                      </span>
                      {warningCount > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center gap-1">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          {warningCount} {warningCount === 1 ? "Warning" : "Warnings"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Video Feed */}
                  <div className="relative w-full flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[320px]">
                    <video
                      ref={(node) => {
                        videoRef.current = node;
                        if (node && streamRef.current) {
                          if (node.srcObject !== streamRef.current) {
                            node.srcObject = streamRef.current;
                          }
                          node.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      onCanPlay={(e) => {
                        e.currentTarget.play().catch(() => {});
                      }}
                      className="w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Face guide frame */}
                    {isCameraStarted && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-44 h-56 sm:w-56 sm:h-72 relative transition-all duration-300">
                          {[
                            "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
                            "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
                            "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
                            "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
                          ].map((cls, i) => (
                            <div key={i} className={`absolute w-7 h-7 ${ isFaceDetected ? "border-emerald-400/80" : "border-rose-500 animate-pulse" } ${cls}`} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Camera initializing state */}
                    {!isCameraStarted && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs text-gray-400 bg-gray-900">
                        <Camera className="w-8 h-8 text-[#dfb74a] animate-pulse" />
                        <span className="text-gray-300 font-medium">Camera initializing…</span>
                        {cameraError && <p className="text-[11px] text-rose-400 font-bold">{cameraError}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
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
                  <button
                    type="button"
                    onClick={() => openDocumentSafely(selectedTask.attachmentUrl, selectedTask.attachmentName || "Question_Paper")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#004b79] dark:text-[#dfb74a] hover:underline shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Questions</span>
                  </button>
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || (!selectedFile && !submissionText.trim())}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#004b79] text-white hover:bg-[#003b60] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
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
