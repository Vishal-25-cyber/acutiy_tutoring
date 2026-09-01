"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { useFastFetch } from "@/lib/api-cache";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isClassroom = pathname.includes("/classroom/");

  // Verify role with /api/auth/me
  const { data: authData } = useFastFetch("/api/auth/me");

  useEffect(() => {
    if (authData?.user) {
      if (authData.user.role === "STUDENT") {
        router.replace("/student/dashboard");
      } else if (authData.user.role === "ADMIN") {
        router.replace("/admin/dashboard");
      }
    }
  }, [authData, router]);

  if (isClassroom) {
    return <>{children}</>;
  }

  if (authData?.user && authData.user.role !== "TEACHER" && authData.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <PortalSidebar role="TEACHER" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="flex-1 transition-opacity duration-150 ease-out">
          {children}
        </div>
      </div>
    </div>
  );
}
