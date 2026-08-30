import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "glow" | "gold";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl cursor-pointer select-none";

    const variants = {
      default: "bg-[#002137] text-white hover:bg-[#083353] dark:bg-[#dfb74a] dark:text-[#002137] dark:hover:bg-[#f7d87c] shadow-sm focus-visible:ring-[#002137]",
      primary: "bg-[#002137] text-white hover:bg-[#083353] dark:bg-[#dfb74a] dark:text-[#002137] dark:hover:bg-[#f7d87c] shadow-sm shadow-[#002137]/20 focus-visible:ring-[#002137]",
      gold: "bg-gradient-to-r from-[#b89047] via-[#dfb74a] to-[#b89047] text-[#002137] font-bold hover:brightness-105 shadow-md shadow-[#b89047]/20 focus-visible:ring-[#b89047]",
      secondary: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:ring-slate-400",
      outline: "border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus-visible:ring-[#002137]",
      ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus-visible:ring-slate-400",
      destructive: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500",
      success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
      glow: "bg-[#002137] text-white hover:bg-[#083353] border border-[#b89047]/50 shadow-md shadow-[#b89047]/20",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 px-4 text-xs sm:text-sm",
      lg: "h-11 px-6 text-sm font-semibold",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
