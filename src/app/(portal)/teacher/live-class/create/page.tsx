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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    topic: "Quadratic Equations — Discriminant & Roots",
    description: "Step-by-step problem solving and NCERT exemplar derivation exercises.",
    date: new Date().toISOString().split("T")[0],
    startTime: "19:00",
    endTime: "20:00",
    gracePeriodMinutes: 5,
    attendanceThresholdPercent: 75,
  });

  const [materials, setMaterials] = useState<{ title: string; fileUrl: string; category: string }[]>([
    { title: "Class 10 Mathematics Formula Cheat Sheet", fileUrl: "https://acuity.edu/materials/class10-maths-sample.pdf", category: "NOTES" },
  ]);

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
            setFormData((prev) => ({ ...prev, batchId: data.batches[0]._id }));
          }
        }
      } catch (err) {
        console.error("Failed to load batches", err);
      }
    }
    loadBatches();
  }, []);

  const addMaterial = () => {
    setMaterials([...materials, { title: "", fileUrl: "", category: "NOTES" }]);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: string, value: string) => {
    const updated = [...materials];
    (updated[index] as any)[field] = value;
    setMaterials(updated);
  };

  const handleSaveClass = async (status: "DRAFT" | "PUBLISHED") => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!formData.subject || !formData.topic || !formData.batchId || !formData.date || !formData.startTime || !formData.endTime) {
        throw new Error("Please complete all required fields (Subject, Topic, Batch, Date, Times).");
      }

      const validMaterials = materials.filter((m) => m.title.trim() && m.fileUrl.trim());

      const payload = {
        ...formData,
        status,
        materials: validMaterials,
      };

      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/teacher/schedule">
            <button className="p-2 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Create & Schedule Live Class
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Publish an interactive video lecture with automated attendance tracking.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── CARDLESS OPEN-SPACE FORM ── */}
      <form onSubmit={(e) => { e.preventDefault(); handleSaveClass("PUBLISHED"); }} className="space-y-6">
        {/* Section 1: Subject & Topic */}
        <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Subject & Curriculum Topic
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Lecture Topic *
              </label>
              <input
                required
                placeholder="e.g. Quadratic Equations — Discriminant Formula"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Batch & Grade Level */}
        <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Target Batch & Grade
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assigned Batch Routine *
              </label>
              <select
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              >
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.startTime} – {b.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Academic Grade / Level *
              </label>
              <select
                value={formData.classLevel}
                onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              >
                {CLASS_LIST.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Class Description & Learning Objectives
            </label>
            <textarea
              rows={2}
              placeholder="Outline session agenda, textbook exercises, and problem sets to be discussed..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Section 3: Date & Timing */}
        <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Schedule & Time Slots
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Session Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Attendance Threshold (% of class duration required)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={formData.attendanceThresholdPercent}
                  onChange={(e) => setFormData({ ...formData, attendanceThresholdPercent: Number(e.target.value) })}
                  className="flex h-10 w-24 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-500">% required for PRESENT status</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Early Entry Grace Period
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={formData.gracePeriodMinutes}
                  onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })}
                  className="flex h-10 w-24 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-500">Minutes early entry permitted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Attached Notes & Resources */}
        <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Attached Study Materials (Optional)
            </h2>
            <button
              type="button"
              onClick={addMaterial}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {materials.map((mat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Material title (e.g. Ray Diagrams Workbook)"
                  value={mat.title}
                  onChange={(e) => updateMaterial(idx, "title", e.target.value)}
                  className="flex-1 h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Document URL (https://...)"
                  value={mat.fileUrl}
                  onChange={(e) => updateMaterial(idx, "fileUrl", e.target.value)}
                  className="flex-1 h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => removeMaterial(idx)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSaveClass("DRAFT")}
            className="px-4 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as Draft</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? "Publishing..." : "Publish & Notify Batch"}</span>
          </button>
        </div>
      </form>
    </main>
  );
}
