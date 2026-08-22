"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Video, Clock, Calendar, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function TeacherSchedulePage() {
  const { data } = useFastFetch("/api/teacher/classes");

  const sessions = data?.sessions || [
    {
      _id: "acuity-class10-maths-live",
      title: "Class 10 CBSE — Quadratic Equations Masterclass",
      subject: "Mathematics",
      classLevel: "Class 10",
      date: new Date().toISOString().split("T")[0],
      startTime: "19:00",
      endTime: "20:00",
      status: "LIVE",
      batch: "7:00 PM – 8:00 PM (Batch 2)",
    },
    {
      _id: "acuity-class9-maths-upcoming",
      title: "Class 9 CBSE — Polynomials & Factor Theorem",
      subject: "Mathematics",
      classLevel: "Class 9",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      startTime: "18:00",
      endTime: "19:00",
      status: "SCHEDULED",
      batch: "6:00 PM – 7:00 PM (Batch 1)",
    },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Teaching Schedule & Batches
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Weekly live lecture calendar and WebRTC host control links.
          </p>
        </div>
        <Link href="/teacher/live-class/create" prefetch={true}>
          <Button variant="primary" size="sm" className="font-bold text-xs gap-1.5 rounded-xl">
            <Plus className="w-4 h-4" />
            <span>Schedule New Class</span>
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {sessions.map((cls: any) => (
          <Card key={cls._id} className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant={cls.status === "LIVE" ? "live" : "default"}>{cls.status}</Badge>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {cls.startTime} – {cls.endTime}
                  </span>
                  <span className="text-xs text-slate-400">• {cls.classLevel}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{cls.title}</h2>
                <p className="text-xs text-slate-500">
                  Subject: {cls.subject} • Batch: {cls.batch} • Date: {cls.date}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Link href={`/teacher/classroom/${cls._id}`}>
                  <Button
                    variant={cls.status === "LIVE" ? "glow" : "primary"}
                    size="md"
                    className="font-bold text-xs gap-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>{cls.status === "LIVE" ? "LAUNCH LIVE CLASS" : "HOST CLASSROOM"}</span>
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
