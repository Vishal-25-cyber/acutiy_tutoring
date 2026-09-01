"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, PhoneCall, ArrowRight, Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#001726]/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" prefetch={true} className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#002137] p-1 shadow-sm border border-slate-200/80 dark:border-[#b89047]/30 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/images/mantif_logo.png"
              alt="Mantif Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-[#002137] dark:text-white">
                MANTIF
              </span>
              <Badge variant="gold" className="text-[10px] px-2 py-0">
                MSME Registered
              </Badge>
            </div>
            <p className="text-[11px] font-medium text-[#b89047] dark:text-[#dfb74a] tracking-tight">
              Human x Artificial Intelligence
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="hover:text-[#004b79] dark:hover:text-[#dfb74a] transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Auth CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/#about" prefetch={true}>
            <Button variant="ghost" size="md" className="font-semibold text-slate-700 dark:text-slate-200 hover:text-[#004b79]">
              Sign In
            </Button>
          </Link>
          <Link href="/#about" prefetch={true}>
            <Button variant="primary" size="md" className="bg-[#002137] hover:bg-[#083353] dark:bg-[#dfb74a] dark:text-[#002137] dark:hover:bg-[#f7d87c] shadow-md shadow-[#002137]/20 font-semibold gap-2">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-950/98 px-6 py-5 space-y-4 shadow-xl">
          <div className="flex flex-col space-y-2.5 text-sm font-semibold">
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
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            <Link href="/#about" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                Sign In
              </Button>
            </Link>
            <Link href="/#about" onClick={() => setIsOpen(false)}>
              <Button variant="primary" className="w-full justify-center bg-[#002137] text-white">
                Get Started / Sign Up
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
