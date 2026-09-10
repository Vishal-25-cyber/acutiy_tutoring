"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Clock, ArrowRight } from "lucide-react";

interface StudentTrialWelcomeModalProps {
  userId?: string;
  studentName?: string;
  remainingHours?: number;
  /** Kept for API compatibility — not rendered in this modal. */
  trialEndsAt?: string | Date;
  isTrialActive: boolean;
  hasSeenTrialWelcome?: boolean;
}

export function StudentTrialWelcomeModal({
  userId,
  studentName = "Student",
  remainingHours = 48,
  trialEndsAt: _trialEndsAt, // acknowledged but not used
  isTrialActive,
  hasSeenTrialWelcome = false,
}: StudentTrialWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isTrialActive || !userId) return;

    // If the DB says they've already seen it, never show again
    if (hasSeenTrialWelcome) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [isTrialActive, userId, hasSeenTrialWelcome]);

  const handleDismiss = () => {
    setIsOpen(false);
    // Persist to DB so it never shows again on any device / browser
    if (userId) {
      fetch("/api/student/trial/seen", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    }
  };

  if (!isTrialActive) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      maxWidth="sm"
      title="🎉 2-Day Free Trial Active"
      description={`Welcome, ${studentName}! You have full access to all live classes and study materials.`}
    >
      <div className="space-y-4 pt-1 text-slate-800 dark:text-slate-100 select-none">
        {/* Time remaining pill */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
          <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Time Remaining</span>
          </span>
          <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
            {remainingHours} Hours
          </span>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-2.5 px-4 rounded-xl bg-[#002137] hover:bg-[#003659] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <span>Start Learning</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Modal>
  );
}

export default StudentTrialWelcomeModal;
