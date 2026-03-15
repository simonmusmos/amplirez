export type ResumeBlock =
  | { type: "name"; text: string }
  | { type: "contact"; text: string }
  | { type: "section"; text: string }
  | { type: "bullet"; text: string }
  | { type: "text"; text: string };

const KNOWN_SECTIONS = new Set([
  "SUMMARY", "PROFESSIONAL SUMMARY", "OBJECTIVE", "PROFILE", "ABOUT",
  "EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "WORK HISTORY", "EMPLOYMENT",
  "EDUCATION", "ACADEMIC BACKGROUND", "ACADEMIC HISTORY",
  "SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES", "KEY SKILLS", "AREAS OF EXPERTISE",
  "PROJECTS", "PERSONAL PROJECTS", "KEY PROJECTS", "NOTABLE PROJECTS",
  "CERTIFICATIONS", "CERTIFICATION", "LICENSES", "CREDENTIALS",
  "AWARDS", "ACHIEVEMENTS", "ACCOMPLISHMENTS", "HONORS",
  "PUBLICATIONS", "RESEARCH", "LANGUAGES", "VOLUNTEER", "VOLUNTEERING",
  "INTERESTS", "HOBBIES", "ACTIVITIES", "REFERENCES",
]);

const BULLET_RE = /^[•\-\*◦▪·–—➤►▶→]\s+/;
const CONTACT_RE = /@|linkedin\.com|github\.com|\+?\d[\d\s\-().]{6,}\d|https?:\/\/|^www\./i;
// A line is a section header if it's all caps (letters, spaces, &, /, -)
const ALL_CAPS_RE = /^[A-Z][A-Z\s&\/\-:]{1,49}$/;

/**
 * Parse resume plain text into typed display blocks.
 * Works with AI-generated text that follows standard resume structure.
 */
export function parseResume(text: string): ResumeBlock[] {
  const lines = text.split("\n").map((l) => l.trim());
  const blocks: ResumeBlock[] = [];

  let nameFound = false;
  let firstSectionFound = false;

  for (const line of lines) {
    if (!line) continue;

    // Bullet point
    if (BULLET_RE.test(line)) {
      firstSectionFound = true;
      blocks.push({ type: "bullet", text: line.replace(BULLET_RE, "").trim() });
      continue;
    }

    // Section header: known keyword or ALL CAPS short line
    const upper = line.toUpperCase().trim();
    if (KNOWN_SECTIONS.has(upper) || (ALL_CAPS_RE.test(line) && line.length <= 45)) {
      firstSectionFound = true;
      blocks.push({ type: "section", text: upper });
      continue;
    }

    // First non-empty line = name (before any section found)
    if (!nameFound && !firstSectionFound) {
      // Skip if it looks like contact info
      if (!CONTACT_RE.test(line)) {
        blocks.push({ type: "name", text: line });
        nameFound = true;
        continue;
      }
    }

    // Contact info (appears near the top, before sections)
    if (!firstSectionFound && CONTACT_RE.test(line)) {
      blocks.push({ type: "contact", text: line });
      continue;
    }

    // Everything else
    blocks.push({ type: "text", text: line });
  }

  return blocks;
}
