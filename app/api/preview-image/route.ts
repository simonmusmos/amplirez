import { NextRequest, NextResponse } from "next/server";
import { getBrowser } from "@/lib/browser";
import { resumeToHtml } from "@/lib/resume/toHtml";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { text, photo } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text." }, { status: 400 });
    }

    const html = resumeToHtml(text, photo ?? null);
    const browser = await getBrowser();

    try {
      const page = await browser.newPage();
      // Render at Letter width so layout matches the generated PDF exactly
      await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: "networkidle0" });

      const screenshot = await page.screenshot({ fullPage: true });

      return new NextResponse(new Uint8Array(screenshot as Buffer), {
        headers: { "Content-Type": "image/png" },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview generation failed.";
    console.error("[/api/preview-image]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
