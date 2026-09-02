"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
  AlertCircle,
  Check,
  Building,
  GraduationCap,
  DollarSign,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { invalidateCache } from "@/lib/api-cache";
import { sanitize10DigitPhone, isValid10DigitPhone, isValidAcuityOrGmail } from "@/lib/validations/phone";

const INITIAL_SETTINGS = {
  companyName: "Acuity Tutoring & Live Learning",
  upiId: "acuity.tutoring@upi",
  qrCodeImageUrl: "",
  supportPhone1: "9876543210",
  supportPhone2: "9876543211",
  supportEmail: "support@acuity.edu",
  defaultGracePeriodMinutes: 5,
  minAttendanceThresholdPercent: 75,
  monthlyTuitionFee: 2500,
  registrationFee: 500,
  academicYear: "2025-2026",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(INITIAL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isLoadedRef = useRef(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data?.settings && !isLoadedRef.current) {
            isLoadedRef.current = true;
            setSettings({
              companyName: data.settings.companyName || INITIAL_SETTINGS.companyName,
              upiId: data.settings.upiId || INITIAL_SETTINGS.upiId,
              qrCodeImageUrl: data.settings.qrCodeImageUrl || "",
              supportPhone1: (data.settings.supportPhone1 || "9876543210").replace(/\D/g, "").slice(-10),
              supportPhone2: (data.settings.supportPhone2 || "9876543211").replace(/\D/g, "").slice(-10),
              supportEmail: data.settings.supportEmail || INITIAL_SETTINGS.supportEmail,
              defaultGracePeriodMinutes: Number(data.settings.defaultGracePeriodMinutes ?? 5),
              minAttendanceThresholdPercent: Number(data.settings.minAttendanceThresholdPercent ?? 75),
              monthlyTuitionFee: Number(data.settings.monthlyTuitionFee ?? 2500),
              registrationFee: Number(data.settings.registrationFee ?? 500),
              academicYear: data.settings.academicYear || "2025-2026",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const phone1Clean = (settings.supportPhone1 || "").replace(/\D/g, "").slice(-10);
    const phone2Clean = (settings.supportPhone2 || "").replace(/\D/g, "").slice(-10);

    if (!isValid10DigitPhone(phone1Clean)) {
      setErrorMessage("Primary Support Hotline must be a valid 10-digit mobile number.");
      return;
    }
    if (phone2Clean && !isValid10DigitPhone(phone2Clean)) {
      setErrorMessage("Coordinator Phone must be a valid 10-digit mobile number.");
      return;
    }

    if (settings.supportEmail && !isValidAcuityOrGmail(settings.supportEmail)) {
      setErrorMessage("Support Email must end with @acuity.edu or @gmail.com.");
      return;
    }

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const payload = {
        ...settings,
        supportPhone1: phone1Clean,
        supportPhone2: phone2Clean,
        supportPhone3: phone2Clean, // synchronized
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        setErrorMessage(resData.error || "Failed to save configuration.");
        return;
      }

      setSavedSuccess(true);
      invalidateCache("/api/admin/settings");
      invalidateCache("/api/admin/dashboard");
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              System Settings &amp; Policies
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Institute identity, official support hotlines, attendance grace window, and tuition fee policies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm self-start sm:self-auto shrink-0 disabled:opacity-60"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Saved &amp; Synced!</span>
            </>
          ) : isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>System settings updated and synchronized across all portals successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 pt-2">
        {/* ── Section 1: Institute Identity & Support Channels ── */}
        <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Institute Identity &amp; Support Channels
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Institute / Platform Name *
              </label>
              <Input
                required
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Central Support Email *
              </label>
              <Input
                required
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Primary Parent Support Hotline (10 Digits) *
              </label>
              <div className="flex rounded-lg shadow-2xs overflow-hidden border border-slate-200 dark:border-slate-800">
                <span className="inline-flex items-center px-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs">
                  +91
                </span>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={settings.supportPhone1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      supportPhone1: sanitize10DigitPhone(e.target.value),
                    })
                  }
                  className="flex h-10 w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#004b79]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Batch Coordinator Emergency Mobile (10 Digits) *
              </label>
              <div className="flex rounded-lg shadow-2xs overflow-hidden border border-slate-200 dark:border-slate-800">
                <span className="inline-flex items-center px-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs">
                  +91
                </span>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="9876543211"
                  value={settings.supportPhone2}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      supportPhone2: sanitize10DigitPhone(e.target.value),
                    })
                  }
                  className="flex h-10 w-full bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#004b79]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Classroom & Attendance Parameters ── */}
        <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Classroom &amp; Attendance Policies
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Default Late Grace Period (Minutes)
              </label>
              <Input
                type="number"
                min={0}
                max={30}
                value={settings.defaultGracePeriodMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultGracePeriodMinutes: Number(e.target.value),
                  })
                }
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Students joining after this window require manual permission.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Minimum Attendance Compliance Threshold (%)
              </label>
              <Input
                type="number"
                min={50}
                max={100}
                value={settings.minAttendanceThresholdPercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minAttendanceThresholdPercent: Number(e.target.value),
                  })
                }
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Trigger high-turnout alerts below this threshold.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Current Academic Term
              </label>
              <Input
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Active tuition session label (e.g., 2025-2026).
              </p>
            </div>
          </div>
        </div>

        {/* ── Section 3: Tuition Fee Policy & QR Code ── */}
        <div className="space-y-4 pb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#004b79] dark:text-[#dfb74a]" />
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Tuition Fee Structure &amp; Official UPI QR
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Standard Monthly Tuition Fee (₹) *
              </label>
              <Input
                required
                type="number"
                min={0}
                step={50}
                value={settings.monthlyTuitionFee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monthlyTuitionFee: Number(e.target.value),
                  })
                }
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Default monthly fee invoiced to registered students.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Official Merchant Bank UPI ID (VPA) *
              </label>
              <Input
                required
                placeholder="e.g. acuity.tutoring@upi, yourname@okaxis, yourphone@paytm"
                value={settings.upiId}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    upiId: e.target.value.trim(),
                  })
                }
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used for auto-generating dynamic QR with pre-filled amounts.
              </p>
            </div>
          </div>

          {/* ── Custom GPay / PhonePe QR Image Upload ── */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Custom GPay / PhonePe / Paytm QR Code Image
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload or paste your personal/shop GPay QR image. Students will scan this exact QR to pay directly to your account.
                </p>
              </div>
              {settings.qrCodeImageUrl && (
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, qrCodeImageUrl: "" })}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 self-start sm:self-auto cursor-pointer"
                >
                  Remove Custom QR
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs transition-colors">
                <span>📁 Upload GPay / PhonePe QR Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === "string") {
                          setSettings({ ...settings, qrCodeImageUrl: reader.result });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              <span className="text-xs text-slate-400">or paste image URL:</span>

              <input
                type="text"
                placeholder="https://example.com/my-gpay-qr.png"
                value={settings.qrCodeImageUrl.startsWith("data:") ? "Custom Image Uploaded (Base64)" : settings.qrCodeImageUrl}
                onChange={(e) => setSettings({ ...settings, qrCodeImageUrl: e.target.value })}
                className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#004b79]"
              />
            </div>

            {settings.qrCodeImageUrl && (
              <div className="pt-2 flex items-center gap-3">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white p-1 shadow-xs">
                  <img
                    src={settings.qrCodeImageUrl}
                    alt="Custom GPay QR Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Custom QR Preview Active
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Students will see this exact QR image when paying tuition fees.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
