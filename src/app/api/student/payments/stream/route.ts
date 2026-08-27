import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { subscribePaymentEvents, PaymentStatusEvent } from "@/lib/payment-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const studentId = session.userId;
  let unsubscribe: (() => void) | null = null;
  let pingInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection event
      const initialMessage = `event: connected\ndata: ${JSON.stringify({
        connected: true,
        studentId,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Subscribe to real-time payment events targeted to this student
      unsubscribe = subscribePaymentEvents(studentId, (event: PaymentStatusEvent) => {
        try {
          const payload = `event: payment-status-updated\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error("SSE stream enqueue error:", err);
        }
      });

      // Keep-alive heartbeat every 15s to prevent proxy/browser timeout
      pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          if (pingInterval) clearInterval(pingInterval);
        }
      }, 15000);
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
