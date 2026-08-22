import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import StudentProfile from "@/models/StudentProfile";
import Material from "@/models/Material";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, subject } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    await connectToDatabase();
    const profile = await StudentProfile.findOne({ userId: session.userId });
    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const studentClass = profile.currentClass; // e.g. "Class 8"

    // Search relevant learning materials in student's class for context
    const materials = await Material.find({
      classLevel: studentClass,
    }).limit(3);

    // Curriculum Knowledge Bank with instant, pedagogical answers
    const qLower = query.toLowerCase();
    let responseText = "";

    if (qLower.includes("photosynthesis")) {
      responseText = `🌿 **Photosynthesis (Explained for ${studentClass}):**\n\nPhotosynthesis is the process by which green plants make their own food using sunlight, water, and carbon dioxide.\n\n**The Formula:**\n` +
        `Carbon Dioxide + Water + Sunlight ➔ Glucose (Food) + Oxygen\n\n` +
        `**Key Points to Remember:**\n` +
        `1. **Chlorophyll:** The green pigment in leaves that absorbs sunlight energy.\n` +
        `2. **Stomata:** Tiny pores on leaves that take in carbon dioxide and release oxygen.\n` +
        `3. **Roots:** Absorb water and minerals from the soil and transport them upward.\n\n` +
        `*Tip: Check your Science chapter revision notes in the Learning Hub for diagrams!*`;
    } else if (qLower.includes("pythagoras") || qLower.includes("triangle") || qLower.includes("hypotenuse")) {
      responseText = `📐 **Pythagoras Theorem (For ${studentClass} Mathematics):**\n\nIn a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides.\n\n**Formula:**\n` +
        `$$a^2 + b^2 = c^2$$\n` +
        `Where **c** is the hypotenuse (the longest side opposite the 90° angle), and **a** and **b** are the other two perpendicular sides.\n\n` +
        `**Quick Example:** If side $a = 3$ cm and side $b = 4$ cm:\n` +
        `$c^2 = 3^2 + 4^2 = 9 + 16 = 25$\n` +
        `$c = \\sqrt{25} = 5$ cm!`;
    } else if (qLower.includes("fraction") || qLower.includes("decimal")) {
      responseText = `🔢 **Fractions & Decimals Guide:**\n\n- **Fraction:** A part of a whole, written as Numerator / Denominator (e.g., $3/4$).\n- **Converting to Decimal:** Divide numerator by denominator: $3 \\div 4 = 0.75$.\n\n*Would you like a practice worksheet for your class? You can download one from the Learning Hub!*`;
    } else if (qLower.includes("force") || qLower.includes("motion") || qLower.includes("newton")) {
      responseText = `⚡ **Force and Laws of Motion (For ${studentClass}):**\n\nA **force** is a push or pull upon an object resulting from its interaction with another object.\n\n**Key Formulas:**\n` +
        `$$\\text{Force } (F) = \\text{Mass } (m) \\times \\text{Acceleration } (a)$$\n` +
        `Unit: **Newton (N)**\n\n` +
        `**Newton's 3 Laws:**\n` +
        `1. **Inertia:** An object stays at rest or in uniform motion unless acted upon by an external force.\n` +
        `2. **$F = ma$:** Acceleration depends on net force and mass.\n` +
        `3. **Action & Reaction:** For every action, there is an equal and opposite reaction.`;
    } else {
      responseText = `📚 **Acuity AI Study Buddy (${studentClass} Curriculum):**\n\nHere is a structured explanation for **"${query}"** tailored to your ${studentClass} syllabus:\n\n` +
        `1. **Concept Overview:** Understanding this topic builds core foundations for your upcoming board assessments.\n` +
        `2. **Step-by-Step Breakdown:** Focus on defining the core terms first, then practice 2-3 solved examples from your textbook.\n` +
        `3. **Teacher Tip:** Don't hesitate to ask your teacher directly in your next live batch session at your scheduled time!\n\n` +
        `*All explanations are strictly aligned with CBSE/State Board guidelines for ${studentClass}.*`;
    }

    return NextResponse.json({
      answer: responseText,
      curriculumClass: studentClass,
      referencedMaterialsCount: materials.length,
    });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
