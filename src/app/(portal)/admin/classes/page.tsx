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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminClassesMonitorPage() {
  const { data, refetch } = useFastFetch("/api/admin/classes");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState<Date>(new Date());

  // Update real-time clock every 10 seconds for precise live countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const liveSessions = Array.isArray(data?.sessions) ? data.sessions : [];

  // Helper to format date cleanly
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

  // Helper to format 24h time to 12h AM/PM
  const formatTime12h = (timeStr?: string) => {
    if (!timeStr) return "";
    try {
      const [h, m] = timeStr.split(":");
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Calculate exact days, hours, and minutes remaining
  const calculateTimeToGo = (session: any) => {
    if (session.status === "CANCELLED") {
      return {
        label: "Session Cancelled",
        type: "CANCELLED",
        badgeColor: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        isLive: false,
      };
    }

    if (session.status === "COMPLETED") {
      return {
        label: `✓ Concluded on ${formatSessionDate(session.date)}`,
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

      // Check if session is currently LIVE
      if (session.status === "LIVE" || (diffMs <= 0 && endDiffMs > 0)) {
        const remainingMins = Math.max(1, Math.floor(endDiffMs / (1000 * 60)));
        return {
          label: `🔴 LIVE NOW (${remainingMins} min${remainingMins !== 1 ? "s" : ""} left)`,
          type: "LIVE",
          badgeColor: "bg-rose-500 text-white font-bold animate-pulse shadow-xs",
          isLive: true,
        };
      }

      // Check if session already ended in the past
      if (endDiffMs <= 0) {
        return {
          label: `Concluded on ${formatSessionDate(session.date)}`,
          type: "ENDED",
          badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700",
          isLive: false,
        };
      }

      // Session is in the future: calculate days, hours, minutes
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const totalHours = Math.floor(totalMinutes / 60);
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      const minutes = totalMinutes % 60;

      if (days > 0) {
        return {
          label: `Starts in ${days} day${days > 1 ? "s" : ""}, ${hours} hr${hours !== 1 ? "s" : ""}`,
          type: "DAYS_AWAY",
          badgeColor: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          isLive: false,
        };
      }

      if (hours > 0) {
        return {
          label: `Starts today in ${hours} hr${hours !== 1 ? "s" : ""}, ${minutes} min${minutes !== 1 ? "s" : ""}`,
          type: "HOURS_AWAY",
          badgeColor: "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          isLive: false,
        };
      }

      return {
        label: `Starts in ${minutes} minute${minutes !== 1 ? "s" : ""}`,
        type: "MINUTES_AWAY",
        badgeColor: "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold",
        isLive: false,
      };
    } catch {
      return {
        label: "Upcoming Session",
        type: "FUTURE",
        badgeColor: "bg-indigo-50 text-indigo-700",
        isLive: false,
      };
    }
  };

  const getSessionPriorityTier = (s: any) => {
    const nowMs = now.getTime();
    if (s.status === "LIVE") return { tier: 0, time: 0 };

    let startMs = 0;
    let endMs = 0;
    if (s.date && s.startTime) {
      const [y, m, d] = s.date.split("-").map(Number);
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = (s.endTime || "20:00").split(":").map(Number);
      startMs = new Date(y, m - 1, d, sh, sm).getTime();
      endMs = new Date(y, m - 1, d, eh, em).getTime();
    }

    if (startMs <= nowMs && endMs > nowMs && s.status !== "CANCELLED" && s.status !== "COMPLETED") {
      return { tier: 0, time: 0 };
    }

    if (startMs > nowMs && s.status !== "CANCELLED") {
      return { tier: 1, time: startMs }; // Nearest upcoming first
    }

    if (s.status === "CANCELLED") {
      return { tier: 3, time: -startMs };
    }

    return { tier: 2, time: -endMs }; // Most recently ended first
  };

  const filteredSessions = liveSessions
    .filter((s: any) => {
      const matchesStatus =
        filterStatus === "ALL"
          ? true
          : filterStatus === "LIVE"
          ? s.status === "LIVE"
          : filterStatus === "UPCOMING"
          ? s.status === "PUBLISHED" || s.status === "SCHEDULED"
          : filterStatus === "COMPLETED"
          ? s.status === "COMPLETED"
          : true;

      const matchesSearch =
        !searchQuery ||
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.teacher?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.classLevel?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    })
    .sort((a: any, b: any) => {
      const pA = getSessionPriorityTier(a);
      const pB = getSessionPriorityTier(b);
      if (pA.tier !== pB.tier) return pA.tier - pB.tier;
      return pA.time - pB.time;
    });

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-7xl animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Live Session Monitor
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse">
              ● REAL-TIME LIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time live lecture monitor, scheduled batch dates, countdowns, and active student attendance turnout.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 self-start md:self-auto">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>
            {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-x-auto">
          {[
            { id: "ALL", label: `All (${liveSessions.length})` },
            { id: "UPCOMING", label: `Upcoming (${liveSessions.filter((s: any) => s.status === "PUBLISHED" || s.status === "SCHEDULED").length})` },
            { id: "LIVE", label: `Live Now (${liveSessions.filter((s: any) => s.status === "LIVE").length})` },
            { id: "COMPLETED", label: `Completed (${liveSessions.filter((s: any) => s.status === "COMPLETED").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search class, subject, teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* ── SESSIONS LIST ── */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <Video className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching classes found</p>
            <p className="text-xs text-slate-400">
              Classes created by teachers or scheduled by administrators will appear here in real-time.
            </p>
          </div>
        ) : (
          filteredSessions.map((s: any) => {
            const timeToGo = calculateTimeToGo(s);
            const timeRangeFormatted = `${formatTime12h(s.startTime)} – ${formatTime12h(s.endTime)}`;

            return (
              <Card
                key={s.id}
                className={`p-5 sm:p-6 border transition-all ${
                  timeToGo.isLive
                    ? "border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10 shadow-sm ring-2 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-indigo-200 dark:hover:border-indigo-800"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Subject, Class, Date & Time, Countdown */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {s.subject}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {s.classLevel}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        • Batch: {s.batch}
                      </span>

                      {/* Real-Time "Days & Time to Go" Countdown Badge */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${timeToGo.badgeColor}`}
                      >
                        <Hourglass className="w-3 h-3" />
                        <span>{timeToGo.label}</span>
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      {s.title}
                    </h2>

                    {s.topic && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        Topic: {s.topic}
                      </p>
                    )}

                    {/* Schedule Date & Time Information */}
                    <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatSessionDate(s.date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{timeRangeFormatted}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          Faculty: <strong className="text-slate-800 dark:text-slate-200">{s.teacher}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span>
                          Enrolled Batch: <strong className="text-slate-700 dark:text-slate-300">{s.enrolledCount} Students</strong>
                        </span>
                        {s.participantsCount > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            (Attended: {s.participantsCount})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    {timeToGo.isLive ? (
                      <Link href={`/student/classroom/${s.id}`} target="_blank">
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-md animate-pulse"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Live Stream</span>
                        </Button>
                      </Link>
                    ) : s.status === "COMPLETED" ? (
                      <Link href={`/student/classroom/${s.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Class Record</span>
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/student/classroom/${s.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Room</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}
