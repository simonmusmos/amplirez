import { NextRequest, NextResponse } from "next/server";
import { scrapeJobDescription } from "@/lib/scraper/jobScraper";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid URL." }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    const jobDescription = await scrapeJobDescription(url);
    return NextResponse.json({ jobDescription });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to scrape job page.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
