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
import { sortClassesByPriority } from "@/lib/class-timing";
import { useClassLiveTimer } from "@/lib/use-class-timer";

function TeacherScheduleClassRow({
  cls,
  handlePublishClass,
  setSwapModalClass,
  setCancelModalClass,
  setDeleteModalClass,
}: {
  cls: any;
  handlePublishClass: (id: string) => void;
  setSwapModalClass: (cls: any) => void;
  setCancelModalClass: (cls: any) => void;
  setDeleteModalClass: (cls: any) => void;
}) {
  const isDraft = cls.status === "DRAFT";
  const isCancelled = cls.status === "CANCELLED";
  const isCompleted = cls.status === "COMPLETED";

  const batchData = {
    ...(cls.batchId || {}),
    date: cls.date,
    startTime: cls.startTime || cls.batchId?.startTime,
    endTime: cls.endTime || cls.batchId?.endTime,
    days: cls.batchId?.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    gracePeriodMinutes: cls.gracePeriodMinutes || cls.batchId?.gracePeriodMinutes || 10,
  };

  const timing = useClassLiveTimer(batchData);
  const targetRoomId = cls.livekitRoomId || cls.meetingId || cls._id || timing.permanentRoomId;

  return (
    <div className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors px-1">
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
            {cls.subject}
          </span>

          <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
            {cls.startTime} – {cls.endTime}
          </span>

          <span className="text-xs text-slate-400">· {cls.date}</span>
          <span className="text-xs text-slate-400">· {cls.batchId?.name || "Batch Slot"}</span>

          {timing.isLiveNow ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              ● Live Now ({timing.countdownText})
            </span>
          ) : !isCancelled && !isCompleted && !isDraft ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Clock className="w-3 h-3 text-amber-500 animate-spin" />
              {timing.countdownText}
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              Completed
            </span>
          ) : isCancelled ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              Cancelled
            </span>
          ) : isDraft ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Draft
            </span>
          ) : null}
        </div>

        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
          {cls.title || `${cls.subject} — ${cls.topic}`}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
          {cls.topic} {cls.description && `— ${cls.description}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {!isCancelled && !isDraft && (
          timing.canJoin ? (
            <Link href={`/classroom/${targetRoomId}`}>
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-md shadow-emerald-500/25 animate-pulse"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Enter Live Class</span>
              </button>
            </Link>
          ) : isCompleted ? (
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Concluded</span>
            </button>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
              title={timing.detailedCountdown}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Opens at {cls.startTime} ({timing.countdownText})</span>
            </button>
          )
        )}

        {isDraft && (
          <button
            onClick={() => handlePublishClass(cls._id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#004b79] hover:bg-[#003b60] text-white transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        )}

        {!isDraft && (
          <Link href={`/teacher/attendance/${cls._id}`}>
            <button className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer">
              <FileCheck2 className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
              <span>Attendance</span>
            </button>
          </Link>
        )}

        {!isCancelled && !isCompleted && !isDraft && (
          <button
            onClick={() => setSwapModalClass(cls)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Swap Subject Days or Change Slot"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
            <span>Swap / Reschedule</span>
          </button>
        )}

        {!isCancelled && !isCompleted && !isDraft && (
          <button
            onClick={() => setCancelModalClass(cls)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
            title="Cancel Class Session"
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => setDeleteModalClass(cls)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          title="Delete Class Permanently"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function TeacherSchedulePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"ALL" | "UPCOMING" | "LIVE" | "COMPLETED" | "DRAFT" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [cancelModalClass, setCancelModalClass] = useState<any>(null);
  const [deleteModalClass, setDeleteModalClass] = useState<any>(null);
  const [swapModalClass, setSwapModalClass] = useState<any>(null);

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

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/classes", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
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
      const res = await fetch(`/api/classes/${classId}/publish`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
      });
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

  const handleCancelClass = async (classId: string) => {
    if (!classId) return;
    try {
      const res = await fetch(`/api/classes/${classId}/cancel`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCancelModalClass(null);
        setClasses((prev) =>
          prev.map((c) => (c._id === classId ? { ...c, status: "CANCELLED" } : c))
        );
        setActionMessage("Class session cancelled successfully.");
        setTimeout(() => setActionMessage(""), 4000);
        loadClasses();
      } else {
        alert(data.error || "Failed to cancel class.");
      }
    } catch (e: any) {
      console.error("Cancel class error:", e);
      alert("Error cancelling class: " + (e.message || "Network error"));
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!classId) return;
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDeleteModalClass(null);
        setClasses((prev) => prev.filter((c) => c._id !== classId));
        setActionMessage("Class deleted permanently.");
        setTimeout(() => setActionMessage(""), 4000);
        loadClasses();
      } else {
        alert(data.error || "Failed to delete class.");
      }
    } catch (e: any) {
      console.error("Delete class error:", e);
      alert("Error deleting class: " + (e.message || "Network error"));
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredClasses = sortClassesByPriority(
    classes.filter((c: any) => {
      const status = (c.status || "").toUpperCase();
      const isLive = status === "LIVE";
      const isUpcoming = (status === "PUBLISHED" || status === "SCHEDULED" || status === "UPCOMING") && (!c.date || c.date >= todayStr);
      const isCompleted = status === "COMPLETED" || (c.date && c.date < todayStr && status !== "CANCELLED" && status !== "DRAFT");
      const isDraft = status === "DRAFT";
      const isCancelled = status === "CANCELLED";

      if (selectedTab === "LIVE" && !isLive) return false;
      if (selectedTab === "UPCOMING" && !isUpcoming) return false;
      if (selectedTab === "COMPLETED" && !isCompleted) return false;
      if (selectedTab === "DRAFT" && !isDraft) return false;
      if (selectedTab === "CANCELLED" && !isCancelled) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title?.toLowerCase().includes(q) ||
          c.subject?.toLowerCase().includes(q) ||
          c.topic?.toLowerCase().includes(q)
        );
      }
      return true;
    })
  );

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Teaching Timetable & Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View live teaching sessions, swap subject days, manage weekly schedule and monitor classroom status.
          </p>
        </div>

        <Link href="/teacher/live-class/create">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-colors cursor-pointer shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Class</span>
          </button>
        </Link>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
          {actionMessage}
        </div>
      )}

      {/* ── 2. FILTER TABS & SEARCH (FLAT, NO CARDS) ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["ALL", "LIVE", "UPCOMING", "COMPLETED", "DRAFT", "CANCELLED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${selectedTab === tab
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
            >
              {tab === "ALL" ? "All Sessions" : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#004b79]"
          />
        </div>
      </div>

      {/* ── 3. CLASSES LIST (CARDLESS HAIRLINE TABLE) ── */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading schedule...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No classes found</p>
            <p className="text-xs text-slate-400">No scheduled sessions match your filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredClasses.map((cls: any) => (
              <TeacherScheduleClassRow
                key={cls._id}
                cls={cls}
                handlePublishClass={handlePublishClass}
                setSwapModalClass={setSwapModalClass}
                setCancelModalClass={setCancelModalClass}
                setDeleteModalClass={setDeleteModalClass}
              />
            ))}
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

      {/* Delete Class Modal */}
      {deleteModalClass && (
        <Modal
          isOpen={!!deleteModalClass}
          onClose={() => setDeleteModalClass(null)}
          title="Delete Class Session"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete <strong>{deleteModalClass.title || "this class"}</strong>? It will be removed from your schedule and the student timetable.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteModalClass(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(deleteModalClass._id)}>
                Delete Class
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
