"use client";

import React, { useState } from "react";
import { UserCheck, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck, FileText, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useFastFetch } from "@/lib/api-cache";

export default function AdminTeachersPage() {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const { data, refetch } = useFastFetch(`/api/admin/teachers?status=${filterStatus}`);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const teachers = data?.teachers || [];

  const handleUpdateStatus = async (teacherId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, status }),
      });

      if (res.ok) {
        setSelectedTeacher(null);
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Faculty & Teacher Approvals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review teacher qualifications, credentials, and manage approval status.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {[
            { id: "ALL", label: "All Staff" },
            { id: "PENDING_APPROVAL", label: "Pending Review" },
            { id: "ACTIVE", label: "Approved" },
            { id: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers List Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 font-bold">Teacher Name & Info</th>
                <th className="p-4 font-bold">Qualification & Experience</th>
                <th className="p-4 font-bold">Assigned Classes</th>
                <th className="p-4 font-bold">Subjects</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No teacher profiles found in this category.
                  </td>
                </tr>
              ) : (
                teachers.map((t: any) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{t.userId?.name}</p>
                      <p className="text-slate-400 text-[11px]">{t.userId?.email} • {t.userId?.phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{t.qualification}</p>
                      <p className="text-slate-400 text-[11px]">{t.experienceYears} Years Experience</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {t.classesTaught?.map((c: string) => (
                          <span key={c} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      {t.subjects?.join(", ")}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          t.approvalStatus === "ACTIVE"
                            ? "success"
                            : t.approvalStatus === "PENDING_APPROVAL"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {t.approvalStatus === "PENDING_APPROVAL" ? "PENDING REVIEW" : t.approvalStatus}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold"
                        onClick={() => setSelectedTeacher(t)}
                      >
                        Inspect Application
                      </Button>
                      {t.approvalStatus === "PENDING_APPROVAL" && (
                        <Button
                          size="sm"
                          variant="success"
                          className="text-xs font-bold"
                          onClick={() => handleUpdateStatus(t.userId._id, "ACTIVE")}
                        >
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Teacher Application Modal */}
      {selectedTeacher && (
        <Modal
          isOpen={!!selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          title={`Teacher Profile: ${selectedTeacher.userId?.name}`}
          description="Verification of educational degrees, identity records, and assigned classes."
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div>
                <span className="text-slate-400">Full Name</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedTeacher.userId?.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Email Address</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedTeacher.userId?.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Phone Number</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedTeacher.userId?.phone}</p>
              </div>
              <div>
                <span className="text-slate-400">Experience</span>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedTeacher.experienceYears} Years</p>
              </div>
            </div>

            <div>
              <span className="font-bold block mb-1">Highest Educational Qualification</span>
              <p className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                {selectedTeacher.qualification} • Specialization: {selectedTeacher.specialization || "Higher Secondary Sciences"}
              </p>
            </div>

            <div>
              <span className="font-bold block mb-1">Attached Verification Documents</span>
              <div className="space-y-2">
                <a
                  href={selectedTeacher.resumeUrl || "https://acuity.edu/docs/sample-resume.pdf"}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 block"
                >
                  <span className="font-semibold">Teacher Curriculum Vitae (Resume)</span>
                  <span className="text-indigo-600 font-bold">View PDF ↗</span>
                </a>
                <a
                  href={selectedTeacher.certificateUrl || "https://acuity.edu/docs/sample-certificate.pdf"}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 block"
                >
                  <span className="font-semibold">Degree Certificate / B.Ed Proof</span>
                  <span className="text-indigo-600 font-bold">View PDF ↗</span>
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" onClick={() => setSelectedTeacher(null)}>
                Close
              </Button>
              {selectedTeacher.approvalStatus === "PENDING_APPROVAL" && (
                <Button
                  variant="success"
                  className="font-bold"
                  onClick={() => handleUpdateStatus(selectedTeacher.userId._id, "ACTIVE")}
                >
                  Approve Application
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
