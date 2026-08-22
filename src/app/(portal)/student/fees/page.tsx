"use client";

import React, { useState } from "react";
import { CreditCard, CheckCircle2, Clock, Download, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentFeesPage() {
  const { data, refetch } = useFastFetch("/api/student/payments");
  const [isPaying, setIsPaying] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isSuccessModal, setIsSuccessModal] = useState(false);

  const handlePayNow = async () => {
    if (!selectedPayment) return;
    setIsPaying(true);
    try {
      const res = await fetch("/api/student/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment._id,
          paymentMethod: "Online UPI (Razorpay Gateway)",
        }),
      });

      if (res.ok) {
        setSelectedPayment(null);
        setIsSuccessModal(true);
        refetch();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

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
          Monthly tuition management with online gateway architecture.
        </p>
      </div>

      {/* Current Due Banner / Card */}
      {currentFee ? (
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
                onClick={() => setSelectedPayment(currentFee)}
              >
                Pay Tuition Now
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <h2 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
              All Tuition Dues Cleared!
            </h2>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              You have no pending fees for the current academic billing cycle.
            </p>
          </div>
        </Card>
      )}

      {/* Payment History */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Payment History & Receipts
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Receipt No</th>
                <th className="p-4 font-bold">Month</th>
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
                    <td className="p-4 font-medium">{p.billingMonth}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">₹{p.amount}</td>
                    <td className="p-4 text-slate-500">{p.paymentMethod || "Online"}</td>
                    <td className="p-4 text-slate-500">
                      {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : "Jan 8, 2025"}
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

      {/* Pay Now Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`Pay Tuition: ${selectedPayment.billingMonth}`}
          description={`Amount: ₹${selectedPayment.amount} • Secure Gateway Architecture`}
        >
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <p className="font-bold">Acuity Payment Security Guarantee</p>
              <p className="text-[11px]">
                Transactions are encrypted with SSL. Raw card details are never stored on servers.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold">Select Payment Mode</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl border border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/50 font-bold text-indigo-700 dark:text-indigo-300">
                  Online UPI / Netbanking
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500">
                  Credit / Debit Card
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setSelectedPayment(null)}>
                Cancel
              </Button>
              <Button variant="glow" isLoading={isPaying} onClick={handlePayNow} className="font-bold">
                Authorize ₹{selectedPayment.amount} Payment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Notification Modal */}
      <Modal
        isOpen={isSuccessModal}
        onClose={() => setIsSuccessModal(false)}
        title="Payment Successful!"
        description="Your monthly tuition has been marked paid and an official receipt has been issued."
      >
        <div className="space-y-4 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-xs text-slate-500">
            Receipt copy has been emailed and synchronized with the Parent Portal.
          </p>
          <Button variant="primary" className="w-full font-bold" onClick={() => setIsSuccessModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </main>
  );
}
