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


        {/* Sleek Modern Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 sm:right-5 top-4 sm:top-5 w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:border-rose-900/60 dark:hover:text-rose-400 transition-all duration-200 border border-slate-200/90 dark:border-slate-800 cursor-pointer shadow-2xs hover:shadow-xs group"
          title="Close"
        >
          <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
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
