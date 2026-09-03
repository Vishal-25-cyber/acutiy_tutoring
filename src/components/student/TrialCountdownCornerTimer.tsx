"use client";

import React, { useState, useEffect } from "react";
import { Clock, Sparkles } from "lucide-react";

interface TrialCountdownCornerTimerProps {
  trialEndsAt?: string | Date;
  remainingHours?: number;
}

export function TrialCountdownCornerTimer({
  trialEndsAt,
  remainingHours: propHours,
}: TrialCountdownCornerTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    percent: number;
  }>({
    hours: propHours || 48,
    minutes: 0,
    seconds: 0,
    percent: 100,
  });

  useEffect(() => {
    if (!trialEndsAt) return;

    const endTime = new Date(trialEndsAt).getTime();
    const totalTrialDurationMs = 48 * 60 * 60 * 1000; // 48 Hours Total

    const updateTimer = () => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, percent: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const percent = Math.min(100, Math.max(0, (diff / totalTrialDurationMs) * 100));

      setTimeLeft({ hours, minutes, seconds, percent });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [trialEndsAt]);

  // Circular progress SVG calculations
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft.percent / 100) * circumference;

  const formattedTime = `${timeLeft.hours}h ${String(timeLeft.minutes).padStart(2, "0")}m ${String(
    timeLeft.seconds
  ).padStart(2, "0")}s`;

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-[#001b2e] border border-slate-200/90 dark:border-[#dfb74a]/30 shadow-xs select-none animate-in fade-in duration-200">
      {/* Animated Loading Circular SVG Timer */}
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        <svg className="w-9 h-9 transform -rotate-90" viewBox="0 0 38 38">
          {/* Background Track */}
          <circle
            cx="19"
            cy="19"
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="3"
            fill="transparent"
          />
          {/* Animated Loading Ring */}
          <circle
            cx="19"
            cy="19"
            r={radius}
            className="stroke-[#004b79] dark:stroke-[#dfb74a] transition-all duration-1000 ease-linear"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Pulsing center icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dfb74a] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#dfb74a]"></span>
          </span>
        </div>
      </div>

      {/* Countdown Text */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Free Trial
          </span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold">
            Active
          </span>
        </div>
        <span className="font-mono text-xs font-black text-slate-800 dark:text-[#dfb74a] tracking-tight">
          {formattedTime}
        </span>
      </div>
    </div>
  );
}

export default TrialCountdownCornerTimer;
