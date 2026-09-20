import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Structathon 2026 — Competitive Exam Platform",
  description:
    "Official platform for Data Structathon 2026 — a competitive event featuring timed MCQ quizzes and algorithmic coding rounds for engineering teams.",
  openGraph: {
    title: "Data Structathon 2026",
    description: "Compete in Round 1 MCQ Quiz and Round 2 Coding Challenge.",
    type: "website",
  },
  robots: { index: false, follow: false }, // Private event — no search indexing
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
