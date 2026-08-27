"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, BookOpen, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";

export interface PaymentSuccessData {
  paymentId: string;
  courseName: string;
  courseId?: string;
  amount: number;
  transactionId: string;
  receiptNumber?: string;
  billingMonth?: string;
}

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PaymentSuccessData | null;
}

export function PaymentSuccessModal({ isOpen, onClose, data }: PaymentSuccessModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen && data) {
      // Trigger subtle celebration confetti
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#6366f1", "#f59e0b", "#3b82f6"],
        });
      } catch {
        // Fallback gracefully if canvas-confetti is not loaded in SSR
      }
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const handleStartLearning = () => {
    onClose();
    // Navigate to courses/classes hub or student classes
    router.push("/student/classes");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window with subtle scale & fade */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.3,
          }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden z-10"
        >
          {/* Top Emerald Header Glow Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />

          <div className="p-6 sm:p-8 space-y-6 text-center">
            {/* Animated Checkmark Circle */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 15 }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30"
            >
              <Check className="w-10 h-10 stroke-[3]" />
            </motion.div>

            {/* Title & Status */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Verification</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Payment Successful
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Your payment has been successfully verified.
              </p>
            </div>

            {/* Payment Details Card */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-4 text-left space-y-3 text-xs">
              <div className="flex justify-between items-start border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
                <span className="text-slate-500 font-medium">Course:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-right max-w-[200px] truncate">
                  {data.courseName}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
                <span className="text-slate-500 font-medium">Amount:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  ₹{data.amount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
                <span className="text-slate-500 font-medium">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                  {data.transactionId}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Your course access has now been unlocked.</span>
              </div>
            </div>

            {/* Start Learning Action Button */}
            <div className="space-y-2 pt-2">
              <Button
                variant="glow"
                size="lg"
                onClick={handleStartLearning}
                className="w-full font-bold text-sm py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 group"
              >
                <span>Start Learning</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Receipt and tax invoice generated automatically.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export default PaymentSuccessModal;
