import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongoose";
import Inquiry from "@/models/Inquiry";
import SystemSettings from "@/models/SystemSettings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, classLevel, subject, message } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Please write your query message." }, { status: 400 });
    }

    await connectToDatabase();

    const inquiry = await Inquiry.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      classLevel: classLevel || "Class 10",
      subject: subject || "General Admissions & Curriculum",
      message: message.trim(),
      status: "NEW",
    });

    return NextResponse.json({
      success: true,
      message: "Your query has been sent successfully. Our academic counselor will email and call you shortly!",
      inquiryId: inquiry._id,
    });
  } catch (error: any) {
    console.error("Contact Inquiry Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send message." }, { status: 500 });
  }
}
