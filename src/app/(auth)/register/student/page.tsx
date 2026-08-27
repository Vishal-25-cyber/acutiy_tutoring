"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  User,
  BookOpen,
  Clock,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getSubjectsForClassAndBoard, BOARD_LIST, CLASS_LIST } from "@/lib/curriculum";

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    name: "",
    dob: "2010-05-15",
    gender: "OTHER",
    phone: "",
    altPhone: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Step 2: Academic
    schoolName: "",
    board: "CBSE",
    currentClass: "Class 10",
    subjects: ["Mathematics (Standard / Basic)", "Science (Physics / Chemistry / Biology)"],
    // Step 3: Batch
    batchId: "",
    // Step 4: Emergency
    parentName: "",
    parentPhone: "",
    altEmergencyPhone: "",
  });

  // Calculate dynamic syllabus subjects
  const syllabusSubjects = getSubjectsForClassAndBoard(formData.currentClass, formData.board);

  // Update selected subjects whenever class or board changes
  const handleClassChange = (newClass: string) => {
    const newSubjects = getSubjectsForClassAndBoard(newClass, formData.board);
    setFormData((prev) => ({
      ...prev,
      currentClass: newClass,
      // Auto-select first 2-3 subjects of the new class if current selection is invalid
      subjects: newSubjects.slice(0, 3),
    }));
  };

  const handleBoardChange = (newBoard: string) => {
    const newSubjects = getSubjectsForClassAndBoard(formData.currentClass, newBoard);
    setFormData((prev) => ({
      ...prev,
      board: newBoard,
      subjects: newSubjects.slice(0, 3),
    }));
  };

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/batches");
        const data = await res.json();
        if (data.batches) {
          setAvailableBatches(data.batches);
          if (data.batches.length > 0 && !formData.batchId) {
            setFormData((prev) => ({ ...prev, batchId: data.batches[0]._id }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadBatches();
  }, [formData.batchId]);

  const handleSubjectToggle = (subj: string) => {
    setFormData((prev) => {
      const exists = prev.subjects.includes(subj);
      return {
        ...prev,
        subjects: exists ? prev.subjects.filter((s) => s !== subj) : [...prev.subjects, subj],
      };
    });
  };

  const handleSelectAllSubjects = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [...syllabusSubjects],
    }));
  };

  const handleNext = () => {
    setErrorMessage("");
    if (step === 1) {
      if (!formData.name || !formData.phone || !formData.email || !formData.password) {
        setErrorMessage("Please fill all required personal fields.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
    } else if (step === 2) {
      if (!formData.schoolName || formData.subjects.length === 0) {
        setErrorMessage("Please provide your school name and select at least one subject.");
        return;
      }
    } else if (step === 3) {
      if (!formData.batchId) {
        setErrorMessage("Please select a live class batch.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!formData.parentName || !formData.parentPhone) {
      setErrorMessage("Parent/Guardian name and emergency phone are required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Registration failed.");
        return;
      }

      router.push("/student/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* LEFT SIDE: Brand & Overview (Cool Modern Blue) */}
      <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 border-r border-slate-800 p-8 lg:p-12 flex flex-col justify-between text-white relative">
        <div>
          <Link href="/" prefetch={true} className="flex items-center gap-3.5 w-fit">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-xl flex items-center justify-center border border-white/80">
              <img
                src="/images/acuity_logo.png"
                alt="Acuity Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">ACUITY</span>
              <p className="text-xs text-yellow-300 font-medium">Where Accuracy Meets Knowledge</p>
            </div>
          </Link>

          <div className="mt-12 space-y-4">
            <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-blue-500/20 text-sky-200 border border-sky-400/30 backdrop-blur-md">
              CBSE & STATE BOARD SYLLABUS
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Begin your journey to academic excellence.
            </h1>
            <p className="text-slate-200 text-sm leading-relaxed">
              Curriculum-aligned live online masterclasses for school students from Class 1 to Class 10 with verified syllabus mapping.
            </p>
          </div>
        </div>

        {/* Dynamic Curriculum Preview Info */}
        <div className="my-8 p-5 rounded-2xl bg-white/10 dark:bg-slate-900/60 border border-white/20 dark:border-slate-700/60 backdrop-blur-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-semibold">Selected Curriculum</span>
            <span className="text-yellow-300 font-bold">{formData.board}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-semibold">Grade Level</span>
            <span className="text-emerald-400 font-bold">{formData.currentClass}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-semibold">Available Syllabus Subjects</span>
            <span className="text-sky-300 font-bold">{syllabusSubjects.length} Subjects</span>
          </div>
        </div>

        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-white">24/7 Official Support Hotlines:</p>
          <p className="font-mono text-yellow-300">+91 98765 43210 • +91 98765 43211</p>
        </div>
      </div>

      {/* RIGHT SIDE: Multi-Step Enrollment Wizard */}
      <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-center max-w-2xl mx-auto w-full">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>STEP {step} OF 4</span>
            <span>
              {step === 1 && "Student Personal Details"}
              {step === 2 && "Academic & Subject Selection"}
              {step === 3 && "Live Batch Selection"}
              {step === 4 && "Parent / Emergency Info"}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-sky-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* STEP 1: PERSONAL */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold mb-1">Full Student Name *</label>
                <Input
                  required
                  placeholder="e.g. Aravind Swaminathan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Email Address *</label>
                  <Input
                    required
                    type="email"
                    placeholder="aravind@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Primary Phone Number *</label>
                  <Input
                    required
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
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
            </div>
          )}

          {/* STEP 2: ACADEMIC & CLASS-WISE SYLLABUS SUBJECTS */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold mb-1">School Name *</label>
                <Input
                  required
                  placeholder="e.g. DAV Senior Secondary School"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Current Class (1 to 10) *</label>
                  <select
                    value={formData.currentClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CLASS_LIST.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Education Board *</label>
                  <select
                    value={formData.board}
                    onChange={(e) => handleBoardChange(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {BOARD_LIST.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Subject Selection */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold">
                      Subjects for {formData.currentClass} ({formData.board}) *
                    </label>
                    <Badge variant="default" className="text-[10px]">
                      Syllabus Aligned
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllSubjects}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Select All
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Select the subjects you want to enroll in for live evening tuition:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {syllabusSubjects.map((subj) => {
                    const isSelected = formData.subjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => handleSubjectToggle(subj)}
                        className={`p-3 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all duration-150 active:scale-[0.98] ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500/40 shadow-xs"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <span className="font-semibold">{subj}</span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "border border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    {formData.subjects.length} of {syllabusSubjects.length} subject(s) selected
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BATCH SELECTION */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-slate-500">
                Choose an evening batch time. Our automated system will allocate your live classroom accordingly:
              </p>

              <div className="space-y-3">
                {availableBatches.map((b) => (
                  <div
                    key={b._id}
                    onClick={() => setFormData({ ...formData, batchId: b._id })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.batchId === b._id
                        ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{b.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Timing: {b.startTime} to {b.endTime} • Mon–Fri
                        </p>
                      </div>
                      <Badge variant="default" className="text-[11px]">
                        5 Min Grace
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: EMERGENCY & PARENT */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold mb-1">Parent / Guardian Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Swaminathan Raman"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Parent Phone Number *</label>
                  <Input
                    required
                    type="tel"
                    placeholder="9876543290"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Alternate Emergency Phone</label>
                  <Input
                    type="tel"
                    placeholder="9876543291"
                    value={formData.altEmergencyPhone}
                    onChange={(e) => setFormData({ ...formData, altEmergencyPhone: e.target.value })}
                  />
                </div>
              </div>

              {/* Official 3 Emergency Hotlines Display */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Official Acuity 24/7 Emergency Lines:
                </p>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <span>1: +91 98765 43210</span>
                  <span>2: +91 98765 43211</span>
                  <span>3: +91 98765 43212</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            {step > 1 ? (
              <Button type="button" variant="outline" size="md" onClick={() => setStep((prev) => prev - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button type="button" variant="primary" size="md" onClick={handleNext}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                onClick={handleSubmit}
                className="font-bold shadow-lg shadow-indigo-500/25"
              >
                Complete Registration
              </Button>
            )}
          </div>

          <div className="text-center text-xs text-slate-500 pt-2">
            Already registered?{" "}
            <Link href="/login" prefetch={true} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign In to your batch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
