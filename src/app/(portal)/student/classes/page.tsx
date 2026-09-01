"use client";

import React from "react";
import Link from "next/link";
import {
  Video,
  Clock,
  User,
  CalendarDays,
  Radio,
  ArrowRight,
  Lock,
  Download,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFastFetch } from "@/lib/api-cache";
import { downloadTimetableDoc } from "@/lib/download";
import { useClassLiveTimer } from "@/lib/use-class-timer";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentClassesPage() {
  const { data } = useFastFetch("/api/student/classes");
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isDownloaded, setIsDownloaded] = React.useState(false);

  // Live real-time current day from browser's local timezone
  const [liveDay, setLiveDay] = React.useState<string>(() => {
    return typeof window !== "undefined" ? DAYS_OF_WEEK[new Date().getDay()] : "Tuesday";
  });

  React.useEffect(() => {
    const updateDay = () => setLiveDay(DAYS_OF_WEEK[new Date().getDay()]);
    updateDay();
    const interval = setInterval(updateDay, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentClass = data?.currentClass || "Class 10";
  const board = data?.board || "CBSE";
  const currentDay = liveDay || data?.currentDay || "Tuesday";
  const batch = data?.batch;
  const batchName = batch?.name || "7:00 PM – 8:00 PM";

  // Real-time live timer & meeting lock status
  const timing = useClassLiveTimer(batch);

  const defaultWeeklySchedule = [
    {
      day: "Monday",
      time: batchName,
      subject: "Mathematics",
      topic: "Quadratic Equations — Discriminant & Real Roots Formula",
      faculty: "Dr. Sarah Jenkins",
      status: "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "Step-by-step problem solving on quadratic equations and discriminant analysis.",
    },
    {
      day: "Tuesday",
      time: batchName,
      subject: "Science",
      topic: "Light: Reflection & Refraction — Ray Diagrams Exemplar",
      faculty: "Prof. Rajesh Kumar",
      status: "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "Concave and convex mirrors ray tracing with NCERT exemplar problems.",
    },
    {
      day: "Wednesday",
      time: batchName,
      subject: "Mathematics",
      topic: "Arithmetic Progressions — nth Term & Sum of Terms",
      faculty: "Dr. Sarah Jenkins",
      status: "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "Derivations of Sn formulas and finding nth terms in arithmetic series.",
    },
    {
      day: "Thursday",
      time: batchName,
      subject: "English",
      topic: "Analytical Paragraph & Advanced Grammar Clauses",
      faculty: "Ms. Anita Desai",
      status: "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "High-scoring writing techniques and active/passive voice application.",
    },
    {
      day: "Friday",
      time: batchName,
      subject: "Social Science",
      topic: "Nationalism in India / Life Processes Core Concepts",
      faculty: "Prof. Rajesh Kumar",
      status: "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "Timeline of the freedom movement and important map markers.",
    },
    {
      day: "Saturday",
      time: batchName,
      subject: "Revision & Doubts",
      topic: "Weekly Test Analysis, Doubt Resolution & Worksheet Solving",
      faculty: "Senior Academic Faculty",
      status: "SCHEDULED",
      roomId: timing.permanentRoomId,
      description: "Comprehensive review of the week's curriculum with live doubt solving.",
    },
  ];

  const todayDateStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isWithinClassWindow = (c: any) => {
    if (!c) return false;
    if (c.status === "LIVE") return true;
    if (c.status === "PUBLISHED" || c.status === "SCHEDULED") {
      const [sh = "0", sm = "0"] = (c.startTime || "").split(":");
      const [eh = "23", em = "59"] = (c.endTime || "").split(":");
      const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10);
      const endMin = parseInt(eh, 10) * 60 + parseInt(em, 10);
      const isOvernight = endMin < startMin;
      const effectiveEndMin = isOvernight ? endMin + 1440 : endMin;
      const effectiveCurrentMin =
        isOvernight && currentMinutes < startMin - 15
          ? currentMinutes + 1440
          : currentMinutes;
      return effectiveCurrentMin >= (startMin - 15) && effectiveCurrentMin <= effectiveEndMin;
    }
    return false;
  };

  const todayDbClass = data?.classes?.find(
    (c: any) =>
      c.status !== "CANCELLED" &&
      c.status !== "COMPLETED" &&
      (!c.date || c.date === todayDateStr)
  );

  const liveClassDoc =
    data?.classes?.find((c: any) => c.status === "LIVE") ||
    data?.classes?.find((c: any) => (!c.date || c.date === todayDateStr) && isWithinClassWindow(c));

  const isClassCurrentlyLive = Boolean(liveClassDoc) || Boolean(todayDbClass);
  const activeDoc = liveClassDoc || todayDbClass;
  const liveOrTodayDbClass = activeDoc;

  const weeklySchedule = (
    Array.isArray(data?.weeklySchedule) && data.weeklySchedule.length > 0
      ? data.weeklySchedule.map((s: any) => ({ ...s, roomId: timing.permanentRoomId }))
      : defaultWeeklySchedule
  ).map((item: any) => {
    const isToday = currentDay.toLowerCase() === item.day.toLowerCase() || liveDay.toLowerCase() === item.day.toLowerCase();
    if (isToday && activeDoc) {
      return {
        ...item,
        subject: activeDoc.subject || item.subject,
        topic: activeDoc.topic || activeDoc.title || item.topic,
        faculty: (typeof activeDoc.teacherId === "object" && activeDoc.teacherId?.name) || item.faculty,
        startTime: activeDoc.startTime || item.startTime,
        endTime: activeDoc.endTime || item.endTime,
        time: activeDoc.startTime && activeDoc.endTime ? `${activeDoc.startTime} – ${activeDoc.endTime}` : item.time,
        status: isClassCurrentlyLive ? "LIVE" : "SCHEDULED",
        roomId: activeDoc.livekitRoomId || activeDoc.meetingId || timing.permanentRoomId,
      };
    }
    return item;
  });

  const todayScheduleItem =
    weeklySchedule.find((s: any) => s.day.toLowerCase() === currentDay.toLowerCase()) ||
    weeklySchedule.find((s: any) => s.day.toLowerCase() === liveDay.toLowerCase()) ||
    weeklySchedule[1];

  const activeSubject = activeDoc?.subject || todayScheduleItem?.subject || "Mathematics";
  const activeTopic =
    activeDoc?.topic ||
    activeDoc?.title ||
    todayScheduleItem?.topic ||
    "Quadratic Equations";
  const activeFaculty =
    (typeof activeDoc?.teacherId === "object" && activeDoc?.teacherId?.name) ||
    todayScheduleItem?.faculty ||
    "Faculty Specialist";
  const activeRoomId =
    activeDoc?.livekitRoomId || activeDoc?.meetingId || todayScheduleItem?.roomId || timing.permanentRoomId;

  const getSubjectAccent = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case "mathematics":
        return { dot: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400" };
      case "science":
      case "physics":
      case "chemistry":
        return { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
      case "english":
        return { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" };
      case "social science":
        return { dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" };
      default:
        return { dot: "bg-purple-500", text: "text-purple-600 dark:text-purple-400" };
    }
  };

  const handleDownloadTimetable = () => {
    setIsDownloading(true);
    setTimeout(() => {
      const success = downloadTimetableDoc({
        currentClass,
        board,
        batchName,
        weeklySchedule,
      });
      setIsDownloading(false);
      if (success) {
        setIsDownloaded(true);
        setTimeout(() => {
          setIsDownloaded(false);
        }, 3000);
      }
    }, 150);
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">

      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-row items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Live Classes & Timetable
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTimetable}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {isDownloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Download Timetable</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── TUITION FEE LOCK PAYWALL (IF LOCKED & TRIAL EXPIRED) ── */}
      {data?.locked ? (
        <div className="py-6 sm:py-10 flex items-center justify-center">
          <div className="w-full max-w-xl p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center space-y-6">

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-50/50 dark:ring-amber-950/20">
              {data.isUnderReview ? (
                <Clock className="w-7 h-7 animate-spin text-amber-600 dark:text-amber-400" />
              ) : (
                <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {data.isUnderReview ? "Tuition Payment Under Verification" : "2-Day Free Trial Concluded"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {data.isUnderReview
                  ? "Your fee submission is currently under verification by the administration. Live class joining will unlock immediately upon approval."
                  : `Your complimentary 2-day trial has concluded. Please clear your monthly tuition fee to continue attending live interactive coaching classes.`}
              </p>
            </div>

            {/* Fee & Month Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Due Amount: <strong className="text-slate-900 dark:text-slate-100 font-bold">₹{data.unpaidFee?.amount || 1999}</strong></span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>Billing Cycle: <strong className="text-slate-900 dark:text-slate-100 font-bold">{data.unpaidFee?.billingMonth || "Current Cycle"}</strong></span>
            </div>

            {/* Features Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-left">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Live Video Classes</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Live Doubt Solving</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Attendance Log</span>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/student/fees" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-[#004b79] hover:bg-[#003b60] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-all cursor-pointer">
                  {data.isUnderReview ? "View Payment Verification Status →" : `Pay Tuition Fee (₹${data.unpaidFee?.amount || 1999}) →`}
                </Button>
              </Link>
              <Link href="/student/fees" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">
                  View Fee Receipts & QR
                </Button>
              </Link>
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* ── 2. CARDLESS ACTIVE LIVE SESSION SECTION ── */}
          <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {isClassCurrentlyLive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      CLASS IS LIVE NOW
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {liveOrTodayDbClass ? "SCHEDULED FOR TODAY" : "TIMED ENTRY LOCK"}
                    </span>
                  )}

                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                    {batchName}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs font-mono text-slate-400">
                    Room: {activeRoomId}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {activeSubject}: {activeTopic}
                </h2>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Instructor: <span className="font-medium text-slate-800 dark:text-slate-200">{activeFaculty}</span> • Direct Interactive Live Classroom
                </p>
              </div>

              <div className="shrink-0">
                {isClassCurrentlyLive ? (
                  <Link href={`/classroom/${activeRoomId}`}>
                    <Button
                      size="lg"
                      className="font-bold text-sm px-6 py-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-sm cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Live Classroom</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-1 text-left lg:text-right">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{liveOrTodayDbClass ? `Starts at ${liveOrTodayDbClass.startTime}` : timing.countdownText}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {liveOrTodayDbClass ? `Live session for ${batchName}` : `Opens automatically during ${batchName}`}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── 3. WEEKLY SCHEDULE TABLE (CARDLESS HAIRLINE DESIGN) ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Weekly Class Schedule & Timetable
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">Monday – Saturday</span>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
              <div className="col-span-2">Day & Timing</div>
              <div className="col-span-5">Subject & Topic</div>
              <div className="col-span-3">Faculty Instructor</div>
              <div className="col-span-2 text-right">Class Status</div>
            </div>

            {/* Schedule Rows (No Boxed Cards) */}
            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {weeklySchedule.map((item: any, idx: number) => {
                const isToday = currentDay.toLowerCase() === item.day.toLowerCase();
                const canJoinToday = isToday && timing.canJoin;
                const accent = getSubjectAccent(item.subject);

                return (
                  <div
                    key={idx}
                    className={`py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors ${isToday ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""
                      }`}
                  >
                    {/* Col 1: Day & Time */}
                    <div className="col-span-2 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {item.day}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-indigo-600 text-white">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {item.time || batchName}
                      </p>
                    </div>

                    {/* Col 2: Subject & Topic */}
                    <div className="col-span-5 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${accent.dot} shrink-0`} />
                        <span className={`text-xs font-bold ${accent.text}`}>
                          {item.subject}
                        </span>
                      </div>
                      <p className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        {item.topic}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.description}
                      </p>
                    </div>

                    {/* Col 3: Faculty */}
                    <div className="col-span-3">
                      <p className="font-medium text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        {item.faculty}
                      </p>
                      <p className="text-[10px] text-slate-400">Faculty Specialist</p>
                    </div>

                    {/* Col 4: Status / Join Action */}
                    <div className="col-span-2 flex items-center justify-start md:justify-end">
                      {canJoinToday ? (
                        <Link href={`/classroom/${timing.permanentRoomId}`}>
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer">
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Live</span>
                          </button>
                        </Link>
                      ) : isToday ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400">
                          <Lock className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">{timing.countdownText}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Scheduled</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </>
      )}

    </main>
  );
}
