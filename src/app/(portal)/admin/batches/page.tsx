"use client";

import React, { useState } from "react";
import { Layers, Plus, Clock, Users, Edit2, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useFastFetch } from "@/lib/api-cache";

const INITIAL_BATCHES = [
  {
    _id: "batch-6pm",
    name: "6:00 PM – 7:00 PM",
    startTime: "18:00",
    endTime: "19:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    capacity: 30,
    enrolledCount: 1,
    occupancyPercentage: 3,
    gracePeriodMinutes: 5,
    isActive: true,
  },
  {
    _id: "batch-7pm",
    name: "7:00 PM – 8:00 PM",
    startTime: "19:00",
    endTime: "20:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    capacity: 30,
    enrolledCount: 2,
    occupancyPercentage: 7,
    gracePeriodMinutes: 5,
    isActive: true,
  },
  {
    _id: "batch-8pm",
    name: "8:00 PM – 9:00 PM",
    startTime: "20:00",
    endTime: "21:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    capacity: 30,
    enrolledCount: 0,
    occupancyPercentage: 0,
    gracePeriodMinutes: 5,
    isActive: true,
  },
];

export default function AdminBatchesPage() {
  const { data, refetch } = useFastFetch("/api/admin/batches", {
    batches: INITIAL_BATCHES,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    startTime: "18:00",
    endTime: "19:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    capacity: 30,
    gracePeriodMinutes: 5,
  });

  const batches = data?.batches || INITIAL_BATCHES;

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          name: "",
          startTime: "18:00",
          endTime: "19:00",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          capacity: 30,
          gracePeriodMinutes: 5,
        });
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    try {
      const res = await fetch("/api/admin/batches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatch._id,
          name: selectedBatch.name,
          startTime: selectedBatch.startTime,
          endTime: selectedBatch.endTime,
          capacity: selectedBatch.capacity,
          gracePeriodMinutes: selectedBatch.gracePeriodMinutes,
        }),
      });

      if (res.ok) {
        setIsEditModal(false);
        setSelectedBatch(null);
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 select-none">
      {/* ── 1. CLEAN CARDLESS HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Dynamic Batch &amp; Capacity Manager
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {batches.length} Active Slots
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure evening batch slots, room occupancy limits, and automated late-entry grace windows.
          </p>
        </div>

        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#004b79] hover:bg-[#003b60] text-white transition-all cursor-pointer shadow-sm self-start sm:self-auto shrink-0"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Batch</span>
        </button>
      </div>

      {/* ── 2. CARDLESS 12-COLUMN BATCH TABLE ── */}
      <div className="space-y-2 pt-2">
        <div className="hidden md:grid grid-cols-12 gap-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
          <div className="col-span-4">Batch Name &amp; Active Schedule</div>
          <div className="col-span-3">Timing &amp; Grace Period</div>
          <div className="col-span-3">Classroom Occupancy</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {batches.map((b: any) => {
            const occupancy = typeof b.enrolledCount === "number" ? b.enrolledCount : 0;
            const percentage = b.capacity > 0 ? Math.round((occupancy / b.capacity) * 100) : 0;

            return (
              <div
                key={b._id}
                className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-1"
              >
                {/* Col 1: Batch Name & Days */}
                <div className="col-span-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{b.name}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {b.days?.join(", ") || "Mon, Tue, Wed, Thu, Fri"}
                  </p>
                </div>

                {/* Col 2: Timing & Grace */}
                <div className="col-span-3 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                    <span>{b.startTime} – {b.endTime}</span>
                  </div>
                  <p className="text-[11px] text-[#004b79] dark:text-[#dfb74a] font-bold">
                    {b.gracePeriodMinutes || 5} mins late grace window
                  </p>
                </div>

                {/* Col 3: Occupancy Bar */}
                <div className="col-span-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Capacity:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {occupancy} / {b.capacity} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        percentage > 85
                          ? "bg-amber-500"
                          : percentage > 50
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    />
                  </div>
                </div>

                {/* Col 4: Action */}
                <div className="col-span-2 flex items-center justify-start md:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBatch(b);
                      setIsEditModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#004b79] dark:text-[#dfb74a]" />
                    <span>Edit Batch</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add Batch Modal ── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Routine Batch"
          description="Define slot timings and student capacity limits."
        >
          <form onSubmit={handleCreateBatch} className="space-y-4 pt-2 text-xs">
            <div>
              <label className="block font-bold mb-1">Batch Display Name *</label>
              <Input
                required
                placeholder="e.g. 6:00 PM – 7:00 PM Evening"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Start Time (24h) *</label>
                <Input
                  required
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">End Time (24h) *</label>
                <Input
                  required
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Room Capacity *</label>
                <Input
                  required
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Late Grace Window (Mins)</label>
                <Input
                  required
                  type="number"
                  min={0}
                  value={formData.gracePeriodMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="font-bold bg-[#004b79] text-white">
                Create Batch Slot
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Batch Modal ── */}
      {isEditModal && selectedBatch && (
        <Modal
          isOpen={isEditModal}
          onClose={() => setIsEditModal(false)}
          title={`Edit Batch: ${selectedBatch.name}`}
          description="Update timings and capacity."
        >
          <form onSubmit={handleUpdateBatch} className="space-y-4 pt-2 text-xs">
            <div>
              <label className="block font-bold mb-1">Batch Display Name *</label>
              <Input
                required
                value={selectedBatch.name}
                onChange={(e) => setSelectedBatch({ ...selectedBatch, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Start Time *</label>
                <Input
                  required
                  type="time"
                  value={selectedBatch.startTime}
                  onChange={(e) => setSelectedBatch({ ...selectedBatch, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">End Time *</label>
                <Input
                  required
                  type="time"
                  value={selectedBatch.endTime}
                  onChange={(e) => setSelectedBatch({ ...selectedBatch, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Room Capacity *</label>
                <Input
                  required
                  type="number"
                  min={1}
                  value={selectedBatch.capacity}
                  onChange={(e) =>
                    setSelectedBatch({ ...selectedBatch, capacity: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Late Grace Window (Mins)</label>
                <Input
                  required
                  type="number"
                  min={0}
                  value={selectedBatch.gracePeriodMinutes}
                  onChange={(e) =>
                    setSelectedBatch({
                      ...selectedBatch,
                      gracePeriodMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setIsEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="font-bold bg-[#004b79] text-white">
                Save Batch Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
