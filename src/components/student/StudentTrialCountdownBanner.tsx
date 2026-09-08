"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface StudentTrialCountdownBannerProps {
  trialEndsAt?: string | Date;
  trialStartDate?: string | Date;
  remainingHours?: number;
  studentName?: string;
  onExpire?: () => void;
}

export function StudentTrialCountdownBanner({
  trialEndsAt,
  remainingHours = 48,
  onExpire,
}: StudentTrialCountdownBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  }>({
    days: 0,
    hours: Math.min(48, remainingHours),
    minutes: 0,
    seconds: 0,
    totalMs: Math.min(48, remainingHours) * 3600 * 1000,
  });

  useEffect(() => {
    if (!trialEndsAt) return;

    const endMs = new Date(trialEndsAt).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const diffMs = Math.max(0, endMs - nowMs);

      if (diffMs <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalMs: 0,
        });
        if (onExpire) {
          onExpire();
        }
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        totalMs: diffMs,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [trialEndsAt, onExpire]);

  const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium select-none">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
      <Clock className="w-3.5 h-3.5 text-[#8c6924] dark:text-amber-400 shrink-0" />
      <span className="text-slate-600 dark:text-slate-300 font-semibold">Trial ends:</span>
      <span className="font-mono font-bold text-[#8c6924] dark:text-amber-400">
        {pad(timeLeft.days)}d : {pad(timeLeft.hours)}h : {pad(timeLeft.minutes)}m : {pad(timeLeft.seconds)}s
      </span>
    </div>
  );
}

export default StudentTrialCountdownBanner;
