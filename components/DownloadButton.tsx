"use client";

import { useState } from "react";

interface DownloadButtonProps {
  text: string;
  filename: string;
  pdfUrl?: string | null;
  photo?: string | null;
}

export default function DownloadButton({ text, filename, pdfUrl, photo }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = buildFilename(filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, filename, photo }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "PDF generation failed.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? <Spinner /> : <DownloadIcon />}
      {loading ? "Generating PDF…" : "Download PDF"}
    </button>
  );
}

function buildFilename(original: string): string {
  return original.replace(/\.(pdf|docx|txt)$/i, "") + "-optimized.pdf";
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}
