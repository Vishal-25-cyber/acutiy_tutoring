import { EventEmitter } from "events";

export interface PaymentStatusEvent {
  paymentId: string;
  studentId: string;
  courseId?: string;
  courseName?: string;
  status: "PAID" | "PENDING_VERIFICATION" | "PENDING" | "OVERDUE" | "FAILED";
  amount: number;
  transactionId?: string;
  receiptNumber?: string;
  billingMonth?: string;
  verifiedAt?: string;
}

// Global EventEmitter for server-side real-time payment updates across API routes
declare global {
  // eslint-disable-next-line no-var
  var paymentEventEmitter: EventEmitter | undefined;
}

const paymentEmitter: EventEmitter = global.paymentEventEmitter || new EventEmitter();
paymentEmitter.setMaxListeners(200);

if (!global.paymentEventEmitter) {
  global.paymentEventEmitter = paymentEmitter;
}

/**
 * Emit payment status update event specifically targeted to a student
 */
export function emitPaymentStatusUpdate(event: PaymentStatusEvent) {
  if (!event || !event.studentId) return;
  // Specific channel for the student to prevent leaking data
  paymentEmitter.emit(`payment:student:${event.studentId}`, event);
  // General event for logging / monitoring
  paymentEmitter.emit("payment:status-updated", event);
}

/**
 * Subscribe to payment events for a specific student
 */
export function subscribePaymentEvents(
  studentId: string,
  callback: (event: PaymentStatusEvent) => void
) {
  const channel = `payment:student:${studentId}`;
  paymentEmitter.on(channel, callback);
  return () => {
    paymentEmitter.off(channel, callback);
  };
}

export default paymentEmitter;
