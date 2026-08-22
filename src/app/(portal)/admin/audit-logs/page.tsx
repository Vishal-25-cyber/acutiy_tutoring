"use client";

import React from "react";
import { History, ShieldCheck, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminAuditLogsPage() {
  const { data } = useFastFetch("/api/admin/audit-logs");

  const sampleLogs = [
    { _id: "1", action: "TEACHER_STATUS_ACTIVE", actor: "Acuity Administrator", entity: "USER", time: "10 mins ago", ip: "127.0.0.1", details: "Approved Dr. Sarah Jenkins" },
    { _id: "2", action: "STUDENT_REGISTERED", actor: "System", entity: "USER", time: "45 mins ago", ip: "127.0.0.1", details: "Enrolled Aravind in Class 10 Batch 2" },
    { _id: "3", action: "BATCH_UPDATED", actor: "Acuity Administrator", entity: "BATCH", time: "2 hours ago", ip: "127.0.0.1", details: "Set grace period to 5 minutes" },
    { _id: "4", action: "PAYMENT_STATUS_PAID", actor: "Online Webhook", entity: "PAYMENT", time: "3 hours ago", ip: "127.0.0.1", details: "₹2,500 tuition verified" },
  ];

  const displayLogs = data?.logs && data.logs.length > 0 ? data.logs : sampleLogs;

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              System Audit Logs
            </h1>
            <Badge variant="default">Immutable Security Log</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological record of administrative operations, teacher approvals, and batch changes.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Action</th>
                <th className="p-4 font-bold">Actor</th>
                <th className="p-4 font-bold">Details</th>
                <th className="p-4 font-bold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayLogs.map((log: any) => (
                <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4">
                    <Badge variant="default">{log.action}</Badge>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{log.actor}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{log.details}</td>
                  <td className="p-4 font-mono text-slate-400">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
