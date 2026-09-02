"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Calendar,
  BookOpen,
  Users,
  ShieldCheck,
  FileText,
  UploadCloud,
  Paperclip,
  FileCheck,
} from "lucide-react";
import { getSubjectsForClassAndBoard, CLASS_LIST } from "@/lib/curriculum";

export default function TeacherCreateLiveClassPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    subject: "Mathematics",
    classLevel: "Class 10",
    batchId: "",
    topic: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    gracePeriodMinutes: 5,
    attendanceThresholdPercent: 75,
  });

  const [materials, setMaterials] = useState<
    { title: string; fileUrl: string; fileName?: string; fileSize?: string; category: string }[]
  >([]);

  const availableSubjects = Array.from(
    new Set([
      "Mathematics",
      "Science",
      "Physics",
      "Chemistry",
      "Biology",
      "English",
      "Social Science",
      ...getSubjectsForClassAndBoard(formData.classLevel, "CBSE"),
    ])
  );

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/batches");
        const data = await res.json();
        if (data.batches && data.batches.length > 0) {
          setBatches(data.batches);
          if (!formData.batchId) {
            const firstBatch = data.batches[0];
            setFormData((prev) => ({
              ...prev,
              batchId: firstBatch._id,
              startTime: prev.startTime || firstBatch.startTime || "18:00",
              endTime: prev.endTime || firstBatch.endTime || "19:00",
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load batches", err);
      }
    }
    loadBatches();
  }, []);

  const handleBatchSelect = (batchId: string) => {
    const selected = batches.find((b) => b._id === batchId);
    setFormData((prev) => ({
      ...prev,
      batchId,
      startTime: selected?.startTime || prev.startTime,
      endTime: selected?.endTime || prev.endTime,
    }));
  };

  const addMaterial = () => {
    setMaterials([...materials, { title: "", fileUrl: "", fileName: "", fileSize: "", category: "NOTES" }]);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: string, value: string) => {
    const updated = [...materials];
    (updated[index] as any)[field] = value;
    setMaterials(updated);
  };

  const handleFileUpload = (index: number, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const updated = [...materials];
      const defaultName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      const formattedTitle = updated[index]?.title?.trim() || defaultName;
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      updated[index] = {
        ...updated[index],
        title: formattedTitle,
        fileUrl: dataUrl || `https://mantif.edu/materials/${file.name}`,
        fileName: file.name,
        fileSize: sizeStr,
        category: updated[index]?.category || "NOTES",
      };
      setMaterials(updated);
    };
    reader.readAsDataURL(file);
  };

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("acuity_auth_token") || sessionStorage.getItem("acuity_auth_token") || ""
        : "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-auth-token"] = token;
    }
    return headers;
  };

  const handleSaveClass = async (status: "DRAFT" | "PUBLISHED") => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!formData.subject || !formData.topic.trim() || !formData.date || !formData.startTime || !formData.endTime) {
        throw new Error("Please complete all required fields (Subject, Topic, Date, Start & End Times).");
      }

      const validMaterials = materials.filter((m) => m.title.trim() && m.fileUrl.trim());
      const resolvedTitle =
        formData.title?.trim() ||
        `${formData.classLevel} ${formData.subject} — ${formData.topic.trim()}`;

      const payload = {
        ...formData,
        title: resolvedTitle,
        topic: formData.topic.trim(),
        description: formData.description.trim(),
        status,
        materials: validMaterials,
      };

      const res = await fetch("/api/classes", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save class.");
      }

      setSuccessMessage(
        status === "DRAFT"
          ? "Class saved as draft successfully! You can publish it anytime."
          : "Live Class published successfully! All batch students have been notified."
      );

      setTimeout(() => {
        router.push("/teacher/schedule");
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/teacher/schedule">
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Create &amp; Schedule Live Class
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Publish an interactive video lecture with automated attendance tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Host Setup
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── 2. CARDLESS FULL-WIDTH FORM ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveClass("PUBLISHED");
        }}
        className="space-y-8"
      >
        {/* Section 1: Subject & Topic */}
        <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Subject &amp; Curriculum Topic
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs cursor-pointer"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Lecture Topic <span className="text-rose-500">*</span>
              </label>
              <input
                required
                placeholder="e.g. Quadratic Equations — Discriminant & Roots"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Batch & Grade Level */}
        <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Target Batch &amp; Grade Level
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Assigned Batch Routine <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.batchId}
                onChange={(e) => handleBatchSelect(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs cursor-pointer"
              >
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.startTime} – {b.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Academic Grade / Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.classLevel}
                onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs cursor-pointer"
              >
                {CLASS_LIST.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Class Description &amp; Learning Objectives
            </label>
            <textarea
              rows={3}
              placeholder="Outline session agenda, NCERT exemplar problem sets, and homework exercises to be discussed..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs resize-y"
            />
          </div>
        </div>

        {/* Section 3: Date & Timing */}
        <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Schedule &amp; Time Slots
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Session Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Attendance Threshold
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={formData.attendanceThresholdPercent}
                  onChange={(e) => setFormData({ ...formData, attendanceThresholdPercent: Number(e.target.value) })}
                  className="flex h-10 w-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
                />
                <span className="text-xs text-slate-500 font-medium">
                  % of session duration required for <strong>PRESENT</strong> status
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Early Entry Grace Period
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={formData.gracePeriodMinutes}
                  onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })}
                  className="flex h-10 w-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
                />
                <span className="text-xs text-slate-500 font-medium">
                  Minutes early entry permitted before start time
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Attached Study Materials */}
        <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Attached Study Materials (Optional)
              </h2>
            </div>
            <button
              type="button"
              onClick={addMaterial}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-[#004b79] dark:text-[#dfb74a] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </button>
          </div>

          <div className="space-y-3">
            {materials.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No study materials attached. Click &quot;Add Resource&quot; to upload PDFs, worksheets, or reference notes.</p>
            ) : (
              materials.map((mat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Material Title Input */}
                    <input
                      type="text"
                      placeholder="Material Title (e.g. Formula Cheat Sheet, Chapter 4 Notes)"
                      value={mat.title}
                      onChange={(e) => updateMaterial(idx, "title", e.target.value)}
                      className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#004b79] transition-colors shadow-xs"
                    />

                    {/* PDF / File Upload Area */}
                    <div className="flex-1 min-w-0">
                      {mat.fileName || mat.fileUrl ? (
                        <div className="h-10 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white shrink-0 uppercase tracking-wider">
                              PDF
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {mat.fileName || "Uploaded Document.pdf"}
                            </span>
                            {mat.fileSize && (
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                ({mat.fileSize})
                              </span>
                            )}
                          </div>
                          <label className="text-[11px] font-bold text-[#004b79] dark:text-[#dfb74a] hover:underline cursor-pointer shrink-0">
                            <span>Change</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleFileUpload(idx, e.target.files[0]);
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#004b79] hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-xs font-bold text-[#004b79] dark:text-[#dfb74a] group">
                          <UploadCloud className="w-4 h-4 group-hover:scale-110 transition-transform text-[#004b79] dark:text-[#dfb74a]" />
                          <span>Upload PDF / Document</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(idx, e.target.files[0]);
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Remove Action Button */}
                    <button
                      type="button"
                      onClick={() => removeMaterial(idx)}
                      className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
                      title="Remove Resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── 3. ACTION BAR ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSaveClass("DRAFT")}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as Draft</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#004b79]/20 disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? "Publishing Class..." : "Publish & Notify Batch"}</span>
          </button>
        </div>
      </form>
    </main>
  );
}
