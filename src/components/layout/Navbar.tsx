"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, Sparkles, PhoneCall, ArrowRight, Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" prefetch={true} className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                ACUITY
              </span>
              <Badge variant="default" className="text-[10px] px-2 py-0 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                Classes 1–10
              </Badge>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Live Interactive Tutoring
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            How It Works
          </Link>
          <Link href="#classes" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Curriculum 1–10
          </Link>
          <Link href="#live-learning" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Live Classes
          </Link>
          <Link href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Learning Hub
          </Link>
          <Link href="#parent-benefits" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Parents
          </Link>
          <Link href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Fee Structure
          </Link>
        </nav>

        {/* Auth CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" prefetch={true}>
            <Button variant="ghost" size="md" className="font-semibold text-slate-700 dark:text-slate-200">
              Sign In
            </Button>
          </Link>
          <Link href="/register/student" prefetch={true}>
            <Button variant="primary" size="md" className="shadow-lg shadow-indigo-500/20 font-semibold gap-2">
              <span>Enroll Student</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3 text-sm font-medium">
            <Link
              href="#how-it-works"
              onClick={() => setIsOpen(false)}
              className="text-slate-700 dark:text-slate-200 py-1"
            >
              How It Works
            </Link>
            <Link
              href="#classes"
              onClick={() => setIsOpen(false)}
              className="text-slate-700 dark:text-slate-200 py-1"
            >
              Classes 1–10 Curriculum
            </Link>
            <Link
              href="#live-learning"
              onClick={() => setIsOpen(false)}
              className="text-slate-700 dark:text-slate-200 py-1"
            >
              Live Interactive Classes
            </Link>
            <Link
              href="#parent-benefits"
              onClick={() => setIsOpen(false)}
              className="text-slate-700 dark:text-slate-200 py-1"
            >
              Parent Portal
            </Link>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                Sign In
              </Button>
            </Link>
            <Link href="/register/student" onClick={() => setIsOpen(false)}>
              <Button variant="primary" className="w-full justify-center">
                Student Registration
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
