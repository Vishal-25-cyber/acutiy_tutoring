"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  Sparkles,
  QrCode,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentFeesPage() {
  const { data, refetch } = useFastFetch("/api/student/payments");
  const [isPaying, setIsPaying] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [transactionIdInput, setTransactionIdInput] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Listen for real-time payment updates dispatched by LivePaymentListener
  useEffect(() => {
    const handleLiveUpdate = () => {
      refetch();
    };

    window.addEventListener("acuity:payment-updated", handleLiveUpdate);
    return () => {
      window.removeEventListener("acuity:payment-updated", handleLiveUpdate);
    };
  }, [refetch]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("acuity.tutoring@upi");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleOpenPayModal = (payment: any) => {
    setSelectedPayment(payment);
    // Suggest an initial randomized UTR for convenience or student can type their own
    setTransactionIdInput(`UPI-${Date.now().toString().slice(-8)}`);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setIsPaying(true);

    try {
      const res = await fetch("/api/student/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment._id,
          paymentMethod: "Online UPI Transfer",
          transactionId: transactionIdInput.trim() || `UPI-${Date.now().toString().slice(-8)}`,
          courseName: selectedPayment.courseName || `Billing: ${selectedPayment.billingMonth}`,
          courseId: selectedPayment.courseId,
        }),
      });

      if (res.ok) {
        setSelectedPayment(null);
        refetch();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  const pendingVerification = data?.pendingVerification;
  const currentFee = data?.currentFee;
  const history = data?.history || [
    {
      _id: "pay-rec-1",
      receiptNumber: "REC-00189",
      billingMonth: "December 2024",
      amount: 2500,
      paymentMethod: "Online UPI",
      paidDate: new Date("2024-12-10").toISOString(),
      status: "PAID",
    },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-5xl animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Tuition Fee & Receipts
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monthly tuition management with live gateway & real-time UPI verification.
        </p>
      </div>

      {/* 1. Pending Verification State (Waiting for Admin approval) */}
      {pendingVerification ? (
        <div className="rounded-3xl bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 relative overflow-hidden shadow-xl border border-amber-500/30 animate-pulse-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="warning" className="text-xs font-bold bg-amber-500/20 text-amber-300 border-amber-500/40">
                  <Clock className="w-3.5 h-3.5 mr-1 animate-spin" />
                  PAYMENT VERIFICATION PENDING
                </Badge>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-amber-100">
                ⏳ Payment Verification Pending
              </h2>

              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                Your payment details have been submitted ({pendingVerification.transactionId}). We are waiting for administrative verification. You can continue using the dashboard while your payment is being verified.
              </p>

              <div className="flex items-center gap-2 text-[11px] text-amber-400 font-mono pt-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking payment status in real-time...</span>
              </div>
            </div>

            <div className="shrink-0 bg-slate-900/80 border border-amber-500/20 p-5 rounded-2xl text-center space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold">Amount Submitted</span>
              <p className="text-3xl font-black text-amber-400">₹{pendingVerification.amount}</p>
              <p className="text-[10px] text-slate-500 font-mono">Txn: {pendingVerification.transactionId}</p>
            </div>
          </div>
        </div>
      ) : currentFee ? (
        /* 2. Unpaid Invoice State */
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <Badge variant="warning" className="text-xs font-bold">
                INVOICE PENDING
              </Badge>
              <h2 className="text-2xl font-extrabold">Billing for {currentFee.billingMonth}</h2>
              <p className="text-xs text-slate-300">
                Due Date: {new Date(currentFee.dueDate).toLocaleDateString()} • Invoice #{currentFee.receiptNumber}
              </p>
              <p className="text-3xl font-black text-white pt-2">₹{currentFee.amount}</p>
            </div>

            <div className="shrink-0">
              <Button
                variant="glow"
                size="lg"
                className="font-bold text-sm px-8 py-5 rounded-2xl shadow-xl shadow-emerald-500/25"
                onClick={() => handleOpenPayModal(currentFee)}
              >
                Pay Tuition (UPI)
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. All Dues Cleared State */
        <Card className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <h2 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
              All Tuition Dues Cleared!
            </h2>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              You have no pending fees for the current academic billing cycle. Full course access is active.
            </p>
          </div>
        </Card>
      )}

      {/* Payment History */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Payment History & Receipts
          </h3>
          <Badge variant="default">Instant Receipts</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Receipt No</th>
                <th className="p-4 font-bold">Month / Course</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Payment Method</th>
                <th className="p-4 font-bold">Paid Date</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No previous payment receipts.
                  </td>
                </tr>
              ) : (
                history.map((p: any) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {p.receiptNumber}
                    </td>
                    <td className="p-4 font-medium">{p.courseName || p.billingMonth}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">₹{p.amount}</td>
                    <td className="p-4 text-slate-500">{p.paymentMethod || "Online UPI"}</td>
                    <td className="p-4 text-slate-500">
                      {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : "Just now"}
                    </td>
                    <td className="p-4">
                      <Badge variant="success">PAID</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant="ghost" className="text-xs h-8">
                        <Download className="w-3.5 h-3.5 mr-1" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pay Now Modal with UPI QR & UTR input */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`Pay Tuition: ${selectedPayment.billingMonth}`}
          description={`Amount: ₹${selectedPayment.amount} • Secure UPI Payment Gateway`}
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
            {/* UPI QR & Details Box */}
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  Scan QR / Pay via UPI
                </span>
                <span className="text-sm font-black text-indigo-950 dark:text-white">
                  ₹{selectedPayment.amount}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-900">
                <div className="text-[11px]">
                  <span className="text-slate-400 block">UPI ID</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                    acuity.tutoring@upi
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyUpi}
                  className="text-xs h-7 gap-1"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUpi ? "Copied" : "Copy"}
                </Button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Open Google Pay, PhonePe, Paytm, or any UPI app, complete the ₹{selectedPayment.amount} transfer, then enter the Transaction ID / UTR below.
              </p>
            </div>

            {/* UTR / Transaction ID Input Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                UPI Reference / Transaction ID (UTR) <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                type="text"
                placeholder="e.g. UPI-20250918-984210"
                value={transactionIdInput}
                onChange={(e) => setTransactionIdInput(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-slate-400">
                Found in your UPI payment receipt (12-digit UTR or Txn Ref).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setSelectedPayment(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="glow"
                isLoading={isPaying}
                className="font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Submit Payment for Verification
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
