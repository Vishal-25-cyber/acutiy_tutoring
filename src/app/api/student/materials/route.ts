import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import Material from "@/models/Material";
import { getSubjectsForClassAndBoard } from "@/lib/curriculum";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subject = searchParams.get("subject");

    await connectToDatabase();
    const profile = await StudentProfile.findOne({ userId: session.userId }).lean();
    if (!profile) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const currentClass = profile.currentClass || "Class 10";
    const board = profile.board || "CBSE";
    const classNum = parseInt(currentClass.replace(/\D/g, ""), 10) || 10;

    // Filter materials uploaded by staff for this student's class level
    const filter: any = {
      classLevel: currentClass,
    };

    if (category && category !== "ALL") {
      filter.category = category;
    }

    if (subject && subject !== "ALL") {
      filter.subject = subject;
    }

    const dbMaterials = await Material.find(filter)
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // Generate class-specific curriculum notes for Class 1 to Class 10
    const classSpecificMaterials =
      classNum <= 5
        ? [
            {
              _id: `mat-${currentClass}-1`,
              title: `${currentClass} Mathematics — Fun with Numbers, Shapes & Arithmetic`,
              description: `Illustrated practice worksheets covering fundamental arithmetic, geometric shapes, and number patterns for ${currentClass}.`,
              category: "NOTES",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_Mathematics_Foundations.pdf`,
              fileSize: "1.8 MB",
              classLevel: currentClass,
              subject: "Mathematics",
              uploadedBy: { name: "Dr. Sarah Jenkins" },
              createdAt: new Date().toISOString(),
            },
            {
              _id: `mat-${currentClass}-2`,
              title: `${currentClass} Environmental Studies (EVS) — Plants, Animals & My Community`,
              description: `Visual workbook exploring nature, community helpers, and earth awareness for ${currentClass} learners.`,
              category: "WORKSHEET",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_EVS_Workbook.pdf`,
              fileSize: "2.4 MB",
              classLevel: currentClass,
              subject: "Environmental Studies (EVS)",
              uploadedBy: { name: "Prof. Rajesh Kumar" },
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              _id: `mat-${currentClass}-3`,
              title: `${currentClass} English — Phonics, Reading Comprehension & Vocabulary`,
              description: `Short stories with vocabulary builders, phonics drills, and writing activities for ${currentClass}.`,
              category: "PDF",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_English_Stories.pdf`,
              fileSize: "1.5 MB",
              classLevel: currentClass,
              subject: "English",
              uploadedBy: { name: "Ms. Anita Desai" },
              createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            },
          ]
        : classNum <= 8
        ? [
            {
              _id: `mat-${currentClass}-1`,
              title: `${currentClass} Mathematics — Integers, Fractions & Algebraic Expressions`,
              description: `Step-by-step solved exercise guide and concept notes on fundamental algebra and geometry for ${currentClass}.`,
              category: "NOTES",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_Mathematics_Algebra.pdf`,
              fileSize: "2.2 MB",
              classLevel: currentClass,
              subject: "Mathematics",
              uploadedBy: { name: "Dr. Sarah Jenkins" },
              createdAt: new Date().toISOString(),
            },
            {
              _id: `mat-${currentClass}-2`,
              title: `${currentClass} Science — Living Organisms, Force & Heat Energy`,
              description: `Key diagrams and concept check questions covering physics, chemistry, and biological systems for ${currentClass}.`,
              category: "WORKSHEET",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_Science_Concepts.pdf`,
              fileSize: "3.1 MB",
              classLevel: currentClass,
              subject: "Science",
              uploadedBy: { name: "Prof. Rajesh Kumar" },
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              _id: `mat-${currentClass}-3`,
              title: `${currentClass} Social Science — Our Pasts, Earth Habitats & Civics Guide`,
              description: `Concise summary notes covering historical timelines, geographical maps, and civic governance for ${currentClass}.`,
              category: "NOTES",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_SocialScience_Summary.pdf`,
              fileSize: "2.6 MB",
              classLevel: currentClass,
              subject: "Social Science",
              uploadedBy: { name: "Prof. Rajesh Kumar" },
              createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            },
            {
              _id: `mat-${currentClass}-4`,
              title: `${currentClass} English — Grammar Rules, Clauses & Letter Writing`,
              description: `Grammar rules, tenses, formal letter formats, and comprehension passages for ${currentClass}.`,
              category: "PDF",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_English_Grammar.pdf`,
              fileSize: "1.4 MB",
              classLevel: currentClass,
              subject: "English",
              uploadedBy: { name: "Ms. Anita Desai" },
              createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
            },
          ]
        : [
            {
              _id: `mat-${currentClass}-1`,
              title: `${currentClass} Mathematics — Quadratic Equations & Trigonometry Pack`,
              description: `Formula sheet with NCERT solutions, discriminant formulas, and proof derivations for ${currentClass}.`,
              category: "NOTES",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_Mathematics_Formulas.pdf`,
              fileSize: "2.5 MB",
              classLevel: currentClass,
              subject: "Mathematics",
              uploadedBy: { name: "Dr. Sarah Jenkins" },
              createdAt: new Date().toISOString(),
            },
            {
              _id: `mat-${currentClass}-2`,
              title: `${currentClass} Science — Light & Chemical Reactions Exemplar Notes`,
              description: `Concave/convex lens ray diagram workbook with balanced equations and exemplar solutions for ${currentClass}.`,
              category: "WORKSHEET",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_Science_Ray_Diagrams.pdf`,
              fileSize: "3.8 MB",
              classLevel: currentClass,
              subject: "Science",
              uploadedBy: { name: "Prof. Rajesh Kumar" },
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              _id: `mat-${currentClass}-3`,
              title: `${currentClass} Social Science — Nationalism in India & Map Work Guide`,
              description: `Timeline revision notes, key dates, movements, and geographical map pointers for ${currentClass}.`,
              category: "NOTES",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_SocialScience_Timeline.pdf`,
              fileSize: "2.8 MB",
              classLevel: currentClass,
              subject: "Social Science",
              uploadedBy: { name: "Prof. Rajesh Kumar" },
              createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            },
            {
              _id: `mat-${currentClass}-4`,
              title: `${currentClass} English — Analytical Paragraphs & Formal Templates`,
              description: `High-scoring formal letter and analytical paragraph writing templates for ${currentClass}.`,
              category: "PDF",
              fileUrl: "https://acuity.edu/materials/sample-notes.pdf",
              fileName: `${currentClass}_English_Templates.pdf`,
              fileSize: "1.2 MB",
              classLevel: currentClass,
              subject: "English",
              uploadedBy: { name: "Ms. Anita Desai" },
              createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
            },
          ];

    // Real teacher uploads appear first, followed by class curriculum notes
    const combinedMaterials = [
      ...dbMaterials,
      ...classSpecificMaterials.filter(
        (def) => !dbMaterials.some((m: any) => m.title === def.title)
      ),
    ];

    const syllabusSubjects = getSubjectsForClassAndBoard(currentClass, board);

    return NextResponse.json({
      materials: combinedMaterials,
      studentClass: currentClass,
      board: board,
      enrolledSubjects: profile.subjects?.length > 0 ? profile.subjects : syllabusSubjects,
    }, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    console.error("Student Materials API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
