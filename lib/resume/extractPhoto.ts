/**
 * Scans a PDF buffer for embedded JPEG images by locating SOI (FF D8 FF)
 * and EOI (FF D9) byte markers.  In JPEG, 0xFF bytes inside compressed data
 * are always stuffed with 0x00, so 0xFF D9 unambiguously marks the end of
 * image data — no false positives.
 *
 * Returns the largest JPEG found as a base64 data URI, or null if none.
 */
export function extractPhotoFromPdf(pdfBuffer: Buffer): string | null {
  const SOI = Buffer.from([0xff, 0xd8, 0xff]);
  const EOI = Buffer.from([0xff, 0xd9]);

  const candidates: { start: number; length: number }[] = [];
  let pos = 0;

  while (pos < pdfBuffer.length) {
    const start = pdfBuffer.indexOf(SOI, pos);
    if (start === -1) break;

    const eoiPos = pdfBuffer.indexOf(EOI, start + 3);
    if (eoiPos === -1) break;

    const end = eoiPos + 2;
    const length = end - start;

    // Skip tiny thumbnails (< 8 KB is unlikely to be a profile photo)
    if (length >= 8_000) {
      candidates.push({ start, length });
    }

    pos = end;
  }

  if (candidates.length === 0) return null;

  // Largest image is most likely the profile photo
  const best = candidates.reduce((a, b) => (b.length > a.length ? b : a));

  // Skip if it's unreasonably large (> 3 MB base64 would be ~4 MB in JSON)
  if (best.length > 3_000_000) return null;

  const jpeg = pdfBuffer.subarray(best.start, best.start + best.length);
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}
