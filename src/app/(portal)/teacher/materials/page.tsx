"use client";

import React, { useState } from "react";
import { BookOpen, Upload, Trash2, Plus, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { getSubjectsForClassAndBoard, CLASS_LIST } from "@/lib/curriculum";
import { useFastFetch } from "@/lib/api-cache";

export default function TeacherMaterialsPage() {
  const { data, refetch } = useFastFetch("/api/teacher/materials");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "NOTES",
    classLevel: "Class 10",
    subject: "Mathematics",
    fileUrl: "https://acuity.edu/materials/class10-maths-sample.pdf",
    fileName: "Class10_Maths_Notes.pdf",
    fileSize: "2.1 MB",
  });

  const availableSubjects = Array.from(
    new Set([
      ...getSubjectsForClassAndBoard(formData.classLevel, "CBSE"),
      ...getSubjectsForClassAndBoard(formData.classLevel, "State Board"),
    ])
  );

  const handleClassChange = (newClass: string) => {
    const newSubjects = getSubjectsForClassAndBoard(newClass, "CBSE");
    setFormData((prev) => ({
      ...prev,
      classLevel: newClass,
      subject: newSubjects[0] || "Mathematics",
    }));
  };

  const materials = data?.materials || [
    {
      _id: "mat-1",
      title: "Class 10 Mathematics — Quadratic Equations Formula & Derivations",
      subject: "Mathematics",
      classLevel: "Class 10",
      category: "NOTES",
      fileSize: "2.1 MB",
      createdAt: new Date().toISOString(),
    },
  ];

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const res = await fetch("/api/teacher/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          title: "",
          description: "",
          category: "NOTES",
          classLevel: "Class 10",
          subject: "Mathematics",
          fileUrl: "https://acuity.edu/materials/class10-maths-sample.pdf",
          fileName: "Class10_Maths_Notes.pdf",
          fileSize: "2.1 MB",
        });
        refetch();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-6xl animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Study Material & Notes Repository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload PDFs, worksheets, and syllabus resources for your enrolled students.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="font-bold text-xs gap-1.5 rounded-xl"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Upload Material</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {materials.length === 0 ? (
          <div className="col-span-2 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No study materials uploaded yet. Click "Upload Material" to publish notes.
          </div>
        ) : (
          materials.map((mat: any) => (
            <Card key={mat._id} className="p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-[10px]">
                    {mat.category}
                  </Badge>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {mat.classLevel} • {mat.subject}
                  </span>
                </div>

                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">{mat.title}</h2>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {mat.description || "Shared with students for home revision and live class preparation."}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{mat.fileSize || "1.5 MB"}</span>
                <span className="font-medium">{new Date(mat.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Upload Study Material"
          description="Publish reference handbooks, notes, or model question papers."
        >
          <form onSubmit={handleUpload} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold mb-1">Document Title *</label>
              <Input
                required
                placeholder="e.g. Class 10 Mathematics — Quadratic Equations Formulas"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Target Class *</label>
                <select
                  value={formData.classLevel}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  {CLASS_LIST.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Subject ({formData.classLevel}) *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                >
                  <option value="NOTES">Class Notes</option>
                  <option value="PDF">PDF Handbook</option>
                  <option value="WORKSHEET">Worksheet & Ray Diagrams</option>
                  <option value="QUESTION_PAPER">Model Question Paper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Estimated File Size</label>
                <Input
                  value={formData.fileSize}
                  onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Summary / Instructions</label>
              <Textarea
                rows={2}
                placeholder="Brief summary of what this document covers..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUploading} className="font-bold">
                Publish Document
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
