/**
 * Collapse multiple whitespace/newlines into single spaces and trim.
 */
export function cleanText(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Truncate text to a maximum character length, appending ellipsis if cut.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Count approximate word count.
 */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
