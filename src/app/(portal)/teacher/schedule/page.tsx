"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Send,
  Ban,
  FileCheck2,
  Search,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ScheduleSwapModal } from "@/components/classroom/ScheduleSwapModal";

export default function TeacherSchedulePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"ALL" | "UPCOMING" | "LIVE" | "COMPLETED" | "DRAFT" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [cancelModalClass, setCancelModalClass] = useState<any>(null);
  const [deleteModalClass, setDeleteModalClass] = useState<any>(null);
  const [swapModalClass, setSwapModalClass] = useState<any>(null);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.classes) {
        setClasses(data.classes);
      }
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handlePublishClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}/publish`, { method: "PUT" });
      const data = await res.json();
      if (res.ok) {
        setActionMessage("Class published! Students in this batch have been notified.");
        setTimeout(() => setActionMessage(""), 4000);
        loadClasses();
      } else {
        alert(data.error || "Failed to publish class");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}/start`, { method: "PUT" });
      if (res.ok) {
        window.location.href = `/classroom/${classId}`;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}/cancel`, { method: "PUT" });
      if (res.ok) {
        setCancelModalClass(null);
        setActionMessage("Class session cancelled successfully.");
        setTimeout(() => setActionMessage(""), 4000);
        loadClasses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteModalClass(null);
        setActionMessage("Class draft deleted permanently.");
        setTimeout(() => setActionMessage(""), 4000);
        loadClasses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredClasses = classes.filter((cls) => {
    const matchesTab =
      selectedTab === "ALL" ||
      (selectedTab === "UPCOMING" && (cls.status === "SCHEDULED" || cls.status === "PUBLISHED")) ||
      cls.status === selectedTab;

    const matchesSearch =
      !searchQuery.trim() ||
      cls.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.topic?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Timetable & Live Sessions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your live lecturing schedule, publish upcoming sessions, and view student attendance logs.
          </p>
        </div>

        <Link href="/teacher/live-class/create" prefetch={true}>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Live Class</span>
          </button>
        </Link>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
          {actionMessage}
        </div>
      )}

      {/* ── FILTERS & TABS (CARDLESS) ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search classes by topic, subject, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(["ALL", "UPCOMING", "LIVE", "COMPLETED", "DRAFT", "CANCELLED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedTab === tab
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CLASS LIST (CARDLESS HAIRLINE TABLE) ── */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading schedule...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No classes found</p>
            <p className="text-xs text-slate-400">No scheduled sessions match your filter criteria.</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            {filteredClasses.map((cls: any) => {
              const isDraft = cls.status === "DRAFT";
              const isLive = cls.status === "LIVE";
              const isCancelled = cls.status === "CANCELLED";
              const isCompleted = cls.status === "COMPLETED";

              return (
                <div
                  key={cls._id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {cls.subject}
                      </span>

                      <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                        {cls.startTime} – {cls.endTime}
                      </span>

                      <span className="text-xs text-slate-400">· {cls.date}</span>
                      <span className="text-xs text-slate-400">· {cls.batchId?.name || "Batch Slot"}</span>
                    </div>

                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {cls.title || `${cls.subject} — ${cls.topic}`}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {cls.topic} {cls.description && `— ${cls.description}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {!isCancelled && !isDraft && (
                      <button
                        onClick={() => handleStartClass(cls._id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{isLive ? "Enter Live Class" : "Start Class"}</span>
                      </button>
                    )}

                    {isDraft && (
                      <button
                        onClick={() => handlePublishClass(cls._id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    )}

                    {!isDraft && (
                      <Link href={`/teacher/attendance/${cls._id}`}>
                        <button className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
                          <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Attendance</span>
                        </button>
                      </Link>
                    )}

                    {!isCancelled && !isCompleted && !isDraft && (
                      <button
                        onClick={() => setSwapModalClass(cls)}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Swap Subject Days or Change Slot"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                        <span>Swap / Reschedule</span>
                      </button>
                    )}

                    {!isCancelled && !isCompleted && !isDraft && (
                      <button
                        onClick={() => setCancelModalClass(cls)}
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Cancel Class"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isDraft && (
                      <button
                        onClick={() => setDeleteModalClass(cls)}
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Reschedule & Day Swap Modal */}
      {swapModalClass && (
        <ScheduleSwapModal
          isOpen={!!swapModalClass}
          onClose={() => setSwapModalClass(null)}
          targetSession={swapModalClass}
          allSessions={classes}
          onSuccess={loadClasses}
        />
      )}

      {/* Cancel Class Modal */}
      {cancelModalClass && (
        <Modal
          isOpen={!!cancelModalClass}
          onClose={() => setCancelModalClass(null)}
          title="Cancel Scheduled Class"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to cancel <strong>{cancelModalClass.title}</strong>? Students in this batch will be notified.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCancelModalClass(null)}>
                Keep Scheduled
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleCancelClass(cancelModalClass._id)}>
                Confirm Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Draft Modal */}
      {deleteModalClass && (
        <Modal
          isOpen={!!deleteModalClass}
          onClose={() => setDeleteModalClass(null)}
          title="Delete Draft Class"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete this draft class?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteModalClass(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(deleteModalClass._id)}>
                Delete Draft
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
