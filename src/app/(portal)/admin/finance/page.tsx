"use client";

import React, { useState } from "react";
import { DollarSign, CheckCircle2, Clock, Download, TrendingUp, CreditCard, Filter } from "lucide-react";
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
import { useFastFetch } from "@/lib/api-cache";

const INITIAL_SUMMARY = {
  totalCollected: 248500,
  totalPending: 32000,
  collectionRate: 88,
  totalTransactions: 104,
};

const INITIAL_PAYMENTS = [
  {
    _id: "pay-1",
    studentId: { _id: "u1", name: "Aravind Swaminathan", email: "aravind.class10@acuity.edu" },
    amount: 2500,
    month: "October 2025",
    type: "TUITION_FEE",
    status: "PAID",
    paidAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    receiptNumber: "REC-2025-00189",
  },
  {
    _id: "pay-2",
    studentId: { _id: "u2", name: "Priya Sharma", email: "priya.class9@acuity.edu" },
    amount: 2500,
    month: "October 2025",
    type: "TUITION_FEE",
    status: "PAID",
    paidAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    receiptNumber: "REC-2025-00174",
  },
  {
    _id: "pay-3",
    studentId: { _id: "u3", name: "Rohit Verma", email: "rohit.class8@acuity.edu" },
    amount: 2500,
    month: "October 2025",
    type: "TUITION_FEE",
    status: "PENDING",
    paidAt: null,
    receiptNumber: null,
  },
];

export default function AdminFinancePage() {
  const { data, refetch } = useFastFetch("/api/admin/finance", {
    summary: INITIAL_SUMMARY,
    payments: INITIAL_PAYMENTS,
  });

  const handleMarkPaid = async (paymentId: string) => {
    try {
      const res = await fetch("/api/admin/finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: "PAID" }),
      });

      if (res.ok) {
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const summary = data?.summary || INITIAL_SUMMARY;
  const payments = data?.payments || INITIAL_PAYMENTS;

  const chartData = [
    { month: "Aug", collected: 180000, pending: 25000 },
    { month: "Sep", collected: 210000, pending: 20000 },
    { month: "Oct", collected: 235000, pending: 30000 },
    { month: "Nov", collected: 242000, pending: 28000 },
    { month: "Dec", collected: 248500, pending: 32000 },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-7xl animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Tuition Ledger & Financial Operations
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monthly tuition fees, revenue collection rates, and reconciliation records.
        </p>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Collected</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{(summary.totalCollected / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-slate-500 mt-1">Cleared this cycle</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Pending Invoices</span>
          <p className="text-3xl font-black text-amber-500 mt-1">
            ₹{(summary.totalPending / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-slate-500 mt-1">Awaiting online UPI transfer</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Collection Efficiency</span>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {summary.collectionRate}%
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">+3% vs last month</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Receipts Issued</span>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {summary.totalTransactions}
          </p>
          <p className="text-xs text-slate-500 mt-1">Class 1 to 10 receipts</p>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="p-6">
        <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
          Monthly Fee Revenue & Pending Dues
        </h2>
        <p className="text-xs text-slate-500 mb-6">Historical trends over the academic session</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected (₹)" />
              <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Student Invoices & Transactions
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Student</th>
                <th className="p-4 font-bold">Billing Month / Course</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Method & UTR</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                payments.map((p: any) => {
                  const isPendingVerification = p.status === "PENDING_VERIFICATION";
                  const isPaid = p.status === "PAID";

                  return (
                    <tr
                      key={p._id}
                      className={
                        isPendingVerification
                          ? "bg-amber-500/10 dark:bg-amber-500/5 hover:bg-amber-500/15"
                          : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      }
                    >
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                        <div>
                          <span>{p.studentId?.name || "Student"}</span>
                          {p.studentId?.email && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {p.studentId.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                        {p.courseName || p.billingMonth}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100 text-sm">
                        ₹{p.amount}
                      </td>
                      <td className="p-4 text-slate-500">
                        <span className="block font-medium text-slate-700 dark:text-slate-300">
                          {p.paymentMethod || "Online UPI"}
                        </span>
                        {p.transactionId && (
                          <span className="block font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                            UTR: {p.transactionId}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isPendingVerification ? (
                          <Badge variant="warning" className="bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 animate-pulse font-bold">
                            ⏳ VERIFICATION PENDING
                          </Badge>
                        ) : (
                          <Badge variant={isPaid ? "success" : "warning"}>
                            {p.status}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!isPaid && (
                          <Button
                            size="sm"
                            variant="success"
                            className={`text-xs font-bold ${
                              isPendingVerification
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                : ""
                            }`}
                            onClick={() => handleMarkPaid(p._id)}
                          >
                            {isPendingVerification ? "✓ Verify & Approve" : "Mark Paid"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
