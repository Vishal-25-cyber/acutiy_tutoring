"use client";

import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { usePathname, useRouter } from "next/navigation";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { LivePaymentListener } from "@/components/payment/LivePaymentListener";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentLayout({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isClassroom = pathname.includes("/classroom/");

  // Verify role with /api/auth/me (never cached, always live)
  const { data: authData, isLoading } = useFastFetch("/api/auth/me");

  useEffect(() => {
    if (!isLoading && authData?.user) {
      if (authData.user.role === "TEACHER") {
        router.replace("/teacher/dashboard");
      } else if (authData.user.role === "ADMIN") {
        router.replace("/admin/dashboard");
      }
    }
  }, [authData, isLoading, router]);

  if (isClassroom) {
    return <>{children || <Outlet />}</>;
  }

  // If user is confirmed to be teacher/admin, don't render student dashboard while redirecting
  if (!isLoading && authData?.user && authData.user.role !== "STUDENT") {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <PortalSidebar role="STUDENT" />
      <LivePaymentListener />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto" id="student-portal-scroll-area">
        <div className="flex-1 transition-opacity duration-150 ease-out">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}
