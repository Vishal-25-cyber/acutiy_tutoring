"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video, Sparkles, Clock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
    date: new Date().toISOString().split("T")[0],
    startTime: "19:00",
    endTime: "20:00",
    gracePeriodMinutes: 5,
  });

  // Calculate dynamic subjects for the chosen class
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
        const data = await res.json();
        if (data.batches) {
          setBatches(data.batches);
          if (data.batches.length > 0 && !formData.batchId) {
            setFormData((prev) => ({ ...prev, batchId: data.batches[0]._id }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadBatches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule class");
      }

      setSuccessMessage("Live Classroom scheduled successfully!");
      setTimeout(() => {
        router.push("/teacher/schedule");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-4xl animate-in fade-in duration-150">
      <div className="flex items-center gap-3">
        <Link href="/teacher/schedule">
          <Button variant="ghost" size="sm" className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Schedule a Live WebRTC Session
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create an interactive lecture room with automated attendance & whiteboard support.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold mb-1.5">Lecture Title *</label>
            <Input
              required
              placeholder="e.g. Class 10 CBSE — Quadratic Equations Masterclass"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5">Target Grade / Class *</label>
              <select
                value={formData.classLevel}
                onChange={(e) => handleClassChange(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CLASS_LIST.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">
                Subject ({formData.classLevel} Syllabus) *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5">Assign to Batch Time Slot *</label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.classLevel || formData.classLevel} • {b.startTime} - {b.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5">Detailed Topic & Learning Objectives *</label>
            <Input
              required
              placeholder="e.g. Discriminant Formula & Solving Complex Word Problems"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5">Session Date *</label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">Start Time *</label>
              <Input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">End Time *</label>
              <Input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/teacher/schedule">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={isLoading} className="font-bold text-xs px-6">
              Create & Publish Live Class
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
