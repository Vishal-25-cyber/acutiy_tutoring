"use client";

import React, { useState } from "react";
import { Layers, Plus, Clock, Users, Edit2, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminBatchesPage() {
  const { data, refetch } = useFastFetch("/api/admin/batches");
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

  const batches = data?.batches || [];

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
    <main className="p-6 sm:p-8 space-y-6 max-w-7xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Dynamic Batch & Capacity Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure evening batch slots, room occupancy limits, and automated late-entry grace windows.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          className="gap-2 font-bold"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Batch</span>
        </Button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {batches.map((b: any) => {
          const occupancy = b.enrolledCount || 18;
          const percentage = Math.round((occupancy / b.capacity) * 100);

          return (
            <Card key={b._id} className="p-6 space-y-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-xs">
                    {b.startTime} – {b.endTime}
                  </Badge>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {b.gracePeriodMinutes || 5} Min Grace Period
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{b.name}</h2>
                <p className="text-xs text-slate-500">
                  Active Days: {b.days?.join(", ") || "Mon to Fri"}
                </p>

                {/* Capacity Occupancy Bar */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Classroom Capacity</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {occupancy} / {b.capacity} Students ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        percentage > 85
                          ? "bg-amber-500"
                          : percentage > 95
                          ? "bg-rose-500"
                          : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-semibold gap-1.5"
                  onClick={() => {
                    setSelectedBatch(b);
                    setIsEditModal(true);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Class Batch"
          description="Define timing, enrolled capacity, and late entry policy."
        >
          <form onSubmit={handleCreateBatch} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold mb-1">Batch Label *</label>
              <Input
                required
                placeholder="e.g. 7:00 PM – 8:00 PM (Batch 2)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Start Time *</label>
                <Input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">End Time *</label>
                <Input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Max Student Capacity *</label>
                <Input
                  type="number"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Late-Entry Grace (Mins) *</label>
                <Input
                  type="number"
                  required
                  value={formData.gracePeriodMinutes}
                  onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="font-bold">
                Create Batch
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {isEditModal && selectedBatch && (
        <Modal
          isOpen={isEditModal}
          onClose={() => setIsEditModal(false)}
          title={`Edit Batch: ${selectedBatch.name}`}
          description="Update timings and capacity limits."
        >
          <form onSubmit={handleUpdateBatch} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold mb-1">Batch Label *</label>
              <Input
                required
                value={selectedBatch.name}
                onChange={(e) => setSelectedBatch({ ...selectedBatch, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Max Student Capacity *</label>
                <Input
                  type="number"
                  required
                  value={selectedBatch.capacity}
                  onChange={(e) => setSelectedBatch({ ...selectedBatch, capacity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Late Grace Window (Mins) *</label>
                <Input
                  type="number"
                  required
                  value={selectedBatch.gracePeriodMinutes || 5}
                  onChange={(e) => setSelectedBatch({ ...selectedBatch, gracePeriodMinutes: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="font-bold">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
