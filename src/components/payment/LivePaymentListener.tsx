"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { PaymentSuccessModal, PaymentSuccessData } from "./PaymentSuccessModal";
import { invalidateCache } from "@/lib/api-cache";

// SessionStorage key for deduplication across tab navigation
const NOTIFIED_PAYMENTS_KEY = "acuity_notified_payments";

function getNotifiedPaymentIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(NOTIFIED_PAYMENTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markPaymentNotified(paymentId: string) {
  if (typeof window === "undefined" || !paymentId) return;
  try {
    const set = getNotifiedPaymentIds();
    set.add(paymentId);
    sessionStorage.setItem(NOTIFIED_PAYMENTS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage quota errors
  }
}

export function LivePaymentListener() {
  const [successData, setSuccessData] = useState<PaymentSuccessData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isPendingVerificationActiveRef = useRef(false);
  const mountedRef = useRef(true);

  // Authoritative handler when PAID state is confirmed
  const handlePaymentPaid = useCallback(async (paymentDetails: {
    paymentId: string;
    courseName?: string;
    amount?: number;
    transactionId?: string;
    billingMonth?: string;
  }) => {
    const { paymentId, courseName, amount, transactionId, billingMonth } = paymentDetails;
    if (!paymentId || !mountedRef.current) return;

    // 1. Check deduplication
    const notifiedSet = getNotifiedPaymentIds();
    if (notifiedSet.has(paymentId)) {
      return;
    }

    // 2. Authoritative check against status API before granting local access
    try {
      const res = await fetch(`/api/student/payments/status?paymentId=${paymentId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status !== "PAID") {
          return;
        }
      }
    } catch {
      // If network fails, retry later
      return;
    }

    // Mark as notified to prevent duplicate popups
    markPaymentNotified(paymentId);

    // 3. Invalidate client-side API caches
    invalidateCache("/api/student/payments");
    invalidateCache("/api/student/dashboard");
    invalidateCache("/api/student/classes");
    invalidateCache("/api/student/materials");
    invalidateCache("/api/auth/me");

    // 4. Dispatch browser custom event for immediate in-page reactivity
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("acuity:payment-updated", {
          detail: {
            paymentId,
            status: "PAID",
            hasAccess: true,
            courseName: courseName || billingMonth || "Class 10 CBSE Comprehensive Bundle",
            amount: amount || 2500,
            transactionId: transactionId || `TXN-${paymentId.slice(-6)}`,
          },
        })
      );
    }

    // 5. Open the prominent Success Modal
    setSuccessData({
      paymentId,
      courseName: courseName || billingMonth || "Class 10 CBSE — All Subjects",
      amount: amount || 2500,
      transactionId: transactionId || `TXN-VERIFIED-${paymentId.slice(-6)}`,
      billingMonth,
    });
    setIsModalOpen(true);
  }, []);

  // Lightweight check — only runs when we know there's a pending verification
  const checkPendingPayments = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch("/api/student/payments/status", { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      if (!data.success) return;

      if (data.pendingVerification) {
        isPendingVerificationActiveRef.current = true;
      } else {
        isPendingVerificationActiveRef.current = false;
      }

      // Check if any recently paid payment has not yet shown success modal
      if (data.latestPaid && data.latestPaid.status === "PAID") {
        const notified = getNotifiedPaymentIds();
        if (!notified.has(data.latestPaid.id)) {
          const paidTime = data.latestPaid.paidDate ? new Date(data.latestPaid.paidDate).getTime() : Date.now();
          const isRecent = Date.now() - paidTime < 24 * 60 * 60 * 1000;
          if (isRecent) {
            handlePaymentPaid({
              paymentId: data.latestPaid.id,
              courseName: data.latestPaid.courseName,
              amount: data.latestPaid.amount,
              transactionId: data.latestPaid.transactionId,
              billingMonth: data.latestPaid.billingMonth,
            });
          }
        }
      }
    } catch {
      // Ignore background fetch errors
    }
  }, [handlePaymentPaid]);

  // Setup SSE stream — only connect when there's a pending verification payment
  useEffect(() => {
    let es: EventSource | null = null;
    let sseRetryTimeout: NodeJS.Timeout | null = null;

    function connectSSE() {
      if (!mountedRef.current) return;
      try {
        es = new EventSource("/api/student/payments/stream");
        eventSourceRef.current = es;

        es.addEventListener("payment-status-updated", (event: MessageEvent) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.status === "PAID") {
              handlePaymentPaid({
                paymentId: payload.paymentId,
                courseName: payload.courseName,
                amount: payload.amount,
                transactionId: payload.transactionId,
                billingMonth: payload.billingMonth,
              });
            } else if (payload.status === "PENDING_VERIFICATION") {
              isPendingVerificationActiveRef.current = true;
              invalidateCache("/api/student/payments");
            }
          } catch (err) {
            console.error("Failed to parse SSE payment update:", err);
          }
        });

        es.onerror = () => {
          if (es) {
            es.close();
            es = null;
          }
          // Reconnect after 15 seconds instead of 5 to reduce overhead
          sseRetryTimeout = setTimeout(connectSSE, 15000);
        };
      } catch {
        // SSE not supported
      }
    }

    // Delay SSE connection by 3 seconds to prioritize page rendering
    const initTimeout = setTimeout(() => {
      connectSSE();
    }, 3000);

    return () => {
      clearTimeout(initTimeout);
      if (es) {
        es.close();
        es = null;
      }
      if (sseRetryTimeout) clearTimeout(sseRetryTimeout);
    };
  }, [handlePaymentPaid]);

  // Poll every 15 seconds instead of 4 — SSE handles instant updates
  useEffect(() => {
    // Initial check after 2 second delay to not block page load
    const initialDelay = setTimeout(() => {
      checkPendingPayments();
    }, 2000);

    const interval = setInterval(() => {
      // Only poll if there's actually a pending verification
      if (isPendingVerificationActiveRef.current) {
        checkPendingPayments();
      }
    }, 15000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [checkPendingPayments]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <>
      <PaymentSuccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={successData}
      />
    </>
  );
}

export default LivePaymentListener;
