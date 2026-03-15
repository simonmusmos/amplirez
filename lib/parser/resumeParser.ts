import path from "path";

/**
 * Extract plain text from a resume buffer.
 * Supports PDF and DOCX formats.
 */
export async function parseResume(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = path.extname(filename).toLowerCase();

  if (ext === ".pdf") {
    // Dynamic import avoids webpack bundling issues with pdf-parse
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(
    `Unsupported file format "${ext}". Please upload a PDF or DOCX file.`
  );
}
