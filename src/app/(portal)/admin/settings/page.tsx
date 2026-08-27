"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, PhoneCall, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFastFetch } from "@/lib/api-cache";

const INITIAL_SETTINGS = {
  companyName: "Acuity Tutoring & Live Learning",
  supportPhone1: "+91 98765 43210",
  supportPhone2: "+91 98765 43211",
  supportPhone3: "+91 98765 43212",
  supportEmail: "support@acuity.edu",
  defaultGracePeriodMinutes: 5,
  minAttendanceThresholdPercent: 75,
  monthlyTuitionFee: 2500,
  registrationFee: 500,
  academicYear: "2025-2026",
};

export default function AdminSettingsPage() {
  const { data } = useFastFetch("/api/admin/settings", {
    settings: INITIAL_SETTINGS,
  });
  const [settings, setSettings] = useState<any>(INITIAL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
    }
  }, [data]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
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

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>System settings updated and synchronized across all portals successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Support Numbers */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Official Company Parent Support Hotlines (3 Mandatory Channels)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Primary Hotline (Phone 1) *</label>
              <Input
                required
                value={settings.supportPhone1}
                onChange={(e) => setSettings({ ...settings, supportPhone1: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Batch Coordinator (Phone 2) *</label>
              <Input
                required
                value={settings.supportPhone2}
                onChange={(e) => setSettings({ ...settings, supportPhone2: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Emergency Escalation (Phone 3) *</label>
              <Input
                required
                value={settings.supportPhone3}
                onChange={(e) => setSettings({ ...settings, supportPhone3: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Central Support Email *</label>
            <Input
              required
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            />
          </div>
        </Card>

        {/* Academic & Late Entry Defaults */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Classroom & Attendance Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Default Late-Entry Grace Period (Mins)</label>
              <Input
                type="number"
                value={settings.defaultGracePeriodMinutes}
                onChange={(e) => setSettings({ ...settings, defaultGracePeriodMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Min Attendance Risk Threshold (%)</label>
              <Input
                type="number"
                value={settings.minAttendanceThresholdPercent}
                onChange={(e) => setSettings({ ...settings, minAttendanceThresholdPercent: Number(e.target.value) })}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" isLoading={isSaving} className="font-bold text-xs px-8">
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </form>
    </main>
  );
}
