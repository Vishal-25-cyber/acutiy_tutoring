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
        <Link href="/" prefetch={true} className="flex items-center gap-3 group shrink-0">
          <img
            src="/images/mantif_logo.png"
            alt="Mantif Logo"
            className="w-10 h-10 object-contain group-hover:scale-105 transition-transform shrink-0"
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

        {/* Desktop Navigation (Moved to Right Side) */}
        <nav className="hidden lg:flex items-center gap-7 xl:gap-9 text-sm font-bold text-slate-700 dark:text-slate-200">
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

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-950/98 px-8 py-6 space-y-4 shadow-xl">
          <div className="flex flex-col space-y-3 text-base font-bold">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="text-slate-700 dark:text-slate-200 py-1.5 hover:text-[#004b79] dark:hover:text-[#dfb74a] transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
