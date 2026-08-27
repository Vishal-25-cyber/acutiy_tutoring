"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Trash2,
  Plus,
  Download,
  CheckCircle2,
  FileText,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { getSubjectsForClassAndBoard, CLASS_LIST } from "@/lib/curriculum";
import { useFastFetch } from "@/lib/api-cache";
import { downloadMaterial } from "@/lib/download";

export default function TeacherMaterialsPage() {
  const { data, refetch } = useFastFetch("/api/teacher/materials");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "NOTES",
    classLevel: "Class 10",
    subject: "Mathematics",
    fileUrl: "",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = `${sizeInMb} MB`;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          fileName: file.name,
          fileSize: sizeStr,
          fileUrl: base64Url,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const materials = data?.materials || [
    {
      _id: "mat-1",
      title: "Quadratic Equations Formulas & Derivations",
      subject: "Mathematics",
      classLevel: "Class 10",
      category: "NOTES",
      fileUrl: "https://acuity.edu/materials/maths-sample.pdf",
      fileName: "Class10_Maths_Notes.pdf",
      fileSize: "2.1 MB",
      description: "Formula sheet with solved exemplar questions.",
    },
    {
      _id: "mat-2",
      title: "Light: Reflection & Refraction Ray Diagrams",
      subject: "Science",
      classLevel: "Class 10",
      category: "WORKSHEET",
      fileUrl: "https://acuity.edu/materials/science-sample.pdf",
      fileName: "Class10_Science_Ray_Diagrams.pdf",
      fileSize: "3.4 MB",
      description: "Ray tracing diagrams with NCERT questions.",
    },
  ];

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.classLevel || !formData.subject) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch("/api/teacher/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setUploadSuccess(true);
        refetch();
        setTimeout(() => {
          setIsModalOpen(false);
          setUploadSuccess(false);
          setFormData({
            title: "",
            description: "",
            category: "NOTES",
            classLevel: "Class 10",
            subject: "Mathematics",
            fileUrl: "",
            fileName: "Class10_Maths_Notes.pdf",
            fileSize: "2.1 MB",
          });
          setSelectedFile(null);
        }, 1500);
      } else {
        const d = await res.json();
        alert(d.error || "Failed to upload material");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study material?")) return;
    try {
      const res = await fetch(`/api/teacher/materials/${id}`, { method: "DELETE" });
      if (res.ok) {
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="w-full min-h-full bg-transparent p-6 sm:p-8 lg:p-10 space-y-8 animate-in fade-in duration-150">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Study Material & Notes Repository
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload PDFs, worksheets, and syllabus resources for your enrolled students to download.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* ── MATERIALS LIST (CARDLESS HAIRLINE TABLE) ── */}
      <div className="space-y-3">
        {materials.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No study materials uploaded yet</p>
            <p className="text-xs text-slate-400">Click &quot;Upload Material&quot; to publish notes for your students.</p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            {materials.map((mat: any) => (
              <div
                key={mat._id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {mat.category || "NOTES"}
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {mat.classLevel} · {mat.subject}
                    </span>
                    <span className="text-xs font-mono text-slate-400">· {mat.fileSize || "1.5 MB"}</span>
                  </div>

                  <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    {mat.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {mat.description || "Shared with students for home revision."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => downloadMaterial(mat)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => handleDelete(mat._id)}
                    className="p-1.5 rounded-md text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          maxWidth="2xl"
          onClose={() => {
            setIsModalOpen(false);
            setUploadSuccess(false);
          }}
          title="Upload Study Material / Notes"
          description="Publish reference handbooks, formula sheets, or model question papers for your enrolled students."
        >
          {uploadSuccess ? (
            <div className="p-10 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                Material Published Successfully!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Enrolled students in {formData.classLevel} can now download this document from their Learning Hub.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-5 pt-2 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Quadratic Equations Formulas & Exemplar Problems"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Grade Level *</label>
                  <select
                    value={formData.classLevel}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {CLASS_LIST.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subject *</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NOTES">Class Notes & Handouts</option>
                    <option value="WORKSHEET">Worksheets & Ray Diagrams</option>
                    <option value="PDF">PDF Reference Handbook</option>
                    <option value="QUESTION_PAPER">Model Question Paper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Upload Document (PDF / Image)</label>
                  <div className="h-10 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-md flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <label className="cursor-pointer flex items-center gap-2 w-full truncate">
                      <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate">
                        {selectedFile ? selectedFile.name : "Click to select a document file"}
                      </span>
                      <input type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.png,.jpg" />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Outline topics covered in this document..."
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-md text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {isUploading ? "Uploading..." : "Publish Material"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </main>
  );
}
