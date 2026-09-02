/**
 * Helper utilities for generating and formatting Student IDs (STD_001) and Staff IDs (STF_001)
 */

export function generateStudentId(seqNumber: number): string {
  return `STD_${String(seqNumber).padStart(3, "0")}`;
}

export function generateStaffId(seqNumber: number): string {
  return `STF_${String(seqNumber).padStart(3, "0")}`;
}

export function formatStudentId(idOrDoc?: any, fallbackIndex?: number): string {
  if (!idOrDoc) {
    return fallbackIndex !== undefined ? generateStudentId(fallbackIndex + 1) : "STD_001";
  }
  if (typeof idOrDoc === "string") {
    if (idOrDoc.startsWith("STD_")) return idOrDoc;
    if (idOrDoc.startsWith("#STD_")) return idOrDoc.replace("#", "");
    if (idOrDoc.startsWith("STU-")) return idOrDoc.replace("STU-", "STD_");
    if (idOrDoc.startsWith("#STU-")) return idOrDoc.replace("#STU-", "STD_");
  }
  if (typeof idOrDoc === "object") {
    if (idOrDoc.studentId) {
      return formatStudentId(idOrDoc.studentId);
    }
  }
  if (fallbackIndex !== undefined) {
    return generateStudentId(fallbackIndex + 1);
  }
  const str = String(idOrDoc?._id || idOrDoc?.id || idOrDoc);
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    const num = (parseInt(str.slice(-4), 16) % 999) + 1;
    return generateStudentId(num);
  }
  return "STD_001";
}

export function formatStaffId(idOrDoc?: any, fallbackIndex?: number): string {
  if (!idOrDoc) {
    return fallbackIndex !== undefined ? generateStaffId(fallbackIndex + 1) : "STF_001";
  }
  if (typeof idOrDoc === "string") {
    if (idOrDoc.startsWith("STF_")) return idOrDoc;
    if (idOrDoc.startsWith("#STF_")) return idOrDoc.replace("#", "");
    if (idOrDoc.startsWith("TEA-")) return idOrDoc.replace("TEA-", "STF_");
    if (idOrDoc.startsWith("#TEA-")) return idOrDoc.replace("#TEA-", "STF_");
  }
  if (typeof idOrDoc === "object") {
    if (idOrDoc.staffId || idOrDoc.teacherId) {
      return formatStaffId(idOrDoc.staffId || idOrDoc.teacherId);
    }
  }
  if (fallbackIndex !== undefined) {
    return generateStaffId(fallbackIndex + 1);
  }
  const str = String(idOrDoc?._id || idOrDoc?.id || idOrDoc);
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    const num = (parseInt(str.slice(-4), 16) % 999) + 1;
    return generateStaffId(num);
  }
  return "STF_001";
}
