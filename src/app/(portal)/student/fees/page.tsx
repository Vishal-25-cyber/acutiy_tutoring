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
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useFastFetch } from "@/lib/api-cache";
import { downloadReceiptPDF } from "@/lib/download";

export default function StudentFeesPage() {
  const { data, refetch } = useFastFetch("/api/student/payments");
  const [isPaying, setIsPaying] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
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

  const upiId = data?.settings?.upiId || "acuity.tutoring@upi";
  const companyName = data?.settings?.companyName || "Acuity Tutoring";
  const monthlyFee = Number(data?.settings?.monthlyFee || data?.currentFee?.amount || 1999);
  const customQrImage = data?.settings?.qrCodeImageUrl;
  const currentMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());

  // Genuine UPI Deep Link URI with pre-filled exact amount
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    companyName
  )}&am=${monthlyFee.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Tuition Fee")}`;

  // High-Resolution Scannable Real QR Code Image (uses custom uploaded QR if set, otherwise auto-generates dynamic UPI QR)
  const displayQrCodeUrl =
    customQrImage && customQrImage.trim()
      ? customQrImage
      : `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
          upiUri
        )}&margin=8`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleOpenScanner = () => {
    setTransactionIdInput(`UPI-${Date.now().toString().slice(-8)}`);
    setShowPayModal(true);
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
          paymentMethod: "Online UPI Transfer",
          transactionId: transactionIdInput.trim() || `UPI-${Date.now().toString().slice(-8)}`,
          courseName: paymentTarget.courseName || `Monthly Live Class Tuition Fee`,
          courseId: paymentTarget.courseId,
        }),
      });

      if (res.ok) {
        setShowPayModal(false);
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
  // Strictly display only this student's real payment receipts from the database
  const history: any[] = data?.history || [];

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Tuition &amp; Fees
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Official monthly tuition invoices, real UPI scanner gateway with auto-filled amount, and verified receipts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleOpenScanner}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>Pay Tuition &amp; Scan QR</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
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
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            ₹{monthlyFee.toLocaleString("en-IN")}
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
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span>{currentFee ? "Pending Dues" : "Cleared"}</span>
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {currentFee ? `₹${currentFee.amount} invoice due` : "No outstanding invoices"}
          </p>
        </div>

        {/* Metric 4: Access Status */}
        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Portal Access</span>
          <p className="text-2xl sm:text-3xl font-black text-[#004b79] dark:text-[#dfb74a]">
            Full Access
          </p>
          <p className="text-xs text-slate-500 font-medium">Live classrooms &amp; notes unlocked</p>
        </div>
      </div>

      {/* ── 3. PENDING VERIFICATION NOTICE (IF ANY) ── */}
      {pendingVerification && (
        <div className="py-3 px-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Payment Verification Pending (Ref: {pendingVerification.transactionId})
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-[11px]">
                Your transfer of ₹{pendingVerification.amount} is under review by administration.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-200">
            ₹{pendingVerification.amount} Submitted
          </span>
        </div>
      )}

      {/* ── 4. PAYMENT RECEIPTS TABLE (ONLY THIS STUDENT'S AUTHENTIC RECEIPTS) ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
              Official Payment Receipts
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {history.length} Authentic Record{history.length === 1 ? "" : "s"}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No payment receipts yet</p>
            <p className="text-[11px] text-slate-400">
              When tuition fees are settled, official verified PDF receipts will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Table Headers */}
            <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
              <div className="col-span-2">Receipt Number</div>
              <div className="col-span-4">Billing Month / Description</div>
              <div className="col-span-2">Amount Paid</div>
              <div className="col-span-2">Payment Mode &amp; Date</div>
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
                    <div className="col-span-2 space-y-0.5">
                      <p className="font-mono font-bold text-xs text-[#004b79] dark:text-[#dfb74a]">
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
                      <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-mono">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-400">Tuition Cleared</p>
                    </div>

                    {/* Col 4: Mode & Date */}
                    <div className="col-span-2 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                      <p className="font-medium">{p.paymentMethod || "Online UPI"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {p.paidDate
                          ? new Date(p.paidDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Today"}
                      </p>
                    </div>

                    {/* Col 5: Action (Download PDF) */}
                    <div className="col-span-2 flex items-center justify-start md:justify-end">
                      <button
                        onClick={() => handleDownloadReceipt(p)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        {isDownloading ? (
                          <span className="animate-spin text-xs">⏳</span>
                        ) : (
                          <Download className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                        )}
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 5. INSTANT UPI PAYMENT & REAL SCANNABLE QR CODE MODAL ── */}
      {showPayModal && (
        <Modal
          isOpen={showPayModal}
          maxWidth="2xl"
          onClose={() => setShowPayModal(false)}
          title="Instant UPI Payment &amp; Real QR Scanner"
          description="Scan the official QR code using Google Pay, PhonePe, Paytm, or BHIM. The amount is automatically pre-filled."
        >
          <form onSubmit={handleSubmitPayment} className="space-y-5 pt-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Real Scannable UPI QR Scanner */}
              <div className="md:col-span-5 flex flex-col items-center text-center space-y-2.5">
                <div className="relative p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <img
                    src={displayQrCodeUrl}
                    alt="Official UPI QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                  />
                  <div className="absolute inset-x-0 bottom-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#004b79] text-white shadow-xs">
                      ₹{monthlyFee.toLocaleString("en-IN")} Pre-Filled
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block">
                    Scan with Any UPI App
                  </span>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Details & UTR Input */}
              <div className="md:col-span-7 space-y-3.5">
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Payee Name:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {companyName}
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

                {/* Reference Number / UTR Input */}
                <div className="space-y-1">
                  <label className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                    Enter 12-Digit UTR / Transaction Reference <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 423589102456 or UPI-20260830-101"
                    value={transactionIdInput}
                    onChange={(e) => setTransactionIdInput(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-xs font-mono focus:outline-none focus:border-[#004b79] focus:ring-1 focus:ring-[#004b79]"
                  />
                  <p className="text-[10px] text-slate-400">
                    When you scan and pay, the amount ₹{monthlyFee} will appear automatically in your UPI app. Enter the resulting 12-digit UTR above.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
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
