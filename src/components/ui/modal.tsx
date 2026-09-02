"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "2xl",
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* ── Soft Blurred Backdrop ── */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* ── Sleek Rectangle Card Modal Container (No Scrollbar, Clean Fit) ── */}
      <div
        className={cn(
          "relative w-full rounded-2xl bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 shadow-2xl z-10 max-h-[94vh] overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5 sm:p-6 transition-all animate-in fade-in zoom-in-98 duration-150",
          maxWidthClasses[maxWidth]
        )}
      >


        {/* Crisp Rectangular Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all border border-slate-200/80 dark:border-slate-700/80 cursor-pointer shadow-2xs"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Modal Title & Description Header */}
        {title && (
          <div className="pb-3.5 mb-4 border-b border-slate-200 dark:border-slate-800 pr-8">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
}
