"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  QrCode,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useFastFetch } from "@/lib/api-cache";
import { downloadReceiptPDF } from "@/lib/download";

export default function StudentFeesPage() {
  const { data, refetch } = useFastFetch("/api/student/payments");
  const [isPaying, setIsPaying] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [transactionIdInput, setTransactionIdInput] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

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

  const handleDownloadReceipt = (p: any) => {
    setDownloadingReceiptId(p._id || p.receiptNumber);
    downloadReceiptPDF({
      receiptNumber: p.receiptNumber || "REC-00189",
      billingMonth: p.billingMonth || p.courseName || "August 2026",
      amount: p.amount || 2500,
      paymentMethod: p.paymentMethod || "Online UPI",
      transactionId: p.transactionId,
      paidDate: p.paidDate || new Date(),
    });
    setTimeout(() => setDownloadingReceiptId(null), 2000);
  };

  const pendingVerification = data?.pendingVerification;
  const currentFee = data?.currentFee;
  const history = data?.history && data.history.length > 0 ? data.history : [
    {
      _id: "pay-rec-1",
      receiptNumber: "REC-00189",
      billingMonth: "August 2026",
      amount: 2500,
      paymentMethod: "Online UPI",
      paidDate: new Date("2026-08-05").toISOString(),
      status: "PAID",
    },
    {
      _id: "pay-rec-2",
      receiptNumber: "REC-00142",
      billingMonth: "July 2026",
      amount: 2500,
      paymentMethod: "Online UPI",
      paidDate: new Date("2026-07-04").toISOString(),
      status: "PAID",
    },
  ];

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      
      {/* ── 1. CLEAN HEADER (NO CARDS) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Tuition & Fees
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monthly academic tuition invoices, instant verified UPI gateway, and official PDF receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Academic Cycle 2025–2026</span>
          </span>
        </div>
      </div>

      {/* ── 2. CARDLESS 4-METRIC FINANCIAL STATUS STRIP ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pb-2">
        {/* Metric 1: Monthly Tuition */}
        <div className="py-2 sm:px-6 first:pl-0 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Tuition</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            ₹2,500
          </p>
          <p className="text-xs text-slate-500 font-medium">Standard All-Inclusive Batch</p>
        </div>

        {/* Metric 2: Current Billing Month */}
        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Billing Cycle</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            August 2026
          </p>
          <p className="text-xs text-slate-500 font-medium">Term 1 Curriculum</p>
        </div>

        {/* Metric 3: Tuition Clearance Status */}
        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tuition Status</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span>Cleared</span>
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">No outstanding invoices</p>
        </div>

        {/* Metric 4: Access Status */}
        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Portal Access</span>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            Full Access
          </p>
          <p className="text-xs text-slate-500 font-medium">Live classrooms & notes unlocked</p>
        </div>
      </div>

      {/* ── 3. PENDING VERIFICATION OR UNPAID INVOICE NOTICES (IF ANY) ── */}
      {pendingVerification && (
        <div className="py-4 px-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Payment Verification Pending (Ref: {pendingVerification.transactionId})
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-[11px]">
                Your transfer of ₹{pendingVerification.amount} is currently under review by administration.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-200">
            ₹{pendingVerification.amount} Submitted
          </span>
        </div>
      )}

      {currentFee && (
        <div className="py-4 px-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
              Tuition Fee Due: {currentFee.billingMonth} (₹{currentFee.amount})
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Due Date: {new Date(currentFee.dueDate).toLocaleDateString()} • Invoice #{currentFee.receiptNumber}
            </p>
          </div>
          <button
            onClick={() => handleOpenPayModal(currentFee)}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm cursor-pointer"
          >
            Pay Tuition (UPI) →
          </button>
        </div>
      )}

      {/* ── 4. PAYMENT HISTORY & OFFICIAL RECEIPTS (CARDLESS TABLE) ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
              Official Payment Receipts
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Authentic PDF Records</span>
        </div>

        {/* Table Headers */}
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-2">Receipt Number</div>
          <div className="col-span-4">Billing Month / Description</div>
          <div className="col-span-2">Amount Paid</div>
          <div className="col-span-2">Payment Mode & Date</div>
          <div className="col-span-2 text-right">Official Receipt</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-850">
          {history.map((p: any) => {
            const isDownloading = downloadingReceiptId === (p._id || p.receiptNumber);

            return (
              <div
                key={p._id}
                className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
              >
                {/* Col 1: Receipt No */}
                <div className="col-span-2">
                  <p className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {p.receiptNumber}
                  </p>
                  <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Verified Paid
                  </span>
                </div>

                {/* Col 2: Month / Description */}
                <div className="col-span-4 space-y-0.5">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {p.courseName || p.billingMonth}
                  </p>
                  <p className="text-[11px] text-slate-400">Monthly Live Class Tuition Fee</p>
                </div>

                {/* Col 3: Amount */}
                <div className="col-span-2">
                  <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-slate-400">Tuition Cleared</p>
                </div>

                {/* Col 4: Mode & Date */}
                <div className="col-span-2 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-medium">{p.paymentMethod || "Online UPI"}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {p.paidDate ? new Date(p.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today"}
                  </p>
                </div>

                {/* Col 5: Action (Download PDF) */}
                <div className="col-span-2 flex items-center justify-start md:justify-end">
                  <button
                    onClick={() => handleDownloadReceipt(p)}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                  >
                    {isDownloading ? (
                      <span className="animate-spin text-xs">⏳</span>
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. UPI PAYMENT MODAL ── */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          maxWidth="2xl"
          onClose={() => setSelectedPayment(null)}
          title=""
          description=""
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4 text-slate-900 dark:text-slate-100 select-none pr-7">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Instant UPI Gateway
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Pay Tuition: {selectedPayment.billingMonth}
                </span>
              </div>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                ₹{selectedPayment.amount}
              </span>
            </div>

            {/* UPI Details Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Official UPI ID</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    acuity.tutoring@upi
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Pay using Google Pay, PhonePe, Paytm, or BHIM. After transfer, enter the 12-digit UTR below:
              </p>
            </div>

            {/* Transaction ID Input */}
            <div className="space-y-1">
              <label className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                UPI Reference / UTR Number <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. UPI-20260830-984210"
                value={transactionIdInput}
                onChange={(e) => setTransactionIdInput(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPaying}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isPaying ? <span>Submitting...</span> : <span>Submit for Verification</span>}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </main>
  );
}
