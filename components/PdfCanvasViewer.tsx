"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

interface PdfCanvasViewerProps {
  url: string | null;
  label: string;
  accent?: boolean;
  loading?: boolean;
  error?: string | null;
  viewportRef?: RefObject<HTMLDivElement>;
  onViewportScroll?: () => void;
}

export default function PdfCanvasViewer({
  url,
  label,
  accent,
  loading,
  error,
  viewportRef,
  onViewportScroll,
}: PdfCanvasViewerProps) {
  const fallbackViewportRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const activeViewportRef = viewportRef ?? fallbackViewportRef;

  const [renderWidth, setRenderWidth] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const viewport = activeViewportRef.current;
    if (!viewport) return;

    const updateWidth = () => {
      const nextWidth = Math.max(0, viewport.clientWidth - 32);
      setRenderWidth((current) => (current === nextWidth ? current : nextWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [activeViewportRef]);

  useEffect(() => {
    if (!url || !renderWidth) return;

    let cancelled = false;
    const pdfUrl = url;

    async function renderPdf() {
      const container = pagesRef.current;
      if (!container) return;

      setRendering(true);
      setRenderError(null);
      container.replaceChildren();

      try {
        const pdfModuleUrl = "/pdf.mjs";
        const pdfjs = await import(/* webpackIgnore: true */ pdfModuleUrl);
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const deviceScale = window.devicePixelRatio || 1;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          if (cancelled) {
            loadingTask.destroy();
            return;
          }

          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const cssScale = renderWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: cssScale * deviceScale });

          const pageWrap = document.createElement("div");
          pageWrap.className = "mx-auto mb-4 w-fit overflow-hidden rounded-md bg-white shadow-sm";

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${Math.floor(baseViewport.width * cssScale)}px`;
          canvas.style.height = `${Math.floor(baseViewport.height * cssScale)}px`;
          canvas.style.display = "block";

          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas rendering is unavailable.");

          pageWrap.appendChild(canvas);
          container.appendChild(pageWrap);

          await page.render({ canvas, canvasContext: context, viewport }).promise;
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : "PDF preview failed.");
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    void renderPdf();

    return () => {
      cancelled = true;
      pagesRef.current?.replaceChildren();
    };
  }, [url, renderWidth]);

  const visibleLoading = Boolean(loading) || rendering;
  const visibleError = error ?? renderError;

  return (
    <div
      className={`rounded-xl border ${accent ? "border-blue-200" : "border-gray-200"} overflow-hidden flex flex-col`}
      style={{ height: 700 }}
    >
      <div
        className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b flex-shrink-0 ${
          accent
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-gray-50 text-gray-600 border-gray-200"
        }`}
      >
        {label}
      </div>

      <div
        ref={activeViewportRef}
        onScroll={onViewportScroll}
        className="flex-1 overflow-y-auto bg-gray-100 p-4"
      >
        {visibleLoading ? (
          <div className="flex h-full min-h-40 items-center justify-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
            Rendering PDF…
          </div>
        ) : visibleError ? (
          <div className="flex h-full min-h-40 items-center justify-center px-4 text-center text-sm text-red-500">
            {visibleError}
          </div>
        ) : (
          <div ref={pagesRef} />
        )}
      </div>
    </div>
  );
}
