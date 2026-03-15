"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import JobUrlInput from "@/components/JobUrlInput";
import ResumeComparison from "@/components/ResumeComparison";
import DownloadButton from "@/components/DownloadButton";
import type { AppStep, OptimizeResult } from "@/types";

type JobInputMode = "url" | "paste";

export default function HomePage() {
  const [step, setStep] = useState<AppStep>("form");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobInputMode, setJobInputMode] = useState<JobInputMode>("url");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimizedPdfUrl, setOptimizedPdfUrl] = useState<string | null>(null);

  const hasResume = resumeFile !== null;
  const hasJob =
    jobInputMode === "url" ? isValidUrl(jobUrl) : jobText.trim().length > 50;
  const canSubmit = hasResume && hasJob;

  // Human-readable hint for what's still missing
  const blockingHint = !hasResume
    ? "Upload your resume to get started"
    : !hasJob
    ? jobInputMode === "url"
      ? "Enter a valid job URL to continue"
      : "Paste at least 50 characters of the job description"
    : null;

  const handleOptimize = async () => {
    if (!resumeFile) return;
    setError(null);
    setStep("loading");

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      if (jobInputMode === "url") {
        formData.append("jobUrl", jobUrl);
      } else {
        formData.append("jobText", jobText);
      }

      const res = await fetch("/api/optimize", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Optimization failed.");

      setResult(data as OptimizeResult);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStep("form");
    }
  };

  const handleReset = () => {
    setStep("form");
    setResumeFile(null);
    setJobUrl("");
    setJobText("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">Amplirez</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Beta
            </span>
          </div>
          {step === "result" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Start over
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">

        {/* ── FORM ── */}
        {step === "form" && (
          <>
            {/* Hero */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Land more interviews
              </h1>
              <p className="mt-2 text-base text-gray-500">
                Upload your resume and a job listing. We rewrite it to match
                the role — ATS-optimized in seconds.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Something went wrong</p>
                    <p className="mt-0.5 text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Step 1 — Resume */}
              <StepCard
                number={1}
                title="Upload your resume"
                done={hasResume}
                status={hasResume ? resumeFile!.name : "No file selected"}
              >
                <FileUpload onFileSelect={setResumeFile} selectedFile={resumeFile} />
              </StepCard>

              {/* Step 2 — Job */}
              <StepCard
                number={2}
                title="Add the job listing"
                done={hasJob}
                status={
                  hasJob
                    ? jobInputMode === "url"
                      ? jobUrl
                      : `${jobText.trim().length} characters pasted`
                    : "Not provided yet"
                }
              >
                {/* Mode tabs */}
                <div className="mb-3 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                  <ModeTab active={jobInputMode === "url"} onClick={() => setJobInputMode("url")}>
                    Job URL
                  </ModeTab>
                  <ModeTab active={jobInputMode === "paste"} onClick={() => setJobInputMode("paste")}>
                    Paste description
                  </ModeTab>
                </div>

                {jobInputMode === "url" ? (
                  <div className="flex flex-col gap-1.5">
                    <JobUrlInput value={jobUrl} onChange={setJobUrl} />
                    <p className="text-xs text-gray-400">
                      Indeed and LinkedIn block scrapers — use &quot;Paste description&quot; if you get an error.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <textarea
                      value={jobText}
                      onChange={(e) => setJobText(e.target.value)}
                      placeholder="Copy and paste the full job description here…"
                      rows={7}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400 resize-y"
                    />
                    <p className="text-xs text-gray-400">
                      {jobText.trim().length} / 50 characters minimum
                      {jobText.trim().length > 0 && jobText.trim().length < 50 && (
                        <span className="ml-1 text-amber-500 font-medium">
                          — need {50 - jobText.trim().length} more
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </StepCard>

              {/* Submit area */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleOptimize}
                  disabled={!canSubmit}
                  className={`w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-sm transition-all ${
                    canSubmit
                      ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.99] cursor-pointer"
                      : "bg-blue-300 cursor-not-allowed"
                  }`}
                >
                  Optimize Resume
                </button>

                {/* Blocking hint — shows exactly what's needed */}
                {blockingHint && (
                  <p className="text-center text-xs text-gray-400">
                    <span className="mr-1">⬆</span>
                    {blockingHint}
                  </p>
                )}

                {/* Checklist */}
                <div className="flex items-center justify-center gap-5 pt-1">
                  <ChecklistItem done={hasResume} label="Resume" />
                  <ChecklistItem done={hasJob} label="Job listing" />
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 pt-1 text-xs text-gray-400">
                <span>ATS-friendly output</span>
                <span>·</span>
                <span>Keyword matched</span>
                <span>·</span>
                <span>Facts kept accurate</span>
                <span>·</span>
                <span>Never stored</span>
              </div>
            </div>
          </>
        )}

        {/* ── LOADING ── */}
        {step === "loading" && (
          <div className="flex flex-col items-center gap-8 py-24">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-blue-50" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Optimizing your resume…</p>
              <p className="mt-1 text-sm text-gray-500">This usually takes 15–30 seconds</p>
            </div>

            <div className="w-full max-w-xs rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3">
                <LoadingStep label="Parsing your resume" state="done" />
                {jobInputMode === "url" && <LoadingStep label="Scraping job listing" state="done" />}
                <LoadingStep label="Rewriting with AI" state="active" />
                <LoadingStep label="Preparing your results" state="pending" />
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === "result" && result && (
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Your optimized resume is ready</h2>
                </div>
                <p className="mt-1 text-sm text-gray-500 pl-9">
                  Review the changes below, then download your PDF.
                </p>
              </div>
              <DownloadButton text={result.optimizedText} filename={result.filename} pdfUrl={optimizedPdfUrl} photo={result.photo} />
            </div>

            {/* Comparison */}
            <ResumeComparison
              originalFile={resumeFile!}
              originalText={result.originalText}
              optimizedText={result.optimizedText}
              filename={result.filename}
              photo={result.photo}
              onPdfReady={setOptimizedPdfUrl}
            />

            {/* Job description accordion */}
            <details className="group rounded-xl border border-gray-200 bg-white">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Job description used for optimization
                <svg className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <pre className="overflow-auto border-t border-gray-100 px-4 pb-4 pt-3 text-xs text-gray-500 whitespace-pre-wrap font-sans max-h-64">
                {result.jobDescription}
              </pre>
            </details>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        Amplirez · Powered by OpenAI · Resume text is never stored
      </footer>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepCard({
  number,
  title,
  done,
  status,
  children,
}: {
  number: number;
  title: string;
  done: boolean;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border bg-white p-6 shadow-sm transition-colors ${done ? "border-green-200" : "border-gray-200"}`}>
      {/* Card header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
            done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"
          }`}>
            {done ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              number
            )}
          </div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
        {/* Status pill */}
        <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium truncate max-w-[180px] ${
          done ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          {done ? status : "Not set"}
        </span>
      </div>

      {/* Card body */}
      {children}
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${done ? "text-green-600" : "text-gray-400"}`}>
      {done ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <div className="h-3.5 w-3.5 rounded-full border-2 border-current" />
      )}
      {label}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
        active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingStep({ label, state }: { label: string; state: "done" | "active" | "pending" }) {
  return (
    <div className="flex items-center gap-3">
      {state === "done" && (
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
          <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {state === "active" && (
        <div className="h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      )}
      {state === "pending" && (
        <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-200" />
      )}
      <span className={`text-sm ${
        state === "done" ? "text-gray-600" :
        state === "active" ? "font-medium text-blue-700" :
        "text-gray-400"
      }`}>
        {label}
      </span>
    </div>
  );
}

function isValidUrl(str: string): boolean {
  try { new URL(str); return true; } catch { return false; }
}
