import { NextRequest, NextResponse } from "next/server";
import { resumeToHtml } from "@/lib/resume/toHtml";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, photo } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text." }, { status: 400 });
    }
    const html = resumeToHtml(text, photo ?? null);
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
