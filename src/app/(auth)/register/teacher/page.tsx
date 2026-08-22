"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CLASS_LIST, getAllUniqueSubjects } from "@/lib/curriculum";

export default function TeacherRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    altPhone: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    qualification: "",
    specialization: "",
    targetBoard: "Both CBSE & State Board",
    subjects: ["Mathematics", "Science"],
    classesTaught: ["Class 8", "Class 9", "Class 10"],
    experienceYears: 4,
    resumeUrl: "https://acuity.edu/docs/sample-resume.pdf",
    certificateUrl: "https://acuity.edu/docs/sample-degree.pdf",
    idProofUrl: "https://acuity.edu/docs/sample-id.pdf",
  });

  const availableSubjects = [
    "Mathematics",
    "Mathematics (Standard / Basic)",
    "Science",
    "Science (Physics / Chemistry / Biology)",
    "Physics",
    "Chemistry",
    "Biology",
    "English Language & Literature",
    "Social Science",
    "Tamil / Regional Language",
    "Hindi Course A / B",
    "Information Technology / Computer Science",
    "Environmental Studies (EVS)",
  ];

  const handleSubjectToggle = (subj: string) => {
    setFormData((prev) => {
      const exists = prev.subjects.includes(subj);
      return {
        ...prev,
        subjects: exists ? prev.subjects.filter((s) => s !== subj) : [...prev.subjects, subj],
      };
    });
  };

  const handleClassToggle = (cls: string) => {
    setFormData((prev) => {
      const exists = prev.classesTaught.includes(cls);
      return {
        ...prev,
        classesTaught: exists ? prev.classesTaught.filter((c) => c !== cls) : [...prev.classesTaught, cls],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (formData.subjects.length === 0 || formData.classesTaught.length === 0) {
      setErrorMessage("Please select at least one subject and class level you teach.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to submit application.");
        return;
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <Badge variant="warning">Application Submitted</Badge>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Pending Admin Approval
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Thank you for applying to teach at Acuity Tutoring! Our academic administration team is reviewing your qualifications and teaching credentials.
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border border-slate-200 dark:border-slate-700/50">
            <p className="font-semibold text-slate-900 dark:text-slate-100">What happens next?</p>
            <p>1. Administrator reviews your resume and certificates.</p>
            <p>2. You will receive an approval email notification.</p>
            <p>3. Once approved, log in to schedule and host live classes.</p>
          </div>
          <Link href="/login" prefetch={true} className="block pt-2">
            <Button variant="primary" className="w-full font-bold">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 font-sans">
      {/* LEFT SIDE: Teacher Branding */}
      <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-8 lg:p-12 flex flex-col justify-between text-white relative">
        <div>
          <Link href="/" prefetch={true} className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-black shadow-lg shadow-purple-500/25">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight">ACUITY</span>
              <p className="text-xs text-indigo-300 font-medium">Faculty Recruitment</p>
            </div>
          </Link>

          <div className="mt-12 space-y-4">
            <Badge variant="default" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              CBSE & State Board Faculty
            </Badge>
            <h2 className="text-3xl font-black leading-tight">
              Teach What You Love with Modern WebRTC Technology.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Conduct high-definition live classes, launch interactive concept quizzes, upload PDF materials, and inspire Class 1 to Class 10 students across India.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 text-xs text-slate-400">
          <span>Acuity Academic Administration • Verified Master Faculty</span>
        </div>
      </div>

      {/* RIGHT SIDE: Application Form */}
      <div className="lg:col-span-7 p-6 sm:p-12 flex items-center justify-center">
        <div className="w-full max-w-xl space-y-6">
          <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Teacher Registration Application
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Account activation requires administrative verification.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Dr. Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Email Address *</label>
                <Input
                  required
                  type="email"
                  placeholder="sarah@acuity.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Phone Number *</label>
                <Input
                  required
                  type="tel"
                  placeholder="9876543213"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Experience (Years) *</label>
                <Input
                  required
                  type="number"
                  placeholder="6"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Highest Qualification *</label>
                <Input
                  required
                  placeholder="e.g. M.Sc. Mathematics, B.Ed"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Board Syllabus Expertise *</label>
                <select
                  value={formData.targetBoard}
                  onChange={(e) => setFormData({ ...formData, targetBoard: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  <option value="Both CBSE & State Board">Both CBSE & State Board</option>
                  <option value="CBSE">CBSE (NCERT)</option>
                  <option value="State Board">State Board (Samacheer Kalvi)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Specialization / Subject Major *</label>
              <Input
                required
                placeholder="e.g. Class 8–10 Secondary Mathematics & Physics"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>

            {/* Classes Taught Selection */}
            <div>
              <label className="block text-xs font-bold mb-1.5">Classes You Can Teach (Class 1 to 10) *</label>
              <div className="flex flex-wrap gap-2">
                {CLASS_LIST.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleClassToggle(cls)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      formData.classesTaught.includes(cls)
                        ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold ring-1 ring-indigo-500/30"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Subjects Selection */}
            <div>
              <label className="block text-xs font-bold mb-1.5">Subjects You Can Teach *</label>
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => handleSubjectToggle(subj)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      formData.subjects.includes(subj)
                        ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 font-bold ring-1 ring-purple-500/30"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Password *</label>
                <Input
                  required
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Confirm Password *</label>
                <Input
                  required
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg shadow-purple-500/25 mt-4"
              isLoading={isLoading}
            >
              Submit Teacher Application
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2">
            Already approved?{" "}
            <Link href="/login" prefetch={true} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign In to your workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
