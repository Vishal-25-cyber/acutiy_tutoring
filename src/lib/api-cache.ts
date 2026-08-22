"use client";

import { useState, useEffect, useRef } from "react";

const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * High-performance Stale-While-Revalidate (SWR) hook with in-memory caching.
 * Returns cached data synchronously on mount at 0ms, then updates in background.
 */
export function useFastFetch<T = any>(
  url: string | null,
  initialFallback?: T
): { data: T | null; isLoading: boolean; error: any; refetch: () => Promise<void> } {
  // Check memory cache synchronously
  const cachedEntry = url ? memoryCache.get(url) : null;
  const hasCachedData = Boolean(cachedEntry && cachedEntry.data);

  const [data, setData] = useState<T | null>(
    (cachedEntry ? cachedEntry.data : initialFallback) ?? null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!hasCachedData);
  const [error, setError] = useState<any>(null);

  const fetchRef = useRef<boolean>(false);

  const executeFetch = async (isManualRefetch = false) => {
    if (!url) return;

    if (!isManualRefetch && hasCachedData) {
      // Data is already displayed instantly from cache; revalidate silently in background
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch(url);
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
