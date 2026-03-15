import { NextRequest, NextResponse } from "next/server";
import { parseResume } from "@/lib/parser/resumeParser";
import { scrapeJobDescription } from "@/lib/scraper/jobScraper";
import { optimizeResume } from "@/lib/ai/claude";
import { extractPhotoFromPdf } from "@/lib/resume/extractPhoto";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    const jobUrl = formData.get("jobUrl") as string | null;
    const jobText = formData.get("jobText") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided." }, { status: 400 });
    }

    if (!jobUrl && !jobText) {
      return NextResponse.json(
        { error: "Provide either a job URL or paste the job description." },
        { status: 400 }
      );
    }

    // Validate file type
    const filename = file.name;
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext ?? "")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX." },
        { status: 400 }
      );
    }

    // Parse resume
    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeText = await parseResume(buffer, filename);

    // Try to extract profile photo (PDF only; DOCX photos are rare)
    const photo = ext === "pdf" ? extractPhotoFromPdf(buffer) : null;

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from the resume. Is it a scanned image?" },
        { status: 422 }
      );
    }

    // Get job description — URL scrape or raw paste
    let jobDescription: string;
    if (jobText && jobText.trim().length > 50) {
      jobDescription = jobText.trim();
    } else if (jobUrl) {
      try {
        new URL(jobUrl);
      } catch {
        return NextResponse.json({ error: "Invalid job URL format." }, { status: 400 });
      }
      jobDescription = await scrapeJobDescription(jobUrl);
    } else {
      return NextResponse.json(
        { error: "Job description is too short. Please paste more content." },
        { status: 400 }
      );
    }

    const optimizedText = await optimizeResume(resumeText, jobDescription);

    return NextResponse.json({
      originalText: resumeText,
      optimizedText,
      jobDescription,
      filename,
      photo,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[/api/optimize]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
