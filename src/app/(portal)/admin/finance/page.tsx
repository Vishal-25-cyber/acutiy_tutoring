"use client";

import React, { useState } from "react";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Download,
  TrendingUp,
  CreditCard,
  Filter,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch, invalidateCache } from "@/lib/api-cache";

export default function AdminFinancePage() {
  const { data, refetch } = useFastFetch("/api/admin/finance");

  const summary = data?.summary || {
    totalCollected: 0,
    totalPending: 0,
    collectionRate: 100,
    totalTransactions: 0,
    paidStudentsCount: 0,
    pendingVerificationCount: 0,
  };

  const payments = Array.isArray(data?.payments) ? data.payments : [];
  const monthlyTrend = Array.isArray(data?.monthlyTrend) && data.monthlyTrend.length > 0
    ? data.monthlyTrend
    : [
        { month: "Jan", collected: 0, pending: 0 },
        { month: "Feb", collected: 0, pending: 0 },
        { month: "Mar", collected: 0, pending: 0 },
      ];

  const handleMarkPaid = async (paymentId: string) => {
    try {
      const res = await fetch("/api/admin/finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: "PAID" }),
      });

      if (res.ok) {
        invalidateCache("/api/admin/finance");
        invalidateCache("/api/admin/dashboard");
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format currency cleanly
  const formatCurrency = (val?: number) => {
    if (typeof val !== "number" || isNaN(val)) return "₹0";
    return `₹${val.toLocaleString("en-IN")}`;
  };

  // Format date and time
  const formatDateTime = (dateStr?: string | Date) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return {
        date: d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch {
      return null;
    }
  };

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-7xl animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Tuition Ledger & Financial Operations
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Live monthly tuition fees, timestamped transaction records, and payment reconciliation.
        </p>
      </div>

      {/* 4 Financial Stat Cards (100% Live DB Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
            {formatCurrency(summary.totalCollected)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Cleared in database</p>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Invoices</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-500 mt-1 tracking-tight">
            {formatCurrency(summary.totalPending)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {summary.pendingVerificationCount > 0
              ? `${summary.pendingVerificationCount} Awaiting Verification`
              : "Awaiting student payment"}
          </p>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collection Efficiency</span>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1 tracking-tight">
            {summary.collectionRate}%
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            {summary.paidStudentsCount} Settled Payments
          </p>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Records Tracked</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
            {summary.totalTransactions}
          </p>
          <p className="text-xs text-slate-400 mt-1">Live fee invoices</p>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4">
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Monthly Fee Revenue & Pending Dues
          </h2>
          <p className="text-xs text-slate-500">Live distribution based on registered student invoices</p>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Transactions & Invoices Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Student Invoices & Receipts ({payments.length})
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 font-bold">Student</th>
                  <th className="p-4 font-bold">Amount</th>
                  <th className="p-4 font-bold">Billing Cycle</th>
                  <th className="p-4 font-bold">Date & Time Paid</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Receipt / Ref</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No invoices currently logged. Invoices generated for enrolled students will appear here.
                    </td>
                  </tr>
                ) : (
                  payments.map((p: any) => {
                    const paidDateTime = formatDateTime(p.paidDate || (p.status === "PAID" ? p.updatedAt || p.createdAt : null));
                    const dueDateTime = formatDateTime(p.dueDate);

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{p.studentId?.name || "Student"}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{p.studentId?.email}</p>
                        </td>

                        <td className="p-4 font-black text-sm text-slate-900 dark:text-slate-100 font-mono">
                          {formatCurrency(p.amount)}
                        </td>

                        <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                          <p>{p.billingMonth || p.month || "Current Term"}</p>
                          {p.courseName && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{p.courseName}</p>
                          )}
                        </td>

                        {/* DATE & TIME PAID COLUMN */}
                        <td className="p-4">
                          {paidDateTime ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{paidDateTime.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                                <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>{paidDateTime.time}</span>
                              </div>
                            </div>
                          ) : p.status === "PENDING_VERIFICATION" ? (
                            <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Verification in progress</span>
                            </span>
                          ) : dueDateTime ? (
                            <span className="text-slate-400 text-[11px]">
                              Due: {dueDateTime.date}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="p-4">
                          <Badge
                            variant={
                              p.status === "PAID"
                                ? "success"
                                : p.status === "PENDING_VERIFICATION"
                                ? "warning"
                                : "destructive"
                            }
                          >
                            {p.status === "PENDING_VERIFICATION" ? "VERIFYING UPI" : p.status}
                          </Badge>
                        </td>

                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            {p.receiptNumber || p.transactionId || "—"}
                          </p>
                          {p.paymentMethod && (
                            <p className="text-[10px] text-slate-400">{p.paymentMethod}</p>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {p.status !== "PAID" ? (
                            <Button
                              size="sm"
                              variant="primary"
                              className="text-xs h-7 font-bold"
                              onClick={() => handleMarkPaid(p._id)}
                            >
                              Mark Paid
                            </Button>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Paid</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
