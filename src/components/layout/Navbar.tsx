"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "About", href: "/#about" },
    { name: "Tutoring Hub", href: "/#tutoring-hub" },
    { name: "Our Side", href: "/#our-side" },
    { name: "Team", href: "/#team" },
    { name: "Testimonials", href: "/#testimonials" },
    { name: "Gallery", href: "/#gallery" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#001726]/95 backdrop-blur-md transition-all shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-20 flex items-center justify-between">
        {/* Brand Logo & Name (Left Side - Clean Logo, Shifted Left, Stylized Λ matching logo) */}
        <Link href="/" prefetch={true} className="flex items-center gap-3.5 group shrink-0">
          <img
            src="/images/mantif_logo.png"
            alt="Mantif Logo"
            className="w-12 h-12 sm:w-[50px] sm:h-[50px] object-contain group-hover:scale-105 transition-transform shrink-0"
          />
          <div className="flex flex-col justify-center">
            <span
              className="font-black text-[22px] tracking-[0.16em] text-[#002137] dark:text-white leading-tight select-none"
              style={{ fontFamily: "'Montserrat', 'Outfit', 'Inter', sans-serif" }}
            >
              M<span className="text-[#b89047] dark:text-[#dfb74a]">Λ</span>NTIF
            </span>
            <p className="text-[11px] font-bold text-[#b89047] dark:text-[#dfb74a] tracking-tight leading-none mt-0.5">
              Human x Artificial Intelligence
            </p>
          </div>
        </Link>

        {/* Desktop Navigation & 3-Lines Sidebar Button */}
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden lg:flex items-center gap-7 xl:gap-8 text-sm font-bold text-slate-700 dark:text-slate-200">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative py-1 text-slate-600 hover:text-[#004b79] dark:text-slate-300 dark:hover:text-[#dfb74a] transition-colors group"
              >
                <span>{item.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#004b79] dark:bg-[#dfb74a] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* 3-Lines Hamburger Button (Universal on Desktop & Mobile) */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:text-[#004b79] dark:text-slate-300 dark:hover:text-[#dfb74a] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer shadow-2xs"
            aria-label="Toggle navigation sidebar"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Slide-out Sidebar Drawer with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          <aside className="fixed top-0 right-0 bottom-0 w-80 sm:w-96 max-w-[88vw] bg-white dark:bg-[#001726] text-slate-900 dark:text-slate-100 shadow-2xl z-50 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
              <div className="flex items-center gap-3">
                <img src="/images/mantif_logo.png" alt="Mantif Logo" className="w-10 h-10 object-contain" />
                <div className="flex flex-col">
                  <span
                    className="font-black text-lg tracking-[0.14em] text-[#002137] dark:text-white leading-tight"
                    style={{ fontFamily: "'Montserrat', 'Outfit', 'Inter', sans-serif" }}
                  >
                    M<span className="text-[#b89047] dark:text-[#dfb74a]">Λ</span>NTIF
                  </span>
                  <span className="text-[10px] font-bold text-[#b89047] dark:text-[#dfb74a] tracking-tight">
                    Human x Artificial Intelligence
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2 px-1">
                Navigation
              </p>
              {navLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-base font-bold text-slate-700 dark:text-slate-200 hover:text-[#004b79] dark:hover:text-[#dfb74a] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
              <Link
                href="/#about"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#002137] hover:bg-[#003657] text-white text-center font-bold text-xs sm:text-sm block transition-all shadow-sm"
              >
                Admission &amp; Portal Login →
              </Link>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
