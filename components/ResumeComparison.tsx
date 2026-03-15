"use client";

import { useEffect, useRef, useState } from "react";
import { wordCount } from "@/utils/text";

interface ResumeComparisonProps {
  originalFile: File;
  originalText: string;
  optimizedText: string;
  filename: string;
  photo?: string | null;
  onPdfReady?: (url: string) => void;
}

type Tab = "original" | "optimized" | "side-by-side";

export default function ResumeComparison({
  originalFile,
  originalText,
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

  // PNG screenshots — side-by-side sync preview
  const [originalImgUrl, setOriginalImgUrl] = useState<string | null>(null);
  const [optimizedImgUrl, setOptimizedImgUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState<string | null>(null);

  const optimizedPdfRef = useRef<string | null>(null);
  const originalImgRef = useRef<string | null>(null);
  const optimizedImgRef = useRef<string | null>(null);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

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

  // PNG screenshots — side-by-side (no PDF viewer chrome, perfect sync)
  useEffect(() => {
    let cancelled = false;
    setImgLoading(true);
    setImgError(null);

    const fetchImg = async (text: string, withPhoto: boolean) => {
      const res = await fetch("/api/preview-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, photo: withPhoto ? photo : null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Preview failed.");
      return URL.createObjectURL(await res.blob());
    };

    Promise.all([fetchImg(originalText, false), fetchImg(optimizedText, true)])
      .then(([orig, opt]) => {
        if (cancelled) return;
        originalImgRef.current = orig;
        optimizedImgRef.current = opt;
        setOriginalImgUrl(orig);
        setOptimizedImgUrl(opt);
      })
      .catch((err) => { if (!cancelled) setImgError(err.message); })
      .finally(() => { if (!cancelled) setImgLoading(false); });

    return () => {
      cancelled = true;
      [originalImgRef, optimizedImgRef].forEach((r) => {
        if (r.current) { URL.revokeObjectURL(r.current); r.current = null; }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalText, optimizedText]);

  const optWords = wordCount(optimizedText);

  const syncScroll = (source: HTMLDivElement, target: HTMLDivElement | null) => {
    if (syncing.current || !target) return;
    syncing.current = true;
    target.scrollTop = source.scrollTop;
    syncing.current = false;
  };

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

      {/* ── Side-by-side: PNG screenshots, perfect sync scroll ── */}
      {tab === "side-by-side" && (
        imgLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500" style={{ height: 700 }}>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
            Generating preview…
          </div>
        ) : imgError ? (
          <div className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-sm text-red-500 px-6 text-center" style={{ height: 700 }}>
            {imgError}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { url: originalImgUrl, label: "Original Resume", ref: leftRef, onScroll: () => syncScroll(leftRef.current!, rightRef.current), accent: false },
              { url: optimizedImgUrl, label: "Optimized Resume", ref: rightRef, onScroll: () => syncScroll(rightRef.current!, leftRef.current), accent: true },
            ].map(({ url, label, ref, onScroll, accent }) => (
              <div key={label} className={`rounded-xl border ${accent ? "border-blue-200" : "border-gray-200"} overflow-hidden flex flex-col h-[700px]`}>
                <div className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b flex-shrink-0 ${accent ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {label}
                </div>
                <div ref={ref} onScroll={onScroll} className="overflow-y-auto flex-1">
                  {url
                    ? <img src={url} alt={label} style={{ width: "100%", display: "block" }} />  // eslint-disable-line @next/next/no-img-element
                    : <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading…</div>
                  }
                </div>
              </div>
            ))}
          </div>
        )
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
          <iframe src={url} className="w-full" style={{ height: "100%", border: "none", display: "block" }} title={label} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading…</div>
        )}
      </div>
    </div>
  );
}
