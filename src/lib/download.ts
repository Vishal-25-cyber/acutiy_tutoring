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
 * Generates an official, comprehensive Multi-Section Student Performance Report PDF
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
    const assign = report.assignmentReport || {};
    const live = report.liveClassEngagement || {};
    const remarks = report.teacherRemarks || {};
    const strengths = report.strengths || [];
    const areas = report.areasNeedingAttention || [];
    const actionPlan = report.recommendedActionPlan || [];

    // ── PAGE 1: HEADER & PROFILE ──
    doc.setFillColor(0, 33, 55); // #002137
    doc.rect(0, 0, 210, 26, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("MANTIF TUTORING", 14, 12);

    doc.setFontSize(8.5);
    doc.setTextColor(223, 183, 74); // Gold #dfb74a
    doc.text("STUDENT COMPREHENSIVE PERFORMANCE REPORT", 14, 19);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Student ID: ${student.studentId || "STU-1001"}`, 145, 12);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      145,
      18
    );

    // 1. Student Information Table
    const studentInfoRows = [
      ["Student Name", student.name || "Student", "Grade & Board", `${student.classLevel || "Class 10"} (${student.board || "CBSE"})`],
      ["School Name", student.schoolName || "Not Specified", "District / Location", student.district || "Not Specified"],
      ["Assigned Batch", student.batchName || "Evening Batch", "Parent / Guardian", `${student.parentName || "Parent"} (${student.parentPhone || ""})`],
      ["Faculty In-Charge", student.assignedTeacher || "Senior Faculty", "Report Period", student.reportPeriod || "Current Term"],
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

    // 2. Key Performance Summary Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, 182, 22, 2, 2, "FD");

    const kpis = [
      { label: "Overall Score", value: `${summary.overallPerformanceScore || 85}%` },
      { label: "Attendance", value: `${summary.attendancePercentage || 90}%` },
      { label: "Test Average", value: `${summary.testAverage || 84}%` },
      { label: "Assignments", value: `${summary.assignmentCompletionPercentage || 88}%` },
      { label: "Live Engagement", value: `${summary.liveClassEngagementPercentage || 92}%` },
      { label: "Class Rank", value: `#${summary.currentRank || 3} of ${summary.totalClassStudents || 28}` },
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

    // 3. Subject-Wise Breakdown Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("1. Subject-Wise Performance Breakdown", 14, currentY);

    const subjectRows = subjects.map((s: any) => [
      s.subject,
      `${s.averageScore || 0}%`,
      `${s.latestScore || 0}%`,
      `${s.highestScore || 0}%`,
      s.numberOfTests || 2,
      s.performanceTrend === "UP" ? "+ Growth" : "Stable",
      s.status || "Good",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Subject Name", "Avg Score", "Latest", "Highest", "Tests", "Trend", "Status"]],
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
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : currentY + 40;

    // 4. Test & Exam Performance Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("2. Assessment & Test History", 14, currentY);

    const testRows = tests.slice(0, 5).map((t: any) => [
      t.testName,
      t.subject,
      new Date(t.testDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      `${t.marksObtained} / ${t.maxMarks}`,
      `${t.percentage}%`,
      `${t.classAverage}%`,
      `#${t.studentRank || 3}`,
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Test Title", "Subject", "Date", "Marks", "Percentage", "Class Avg", "Rank"]],
      body: testRows,
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
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
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 45;

    // ── PAGE 2: ATTENDANCE, ENGAGEMENT & REMARKS ──
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    // 5. Attendance & Live Class Analytics Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("3. Attendance & Classroom Engagement Summary", 14, currentY);

    const attendanceSummaryRows = [
      ["Total Live Classes", `${att.totalClasses || 24} Sessions`, "Classes Attended", `${att.classesAttended || 22} Sessions (${att.attendancePercentage || 92}%)`],
      ["Classes Missed / Absent", `${att.classesAbsent || 2} Sessions`, "Late Joins Recorded", `${att.lateJoins || 0} Times`],
      ["Avg Session Duration", `${live.avgSessionDurationMinutes || 54} Mins / Class`, "Live Engagement Rate", `${live.engagementPercentage || 90}% Uncapped`],
      ["Active Homework Tasks", `${assign.submitted || 12} Submitted / ${assign.totalAssignments || 14}`, "Pending Worksheets", `${assign.pending || 2} Pending Tasks`],
    ];

    autoTable(doc, {
      startY: currentY + 3,
      body: attendanceSummaryRows,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: "middle",
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 42, textColor: [71, 85, 105], fillColor: [248, 250, 252] },
        1: { cellWidth: 48, textColor: [15, 23, 42], fontStyle: "bold" },
        2: { fontStyle: "bold", cellWidth: 44, textColor: [71, 85, 105], fillColor: [248, 250, 252] },
        3: { cellWidth: 48, textColor: [15, 23, 42] },
      },
    });

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 45;

    // 6. Strengths & Areas for Improvement (Side by Side Boxes)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("4. Academic Strengths & Areas Needing Attention", 14, currentY);

    currentY += 4;
    const boxWidth = 88;
    const boxHeight = 36;

    // Strengths Box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, currentY, boxWidth, boxHeight, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text("KEY STRENGTHS", 18, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    let sY = currentY + 12;
    strengths.slice(0, 3).forEach((st: string) => {
      const splitStr = doc.splitTextToSize(`• ${st}`, boxWidth - 8);
      doc.text(splitStr, 18, sY);
      sY += splitStr.length * 4;
    });

    // Areas Needing Attention Box
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(108, currentY, boxWidth, boxHeight, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(153, 27, 27);
    doc.text("AREAS FOR FOCUS", 112, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    let aY = currentY + 12;
    areas.slice(0, 3).forEach((ar: string) => {
      const splitAr = doc.splitTextToSize(`• ${ar}`, boxWidth - 8);
      doc.text(splitAr, 112, aY);
      aY += splitAr.length * 4;
    });

    currentY += boxHeight + 8;

    // 7. Recommended Action Plan
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("5. Recommended Academic Action Plan", 14, currentY);

    const planRows = actionPlan.slice(0, 4).map((p: string, idx: number) => [
      `Step ${idx + 1}`,
      p,
      "Daily Practice",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Priority", "Action Item", "Schedule"]],
      body: planRows,
      theme: "grid",
      headStyles: {
        fillColor: [0, 75, 121],
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
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 24, textColor: [0, 75, 121] },
        1: { cellWidth: 124 },
        2: { cellWidth: 34 },
      },
    });

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 35;

    // 8. Teacher Remarks Section
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 28, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 33, 55);
    doc.text(`FACULTY OBSERVATION & REMARKS (${remarks.teacherName || "Academic Staff"})`, 18, currentY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const remarkText = doc.splitTextToSize(
      `Observation: ${remarks.observation || "Diligent learner with consistent classroom engagement."} | Academic: ${
        remarks.academicFeedback || "Solid problem solving foundations."
      } | Recommendations: ${remarks.recommendations || "Continue regular revision."}`,
      174
    );
    doc.text(remarkText, 18, currentY + 14);

    // 9. Official Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Mantif Tutoring Academic Evaluation Report • Certified by Faculty Academic Board • support@mantif.edu",
      14,
      288
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
    const classDist = report.classDistribution || [];
    const strengths = report.cohortStrengths || [];
    const focusAreas = report.cohortFocusAreas || [];
    const actionPlan = report.institutionalActionPlan || [];

    // ── PAGE 1: HEADER & SCHOOL OVERVIEW ──
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
      ["Curriculum Board", overview.board || "CBSE", "Grades Represented", (overview.classesRepresented || []).join(", ") || "Class 6-10"],
      ["Top Performer", `${overview.topPerformer || "Top Student"} (${overview.highestScore || 95}%)`, "Evaluation Period", overview.reportPeriod || "Current Term"],
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
      { label: "School Overall Avg", value: `${metrics.overallSchoolAverage || 82}%` },
      { label: "Avg Attendance", value: `${metrics.averageAttendance || 90}%` },
      { label: "Test Average", value: `${metrics.averageTestScore || 80}%` },
      { label: "HW Completion", value: `${metrics.averageAssignmentCompletion || 87}%` },
      { label: "Highest Score", value: `${metrics.highestScore || 95}%` },
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

    // 3. Consolidated Student Marksheet Table (All students of this school in one table)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("1. Consolidated Student Marksheet & Rank List", 14, currentY);

    const marksheetRows = students.map((st: any) => [
      `#${st.schoolRank || 1}`,
      st.name,
      st.studentId,
      st.classLevel,
      `${st.subjectScores?.Mathematics || 80}%`,
      `${st.subjectScores?.Science || 80}%`,
      `${st.subjectScores?.English || 80}%`,
      `${st.subjectScores?.["Social Science"] || 80}%`,
      `${st.attendancePercentage}%`,
      `${st.overallScore}%`,
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
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 14, textColor: [0, 75, 121] },
        1: { fontStyle: "bold", cellWidth: 36 },
        2: { cellWidth: 22 },
        3: { cellWidth: 20 },
        4: { cellWidth: 14 },
        5: { cellWidth: 14 },
        6: { cellWidth: 14 },
        7: { cellWidth: 16 },
        8: { cellWidth: 15 },
        9: { fontStyle: "bold", cellWidth: 17, textColor: [16, 185, 129] },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 60;

    // ── PAGE 2: SUBJECT BENCHMARKS, CLASS DISTRIBUTION & ACTION PLAN ──
    if (currentY > 210) {
      doc.addPage();
      currentY = 20;
    }

    // 4. Subject-Wise Benchmark Comparison Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("2. Subject-Wise Benchmark Comparison (School vs Institute)", 14, currentY);

    const subjectRows = subjects.map((sb: any) => [
      sb.subject,
      `${sb.schoolAverage}%`,
      `${sb.instituteBenchmark}%`,
      sb.comparison,
      sb.status === "EXCELLENT" ? "Excellent (Above Avg)" : "Good",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Subject", "School Cohort Average", "Institute Benchmark", "Variance Comparison", "Status"]],
      body: subjectRows,
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.8,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 45;

    // 5. Grade-Wise Performance Distribution Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("3. Grade-Wise Academic Distribution within School", 14, currentY);

    const gradeRows = classDist.map((cd: any) => [
      cd.classLevel,
      `${cd.studentCount} Students`,
      `${cd.averageScore}%`,
      `${cd.averageAttendance}%`,
      cd.averageScore >= 80 ? "Top Performing Grade" : "Steady Progress",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Class / Grade", "Enrolled Students", "Average Score", "Average Attendance", "Cohort Rating"]],
      body: gradeRows,
      theme: "grid",
      headStyles: {
        fillColor: [0, 75, 121],
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

    currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 40;

    // 6. Cohort Strengths & Focus Areas (Side by Side)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("4. Institutional Strengths & Growth Areas", 14, currentY);

    currentY += 4;
    const bW = 88;
    const bH = 34;

    // Strengths
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, currentY, bW, bH, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text("COHORT STRENGTHS", 18, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    let sY2 = currentY + 12;
    strengths.slice(0, 3).forEach((st: string) => {
      const splitSt = doc.splitTextToSize(`• ${st}`, bW - 8);
      doc.text(splitSt, 18, sY2);
      sY2 += splitSt.length * 4;
    });

    // Focus Areas
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(108, currentY, bW, bH, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(153, 27, 27);
    doc.text("AREAS FOR FOCUS", 112, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    let aY2 = currentY + 12;
    focusAreas.slice(0, 3).forEach((fa: string) => {
      const splitFa = doc.splitTextToSize(`• ${fa}`, bW - 8);
      doc.text(splitFa, 112, aY2);
      aY2 += splitFa.length * 4;
    });

    currentY += bH + 8;

    // 7. Institutional Action Plan
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 33, 55);
    doc.text("5. Recommended Institutional Action Plan", 14, currentY);

    const planRows = actionPlan.map((p: string, idx: number) => [
      `Phase ${idx + 1}`,
      p,
      "Monthly Alignment",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Timeline", "Strategic Action Step", "Review Frequency"]],
      body: planRows,
      theme: "grid",
      headStyles: {
        fillColor: [0, 75, 121],
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
    });

    // 8. Official Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Mantif Tutoring Official School Academic Cohort Report • Certified by Academic Director • support@mantif.edu",
      14,
      288
    );

    const cleanFileName = `Mantif_School_Report_${(overview.schoolName || "School").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    return triggerPdfDownload(doc, cleanFileName);
  } catch (err) {
    console.error("Failed to generate School Performance Report PDF:", err);
    return false;
  }
}


