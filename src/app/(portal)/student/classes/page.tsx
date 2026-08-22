"use client";

import React from "react";
import Link from "next/link";
import { Video, Clock, Calendar, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentClassesPage() {
  const { data } = useFastFetch("/api/student/classes");

  const todayClasses = data?.todayClasses || [
    {
      _id: "acuity-class10-maths-live",
      title: "Class 10 CBSE — Quadratic Equations Masterclass",
      subject: "Mathematics",
      topic: "Discriminant Formula & Solving Complex Word Problems",
      date: new Date().toISOString().split("T")[0],
      startTime: "19:00",
      endTime: "20:00",
      status: "LIVE",
      teacherId: { name: "Dr. Sarah Jenkins" },
      gracePeriodMinutes: 5,
    },
  ];

  const weeklySchedule = [
    { day: "Monday", time: "7:00 PM – 8:00 PM", subject: "Mathematics", topic: "Quadratic Equations" },
    { day: "Tuesday", time: "7:00 PM – 8:00 PM", subject: "Science", topic: "Light Reflection & Refraction" },
    { day: "Wednesday", time: "7:00 PM – 8:00 PM", subject: "Mathematics", topic: "Arithmetic Progressions" },
    { day: "Thursday", time: "7:00 PM – 8:00 PM", subject: "English", topic: "Grammar & Creative Writing" },
    { day: "Friday", time: "7:00 PM – 8:00 PM", subject: "Social Science", topic: "Nationalism in India" },
  ];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Live Classes & Timetable
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Batch: <strong>7:00 PM – 8:00 PM (Batch 2)</strong> • 5-Minute Late Entry Protection.
          </p>
        </div>
      </div>

      {/* Hero Live Session */}
      {todayClasses.map((cls: any) => (
        <Card
          key={cls._id}
          className="p-6 border-indigo-500/50 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 shadow-md"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={cls.status === "LIVE" ? "live" : "default"}>{cls.status}</Badge>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {cls.startTime} – {cls.endTime}
                </span>
                <span className="text-xs text-slate-400">• 5-Min Grace Period</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{cls.title}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                <strong>Topic:</strong> {cls.topic}
                <br />
                <span className="text-slate-500">Teacher: {cls.teacherId?.name || "Dr. Sarah Jenkins"}</span>
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Link href={`/student/classroom/${cls._id}`}>
                <Button
                  variant={cls.status === "LIVE" ? "glow" : "primary"}
                  size="lg"
                  className="font-bold text-xs gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>{cls.status === "LIVE" ? "JOIN LIVE CLASS" : "ENTER ROOM"}</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ))}

      {/* Weekly Schedule */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Weekly Batch Schedule (Class 10 CBSE)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Day</th>
                <th className="p-4 font-bold">Batch Timing</th>
                <th className="p-4 font-bold">Subject</th>
                <th className="p-4 font-bold">Weekly Agenda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {weeklySchedule.map((slot, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{slot.day}</td>
                  <td className="p-4 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {slot.time}
                  </td>
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{slot.subject}</td>
                  <td className="p-4 text-slate-500">{slot.topic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
