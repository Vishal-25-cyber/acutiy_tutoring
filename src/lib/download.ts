/**
 * Acuity Tutoring — Client-Side Material Download & Document Generation Engine
 * Handles direct file downloads, base64 data URLs, and dynamic printable study guides.
 */

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
 * Downloads a material file to the user's computer.
 * If fileUrl is a data URL or real downloadable link, it downloads directly.
 * If fileUrl is a placeholder/sample link, it dynamically generates an educational study guide PDF/document blob.
 */
export async function downloadMaterial(material: DownloadableMaterial): Promise<boolean> {
  try {
    const rawFileName =
      material.fileName ||
      `${material.subject}_${material.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    const cleanFileName = rawFileName.endsWith(".pdf") || rawFileName.endsWith(".html") || rawFileName.endsWith(".doc")
      ? rawFileName
      : `${rawFileName}.pdf`;

    // 1. If it's a data URL (e.g. uploaded file in base64)
    if (material.fileUrl && material.fileUrl.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = material.fileUrl;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // 2. If it's a valid remote blob or external URL that is directly reachable
    if (
      material.fileUrl &&
      material.fileUrl.startsWith("http") &&
      !material.fileUrl.includes("sample") &&
      !material.fileUrl.includes("acuity.edu")
    ) {
      try {
        const res = await fetch(material.fileUrl, { mode: "cors" });
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = cleanFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          return true;
        }
      } catch (e) {
        // Fall through to rich study doc generator
      }
    }

    // 3. Generate a rich, formatted, printable Acuity Study Notes Document
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

    const docContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${material.title} — Acuity Tutoring</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand {
      font-size: 24px;
      font-weight: 900;
      color: #312e81;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #4f46e5;
    }
    .meta-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #eef2ff;
      color: #4338ca;
      font-size: 12px;
      font-weight: 700;
      border-radius: 9999px;
      margin-top: 6px;
    }
    .doc-info {
      text-align: right;
      font-size: 12px;
      color: #64748b;
    }
    h1 {
      font-size: 22px;
      color: #0f172a;
      margin: 0 0 12px 0;
      font-weight: 800;
    }
    .subject-pill {
      display: inline-block;
      padding: 3px 10px;
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 700;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .card h2 {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 0;
      margin-bottom: 10px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
    }
    ul, ol {
      margin: 8px 0;
      padding-left: 24px;
      font-size: 14px;
    }
    li {
      margin-bottom: 8px;
    }
    .formula-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 14px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      margin: 12px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    .watermark {
      font-size: 10px;
      color: #a5b4fc;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 800;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ACUITY <span>TUTORING</span></div>
      <div class="meta-badge">${material.category || "CLASS NOTES"} • ${material.classLevel || "Class 10"}</div>
    </div>
    <div class="doc-info">
      <div><strong>Faculty:</strong> ${facultyName}</div>
      <div><strong>Date Published:</strong> ${dateStr}</div>
      <div><strong>Academic Year:</strong> 2025 – 2026</div>
    </div>
  </div>

  <div class="subject-pill">SUBJECT: ${(material.subject || "General").toUpperCase()}</div>
  <h1>${material.title}</h1>
  <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">
    ${material.description || "Official syllabus study material and structured reference notes designed for Acuity Tutoring students."}
  </p>

  <div class="card">
    <h2>1. Core Concepts & Key Theoretical Foundations</h2>
    <ul>
      <li><strong>Standard Definitions:</strong> Comprehensive terminology aligned strictly with the CBSE / State Board curriculum guidelines.</li>
      <li><strong>Conceptual Breakdown:</strong> Step-by-step conceptual hierarchy starting from fundamental axioms to advanced problem solving.</li>
      <li><strong>Important Exam Rules:</strong> Key examination points and common pitfalls highlighted for full mark scoring.</li>
    </ul>
  </div>

  <div class="card">
    <h2>2. Key Formulas, Derivations & Theorems</h2>
    <div class="formula-box">
      • Standard Form & General Equations: Ax + By = C | ax² + bx + c = 0<br>
      • Discriminant & Nature of Solutions: D = b² - 4ac (D &gt; 0: Real & Distinct, D = 0: Equal, D &lt; 0: Non-real)<br>
      • Essential Proportionality & Conversion: Rate = Distance / Time | Work = Power × Time
    </div>
    <ul>
      <li>Always write the general formula before substituting numerical values in board exams.</li>
      <li>Verify dimensional units (e.g., m/s vs km/h, cm² vs m²) prior to final answer calculation.</li>
    </ul>
  </div>

  <div class="card">
    <h2>3. Step-by-Step Exemplar Practice Problems</h2>
    <ol>
      <li><strong>Problem Type A:</strong> Direct application of formula with given standard boundary conditions.</li>
      <li><strong>Problem Type B:</strong> Multi-step word problem requiring formation of algebraic equations and algebraic solving.</li>
      <li><strong>Problem Type C:</strong> Higher Order Thinking Skills (HOTS) board exemplar question.</li>
    </ol>
  </div>

  <div class="card">
    <h2>4. Home Revision & Assignment Checklist</h2>
    <ul>
      <li>[ ] Complete the homework worksheet in the Acuity Student Portal under Assignments.</li>
      <li>[ ] Review video recording / classroom notes before the next scheduled live session.</li>
      <li>[ ] Clarify any doubts directly with faculty during the live doubt clearing session.</li>
    </ul>
  </div>

  <div class="footer">
    <div class="watermark">Acuity Live Online Tutoring • Verified Learning Hub Document</div>
    <div>24/7 Helpline: +91 98765 43210 • support@acuity.edu</div>
  </div>

  <script>
    // Auto-trigger print dialog if opened in a dedicated tab
    if (window.location.search.includes('print=true')) {
      window.onload = () => window.print();
    }
  </script>
</body>
</html>`;

    // Download as formatted HTML/document or create printable blob
    const blob = new Blob([docContent], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = cleanFileName.replace(/\.pdf$/i, ".html");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return true;
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
 * Generates and downloads the clean, formatted Weekly Schedule Timetable table file.
 */
export function downloadTimetableDoc(data: TimetableDocData): boolean {
  try {
    const rawFileName = `Acuity_Timetable_${data.currentClass.replace(/\s+/g, "_")}_${data.board}.html`;
    const rowsHtml = data.weeklySchedule
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px 16px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${item.day}</td>
        <td style="padding: 12px 16px; font-family: monospace; font-size: 13px; color: #4338ca; border-bottom: 1px solid #e2e8f0;">${item.time || data.batchName}</td>
        <td style="padding: 12px 16px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${item.subject}</td>
        <td style="padding: 12px 16px; color: #334155; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #1e293b;">${item.topic}</div>
          ${item.description ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${item.description}</div>` : ""}
        </td>
        <td style="padding: 12px 16px; font-weight: 500; color: #475569; border-bottom: 1px solid #e2e8f0;">${item.faculty}</td>
        <td style="padding: 12px 16px; font-weight: 700; color: #16a34a; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="display: inline-block; padding: 3px 8px; background: #dcfce7; color: #15803d; border-radius: 6px; font-size: 11px;">LIVE HD</span>
        </td>
      </tr>
    `
      )
      .join("");

    const docContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Acuity Tutoring — Live Class Timetable (${data.currentClass})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 36px;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
    }
    .header {
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand {
      font-size: 24px;
      font-weight: 900;
      color: #312e81;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #4f46e5;
    }
    .subtitle {
      font-size: 13px;
      color: #6366f1;
      font-weight: 600;
      margin-top: 2px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .meta-item label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-item .val {
      display: block;
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      font-size: 13px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 16px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
    }
    .info-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 12px;
      color: #166534;
      margin-bottom: 20px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 15px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ACUITY <span>TUTORING</span></div>
      <div class="subtitle">Official Weekly Live Classroom Schedule & Timetable</div>
    </div>
    <div style="text-align: right; font-size: 12px; color: #64748b;">
      <div><strong>Academic Year:</strong> 2025–2026</div>
      <div><strong>Issued Date:</strong> ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item">
      <label>Grade & Curriculum</label>
      <div class="val">${data.currentClass} (${data.board})</div>
    </div>
    <div class="meta-item">
      <label>Assigned Batch Schedule</label>
      <div class="val" style="color: #4f46e5;">${data.batchName} (Mon–Sat)</div>
    </div>
    <div class="meta-item">
      <label>Attendance Requirement</label>
      <div class="val" style="color: #16a34a;">Minimum 75% Active Turnout</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Day</th>
        <th style="width: 18%;">Session Time</th>
        <th style="width: 16%;">Subject</th>
        <th style="width: 32%;">Topic & Learning Objectives</th>
        <th style="width: 14%;">Faculty</th>
        <th style="width: 8%; text-align: center;">Delivery</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="info-card">
    <strong>📌 Student Guidelines:</strong> Live sessions open 5 minutes prior to scheduled batch time. A 5-minute late entry grace period is enforced. Attendance is recorded automatically in real-time.
  </div>

  <div class="footer">
    <div>Acuity Tutoring System • Live HD Classroom Network</div>
    <div>Support Helpline: +91 98765 43210 • support@acuity.edu</div>
  </div>

  <script>
    if (window.location.search.includes('print=true')) {
      window.onload = () => window.print();
    }
  </script>
</body>
</html>`;

    const blob = new Blob([docContent], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = rawFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch (error) {
    console.error("Failed to download timetable:", error);
    return false;
  }
}
