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
  Smartphone,
  Info,
  Lock,
  Receipt,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useFastFetch } from "@/lib/api-cache";
import { downloadReceiptPDF } from "@/lib/download";

export default function StudentFeesPage() {
  const { data, refetch } = useFastFetch("/api/student/payments");
  const [isPaying, setIsPaying] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [isQrUnlocked, setIsQrUnlocked] = useState(false);
  const [autoLockSeconds, setAutoLockSeconds] = useState(30);
  const [hasScanned, setHasScanned] = useState(false);
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

  // Automatic security lock timer: locks QR automatically after 30 seconds
  useEffect(() => {
    let timer: any;
    if (isQrUnlocked && showPayModal) {
      timer = setInterval(() => {
        setAutoLockSeconds((prev) => {
          if (prev <= 1) {
            setIsQrUnlocked(false);
            setHasScanned(true);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isQrUnlocked, showPayModal]);

  const upiId = (data?.settings?.upiId || "acuity.tutoring@upi").trim();
  const companyName = (data?.settings?.companyName || "Mantif Tutoring").trim();
  const monthlyFee = Number(data?.currentFee?.amount ?? data?.settings?.monthlyFee ?? 299);
  const customQrImage = data?.settings?.qrCodeImageUrl;
  const currentMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());

  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&am=${monthlyFee}&cu=INR&tn=${encodeURIComponent(`Tuition Fee ${currentMonthStr}`)}`;

  const displayQrCodeUrl =
    customQrImage && customQrImage.trim()
      ? customQrImage
      : `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
          upiUri
        )}&margin=8`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleOpenScanner = () => {
    setTransactionIdInput(`UPI-${Date.now().toString().slice(-8)}`);
    setIsQrUnlocked(false);
    setHasScanned(false);
    setAutoLockSeconds(30);
    setShowPayModal(true);
  };

  const handleOpenQr = () => {
    setIsQrUnlocked(true);
    setAutoLockSeconds(30);
  };

  const handleManualLock = () => {
    setIsQrUnlocked(false);
    setHasScanned(true);
  };

  const handleUtrChange = (val: string) => {
    setTransactionIdInput(val);
    if (isQrUnlocked && val.trim().length >= 4) {
      // Auto-lock QR as soon as user types their UTR after scanning
      setIsQrUnlocked(false);
      setHasScanned(true);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);

    const paymentTarget = data?.currentFee || data?.allPayments?.[0] || {
      _id: "direct-pay",
      billingMonth: currentMonthStr,
    };

    try {
      const res = await fetch("/api/student/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: paymentTarget._id,
          amount: monthlyFee,
          paymentMethod: "UPI",
          transactionId: transactionIdInput.trim() || `UPI-MANUAL-${Date.now().toString().slice(-6)}`,
          courseName: paymentTarget.courseName || `Monthly Live Class Tuition Fee`,
          courseId: paymentTarget.courseId,
          billingMonth: paymentTarget.billingMonth || currentMonthStr,
        }),
      });

      if (res.ok) {
        setShowPayModal(false);
        setIsQrUnlocked(false);
        setHasScanned(true);
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
      receiptNumber: p.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
      billingMonth: p.billingMonth || p.courseName || currentMonthStr,
      amount: p.amount || monthlyFee,
      paymentMethod: p.paymentMethod || "Online UPI",
      transactionId: p.transactionId,
      paidDate: p.paidDate || p.createdAt || new Date(),
    });
    setTimeout(() => setDownloadingReceiptId(null), 2000);
  };

  const pendingVerification = data?.pendingVerification;
  const currentFee = data?.currentFee;
  const history: any[] = data?.history || [];

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Tuition &amp; Fees
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Official monthly tuition invoices, secure Founder payment gateway, and verified receipts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          {pendingVerification ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Payment Locked (Verification in Progress)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenScanner}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              <span>Founder's Payment Details</span>
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Academic Cycle 2025–2026</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pb-2">
        <div className="py-2 sm:px-6 first:pl-0 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Tuition</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            ₹{monthlyFee.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-slate-500 font-medium">Standard All-Inclusive Batch</p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Billing Cycle</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {currentMonthStr}
          </p>
          <p className="text-xs text-slate-500 font-medium">Term 1 Curriculum</p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tuition Status</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span>{currentFee ? "Pending Dues" : "Cleared"}</span>
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {currentFee ? `₹${currentFee.amount} invoice due` : "No outstanding invoices"}
          </p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Portal Access</span>
          <p className="text-2xl sm:text-3xl font-black text-[#004b79] dark:text-[#dfb74a]">
            Full Access
          </p>
          <p className="text-xs text-slate-500 font-medium">Live classrooms &amp; notes unlocked</p>
        </div>
      </div>

      {pendingVerification && (
        <div className="py-3 px-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-900 dark:text-amber-200 block">
                Payment Verification in Progress (Locked for Security)
              </span>
              <p className="text-amber-700 dark:text-amber-300">
                UTR #{pendingVerification.transactionId} for ₹{pendingVerification.amount} ({pendingVerification.billingMonth}) is recorded. Admin verification will unlock receipts immediately.
              </p>
            </div>
          </div>
          <span className="font-mono font-bold text-amber-800 dark:text-amber-300 shrink-0">
            Awaiting Confirmation
          </span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Verified Tuition Fee Receipts
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {history.length} {history.length === 1 ? "Receipt" : "Receipts"} Issued
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Payment Receipts Issued Yet</p>
            <p className="text-xs text-slate-400">Once your tuition payment is submitted and verified, your official tax invoice will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {history.map((p, idx) => {
              const formattedDate = new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(p.paidDate || p.createdAt));
              const isDownloading = downloadingReceiptId === (p._id || p.receiptNumber);

              return (
                <div
                  key={idx}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                >
                  <div className="col-span-3 space-y-0.5">
                    <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 block">
                      {p.receiptNumber || `REC-2026-${String(idx + 1).padStart(3, "0")}`}
                    </span>
                    <span className="text-[11px] text-slate-400">{formattedDate}</span>
                  </div>

                  <div className="col-span-4 space-y-0.5">
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 block">
                      {p.billingMonth || p.courseName || "Academic Tuition Fee"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      UTR: {p.transactionId || "Verified Transfer"}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      ₹{Number(p.amount || monthlyFee).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="col-span-3 flex items-center justify-start md:justify-end gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(p)}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      {isDownloading ? (
                        <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      )}
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPayModal && (
        <Modal
          isOpen={showPayModal}
          maxWidth="2xl"
          onClose={() => setShowPayModal(false)}
          title="Founder's Payment Details"
          description="Secure direct payment to founder's verified official UPI account."
        >
          <form onSubmit={handleSubmitPayment} className="space-y-5 pt-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 flex flex-col items-center text-center space-y-2.5">
                {!isQrUnlocked ? (
                  <div className="w-48 h-48 sm:w-52 sm:h-52 p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2.5 shadow-inner">
                    <div className="w-12 h-12 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <Lock className="w-6 h-6 text-[#004b79] dark:text-[#dfb74a]" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {hasScanned ? "QR Code Locked" : "Payment QR Locked"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {hasScanned ? "Scan finished. Enter UTR to verify." : "Click below to view Founder's QR"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenQr}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{hasScanned ? "Re-open QR" : "Click to Open QR"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-150 relative">
                      <img
                        src={displayQrCodeUrl}
                        alt="Founder's Official UPI QR Code"
                        className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                        <span>Auto-locks in {autoLockSeconds}s</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleManualLock}
                        className="text-[11px] font-bold text-[#004b79] dark:text-[#dfb74a] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Lock Now</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-7 space-y-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Payee Name:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      Founder — {companyName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Tuition Amount:</span>
                    <span className="font-mono font-black text-sm sm:text-base text-[#004b79] dark:text-[#dfb74a]">
                      ₹{monthlyFee.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Official UPI ID
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {upiId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      {copiedUpi ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span>{copiedUpi ? "Copied" : "Copy UPI"}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                    Enter 12-Digit UTR / Transaction Reference <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 423589102456"
                    value={transactionIdInput}
                    onChange={(e) => handleUtrChange(e.target.value)}
                    onFocus={() => {
                      if (isQrUnlocked) {
                        setIsQrUnlocked(false);
                        setHasScanned(true);
                      }
                    }}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-xs font-mono focus:outline-none focus:border-[#004b79] focus:ring-1 focus:ring-[#004b79]"
                  />
                  <p className="text-[10px] text-slate-400">
                    Scan with any UPI app and enter the 12-digit UTR reference above to complete verification.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPaying}
                className="px-5 py-2 rounded-lg bg-[#004b79] hover:bg-[#003b60] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {isPaying ? <span>Submitting...</span> : <span>Confirm &amp; Submit UTR</span>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
