import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Outfit } from "next/font/google";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Acuity Tutoring — Live Online Learning Platform (Class 1 to 10)",
  description:
    "Production-grade online tutoring and live classroom management platform for CBSE & State Board students from Class 1 to 10. Automated attendance, late entry control, and expert faculty.",
  keywords: [
    "Online Tuition",
    "Live Classes",
    "Class 1 to 10 Tuition",
    "CBSE Tuition",
    "State Board Tuition",
    "Interactive Classroom",
    "EdTech Platform",
    "Acuity Tutoring",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
