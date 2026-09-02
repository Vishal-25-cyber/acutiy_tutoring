"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const memoryCache = new Map<string, { data: any; timestamp: number }>();
const inflightRequests = new Map<string, Promise<any>>();
const CACHE_STALE_MS = 60000; // 60s stale time: instant UI transitions with background sync

// Global event bus for instant cache invalidation across tabs / components
const cacheListeners = new Set<(urlPrefix: string) => void>();

/**
 * Prefetches and caches an API endpoint in the background with deduplication.
 */
export async function prefetchApi(url: string): Promise<any> {
  if (!url || typeof window === "undefined" || url.includes("/api/auth/me")) return null;

  const cached = memoryCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_STALE_MS) {
    return cached.data;
  }

  if (inflightRequests.has(url)) {
    return inflightRequests.get(url);
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (!url.includes("/api/auth/me")) {
          memoryCache.set(url, { data, timestamp: Date.now() });
        }
        return data;
      }
    } catch (e) {
      // ignore prefetch errors
    } finally {
      inflightRequests.delete(url);
    }
    return null;
  })();

  inflightRequests.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Pre-warms common portal routes into memory cache for instant sub-millisecond navigation.
 */
export function warmupPortalCache(role: string = "STUDENT") {
  if (typeof window === "undefined") return;

  const endpoints =
    role === "STUDENT"
      ? [
        "/api/student/dashboard",
        "/api/student/classes",
        "/api/student/materials",
        "/api/student/assignments",
        "/api/student/attendance",
        "/api/student/payments",
        "/api/notifications",
      ]
      : role === "TEACHER"
      ? [
        "/api/teacher/dashboard",
        "/api/classes",
        "/api/teacher/materials",
        "/api/teacher/assignments",
        "/api/teacher/students",
        "/api/teacher/attendance",
        "/api/notifications",
      ]
      : [
        "/api/admin/dashboard",
        "/api/admin/students",
        "/api/admin/teachers?status=ALL",
        "/api/admin/batches",
        "/api/batches",
        "/api/admin/classes",
        "/api/admin/attendance?classLevel=ALL&status=ALL",
        "/api/admin/staff-attendance",
        "/api/admin/finance",
        "/api/admin/analytics",
        "/api/admin/settings",
        "/api/notifications",
      ];

  endpoints.forEach((ep, i) => {
    setTimeout(() => prefetchApi(ep), i * 20);
  });
}

/**
 * High-performance Stale-While-Revalidate (SWR) hook.
 * Returns cached data immediately on mount, then fetches fresh data from the server in background.
 * Also supports auto-revalidation on window focus and auto-polling.
 */
export function useFastFetch<T = any>(
  url: string | null,
  initialFallback?: T,
  options: { pollIntervalMs?: number; disableAutoRevalidate?: boolean } = {}
): { data: T | null; isLoading: boolean; isRevalidating: boolean; error: any; refetch: () => Promise<void> } {
  const isAuthMe = url?.includes("/api/auth/me");

  const getCached = useCallback(() => {
    if (!url || isAuthMe) return null;
    const entry = memoryCache.get(url);
    return entry ? entry.data : null;
  }, [url, isAuthMe]);

  const [data, setData] = useState<T | null>(() => {
    const cached = getCached();
    return cached !== null && cached !== undefined ? cached : (initialFallback ?? null);
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!url) return false;
    return getCached() === null;
  });

  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const isMountedRef = useRef(true);

  // Sync cache immediately when url changes
  useEffect(() => {
    if (!url) {
      setData(null);
      setIsLoading(false);
      return;
    }
    if (isAuthMe) {
      setIsLoading(true);
      return;
    }
    const cached = memoryCache.get(url)?.data;
    if (cached !== undefined && cached !== null) {
      setData(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [url, isAuthMe]);

  const executeFetch = useCallback(
    async (isManual = false) => {
      if (!url) return;

      const cached = isAuthMe ? null : memoryCache.get(url)?.data;
      if (!isManual && cached !== undefined && cached !== null) {
        setIsLoading(false);
        setIsRevalidating(true);
      } else if (isManual || cached === undefined || cached === null) {
        setIsLoading(true);
      }

      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: isAuthMe ? { "Cache-Control": "no-cache" } : undefined,
        });

        if (res.ok) {
          const json = await res.json();
          if (!isAuthMe) {
            memoryCache.set(url, { data: json, timestamp: Date.now() });
          }
          if (isMountedRef.current) {
            setData(json);
            setError(null);
          }
        } else {
          throw new Error(`Request failed with status ${res.status}`);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRevalidating(false);
        }
      }
    },
    [url, isAuthMe]
  );

  useEffect(() => {
    isMountedRef.current = true;
    executeFetch();

    // Revalidate on window focus
    const handleFocus = () => {
      executeFetch();
    };
    window.addEventListener("focus", handleFocus);

    // Listen for global cache invalidations
    const handleInvalidation = (prefix: string) => {
      if (url && url.startsWith(prefix)) {
        executeFetch(true);
      }
    };
    cacheListeners.add(handleInvalidation);

    // Optional polling interval (default every 10 seconds for live sync)
    const pollInterval = options.pollIntervalMs || 10000;
    let timer: any = null;
    if (!options.disableAutoRevalidate) {
      timer = setInterval(() => {
        executeFetch();
      }, pollInterval);
    }

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("focus", handleFocus);
      cacheListeners.delete(handleInvalidation);
      if (timer) clearInterval(timer);
    };
  }, [url, executeFetch, options.pollIntervalMs, options.disableAutoRevalidate]);

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    refetch: () => executeFetch(true),
  };
}

/**
 * Manually update client memory cache for an endpoint
 */
export function setCachedData(url: string, data: any) {
  memoryCache.set(url, { data, timestamp: Date.now() });
  cacheListeners.forEach((listener) => listener(url));
}

/**
 * Invalidate cache key prefix and notify all active listeners to refresh immediately
 */
export function invalidateCache(urlPrefix: string = "") {
  if (!urlPrefix || urlPrefix === "/api" || urlPrefix === "all") {
    memoryCache.clear();
    inflightRequests.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(urlPrefix)) {
        memoryCache.delete(key);
      }
    }
  }
  cacheListeners.forEach((listener) => listener(urlPrefix));
}

/**
 * Hard reset all client auth tokens, session state, and memory caches
 */
export function clearAuthAndCaches() {
  memoryCache.clear();
  inflightRequests.clear();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("acuity_auth_token");
      localStorage.removeItem("acuity_user_name");
      localStorage.removeItem("acuity_user_role");
      sessionStorage.removeItem("acuity_auth_token");
    } catch {
      // ignore
    }
  }
  cacheListeners.forEach((listener) => listener("all"));
}
