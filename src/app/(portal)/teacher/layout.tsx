"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import { usePathname } from "next/navigation";
import { PortalSidebar } from "@/components/layout/PortalSidebar";

export default function TeacherLayout({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const isClassroom = pathname.includes("/classroom/");

  if (isClassroom) {
    return <>{children || <Outlet />}</>;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <PortalSidebar role="TEACHER" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto" id="teacher-portal-scroll-area">
        <div className="flex-1 transition-opacity duration-150 ease-out">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}
