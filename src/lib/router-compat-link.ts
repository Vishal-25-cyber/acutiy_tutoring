import React, { useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import { prefetchApi } from "./api-cache";

export interface NextLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string | { pathname?: string; query?: Record<string, any> };
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  children?: React.ReactNode;
  className?: string;
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLAnchorElement>) => void;
}

const ROUTE_API_MAP: Record<string, string> = {
  "/student/dashboard": "/api/student/dashboard",
  "/student/classes": "/api/student/classes",
  "/student/materials": "/api/student/materials",
  "/student/assignments": "/api/student/assignments",
  "/student/attendance": "/api/student/attendance",
  "/student/fees": "/api/student/payments",
  "/student/performance": "/api/student/performance",
  "/student/parent-view": "/api/student/parent-view",
  "/teacher/dashboard": "/api/teacher/dashboard",
  "/teacher/schedule": "/api/classes",
  "/teacher/materials": "/api/teacher/materials",
  "/teacher/assignments": "/api/teacher/assignments",
  "/teacher/students": "/api/teacher/students",
  "/teacher/reports": "/api/teacher/reports",
  "/teacher/attendance": "/api/teacher/attendance",
  "/admin/dashboard": "/api/admin/dashboard",
  "/admin/students": "/api/admin/students",
  "/admin/teachers": "/api/admin/teachers?status=ALL",
  "/admin/reports": "/api/teacher/reports",
  "/admin/batches": "/api/batches",
  "/admin/classes": "/api/classes",
  "/admin/attendance": "/api/admin/attendance?classLevel=ALL&status=ALL",
  "/admin/staff-attendance": "/api/admin/staff-attendance",
  "/admin/finance": "/api/admin/finance",
  "/admin/analytics": "/api/admin/analytics",
  "/admin/settings": "/api/admin/settings",
};

export function Link({
  href,
  prefetch = true,
  replace,
  scroll,
  children,
  onMouseEnter,
  onTouchStart,
  ...rest
}: NextLinkProps) {
  let targetTo = typeof href === "string" ? href : href?.pathname || "/";
  if (typeof href === "object" && href.query) {
    const params = new URLSearchParams(href.query);
    targetTo = `${targetTo}?${params.toString()}`;
  }

  const handlePrefetch = useCallback(() => {
    if (prefetch !== false) {
      const cleanPath = targetTo.split("?")[0];
      const apiEndpoint = ROUTE_API_MAP[cleanPath];
      if (apiEndpoint) {
        prefetchApi(apiEndpoint);
      }
    }
  }, [targetTo, prefetch]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    handlePrefetch();
    if (onMouseEnter) onMouseEnter(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
    handlePrefetch();
    if (onTouchStart) onTouchStart(e);
  };

  return React.createElement(
    RouterLink,
    {
      to: targetTo,
      replace,
      onMouseEnter: handleMouseEnter,
      onTouchStart: handleTouchStart,
      ...rest,
    },
    children
  );
}

export default Link;

