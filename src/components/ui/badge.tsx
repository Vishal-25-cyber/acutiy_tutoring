import * as React from "react";
import { cn } from "./button";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "gold"
    | "secondary"
    | "outline"
    | "destructive"
    | "success"
    | "warning"
    | "info"
    | "riskLow"
    | "riskMedium"
    | "riskHigh"
    | "live";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#002137]/10 dark:bg-[#dfb74a]/15 text-[#002137] dark:text-[#dfb74a] border-[#002137]/20 dark:border-[#dfb74a]/30",
    gold: "bg-[#b89047]/15 text-[#8f6d2b] dark:text-[#dfb74a] border-[#b89047]/30",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    outline: "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300",
    destructive: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    success: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    warning: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    info: "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    riskLow: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
    riskMedium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
    riskHigh: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 animate-pulse-subtle",
    live: "bg-red-500 text-white font-bold animate-pulse shadow-sm shadow-red-500/50 border-transparent",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
