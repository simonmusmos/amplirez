import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amplirez — AI Resume Optimizer",
  description:
    "Optimize your resume for any job posting using AI. ATS-friendly, keyword-matched, and tailored in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
