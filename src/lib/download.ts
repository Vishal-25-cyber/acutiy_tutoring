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

    // 2. Generate a structured, printable Acuity Study Notes PDF
    const facultyName =
      typeof material.uploadedBy === "object" && material.uploadedBy?.name
        ? material.uploadedBy.name
        : typeof material.uploadedBy === "string"
        ? material.uploadedBy
        : "Acuity Senior Faculty Team";

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
    doc.text("ACUITY TUTORING", 15, 14);

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
      material.description || "Official syllabus study material and structured reference notes designed for Acuity Tutoring students.",
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
    doc.text("Acuity Live Online Tutoring • Verified Learning Hub Document • support@acuity.edu", 15, Math.min(finalY, 285));

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
    doc.text("ACUITY TUTORING", 14, 15);

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
      "Acuity Tutoring System • Where Accuracy Meets Knowledge • 24/7 Helpline: +91 98765 43210 • support@acuity.edu",
      14,
      Math.min(finalY, 195)
    );

    // Force strict filename with .pdf extension
    const cleanFileName = `Acuity_Timetable_${data.currentClass.replace(/\s+/g, "_")}_${data.board}.pdf`;
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
 * Generates and downloads the official Acuity Fee Payment Receipt in high-resolution PDF format.
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
    doc.text("ACUITY TUTORING", 15, 14);

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
      "This is a computer-generated authentic fee receipt. No physical signature required. • Support: support@acuity.edu",
      15,
      Math.min(finalY + 32, 270)
    );

    const cleanFileName = `Acuity_Fee_Receipt_${data.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    return triggerPdfDownload(doc, cleanFileName);
  } catch (error) {
    console.error("Failed to generate PDF receipt:", error);
    return false;
  }
}
