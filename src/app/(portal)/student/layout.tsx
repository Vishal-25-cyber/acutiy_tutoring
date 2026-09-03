"use client";

import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { usePathname, useRouter } from "next/navigation";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { LivePaymentListener } from "@/components/payment/LivePaymentListener";
import { StudentTrialLockScreen } from "@/components/student/StudentTrialLockScreen";
import { StudentTrialWelcomeModal } from "@/components/student/StudentTrialWelcomeModal";
import { useFastFetch } from "@/lib/api-cache";
import { Clock } from "lucide-react";

export default function StudentLayout({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isClassroom = pathname.includes("/classroom/");

  // Verify role and trial status with /api/auth/me (never cached, always live)
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

  const user = authData?.user;
  const trial = user?.trial;
  const hasPaid = !!trial?.hasPaid;
  const isTrialActive = !hasPaid && !!trial?.isTrialActive;
  const isTrialExpired = !hasPaid && !!trial?.isTrialExpired;
  const isFeesPage = pathname === "/student/fees" || pathname.startsWith("/student/fees/");

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <PortalSidebar role="STUDENT" />
      <LivePaymentListener />

      {/* Welcome Dialog for Student on 2-Day Trial Login */}
      {isTrialActive && (
        <StudentTrialWelcomeModal
          userId={user?.id}
          studentName={user?.name}
          remainingHours={trial?.remainingHours}
          trialEndsAt={trial?.trialEndsAt}
          isTrialActive={isTrialActive}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto" id="student-portal-scroll-area">
        {/* Expired 2-Day Trial Warning Banner on Fees Page */}
        {isTrialExpired && isFeesPage && (
          <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs border-b border-amber-400/40 shrink-0 select-none">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="font-extrabold text-amber-200">⚠️ 2-Day Trial Concluded:</span>
              <span className="text-amber-50 text-xs">
                Complete your monthly tuition payment below to unlock all live classes and study materials.
              </span>
            </div>
            <span className="font-bold text-[11px] px-2.5 py-0.5 rounded bg-white/20 text-white">
              Payment Pending
            </span>
          </div>
        )}

        <div className="flex-1 transition-opacity duration-150 ease-out">
          {/* REQUIREMENT: "after two days of trail ended then all the pages should locked that time fees receip should show in the side bar" */}
          {isTrialExpired && !isFeesPage ? (
            <StudentTrialLockScreen
              studentName={user?.name}
              studentClass={user?.profile?.currentClass}
              studentId={user?.profile?.studentId}
              trialEndsAt={trial?.trialEndsAt}
            />
          ) : (
            children || <Outlet />
          )}
        </div>
      </div>
    </div>
  );
}
