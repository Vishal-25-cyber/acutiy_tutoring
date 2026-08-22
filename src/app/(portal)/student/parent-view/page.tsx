"use client";

import React from "react";
import { Users2, CheckCircle2, Clock, Award, PhoneCall, ShieldCheck, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFastFetch } from "@/lib/api-cache";

export default function StudentParentViewPage() {
  const { data } = useFastFetch("/api/student/parent-view");

  const student = data?.student || {
    name: "Aravind Swaminathan",
    classLevel: "Class 10",
    board: "CBSE",
    schoolName: "DAV Senior Secondary School",
    parentName: "Swaminathan Raman",
    parentPhone: "9876543290",
  };

  const attendance = data?.attendance || { percentage: 96, totalClasses: 18, attendedClasses: 16, riskLevel: "LOW" };
  const hotlines = data?.officialSupportNumbers || {
    phone1: "+91 98765 43210",
    phone2: "+91 98765 43211",
    phone3: "+91 98765 43212",
    email: "support@acuity.edu",
  };

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-5xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Parent & Guardian View
            </h1>
            <Badge variant="success">Verified Academic Record</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Parent: <strong>{student.parentName}</strong> ({student.parentPhone})
          </p>
        </div>
      </div>

      {/* Student Profile Overview Card */}
      <Card className="p-6 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Student Name</span>
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">{student.name}</p>
          </div>
          <div>
            <span className="text-slate-400">Class & Board</span>
            <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mt-0.5">
              {student.classLevel} ({student.board})
            </p>
          </div>
          <div>
            <span className="text-slate-400">School</span>
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">{student.schoolName}</p>
          </div>
          <div>
            <span className="text-slate-400">Batch Timing</span>
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">7:00 PM – 8:00 PM</p>
          </div>
        </div>
      </Card>

      {/* Parent Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Live Attendance Rate</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {attendance.percentage}%
          </p>
          <Badge variant="riskLow" className="mt-1 text-[10px]">
            {attendance.riskLevel} ATTENDANCE RISK
          </Badge>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Homework Submissions</span>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">100%</p>
          <p className="text-xs text-slate-500 mt-1">All weekly tasks turned in</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase">Tuition Fee Status</span>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">Cleared</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            Receipt #REC-00189
          </p>
        </Card>
      </div>

      {/* Teacher Academic Feedback */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Teacher Academic Remarks
          </h3>
        </div>
        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <li>
            • <strong>Dr. Sarah Jenkins (Mathematics):</strong> "Aravind shows great aptitude in solving quadratic equations. His working step clarity is excellent."
          </li>
          <li>
            • <strong>Prof. Rajesh Kumar (Science):</strong> "Consistently active in answering live polls and submitting physics Ray Diagram assignments on time."
          </li>
        </ul>
      </Card>

      {/* Official Company 3 Hotlines Configured by Admin */}
      <Card className="p-6 bg-slate-900 text-white space-y-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-base">24/7 Official Parent Support Hotlines</h3>
        </div>
        <p className="text-xs text-slate-400">
          Our academic directors and batch coordinators are available directly on these verified support channels:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs pt-1">
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 text-[10px] block font-sans">Primary Support Line</span>
            <span className="text-white font-bold">{hotlines.phone1}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 text-[10px] block font-sans">Batch Academic Desk</span>
            <span className="text-white font-bold">{hotlines.phone2}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 text-[10px] block font-sans">Emergency Hotline</span>
            <span className="text-white font-bold">{hotlines.phone3}</span>
          </div>
        </div>
      </Card>
    </main>
  );
}
