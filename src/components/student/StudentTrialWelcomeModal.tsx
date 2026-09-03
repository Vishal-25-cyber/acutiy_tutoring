"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Sparkles, Video, BookOpen, Clock, CheckCircle2, ArrowRight } from "lucide-react";

interface StudentTrialWelcomeModalProps {
  userId?: string;
  studentName?: string;
  remainingHours?: number;
  trialEndsAt?: string | Date;
  isTrialActive: boolean;
}

export function StudentTrialWelcomeModal({
  userId,
  studentName = "Student",
  remainingHours = 48,
  trialEndsAt,
  isTrialActive,
}: StudentTrialWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isTrialActive || !userId) return;

    // Show on each login session
    const storageKey = `mantif_trial_welcome_seen_${userId}`;
    const alreadySeenInSession = sessionStorage.getItem(storageKey);

    if (!alreadySeenInSession) {
      // Delay slightly for smooth page entrance
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isTrialActive, userId]);

  const handleDismiss = () => {
    if (userId) {
      try {
        sessionStorage.setItem(`mantif_trial_welcome_seen_${userId}`, "true");
      } catch {}
    }
    setIsOpen(false);
  };

  if (!isTrialActive) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      maxWidth="md"
      title="🌟 2-Day Free Trial Active"
      description="Enjoy full access to Mantif's online classrooms and study resources."
    >
      <div className="space-y-4 pt-1 text-slate-800 dark:text-slate-100 select-none">
        {/* Banner with Countdown */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#002137] to-[#003659] text-white space-y-2 border border-[#dfb74a]/30 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-[#dfb74a]/20 text-[#dfb74a] border border-[#dfb74a]/30">
              Complimentary Trial
            </span>
            <span className="font-mono text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{remainingHours}h remaining</span>
            </span>
          </div>
          <h2 className="text-base font-black text-white">
            Welcome, {studentName}!
          </h2>
          <p className="text-xs text-slate-200 leading-relaxed">
            Your 2-Day Free Trial is live. You can attend all live interactive classes, download NCERT notes, and submit homework tasks without paying fees.
          </p>
        </div>

        {/* Benefits Checklist */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">100% Free Live Audio/Video WebRTC Sessions</span>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">Unrestricted Chapter Notes &amp; Formulas</span>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">No advance payment or credit card required</span>
          </div>
        </div>

        {/* Dismiss Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-3 px-4 rounded-xl bg-[#002137] hover:bg-[#003659] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <span>Start Learning Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default StudentTrialWelcomeModal;
