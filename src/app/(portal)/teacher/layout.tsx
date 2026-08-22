"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { PortalHeader } from "@/components/layout/PortalHeader";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isClassroom = pathname.includes("/classroom/");

  if (isClassroom) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <PortalSidebar role="TEACHER" />

      <div className="flex-1 flex flex-col min-w-0">
        <PortalHeader
          userName="Dr. Sarah Jenkins"
          userRole="TEACHER"
        />

        <div className="flex-1 transition-opacity duration-150 ease-out">
          {children}
        </div>
      </div>
    </div>
  );
}
