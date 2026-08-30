"use client";

import React, { useState, useEffect, useRef } from "react";
import { Save, CheckCircle2, PhoneCall, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { invalidateCache } from "@/lib/api-cache";
import { sanitize10DigitPhone, isValid10DigitPhone, isValidAcuityOrGmail } from "@/lib/validations/phone";

const INITIAL_SETTINGS = {
  companyName: "Acuity Tutoring & Live Learning",
  supportPhone1: "9876543210",
  supportPhone2: "9876543211",
  supportPhone3: "9876543212",
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

  // Fetch settings once on mount
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
              supportPhone1: (data.settings.supportPhone1 || "9876543210").replace(/\D/g, "").slice(-10),
              supportPhone2: (data.settings.supportPhone2 || "9876543211").replace(/\D/g, "").slice(-10),
              supportPhone3: (data.settings.supportPhone3 || "9876543212").replace(/\D/g, "").slice(-10),
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
    const phone3Clean = (settings.supportPhone3 || "").replace(/\D/g, "").slice(-10);

    if (!isValid10DigitPhone(phone1Clean)) {
      setErrorMessage("Primary Hotline (Phone 1) must be a valid 10-digit mobile number.");
      return;
    }
    if (!isValid10DigitPhone(phone2Clean)) {
      setErrorMessage("Batch Coordinator (Phone 2) must be a valid 10-digit mobile number.");
      return;
    }
    if (!isValid10DigitPhone(phone3Clean)) {
      setErrorMessage("Emergency Escalation (Phone 3) must be a valid 10-digit mobile number.");
      return;
    }

    if (settings.supportEmail && !isValidAcuityOrGmail(settings.supportEmail)) {
      setErrorMessage("Central Support Email must end with @acuity.edu or @gmail.com.");
      return;
    }

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const payload = {
        ...settings,
        supportPhone1: phone1Clean,
        supportPhone2: phone2Clean,
        supportPhone3: phone3Clean,
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
    <main className="p-6 sm:p-8 space-y-6 max-w-4xl animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            System & Support Configurations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official company emergency hotlines, default grace periods, and tuition policies.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>System settings updated and synchronized across all portals successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Support Numbers */}
        <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Official Company Parent Support Hotlines (3 Mandatory Channels)
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Phone 1 */}
            <div>
              <label className="block text-xs font-bold mb-1">Primary Hotline (Phone 1) *</label>
              <div className="flex rounded-md shadow-2xs">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs select-none">
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
                  className="flex h-10 w-full rounded-r-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Phone 2 */}
            <div>
              <label className="block text-xs font-bold mb-1">Batch Coordinator (Phone 2) *</label>
              <div className="flex rounded-md shadow-2xs">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs select-none">
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
                  className="flex h-10 w-full rounded-r-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Phone 3 */}
            <div>
              <label className="block text-xs font-bold mb-1">Emergency Escalation (Phone 3) *</label>
              <div className="flex rounded-md shadow-2xs">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs select-none">
                  +91
                </span>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="9876543212"
                  value={settings.supportPhone3}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      supportPhone3: sanitize10DigitPhone(e.target.value),
                    })
                  }
                  className="flex h-10 w-full rounded-r-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Central Support Email *</label>
            <Input
              required
              type="text"
              placeholder="support@acuity.edu"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            />
          </div>
        </Card>

        {/* Academic & Late Entry Defaults */}
        <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Classroom & Attendance Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                Default Late-Entry Grace Period (Mins)
              </label>
              <Input
                type="number"
                min={0}
                max={30}
                value={settings.defaultGracePeriodMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, defaultGracePeriodMinutes: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                Min Attendance Risk Threshold (%)
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                value={settings.minAttendanceThresholdPercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minAttendanceThresholdPercent: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </Card>

        {/* Financial & Fee Rules */}
        <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Default Fee Billing Structure
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Monthly Tuition Fee (₹)</label>
              <Input
                type="number"
                min={0}
                value={settings.monthlyTuitionFee}
                onChange={(e) =>
                  setSettings({ ...settings, monthlyTuitionFee: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">One-Time Registration (₹)</label>
              <Input
                type="number"
                min={0}
                value={settings.registrationFee}
                onChange={(e) =>
                  setSettings({ ...settings, registrationFee: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Academic Session</label>
              <Input
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            className="font-bold shadow-lg shadow-indigo-500/20 px-8 cursor-pointer"
          >
            <Save className="w-4 h-4 mr-2" />
            <span>Save Configuration</span>
          </Button>
        </div>
      </form>
    </main>
  );
}
