"use client";

import { useEffect, useRef, useState } from "react";
import { wordCount } from "@/utils/text";
import PdfCanvasViewer from "@/components/PdfCanvasViewer";

interface ResumeComparisonProps {
  originalFile: File;
  optimizedText: string;
  filename: string;
  photo?: string | null;
  onPdfReady?: (url: string) => void;
}

type Tab = "original" | "optimized" | "side-by-side";

export default function ResumeComparison({
  originalFile,
  optimizedText,
  filename,
  photo,
  onPdfReady,
}: ResumeComparisonProps) {
  const [tab, setTab] = useState<Tab>("side-by-side");

  // Actual PDFs — solo tabs + download
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [optimizedPdfUrl, setOptimizedPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const optimizedPdfRef = useRef<string | null>(null);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncingScrollRef = useRef(false);

  // Original PDF (uploaded file)
  useEffect(() => {
    const url = URL.createObjectURL(originalFile);
    setOriginalPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalFile]);

  // Optimized PDF — download + solo tab
  useEffect(() => {
    let cancelled = false;
    setPdfLoading(true);
    setPdfError(null);
    fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: optimizedText, filename, photo }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "PDF failed.");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        optimizedPdfRef.current = url;
        setOptimizedPdfUrl(url);
        onPdfReady?.(url);
      })
      .catch((err) => { if (!cancelled) setPdfError(err.message); })
      .finally(() => { if (!cancelled) setPdfLoading(false); });
    return () => {
      cancelled = true;
      if (optimizedPdfRef.current) { URL.revokeObjectURL(optimizedPdfRef.current); optimizedPdfRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optimizedText, filename]);

  const syncScroll = (source: "left" | "right") => {
    if (syncingScrollRef.current) return;

    const sourceEl = source === "left" ? leftRef.current : rightRef.current;
    const targetEl = source === "left" ? rightRef.current : leftRef.current;
    if (!sourceEl || !targetEl) return;

    const sourceMax = sourceEl.scrollHeight - sourceEl.clientHeight;
    const targetMax = targetEl.scrollHeight - targetEl.clientHeight;
    const ratio = sourceMax > 0 ? sourceEl.scrollTop / sourceMax : 0;

    syncingScrollRef.current = true;
    targetEl.scrollTop = targetMax > 0 ? ratio * targetMax : 0;
    requestAnimationFrame(() => {
      syncingScrollRef.current = false;
    });
  };

  const optWords = wordCount(optimizedText);

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-1">
          {(["side-by-side", "original", "optimized"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors -mb-px capitalize ${
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.replace("-", " ")}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 pb-2">
          Optimized: <strong className="text-blue-600">{optWords} words</strong>
        </span>
      </div>

      {/* ── Side-by-side: synchronized PDF canvases ── */}
      {tab === "side-by-side" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PdfCanvasViewer
            url={originalPdfUrl}
            label="Original Resume"
            loading={!originalPdfUrl}
            viewportRef={leftRef}
            onViewportScroll={() => syncScroll("left")}
          />
          <PdfCanvasViewer
            url={optimizedPdfUrl}
            label="Optimized Resume"
            accent
            loading={pdfLoading}
            error={pdfError}
            viewportRef={rightRef}
            onViewportScroll={() => syncScroll("right")}
          />
        </div>
      )}

      {/* ── Solo tabs: actual PDF viewer ── */}
      {tab === "original" && <PdfPanel url={originalPdfUrl} label="Original Resume" />}
      {tab === "optimized" && <PdfPanel url={optimizedPdfUrl} label="Optimized Resume" loading={pdfLoading} error={pdfError} accent />}
    </div>
  );
}

function PdfPanel({ url, label, loading, error, accent }: {
  url: string | null; label: string; loading?: boolean; error?: string | null; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border ${accent ? "border-blue-200" : "border-gray-200"} overflow-hidden flex flex-col`} style={{ height: "calc(100vh - 220px)", minHeight: 600 }}>
      <div className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b flex-shrink-0 ${accent ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
        {label}
      </div>
      <div className="flex-1 relative">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />Generating PDF…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500 px-4 text-center">{error}</div>
        ) : url ? (
          <iframe src={url} title={label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading…</div>
        )}
      </div>
    </div>
  );
}
