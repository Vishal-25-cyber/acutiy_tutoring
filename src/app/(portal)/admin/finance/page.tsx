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

export default function AdminFinancePage() {
  const { data, refetch } = useFastFetch("/api/admin/finance");

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

  const summary = data?.summary || {
    totalCollected: 248500,
    totalPending: 32000,
    collectionRate: 88,
    totalTransactions: 104,
  };

  const payments = data?.payments || [];

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
                <th className="p-4 font-bold">Billing Month</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Method</th>
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
                payments.map((p: any) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                      {p.studentId?.name || "Student"}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{p.billingMonth}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">₹{p.amount}</td>
                    <td className="p-4 text-slate-500">{p.paymentMethod || "Online"}</td>
                    <td className="p-4">
                      <Badge variant={p.status === "PAID" ? "success" : "warning"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {p.status !== "PAID" && (
                        <Button
                          size="sm"
                          variant="success"
                          className="text-xs font-bold"
                          onClick={() => handleMarkPaid(p._id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
