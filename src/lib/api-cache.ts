"use client";

import { useState, useEffect, useRef } from "react";

const memoryCache = new Map<string, { data: any; timestamp: number }>();
const inflightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL for ultra-fast navigation

/**
 * Prefetches and caches an API endpoint in the background with deduplication.
 */
export async function prefetchApi(url: string): Promise<any> {
  if (!url || typeof window === "undefined") return null;

  const cached = memoryCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Deduplicate inflight requests to prevent duplicate network calls
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
      // ignore background prefetch error
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
        "/api/admin/audit-logs",
        "/api/notifications",
      ];

  // Stagger prefetch calls to avoid flooding the server
  endpoints.forEach((ep, i) => {
    setTimeout(() => prefetchApi(ep), i * 50);
  });
}

/**
 * High-performance Stale-While-Revalidate (SWR) hook with instant zero-millisecond memory caching.
 * Returns cached data immediately on mount, then updates seamlessly in background.
 */
export function useFastFetch<T = any>(
  url: string | null,
  initialFallback?: T
): { data: T | null; isLoading: boolean; error: any; refetch: () => Promise<void> } {
  // Check memory cache synchronously
  const cachedEntry = url ? memoryCache.get(url) : null;
  const isFresh = Boolean(cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS);
  const hasCachedData = Boolean(cachedEntry && cachedEntry.data);

  const [data, setData] = useState<T | null>(
    (cachedEntry ? cachedEntry.data : initialFallback) ?? null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!hasCachedData);
  const [error, setError] = useState<any>(null);

  const executeFetch = async (isManualRefetch = false) => {
    if (!url) return;

    if (!isManualRefetch && hasCachedData) {
      // Data is already displayed instantly from cache; revalidate silently in background
      setIsLoading(false);
      // If cache is still fresh and not a manual refetch, avoid unnecessary network calls
      if (isFresh) return;
    } else {
      setIsLoading(!hasCachedData);
    }

    try {
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        memoryCache.set(url, { data: json, timestamp: Date.now() });
        setData(json);
        setError(null);
      } else {
        throw new Error(`Request failed with status ${res.status}`);
      }
    } catch (err) {
      console.warn(`FastFetch error for ${url}:`, err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeFetch();
  }, [url]);

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
}

/**
 * Invalidate cache key
 */
export function invalidateCache(urlPrefix: string) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(urlPrefix)) {
      memoryCache.delete(key);
    }
  }
}
