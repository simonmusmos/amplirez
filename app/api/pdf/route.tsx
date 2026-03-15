import { NextRequest, NextResponse } from "next/server";
import { getBrowser } from "@/lib/browser";
import { resumeToHtml } from "@/lib/resume/toHtml";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { text, filename, photo } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing resume text." }, { status: 400 });
    }

    const html = resumeToHtml(text, photo ?? null);
    const browser = await getBrowser();

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdf = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${buildFilename(filename ?? "resume.pdf")}"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed.";
    console.error("[/api/pdf]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildFilename(original: string): string {
  return original.replace(/\.(pdf|docx|txt)$/i, "") + "-optimized.pdf";
}
