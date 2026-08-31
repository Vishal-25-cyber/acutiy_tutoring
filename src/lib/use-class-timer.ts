"use client";

import { useState, useEffect } from "react";
import { BatchInfo, ClassTimingStatus, computeClassTimingStatus } from "./class-timing";

export function useClassLiveTimer(batch?: BatchInfo | null): ClassTimingStatus {
  const [timing, setTiming] = useState<ClassTimingStatus>(() => computeClassTimingStatus(batch));

  useEffect(() => {
    // Initial compute
    setTiming(computeClassTimingStatus(batch));

    // Update every second in real-time
    const interval = setInterval(() => {
      setTiming(computeClassTimingStatus(batch));
    }, 1000);

    return () => clearInterval(interval);
  }, [batch?._id, batch?.startTime, batch?.endTime, JSON.stringify(batch?.days)]);

  return timing;
}
