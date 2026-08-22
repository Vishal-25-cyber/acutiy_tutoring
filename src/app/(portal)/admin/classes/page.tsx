"use client";

import React from "react";
import Link from "next/link";
import { Video, Clock, ShieldCheck, Users, Signal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminClassesMonitorPage() {
  const { data } = useFastFetch("/api/admin/classes");

  const liveSessions = data?.sessions || [
    {
      id: "acuity-class10-maths-live",
      title: "Class 10 CBSE — Quadratic Equations Masterclass",
      subject: "Mathematics",
      classLevel: "Class 10",
      batch: "7:00 PM – 8:00 PM",
      teacher: "Dr. Sarah Jenkins",
      participantsCount: 18,
      status: "LIVE",
      startedAt: "7:00 PM",
      graceMinutes: 5,
    },
    {
      id: "acuity-class9-science-live",
      title: "Class 9 — Laws of Motion & Momentum",
      subject: "Science",
      classLevel: "Class 9",
      batch: "6:00 PM – 7:00 PM",
      teacher: "Prof. Rajesh Kumar",
      participantsCount: 22,
      status: "COMPLETED",
      startedAt: "6:00 PM",
      graceMinutes: 5,
    },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Live Session Monitor
            </h1>
            <Badge variant="live">REAL-TIME</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor active WebRTC rooms, faculty stream quality, and student attendance logs.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {liveSessions.map((s: any) => (
          <Card key={s.id} className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant={s.status === "LIVE" ? "live" : "default"}>{s.status}</Badge>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {s.batch}
                  </span>
                  <span className="text-xs text-slate-400">• {s.classLevel}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.title}</h2>
                <p className="text-xs text-slate-500">
                  Faculty: <strong>{s.teacher}</strong> • Enrolled Present: <strong>{s.participantsCount} Students</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/student/classroom/${s.id}`}>
                  <Button
                    size="sm"
                    variant={s.status === "LIVE" ? "glow" : "outline"}
                    className="text-xs font-bold gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{s.status === "LIVE" ? "Inspect Stream" : "View Recording"}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
