"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  ArrowLeftRight,
  AlertCircle,
  CheckCircle2,
  CalendarCheck2,
  Shuffle,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ScheduleSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSession: any;
  allSessions: any[];
  onSuccess: () => void;
}

export function ScheduleSwapModal({
  isOpen,
  onClose,
  targetSession,
  allSessions = [],
  onSuccess,
}: ScheduleSwapModalProps) {
  const [activeTab, setActiveTab] = useState<"SWAP" | "RESCHEDULE">("SWAP");
  const [selectedSwapSessionId, setSelectedSwapSessionId] = useState<string>("");
  const [newDate, setNewDate] = useState<string>(
    targetSession?.date || new Date().toISOString().split("T")[0]
  );
  const [newStartTime, setNewStartTime] = useState<string>(targetSession?.startTime || "19:00");
  const [newEndTime, setNewEndTime] = useState<string>(targetSession?.endTime || "20:00");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  if (!targetSession) return null;

  const otherSessions = allSessions.filter(
    (s) => s._id?.toString() !== targetSession._id?.toString()
  );

  const selectedSwapSession = otherSessions.find(
    (s) => s._id?.toString() === selectedSwapSessionId
  );

  const handleSwap = async () => {
    if (!selectedSwapSessionId) {
      setErrorMessage("Please select another session to swap schedule days with.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/teacher/schedule/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionAId: targetSession._id,
          sessionBId: selectedSwapSessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to swap schedule.");
        return;
      }

      setSuccessMessage("Schedule days swapped successfully! Both classes updated.");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to swap session days.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newStartTime || !newEndTime) {
      setErrorMessage("Please choose a valid date and time range.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/teacher/schedule/reschedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: targetSession._id,
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to reschedule session.");
        return;
      }

      setSuccessMessage("Class rescheduled successfully without schedule collisions!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to reschedule class.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Faculty Schedule & Day Swap Manager"
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-200">
        {/* Current Session Summary */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-[#002137]/80 border border-blue-200 dark:border-[#004b79]/60 text-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>SELECTED CLASS SESSION</span>
            <span className="text-[#004b79] dark:text-[#dfb74a] uppercase font-mono">
              {targetSession.classLevel}
            </span>
          </div>
          <p className="font-bold text-sm text-[#002137] dark:text-white">
            {targetSession.title}
          </p>
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              {targetSession.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {targetSession.startTime} – {targetSession.endTime}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-800 font-sans font-semibold">
              {targetSession.subject}
            </span>
          </div>
        </div>

        {/* Action Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-[#002137] p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("SWAP");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "SWAP"
                ? "bg-white dark:bg-[#004b79] text-[#002137] dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Swap Subject Days</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("RESCHEDULE");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "RESCHEDULE"
                ? "bg-white dark:bg-[#004b79] text-[#002137] dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Change Time Slot</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ── MODE 1: SWAP SUBJECT DAYS ── */}
        {activeTab === "SWAP" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select another class session to exchange dates and time slots with. The system guarantees both sessions update simultaneously with zero schedule interruptions.
            </p>

            <div>
              <label className="block text-xs font-bold mb-1">
                Select Class to Swap With:
              </label>
              {otherSessions.length > 0 ? (
                <select
                  value={selectedSwapSessionId}
                  onChange={(e) => setSelectedSwapSessionId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#002137] px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004b79]"
                >
                  <option value="">-- Choose a session to swap with --</option>
                  {otherSessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.date} ({s.startTime}–{s.endTime}) • {s.subject}: {s.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  No other active scheduled sessions available to swap.
                </div>
              )}
            </div>

            {/* Swap Preview Visualization */}
            {selectedSwapSession && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#004b79] dark:text-[#dfb74a] flex items-center gap-1">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Proposed Schedule Exchange</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold">CURRENT SESSION MOVES TO:</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{selectedSwapSession.date}</p>
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      {selectedSwapSession.startTime} – {selectedSwapSession.endTime}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold">SWAPPED SESSION MOVES TO:</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{targetSession.date}</p>
                    <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                      {targetSession.startTime} – {targetSession.endTime}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="button"
              disabled={isLoading || !selectedSwapSessionId}
              onClick={handleSwap}
              className="w-full h-11 font-bold text-xs rounded-xl bg-[#002137] dark:bg-[#004b79] hover:bg-[#001726] dark:hover:bg-[#0284c7] text-white shadow-md"
            >
              {isLoading ? "Swapping Sessions..." : "Confirm & Swap Subject Days →"}
            </Button>
          </div>
        )}

        {/* ── MODE 2: CHANGE TIME SLOT & DATE ── */}
        {activeTab === "RESCHEDULE" && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              Shift this class to a different date or time slot. Automatic collision checks verify that your new slot is free.
            </p>

            <div>
              <label className="block font-bold mb-1">New Date</label>
              <Input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Start Time</label>
                <Input
                  type="time"
                  required
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">End Time</label>
                <Input
                  type="time"
                  required
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Quick Evening Slot Presets */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-bold text-slate-400">
                Quick Evening Batch Presets:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewStartTime("18:00");
                    setNewEndTime("19:00");
                  }}
                  className={`p-2 rounded-lg border text-[11px] font-semibold transition-all ${
                    newStartTime === "18:00" && newEndTime === "19:00"
                      ? "bg-blue-50 dark:bg-[#004b79] border-blue-500 text-[#002137] dark:text-white"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  6:00 – 7:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewStartTime("19:00");
                    setNewEndTime("20:00");
                  }}
                  className={`p-2 rounded-lg border text-[11px] font-semibold transition-all ${
                    newStartTime === "19:00" && newEndTime === "20:00"
                      ? "bg-blue-50 dark:bg-[#004b79] border-blue-500 text-[#002137] dark:text-white"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  7:00 – 8:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewStartTime("20:00");
                    setNewEndTime("21:00");
                  }}
                  className={`p-2 rounded-lg border text-[11px] font-semibold transition-all ${
                    newStartTime === "20:00" && newEndTime === "21:00"
                      ? "bg-blue-50 dark:bg-[#004b79] border-blue-500 text-[#002137] dark:text-white"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  8:00 – 9:00 PM
                </button>
              </div>
            </div>

            <Button
              type="button"
              disabled={isLoading}
              onClick={handleReschedule}
              className="w-full h-11 font-bold text-xs rounded-xl bg-[#002137] dark:bg-[#004b79] hover:bg-[#001726] dark:hover:bg-[#0284c7] text-white shadow-md"
            >
              {isLoading ? "Validating & Rescheduling..." : "Save Rescheduled Time Slot →"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
