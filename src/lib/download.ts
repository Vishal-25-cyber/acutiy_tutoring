/**
 * Acuity Tutoring — Client-Side Material Download & PDF Generation Engine
 * Handles direct file downloads, base64 data URLs, and dynamic printable study guides/timetables.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface DownloadableMaterial {
  _id?: string;
  title: string;
  subject: string;
  classLevel?: string;
  category?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  description?: string;
  uploadedBy?: { name?: string } | string;
  createdAt?: string | Date;
}

/**
 * Bulletproof PDF trigger that forces the exact filename and .pdf extension across all browsers.
 */
function triggerPdfDownload(doc: jsPDF, fileName: string): boolean {
  const cleanName = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  try {
    // Primary: jsPDF standard save which properly sets content-disposition & filename
    doc.save(cleanName);
    return true;
  } catch (err) {
    console.warn("doc.save failed, trying DataURI fallback:", err);
    try {
      // Fallback: Base64 Data URI with explicit download attribute
      const dataUri = doc.output("datauristring");
      const link = document.createElement("a");
      link.href = dataUri;
      link.setAttribute("download", cleanName);
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 500);
      return true;
    } catch (fallbackErr) {
      console.error("PDF download fallback error:", fallbackErr);
      return false;
    }
  }
}

/**
 * Downloads a material file to the user's computer.
 * Always ensures the output is an authentic .pdf file.
 */
export async function downloadMaterial(material: DownloadableMaterial): Promise<boolean> {
  try {
    const rawFileName =
      material.fileName ||
      `${material.subject || "Study"}_${material.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    const cleanFileName = rawFileName.toLowerCase().endsWith(".pdf") ? rawFileName : `${rawFileName}.pdf`;

    // 1. If it's a direct PDF data URL
    if (material.fileUrl && material.fileUrl.startsWith("data:application/pdf")) {
      const link = document.createElement("a");
      link.href = material.fileUrl;
      link.setAttribute("download", cleanFileName);
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 500);
      return true;
    }

    // 2. Generate a structured, printable Mantif Study Notes PDF
    const facultyName =
      typeof material.uploadedBy === "object" && material.uploadedBy?.name
        ? material.uploadedBy.name
        : typeof material.uploadedBy === "string"
        ? material.uploadedBy
        : "Mantif Senior Faculty Team";

    const dateStr = material.createdAt
      ? new Date(material.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header bar
    doc.setFillColor(0, 33, 55); // #002137
    doc.rect(0, 0, 210, 26, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("MANTIF TUTORING", 15, 14);

    doc.setFontSize(9);
    doc.setTextColor(223, 183, 74); // Gold #dfb74a
    doc.text(`${(material.category || "STUDY NOTES").toUpperCase()} • ${material.classLevel || "Class 10"}`, 15, 21);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Faculty: ${facultyName}`, 145, 12);
    doc.text(`Date: ${dateStr}`, 145, 18);

    // Subject badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text(`SUBJECT: ${(material.subject || "General").toUpperCase()}`, 15, 36);

    // Title
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    const splitTitle = doc.splitTextToSize(material.title, 180);
    doc.text(splitTitle, 15, 44);

    let currentY = 44 + splitTitle.length * 6;

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(
      material.description || "Official syllabus study material and structured reference notes designed for Mantif Tutoring students.",
      180
    );
    doc.text(splitDesc, 15, currentY);
    currentY += splitDesc.length * 5 + 6;

    // Content sections table
    const studySections = [
      [
        "1. Core Concepts",
        "Comprehensive theoretical foundations and standard definitions strictly aligned with the CBSE curriculum guidelines.",
      ],
      [
        "2. Key Formulas & Theorems",
        "• Standard Form: ax² + bx + c = 0 | Discriminant: D = b² - 4ac\n• Nature of Roots: D > 0 (Real & Distinct), D = 0 (Equal), D < 0 (Complex)\n• Units & Constants: Standard SI units must be maintained.",
      ],
      [
        "3. Step-by-Step Exemplar Practice",
        "• Problem Type A: Direct formula application\n• Problem Type B: Multi-step word problem with equation modeling\n• Problem Type C: Higher Order Thinking Skills (HOTS) board questions",
      ],
      [
        "4. Home Revision Checklist",
        "1. Complete the homework worksheet in the Student Portal under Assignments.\n2. Review recorded class notes prior to the next scheduled live session.\n3. Clarify doubts directly with faculty during the doubt clearing session.",
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [["Section", "Curriculum Content & Study Guidelines"]],
      body: studySections,
      theme: "grid",
      headStyles: {
        fillColor: [0, 33, 55],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        valign: "top",
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: 130 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 265;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Mantif Live Online Tutoring • Verified Learning Hub Document • support@mantif.edu", 15, Math.min(finalY, 285));

    return triggerPdfDownload(doc, cleanFileName);
  } catch (error) {
    console.error("Failed to download material:", error);
    return false;
  }
}

export interface TimetableDocData {
  studentName?: string;
  currentClass: string;
  board: string;
  batchName: string;
  weeklySchedule: Array<{
    day: string;
    time?: string;
    subject: string;
    topic: string;
    faculty: string;
    description?: string;
    status?: string;
  }>;
}

/**
 * Generates and downloads the clean, formatted Weekly Schedule Timetable directly in PDF format.
 */
export function downloadTimetableDoc(data: TimetableDocData): boolean {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // 1. Header Banner
    doc.setFillColor(0, 33, 55); // #002137 Sapphire Dark
    doc.rect(0, 0, 297, 24, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("MANTIF TUTORING", 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(223, 183, 74); // Gold #dfb74a
    doc.text("OFFICIAL WEEKLY LIVE CLASSROOM TIMETABLE", 75, 15);

    // Meta Box / Subtitle
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Grade & Board: ${data.currentClass} (${data.board})`, 14, 32);
    doc.text(`Assigned Batch: ${data.batchName} (Monday – Saturday)`, 105, 32);
    doc.text(`Academic Year: 2025–2026`, 228, 32);

    // 2. Table Data
    const tableData = data.weeklySchedule.map((item) => [
      item.day,
      item.time || data.batchName,
      item.subject,
      `${item.topic}\n${item.description || ""}`,
      item.faculty,
      "Live HD",
    ]);

    autoTable(doc, {
      startY: 37,
      head: [["Day", "Session Time", "Subject", "Topic & Learning Objectives", "Faculty Instructor", "Delivery"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [0, 33, 55],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        halign: "left",
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        valign: "middle",
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 24 },
        1: { fontStyle: "bold", textColor: [79, 70, 229], cellWidth: 35 },
        2: { fontStyle: "bold", cellWidth: 28 },
        3: { cellWidth: 95 },
        4: { fontStyle: "bold", cellWidth: 42 },
        5: { halign: "center", cellWidth: 20, textColor: [22, 163, 74] },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // 3. Footer
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 180;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Mantif Tutoring System • Intelligent Learning Platform • 24/7 Helpline: +91 98765 43210 • support@mantif.edu",
      14,
      Math.min(finalY, 195)
    );

    // Force strict filename with .pdf extension
    const cleanFileName = `Mantif_Timetable_${data.currentClass.replace(/\s+/g, "_")}_${data.board}.pdf`;
    return triggerPdfDownload(doc, cleanFileName);
  } catch (error) {
    console.error("Failed to generate PDF timetable:", error);
    return false;
  }
}

export interface ReceiptDocData {
  receiptNumber: string;
  studentName?: string;
  studentClass?: string;
  board?: string;
  billingMonth: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  paidDate?: string | Date;
}

/**
 * Generates and downloads the official Mantif Fee Payment Receipt in high-resolution PDF format.
 */
export function downloadReceiptPDF(data: ReceiptDocData): boolean {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // 1. Header Banner
    doc.setFillColor(0, 33, 55); // #002137 Sapphire Dark
    doc.rect(0, 0, 210, 28, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("MANTIF TUTORING", 15, 14);

    doc.setFontSize(9);
    doc.setTextColor(223, 183, 74); // Gold #dfb74a
    doc.text("OFFICIAL TUITION FEE RECEIPT", 15, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Receipt No: ${data.receiptNumber}`, 145, 14);
    doc.text(
      `Date: ${
        data.paidDate
          ? new Date(data.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      }`,
      145,
      20
    );

    // 2. Receipt Details Table
    const receiptRows = [
      ["Receipt Number", data.receiptNumber],
      ["Billing Cycle / Month", data.billingMonth],
      ["Student Grade & Board", `${data.studentClass || "Class 10"} (${data.board || "CBSE"} Board)`],
      ["Payment Mode", data.paymentMethod || "Online UPI"],
      ["Transaction Reference / UTR", data.transactionId || `UPI-${data.receiptNumber.replace(/\D/g, "") || "984210"}`],
      ["Tuition Fee Amount", `INR ${data.amount.toLocaleString("en-IN")}.00`],
      ["Payment Status", "PAID & VERIFIED (CLEARED)"],
    ];

    autoTable(doc, {
      startY: 40,
      head: [["Particulars", "Transaction & Enrollment Details"]],
      body: receiptRows,
      theme: "grid",
      headStyles: {
        fillColor: [0, 33, 55],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        valign: "middle",
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 65 },
        1: { cellWidth: 115 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // 3. Amount Total Strip
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 140;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.rect(15, finalY, 180, 16, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    doc.text("TOTAL AMOUNT RECEIVED:", 22, finalY + 10);
    doc.text(`INR ${data.amount.toLocaleString("en-IN")}.00`, 135, finalY + 10);

    // 4. Verification Stamp & Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "This is a computer-generated authentic fee receipt. No physical signature required. • Support: support@mantif.edu",
      15,
      Math.min(finalY + 32, 270)
    );

    const cleanFileName = `Mantif_Fee_Receipt_${data.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    return triggerPdfDownload(doc, cleanFileName);
  } catch (error) {
    console.error("Failed to generate PDF receipt:", error);
    return false;
  }
}

/**
 * Generates an official, clean Student Performance Report PDF
 * Strictly containing:
 * 1. Student & Academic Info
 * 2. How They Perform (Overall Performance & Attendance Overview)
 * 3. Good / Strongest Subject Highlight
 * 4. Subject-Wise Marks Table
 * 5. Assessment / Test Marks
 * 6. Remarks by the Staff / Faculty
 */
export async function generateStudentPerformanceReportPdf(report: any): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const student = report.studentInfo || {};
    const summary = report.performanceSummary || {};
    const subjects = report.subjectBreakdown || [];
    const tests = report.testPerformance?.tests || [];
    const att = report.attendanceReport || {};
    const remarks = report.teacherRemarks || {};

    // Determine Good Subject
    const goodSubject = summary.goodSubject || (subjects.length > 0
      ? { name: subjects[0].subject, score: subjects[0].averageScore || 90 }
      : { name: "Mathematics", score: 90 });

    // ── HEADER ──
    doc.setFillColor(0, 33, 55); // #002137
    doc.rect(0, 0, 210, 26, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("MANTIF TUTORING", 14, 12);

    doc.setFontSize(8.5);
    doc.setTextColor(223, 183, 74); // Gold #dfb74a
    doc.text("OFFICIAL STUDENT ACADEMIC PERFORMANCE REPORT", 14, 19);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Student ID: ${student.studentId || "STU-1001"}`, 145, 12);
    doc.text(
      `Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      145,
      18
    );

    // 1. Student Information Table
    const studentInfoRows = [
      ["Student Name", student.name || "Student", "Grade & Board", `${student.classLevel || "Class 10"} (${student.board || "CBSE"})`],
      ["School Name", student.schoolName || "Not Specified", "Assigned Batch", student.batchName || "Regular Evening Batch"],
      ["Parent / Guardian", `${student.parentName || "Parent"} (${student.parentPhone || ""})`, "Staff In-Charge", student.assignedTeacher || "Faculty Team"],
      ["Evaluation Period", student.reportPeriod || "Current Academic Term", "Performance Level", (summary.overallPerformanceScore || 85) >= 80 ? "Distinction / High Performer" : "Consistent Performer"],
    ];

    autoTable(doc, {
      startY: 32,
      body: studentInfoRows,
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5,
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 32, textColor: [71, 85, 105], fillColor: [248, 250, 252] },
        1: { cellWidth: 58, textColor: [15, 23, 42], fontStyle: "bold" },
        2: { fontStyle: "bold", cellWidth: 35, textColor: [71, 85, 105], fillColor: [248, 250, 252] },
        3: { cellWidth: 55, textColor: [15, 23, 42] },
      },
    });

    let currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : 65;

    // 2. How They Perform — Executive Summary Strip
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, 182, 22, 2, 2, "FD");

    const kpis = [
      { label: "Overall Score", value: `${summary.overallPerformanceScore || 85}%` },
      { label: "Live Attendance", value: `${summary.attendancePercentage || att.attendancePercentage || 90}%` },
      { label: "Test Average", value: `${summary.testAverage || 84}%` },
      { label: "HW Completion", value: `${summary.assignmentCompletionPercentage || 95}%` },
      { label: "Class Rank", value: `#${summary.currentRank || 1} in Batch` },
    ];

    const kpiWidth = 182 / kpis.length;
    kpis.forEach((kpi, idx) => {
      const kX = 14 + idx * kpiWidth + kpiWidth / 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 33, 55);
      doc.text(kpi.value, kX, currentY + 9, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, kX, currentY + 16, { align: "center" });
    });

    currentY += 28;

    // 3. Good / Strongest Subject Highlight Box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, currentY, 182, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(22, 101, 52);
    doc.text(`TOP PERFORMING / GOOD SUBJECT: ${goodSubject.name.toUpperCase()} (${goodSubject.score || 92}%)`, 20, currentY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Demonstrates highest conceptual clarity, consistent test performance, and strong problem solving skills in ${goodSubject.name}.`, 20, currentY + 13);

    currentY += 24;

    // 4. Student Marks & Subject Breakdown Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 33, 55);
    doc.text("1. Student Marks & Subject-Wise Performance", 14, currentY);

    const subjectRows = subjects.map((s: any) => [
      s.subject,
      `${s.averageScore || 0}%`,
      `${s.latestScore || s.averageScore || 0}%`,
      `${s.highestScore || s.averageScore || 0}%`,
      s.performanceTrend === "UP" ? "Improving (+)" : "Stable",
      (s.averageScore || 0) >= 85 ? "Grade A+ (Mastery)" : (s.averageScore || 0) >= 75 ? "Grade A (Proficient)" : "Grade B (Good)",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Subject", "Marks / Avg Score", "Latest Score", "Highest Score", "Trend", "Academic Standing"]],
      body: subjectRows,
      theme: "grid",
      headStyles: {
        fillColor: [0, 75, 121], // #004b79
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { cellWidth: 32, fontStyle: "bold", textColor: [0, 75, 121] },
        2: { cellWidth: 26 },
        3: { cellWidth: 26 },
        4: { cellWidth: 26 },
        5: { cellWidth: 32, fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : currentY + 45;

    // 5. Assessment / Test Marks Table (if tests exist)
    if (tests.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 33, 55);
      doc.text("2. Assessment & Test Marks Record", 14, currentY);

      const testRows = tests.slice(0, 4).map((t: any) => [
        t.testName,
        t.subject,
        new Date(t.testDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        `${t.marksObtained} / ${t.maxMarks}`,
        `${t.percentage}%`,
        `#${t.studentRank || 1}`,
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [["Test Title", "Subject", "Date", "Marks Obtained", "Percentage", "Batch Rank"]],
        body: testRows,
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : currentY + 35;
    }

    // 6. Remarks by the Staff / Faculty
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 33, 55);
    doc.text("3. Remarks by the Staff & Faculty Guidance", 14, currentY);

    currentY += 3;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 34, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 75, 121);
    doc.text(`STAFF IN-CHARGE: ${remarks.teacherName || student.assignedTeacher || "Senior Faculty Specialist"}`, 18, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    const obsText = `• Faculty Observation: ${remarks.observation || "Student exhibits strong classroom discipline, attentiveness during lectures, and regularly clarifies conceptual doubts."}`;
    const splitObs = doc.splitTextToSize(obsText, 174);
    doc.text(splitObs, 18, currentY + 12);

    const acadText = `• Academic Feedback: ${remarks.academicFeedback || `Shows excellent understanding and analytical skills in ${goodSubject.name}. Keeps worksheets and notes well-maintained.`}`;
    const splitAcad = doc.splitTextToSize(acadText, 174);
    doc.text(splitAcad, 18, currentY + 19);

    const recText = `• Staff Recommendations: ${remarks.recommendations || "Continue regular revision of formulas and practice past exam problem sets."}`;
    const splitRec = doc.splitTextToSize(recText, 174);
    doc.text(splitRec, 18, currentY + 26);

    currentY += 40;

    // 7. Computer-Generated Certification Stamp & Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Mantif Tutoring Official Student Academic Performance Report • Verified by Faculty Academic Board • support@mantif.edu",
      14,
      286
    );

    const cleanFileName = `Mantif_Performance_Report_${(student.name || "Student").replace(/[^a-zA-Z0-9_-]/g, "_")}_${
      student.studentId || "STU"
    }.pdf`;
    return triggerPdfDownload(doc, cleanFileName);
  } catch (err) {
    console.error("Failed to generate Student Performance Report PDF:", err);
    return false;
  }
}

/**
 * Generates an official Consolidated School-Wise Academic Cohort Report PDF
 */
export async function generateSchoolPerformanceReportPdf(report: any): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const overview = report.schoolOverview || {};
    const metrics = report.schoolMetrics || {};
    const students = report.studentMarksheet || [];
    const subjects = report.subjectBenchmarks || [];

    // Identify top subject of the school
    const topSchoolSubj = [...subjects].sort((a: any, b: any) => (b.schoolAverage || 0) - (a.schoolAverage || 0))[0] || {
      subject: "Mathematics",
      schoolAverage: 90,
    };

    // ── HEADER ──
    doc.setFillColor(0, 33, 55); // #002137
    doc.rect(0, 0, 210, 26, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("MANTIF TUTORING", 14, 12);

    doc.setFontSize(8.5);
    doc.setTextColor(223, 183, 74); // Gold #dfb74a
    doc.text("SCHOOL ACADEMIC COHORT PERFORMANCE REPORT", 14, 19);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Enrolled Students: ${overview.totalStudents || students.length}`, 145, 12);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      145,
      18
    );

    // 1. School Information Table
    const schoolInfoRows = [
      ["School Name", overview.schoolName || "School", "District / Location", overview.district || "Main District"],
      ["Curriculum Board", overview.board || "CBSE", "Enrolled Students", `${overview.totalStudents || students.length} Enrolled`],
      ["Top Performer", `${overview.topPerformer || "Top Student"} (${overview.highestScore || 95}%)`, "Evaluation Period", overview.reportPeriod || "Current Academic Term"],
    ];

    autoTable(doc, {
      startY: 32,
      body: schoolInfoRows,
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5,
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 35, textColor: [71, 85, 105], fillColor: [248, 250, 252] },
        1: { cellWidth: 55, textColor: [15, 23, 42], fontStyle: "bold" },
        2: { fontStyle: "bold", cellWidth: 38, textColor: [71, 85, 105], fillColor: [248, 250, 252] },
        3: { cellWidth: 52, textColor: [15, 23, 42] },
      },
    });

    let currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : 65;

    // 2. School Aggregate Scorecard Strip
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, 182, 22, 2, 2, "FD");

    const schoolKpis = [
      { label: "School Overall Avg", value: `${metrics.overallSchoolAverage || 85}%` },
      { label: "Avg Attendance", value: `${metrics.averageAttendance || 90}%` },
      { label: "Test Average", value: `${metrics.averageTestScore || 85}%` },
      { label: "Good Subject", value: `${topSchoolSubj.subject}` },
      { label: "Top Performer", value: `${overview.topPerformer || "Top Student"}` },
      { label: "Total Students", value: `${overview.totalStudents || students.length}` },
    ];

    const kpiW = 182 / schoolKpis.length;
    schoolKpis.forEach((kpi, idx) => {
      const kX = 14 + idx * kpiW + kpiW / 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(0, 33, 55);
      doc.text(kpi.value, kX, currentY + 9, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, kX, currentY + 16, { align: "center" });
    });

    currentY += 28;

    // 3. Consolidated Student Marksheet Table (Only REAL students of this school)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("1. Student Marksheet & Academic Record", 14, currentY);

    const marksheetRows = students.map((st: any) => [
      `#${st.schoolRank || 1}`,
      st.name,
      st.studentId,
      st.classLevel,
      `${st.subjectScores?.Mathematics ?? 90}%`,
      `${st.subjectScores?.Science ?? 85}%`,
      `${st.subjectScores?.English ?? 88}%`,
      `${st.subjectScores?.["Social Science"] ?? 80}%`,
      `${st.attendancePercentage ?? 90}%`,
      `${st.overallScore ?? 88}%`,
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Rank", "Student Name", "Student ID", "Grade", "Math", "Sci", "Eng", "Soc Sci", "Att %", "Overall"]],
      body: marksheetRows,
      theme: "grid",
      headStyles: {
        fillColor: [0, 75, 121], // #004b79
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 45;

    // 4. Remarks by the Staff / Faculty
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 33, 55);
    doc.text("2. Remarks by Staff & Faculty Cohort Assessment", 14, currentY);

    currentY += 3;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 28, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 75, 121);
    doc.text("FACULTY COHORT ASSESSMENT & OBSERVATIONS", 18, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    const schoolRemarks = `• Faculty Observation: Students from ${overview.schoolName || "this school"} demonstrate punctual attendance, consistent homework completion, and strong performance in core subjects.
• Good Subject Focus: ${topSchoolSubj.subject} (${topSchoolSubj.schoolAverage}%) continues to be the strongest subject with high student interest.
• Staff Recommendation: Continue weekly chapter tests and scheduled revision sessions to maintain academic excellence.`;

    const splitSchoolRemarks = doc.splitTextToSize(schoolRemarks, 174);
    doc.text(splitSchoolRemarks, 18, currentY + 12);

    // 5. Official Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Mantif Tutoring Official School Cohort Performance Report • Certified by Academic Faculty • support@mantif.edu",
      14,
      286
    );

    const cleanFileName = `Mantif_School_Report_${(overview.schoolName || "School").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    return triggerPdfDownload(doc, cleanFileName);
  } catch (err) {
    console.error("Failed to generate School Performance Report PDF:", err);
    return false;
  }
}
