"use client";

import React, { useState, useEffect } from "react";
import { Users2, Search, Filter, Plus, Edit2, ShieldAlert, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedBoard, setSelectedBoard] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [selectedRisk, setSelectedRisk] = useState("ALL");

  // Edit Modal State
  const [editStudent, setEditStudent] = useState<any>(null);
  const [editBatchId, setEditBatchId] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [resetPass, setResetPass] = useState("");

  // Add Student Modal State
  const [isAddModal, setIsAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    schoolName: "National Public School",
    board: "CBSE",
    currentClass: "Class 10",
    batchId: "",
    parentName: "",
    parentPhone: "",
    password: "Student@123",
  });

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedBoard, selectedBatch, selectedRisk]);

  async function loadData() {
    try {
      const query = new URLSearchParams();
      if (selectedClass !== "ALL") query.append("classLevel", selectedClass);
      if (selectedBoard !== "ALL") query.append("board", selectedBoard);
      if (selectedBatch !== "ALL") query.append("batchId", selectedBatch);
      if (selectedRisk !== "ALL") query.append("riskLevel", selectedRisk);

      const [sRes, bRes] = await Promise.all([
        fetch(`/api/admin/students?${query.toString()}`),
        fetch("/api/batches"),
      ]);

      if (sRes.ok) {
        const sData = await sRes.json();
        setStudents(sData.students || []);
      }

      if (bRes.ok) {
        const bData = await bRes.json();
        setBatches(bData.batches || []);
        if (bData.batches?.length > 0 && !newStudent.batchId) {
          setNewStudent((prev) => ({ ...prev, batchId: bData.batches[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleUpdateStudent = async () => {
    if (!editStudent) return;
    try {
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: editStudent.userId._id,
          batchId: editBatchId,
          status: editStatus,
          resetPassword: resetPass || undefined,
        }),
      });

      if (res.ok) {
        setEditStudent(null);
        setResetPass("");
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });

      if (res.ok) {
        setIsAddModal(false);
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = students.filter((st) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const u = st.userId || {};
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      st.schoolName?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Student Directory & Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Filter, edit batch assignments, inspect attendance risk levels, and manage student accounts.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
          onClick={() => setIsAddModal(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by student name, email, or school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Classes (1-10)</option>
            {[
              "Class 1",
              "Class 2",
              "Class 3",
              "Class 4",
              "Class 5",
              "Class 6",
              "Class 7",
              "Class 8",
              "Class 9",
              "Class 10",
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Boards (CBSE & State)</option>
            {["CBSE", "State Board"].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4 font-bold">Student Name</th>
                    <th className="p-4 font-bold">Contact Info</th>
                    <th className="p-4 font-bold">Grade & Board</th>
                    <th className="p-4 font-bold">Batch Time</th>
                    <th className="p-4 font-bold">Parent Phone</th>
                    <th className="p-4 font-bold">Risk Level</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        No students matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((st) => {
                      const u = st.userId || {};
                      return (
                        <tr key={st._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                            {u.name}
                          </td>
                          <td className="p-4 text-slate-500 font-mono">
                            <p>{u.email}</p>
                            <p className="text-[10px]">{u.phone}</p>
                          </td>
                          <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                            {st.currentClass} • {st.board}
                          </td>
                          <td className="p-4 text-slate-500">{st.batchId?.name || "7:00 PM – 8:00 PM"}</td>
                          <td className="p-4 text-slate-500 font-mono">{st.parentPhone}</td>
                          <td className="p-4">
                            <Badge
                              variant={
                                st.attendanceRiskLevel === "LOW"
                                  ? "riskLow"
                                  : st.attendanceRiskLevel === "MEDIUM"
                                  ? "riskMedium"
                                  : "riskHigh"
                              }
                            >
                              {st.attendanceRiskLevel || "LOW"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={u.status === "ACTIVE" ? "success" : "destructive"}>
                              {u.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8"
                              onClick={() => {
                                setEditStudent(st);
                                setEditBatchId(st.batchId?._id || "");
                                setEditStatus(u.status || "ACTIVE");
                              }}
                            >
                              <Edit2 className="w-3 h-3 mr-1" /> Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

      {/* Edit Student Modal */}
      {editStudent && (
        <Modal
          isOpen={!!editStudent}
          onClose={() => setEditStudent(null)}
          title={`Edit Student: ${editStudent.userId?.name}`}
          description="Reassign batch, update account status, or reset credentials."
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold mb-1">Reassign Batch Time</label>
              <select
                value={editBatchId}
                onChange={(e) => setEditBatchId(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
              >
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.startTime} - {b.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Account Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Reset Password (Optional)</label>
              <Input
                type="password"
                placeholder="Leave blank to keep current password"
                value={resetPass}
                onChange={(e) => setResetPass(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditStudent(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateStudent} className="font-bold">
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModal}
        onClose={() => setIsAddModal(false)}
        title="Enroll New Student"
        description="Create verified student account and assign live batch."
      >
        <form onSubmit={handleAddStudent} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold mb-1">Student Full Name *</label>
            <Input
              required
              placeholder="e.g. Priya Sharma"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Email Address *</label>
              <Input
                required
                type="email"
                placeholder="priya@acuity.edu"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Phone Number *</label>
              <Input
                required
                type="tel"
                placeholder="9876543221"
                value={newStudent.phone}
                onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Class Level *</label>
              <select
                value={newStudent.currentClass}
                onChange={(e) => setNewStudent({ ...newStudent, currentClass: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
              >
                {[
                  "Class 1",
                  "Class 2",
                  "Class 3",
                  "Class 4",
                  "Class 5",
                  "Class 6",
                  "Class 7",
                  "Class 8",
                  "Class 9",
                  "Class 10",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Board *</label>
              <select
                value={newStudent.board}
                onChange={(e) => setNewStudent({ ...newStudent, board: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
              >
                {["CBSE", "State Board"].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Batch Time *</label>
              <select
                value={newStudent.batchId}
                onChange={(e) => setNewStudent({ ...newStudent, batchId: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
              >
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Parent Name *</label>
              <Input
                required
                placeholder="Ramesh Sharma"
                value={newStudent.parentName}
                onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Parent Phone *</label>
              <Input
                required
                placeholder="9876543292"
                value={newStudent.parentPhone}
                onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold">
              Enroll Student
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
