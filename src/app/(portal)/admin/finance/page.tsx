"use client";

import React, { useState } from "react";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Search,
  ShieldCheck,
  Calendar,
  Check,
} from "lucide-react";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";

export default function AdminFinancePage() {
  const { data, refetch } = useFastFetch("/api/admin/finance");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const summary = data?.summary || {
    totalCollected: 0,
    totalPending: 0,
    collectionRate: 100,
    totalTransactions: 0,
    paidStudentsCount: 0,
    pendingVerificationCount: 0,
  };

  const payments = Array.isArray(data?.payments) ? data.payments : [];

  const filteredPayments = payments.filter((p: any) => {
    const matchesSearch =
      !search.trim() ||
      p.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.studentId?.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionId?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "PAID" && p.status === "PAID") ||
      (filterStatus === "PENDING" && p.status !== "PAID");

    return matchesSearch && matchesStatus;
  });

  const handleMarkPaid = async (paymentId: string) => {
    setUpdatingId(paymentId);
    try {
      const res = await fetch("/api/admin/finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: "PAID" }),
      });

      if (res.ok) {
        invalidateCache("/api/admin/finance");
        invalidateCache("/api/admin/dashboard");
        await refetch();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatCurrency = (val?: number) => {
    if (typeof val !== "number" || isNaN(val)) return "₹0";
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const formatDateTime = (dateStr?: string | Date) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return {
        date: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch {
      return null;
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Tuition Ledger &amp; Financials
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-[#002137] text-[#004b79] dark:text-[#dfb74a] border border-blue-200 dark:border-[#004b79]/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monthly tuition fee collections, cleared payments, and student invoices.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-x-auto self-start sm:self-auto shrink-0">
          {[
            { id: "ALL", label: `All Invoices (${payments.length})` },
            { id: "PAID", label: `Settled (${summary.paidStudentsCount})` },
            { id: "PENDING", label: `Pending Dues (${payments.length - summary.paidStudentsCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. ESSENTIAL 4-METRIC FLAT STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pb-2">
        <div className="py-2 sm:px-6 first:pl-0 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(summary.totalCollected)}
          </p>
          <p className="text-xs text-slate-400">Cleared in database</p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Dues</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">
            {formatCurrency(summary.totalPending)}
          </p>
          <p className="text-xs text-slate-400">
            {summary.pendingVerificationCount > 0
              ? `${summary.pendingVerificationCount} Awaiting Verification`
              : "Awaiting payment"}
          </p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Collection Rate</span>
          <p className="text-2xl sm:text-3xl font-black text-[#004b79] dark:text-[#dfb74a] font-mono">
            {summary.collectionRate}%
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {summary.paidStudentsCount} Settled Payments
          </p>
        </div>

        <div className="py-2 sm:px-6 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Invoices Tracked</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {summary.totalTransactions}
          </p>
          <p className="text-xs text-slate-400">Fee receipts</p>
        </div>
      </div>

      {/* ── 3. SEARCH BAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search student, email, or receipt number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#004b79] shadow-xs"
          />
        </div>
      </div>

      {/* ── 4. CARDLESS 12-COLUMN INVOICES TABLE ── */}
      <div className="space-y-2 pt-2">
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-3">Student &amp; Email</div>
          <div className="col-span-2">Amount &amp; Term</div>
          <div className="col-span-3">Payment Timestamp</div>
          <div className="col-span-2">Receipt &amp; Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredPayments.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <DollarSign className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No invoices in this view</p>
              <p className="text-xs text-slate-400">Invoices generated for students will appear here.</p>
            </div>
          ) : (
            filteredPayments.map((p: any) => {
              const paidDateTime = formatDateTime(
                p.paidDate || (p.status === "PAID" ? p.updatedAt || p.createdAt : null)
              );
              const dueDateTime = formatDateTime(p.dueDate);
              const isPaid = p.status === "PAID";

              return (
                <div
                  key={p._id}
                  className="py-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
                >
                  {/* Col 1: Student */}
                  <div className="col-span-3 space-y-0.5">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {p.studentId?.name || "Student"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{p.studentId?.email}</p>
                  </div>

                  {/* Col 2: Amount & Term */}
                  <div className="col-span-2 space-y-0.5">
                    <p className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {formatCurrency(p.amount)}
                    </p>
                    <p className="text-[11px] text-slate-400">{p.billingMonth || p.month || "Current Term"}</p>
                  </div>

                  {/* Col 3: Date Paid */}
                  <div className="col-span-3 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {paidDateTime ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{paidDateTime.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          <span>{paidDateTime.time}</span>
                        </div>
                      </div>
                    ) : p.status === "PENDING_VERIFICATION" ? (
                      <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>UPI Verification in progress</span>
                      </span>
                    ) : dueDateTime ? (
                      <span className="text-slate-400 text-[11px]">Due: {dueDateTime.date}</span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </div>

                  {/* Col 4: Status & Receipt */}
                  <div className="col-span-2 space-y-0.5">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isPaid
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : p.status === "PENDING_VERIFICATION"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {p.status === "PENDING_VERIFICATION" ? "Verifying UPI" : p.status}
                    </span>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {p.receiptNumber || p.transactionId || "—"}
                    </p>
                  </div>

                  {/* Col 5: Actions */}
                  <div className="col-span-2 flex items-center justify-start md:justify-end">
                    {!isPaid ? (
                      <button
                        type="button"
                        disabled={updatingId === p._id}
                        onClick={() => handleMarkPaid(p._id)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-2xs disabled:opacity-60"
                      >
                        {updatingId === p._id ? "Updating..." : "Mark Paid"}
                      </button>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Settled</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
