"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  Clock,
  ShieldCheck,
  Users,
  Eye,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  Hourglass,
  Radio,
} from "lucide-react";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminClassesMonitorPage() {
  const { data, refetch } = useFastFetch("/api/admin/classes");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState<Date>(new Date());

  // Update real-time clock every 10 seconds for live countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const liveSessions = Array.isArray(data?.sessions) ? data.sessions : [];

  const formatSessionDate = (dateStr?: string) => {
    if (!dateStr) return "Date TBD";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const calculateTimeToGo = (session: any) => {
    if (session.status === "CANCELLED") {
      return {
        label: "Cancelled",
        type: "CANCELLED",
        badgeColor: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        isLive: false,
      };
    }

    if (session.status === "COMPLETED") {
      return {
        label: "Concluded",
        type: "COMPLETED",
        badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
        isLive: false,
      };
    }

    if (!session.date || !session.startTime) {
      return {
        label: session.status || "Scheduled",
        type: "UNKNOWN",
        badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-600",
        isLive: false,
      };
    }

    try {
      const [y, m, d] = session.date.split("-").map(Number);
      const [sh, sm] = session.startTime.split(":").map(Number);
      const [eh, em] = (session.endTime || "20:00").split(":").map(Number);

      const startDateTime = new Date(y, m - 1, d, sh, sm);
      const endDateTime = new Date(y, m - 1, d, eh, em);

      const diffMs = startDateTime.getTime() - now.getTime();
      const endDiffMs = endDateTime.getTime() - now.getTime();

      if (session.status === "LIVE" || (diffMs <= 0 && endDiffMs > 0)) {
        const remainingMins = Math.max(1, Math.floor(endDiffMs / (1000 * 60)));
        return {
          label: `LIVE NOW (${remainingMins}m left)`,
          type: "LIVE",
          badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold animate-pulse",
          isLive: true,
        };
      }

      if (endDiffMs <= 0) {
        return {
          label: "Concluded",
          type: "ENDED",
          badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700",
          isLive: false,
        };
      }

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const totalHours = Math.floor(totalMinutes / 60);
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      const minutes = totalMinutes % 60;

      if (days > 0) {
        return {
          label: `Starts in ${days}d ${hours}h`,
          type: "DAYS_AWAY",
          badgeColor: "bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border-blue-200 dark:border-[#004b79]/60",
          isLive: false,
        };
      }

      if (hours > 0) {
        return {
          label: `Starts in ${hours}h ${minutes}m`,
          type: "HOURS_AWAY",
          badgeColor: "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          isLive: false,
        };
      }

      return {
        label: `Starts in ${minutes}m`,
        type: "MINUTES_AWAY",
        badgeColor: "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold",
        isLive: false,
      };
    } catch {
      return {
        label: "Scheduled",
        type: "FUTURE",
        badgeColor: "bg-blue-50 text-[#004b79]",
        isLive: false,
      };
    }
  };

  const getSubjectBadge = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case "mathematics":
        return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800";
      case "science":
      case "physics":
      case "chemistry":
      case "biology":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800";
      case "english":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800";
      default:
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800";
    }
  };

  const filteredSessions = liveSessions.filter((s: any) => {
    const timeToGo = calculateTimeToGo(s);
    if (filterStatus === "LIVE" && !timeToGo.isLive) return false;
    if (filterStatus === "UPCOMING" && (timeToGo.isLive || s.status === "COMPLETED")) return false;
    if (filterStatus === "COMPLETED" && s.status !== "COMPLETED" && timeToGo.type !== "ENDED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title?.toLowerCase().includes(q) ||
        s.subject?.toLowerCase().includes(q) ||
        s.topic?.toLowerCase().includes(q) ||
        s.teacher?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Live Session &amp; Lecture Monitor
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time live lecture monitor, scheduled batch dates, countdowns, and active student attendance turnout.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
          <span>
            {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      </div>

      {/* ── 2. FILTERS & SEARCH ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 overflow-x-auto self-start sm:self-auto">
          {[
            { id: "ALL", label: `All (${liveSessions.length})` },
            { id: "UPCOMING", label: `Upcoming (${liveSessions.filter((s: any) => s.status === "PUBLISHED" || s.status === "SCHEDULED").length})` },
            { id: "LIVE", label: `Live Now (${liveSessions.filter((s: any) => s.status === "LIVE").length})` },
            { id: "COMPLETED", label: `Completed (${liveSessions.filter((s: any) => s.status === "COMPLETED").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search class, subject, teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#004b79] shadow-xs"
          />
        </div>
      </div>

      {/* ── 3. CARDLESS 12-COLUMN SESSIONS TABLE ── */}
      <div className="space-y-2 pt-2">
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-3">Subject &amp; Class</div>
          <div className="col-span-4">Session Topic &amp; Batch</div>
          <div className="col-span-3">Date, Time &amp; Faculty</div>
          <div className="col-span-2 text-right">Status &amp; Action</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredSessions.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <Video className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching sessions found</p>
              <p className="text-xs text-slate-400">Classes scheduled by teachers or administrators will appear here.</p>
            </div>
          ) : (
            filteredSessions.map((s: any) => {
              const timeToGo = calculateTimeToGo(s);
              return (
                <div
                  key={s.id}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                >
                  {/* Col 1: Subject & Class */}
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSubjectBadge(s.subject)}`}>
                        {s.subject}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {s.classLevel}
                      </span>
                    </div>
                  </div>

                  {/* Col 2: Topic & Batch */}
                  <div className="col-span-4 space-y-0.5">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {s.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Batch: {s.batch || "Assigned Batch"} • {s.enrolledCount || 0} Students
                    </p>
                  </div>

                  {/* Col 3: Date, Time & Teacher */}
                  <div className="col-span-3 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                      <span>{formatSessionDate(s.date)}</span>
                      <span className="font-mono text-slate-400">({s.startTime} - {s.endTime})</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Instructor: <strong className="text-slate-700 dark:text-slate-300 font-medium">{s.teacher}</strong>
                    </p>
                  </div>

                  {/* Col 4: Status Badge & Inspect Link */}
                  <div className="col-span-2 flex items-center justify-start md:justify-end gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${timeToGo.badgeColor}`}>
                      {timeToGo.label}
                    </span>

                    <Link href={`/student/classroom/${s.id}`} target="_blank">
                      <button className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs flex items-center gap-1">
                        <Eye className="w-3 h-3 text-[#004b79] dark:text-[#dfb74a]" />
                        <span>Inspect</span>
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
