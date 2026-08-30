"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const memoryCache = new Map<string, { data: any; timestamp: number }>();
const inflightRequests = new Map<string, Promise<any>>();
const CACHE_STALE_MS = 2000; // 2 seconds stale time: gives instant UI on transitions but revalidates immediately

// Global event bus for instant cache invalidation across tabs / components
const cacheListeners = new Set<(urlPrefix: string) => void>();

/**
 * Prefetches and caches an API endpoint in the background with deduplication.
 */
export async function prefetchApi(url: string): Promise<any> {
  if (!url || typeof window === "undefined") return null;

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
        memoryCache.set(url, { data, timestamp: Date.now() });
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
        "/api/auth/me",
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
        "/api/auth/me",
        "/api/teacher/dashboard",
        "/api/classes",
        "/api/teacher/materials",
        "/api/teacher/assignments",
        "/api/teacher/students",
        "/api/teacher/attendance",
        "/api/notifications",
      ]
      : [
        "/api/auth/me",
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
    setTimeout(() => prefetchApi(ep), i * 30);
  });
}

/**
 * High-performance Stale-While-Revalidate (SWR) hook.
 * Returns cached data immediately on mount, then always fetches real fresh data from the server in background.
 * Also supports auto-revalidation on window focus and auto-polling.
 */
export function useFastFetch<T = any>(
  url: string | null,
  initialFallback?: T,
  options: { pollIntervalMs?: number; disableAutoRevalidate?: boolean } = {}
): { data: T | null; isLoading: boolean; error: any; refetch: () => Promise<void> } {
  const cachedEntry = url ? memoryCache.get(url) : null;
  const hasCachedData = Boolean(cachedEntry && cachedEntry.data);

  const [data, setData] = useState<T | null>(
    (cachedEntry ? cachedEntry.data : initialFallback) ?? null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!hasCachedData);
  const [error, setError] = useState<any>(null);
  const isMountedRef = useRef(true);

  const executeFetch = useCallback(
    async (isManual = false) => {
      if (!url) return;

      if (!isManual && hasCachedData) {
        setIsLoading(false);
      } else if (!hasCachedData) {
        setIsLoading(true);
      }

      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: { "Cache-Control": "no-cache" },
        });

        if (res.ok) {
          const json = await res.json();
          memoryCache.set(url, { data: json, timestamp: Date.now() });
          if (isMountedRef.current) {
            setData(json);
            setError(null);
          }
        } else {
          throw new Error(`Request failed with status ${res.status}`);
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.warn(`FastFetch error for ${url}:`, err);
          setError(err);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [url, hasCachedData]
  );

  useEffect(() => {
    isMountedRef.current = true;
    executeFetch();

    // Revalidate on window focus so updates in other tabs/windows reflect immediately
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

    // Optional polling interval (default every 6 seconds for live real-time sync)
    const pollInterval = options.pollIntervalMs || 6000;
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
  for (const key of memoryCache.keys()) {
    if (!urlPrefix || key.startsWith(urlPrefix)) {
      memoryCache.delete(key);
    }
  }
  cacheListeners.forEach((listener) => listener(urlPrefix));
}
