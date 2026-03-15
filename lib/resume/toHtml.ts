import { parseResume, ResumeBlock } from "./parser";

// ─── Constants ─────────────────────────────────────────────────────────────

const DATE_LINE_RE =
  /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{4}|\d{4}\s*[-–]\s*(\d{4}|present|current)/i;

/** Sections that belong in the left sidebar */
const SIDEBAR_SECTIONS = new Set([
  "SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES", "KEY SKILLS",
  "AREAS OF EXPERTISE", "TECHNOLOGIES", "TECH STACK", "TOOLS",
  "TOOLS & TECHNOLOGIES", "COMPETENCIES", "CERTIFICATIONS",
  "CERTIFICATION", "LICENSES", "CREDENTIALS", "LANGUAGES",
  "INTERESTS", "HOBBIES",
]);

const SUMMARY_SECTIONS = new Set([
  "PROFESSIONAL SUMMARY", "SUMMARY", "OBJECTIVE", "PROFILE", "ABOUT",
]);

// ─── Text helpers ──────────────────────────────────────────────────────────

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** **bold** → <strong>  *italic* → <em> */
function rich(text: string): string {
  return escape(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function isDate(b: ResumeBlock)   { return b.type === "text" && DATE_LINE_RE.test(b.text); }
function isBold(b: ResumeBlock)   { return b.type === "text" && /\*\*[^*]+\*\*/.test(b.text); }
function isTitle(b: ResumeBlock)  { return b.type === "text" && /^\*[^*]+\*$/.test(b.text.trim()); }

// ─── Chip renderer ─────────────────────────────────────────────────────────

function chips(raw: string): string {
  return raw
    .split(/[,;·|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<span class="chip">${escape(s)}</span>`)
    .join("");
}

// ─── Contact icon detector ─────────────────────────────────────────────────

function contactIcon(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("@"))           return svgIcon("email");
  if (t.includes("linkedin"))    return svgIcon("linkedin");
  if (t.includes("github"))      return svgIcon("github");
  if (/^\+?[\d\s\-()+]{7,}/.test(text.trim())) return svgIcon("phone");
  return svgIcon("web");
}

function svgIcon(type: string): string {
  const paths: Record<string, string> = {
    email:    "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    phone:    "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z",
    linkedin: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
    github:   "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
    web:      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  };
  const d = paths[type] ?? paths.web;
  return `<svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;
}

// ─── Block splitter ─────────────────────────────────────────────────────────

function splitColumns(blocks: ResumeBlock[]): {
  sidebar: ResumeBlock[];
  main: ResumeBlock[];
} {
  const sidebar: ResumeBlock[] = [];
  const main: ResumeBlock[] = [];
  let inSidebar = false;

  for (const b of blocks) {
    if (b.type === "section") inSidebar = SIDEBAR_SECTIONS.has(b.text);
    (inSidebar ? sidebar : main).push(b);
  }
  return { sidebar, main };
}

// ─── Block renderer ────────────────────────────────────────────────────────

function renderBlocks(blocks: ResumeBlock[], sidebar = false): string {
  const parts: string[] = [];
  let i = 0;
  let section = "";

  while (i < blocks.length) {
    const b = blocks[i];
    const inSkills = SIDEBAR_SECTIONS.has(section);
    const inSummary = SUMMARY_SECTIONS.has(section);

    // ── Bullets ────────────────────────────────────────────────────────
    if (b.type === "bullet") {
      if (inSkills) {
        // Collect all consecutive bullets → flat chip grid
        const raws: string[] = [];
        while (i < blocks.length && blocks[i].type === "bullet") {
          raws.push(blocks[i].text);
          i++;
        }
        const allChips = raws
          .flatMap((r) => r.split(/[,;·|]/).map((s) => s.trim()).filter(Boolean))
          .map((s) => `<span class="chip">${escape(s)}</span>`)
          .join("");
        parts.push(`<div class="chip-grid">${allChips}</div>`);
      } else {
        const items: string[] = [];
        while (i < blocks.length && blocks[i].type === "bullet") {
          items.push(`<li>${rich(blocks[i].text)}</li>`);
          i++;
        }
        parts.push(`<ul>${items.join("")}</ul>`);
      }
      continue;
    }

    switch (b.type) {
      // ── Section header ───────────────────────────────────────────────
      case "section": {
        section = b.text;
        const cls = sidebar ? "sh sh-side" : "sh";
        parts.push(`<div class="${cls}"><span>${escape(b.text)}</span></div>`);
        break;
      }

      // ── Text ─────────────────────────────────────────────────────────
      case "text": {
        // Skills section: "Category: a, b, c" → label row + chips
        if (inSkills) {
          const m = b.text.match(/^([^:]{1,40}):\s*(.+)$/);
          if (m) {
            parts.push(
              `<div class="cat-row">` +
                `<div class="cat-label">${escape(m[1])}</div>` +
                `<div class="chip-grid">${chips(m[2])}</div>` +
                `</div>`
            );
          } else {
            const c = chips(b.text);
            parts.push(c ? `<div class="chip-grid">${c}</div>` : `<div class="st">${rich(b.text)}</div>`);
          }
          break;
        }

        // Bold line = company
        if (isBold(b)) {
          const next = blocks[i + 1];
          const nn   = blocks[i + 2];
          if (next && isDate(next)) {
            const hasTitle = nn && isTitle(nn);
            const titleHtml = hasTitle
              ? `<div class="role">${rich(nn!.text)}</div>` : "";
            parts.push(
              `<div class="entry-head">` +
                `<div class="company">${rich(b.text)}</div>` +
                `<div class="date">${escape(next.text)}</div>` +
                `</div>` + titleHtml
            );
            i += hasTitle ? 3 : 2;
            continue;
          }
          parts.push(`<div class="company">${rich(b.text)}</div>`);
          break;
        }

        if (isDate(b))  { parts.push(`<div class="date standalone">${escape(b.text)}</div>`); break; }
        if (isTitle(b)) { parts.push(`<div class="role">${rich(b.text)}</div>`); break; }

        // Professional summary gets a special wrapper
        if (inSummary) {
          parts.push(`<p class="summary-para">${rich(b.text)}</p>`);
          break;
        }

        parts.push(`<div class="st">${rich(b.text)}</div>`);
        break;
      }

      default: break;
    }

    i++;
  }

  return parts.join("\n");
}

// ─── Main export ────────────────────────────────────────────────────────────

export function resumeToHtml(text: string, photo?: string | null): string {
  const blocks = parseResume(text);

  const nameBlock     = blocks.find((b) => b.type === "name");
  const contactBlocks = blocks.filter((b) => b.type === "contact");
  const bodyBlocks    = blocks.filter((b) => b.type !== "name" && b.type !== "contact");

  const contactHtml = contactBlocks
    .map((b) => `<span class="ci">${contactIcon(b.text)}<span>${escape(b.text)}</span></span>`)
    .join('<span class="csep">&middot;</span>');

  const { sidebar, main } = splitColumns(bodyBlocks);
  const hasSidebar = sidebar.length > 0;
  const hasPhoto   = Boolean(photo);

  const sidebarHtml = hasSidebar ? renderBlocks(sidebar, true) : "";
  const mainHtml    = renderBlocks(main, false);

  const contentHtml = hasSidebar
    ? `<div class="layout">
        <aside class="sidebar">${sidebarHtml}</aside>
        <main class="main">${mainHtml}</main>
       </div>`
    : `<div class="solo">${mainHtml}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet"/>
<style>
/* ── Reset ─────────────────────────────────────────── */
*{margin:0;padding:0;box-sizing:border-box;}

/* ── Page & body ───────────────────────────────────── */
body{
  font-family:'Inter','Helvetica Neue',Arial,sans-serif;
  font-size:9.5pt;
  line-height:1.6;
  color:#1e293b;
  /* sidebar colour fills the full document height naturally */
  background:linear-gradient(to right, #f0f4ff 29%, #ffffff 29%);
}
@page{margin:0;size:Letter;}

/* ── HEADER BAND ───────────────────────────────────── */
.hband{
  position:relative;
  background:linear-gradient(135deg,#0b1320 0%,#162c5e 55%,#1e3a8a 100%);
  padding:0.48in 0.9in 0.36in;
  text-align:center;
}
${hasPhoto ? `.hband{padding-right:calc(0.9in + 100px);padding-left:calc(0.9in + 100px);}` : ""}

.hname{
  font-family:'Playfair Display',Georgia,serif;
  font-size:26pt;
  font-weight:700;
  color:#fff;
  letter-spacing:0.5px;
  line-height:1.15;
  margin-bottom:8px;
}
.hcontact{
  display:flex;
  flex-wrap:wrap;
  justify-content:center;
  gap:6px 14px;
  font-size:8pt;
}
.ci{
  display:inline-flex;
  align-items:center;
  gap:4px;
  color:#bfdbfe;
  font-weight:500;
}
.contact-icon{
  width:10px;height:10px;
  opacity:.75;
  flex-shrink:0;
}
.csep{color:rgba(255,255,255,.2);font-size:9pt;}

/* Profile photo */
.photo{
  position:absolute;
  top:50%;right:0.9in;
  transform:translateY(-50%);
  width:82px;height:82px;
  border-radius:50%;
  object-fit:cover;
  object-position:center top;
  border:2px solid rgba(255,255,255,.35);
}

/* ── ACCENT STRIPE ─────────────────────────────────── */
.stripe{
  height:4px;
  background:linear-gradient(to right,#1d4ed8,#60a5fa,#1d4ed8);
}

/* ── TWO-COLUMN LAYOUT ─────────────────────────────── */
.layout{
  display:grid;
  grid-template-columns:29% 1fr;
}

/* Sidebar */
.sidebar{
  /* background comes from body gradient — no bg needed here */
  border-right:1px solid #dde8f5;
  padding:22px 16px 40px 0.9in;
}

/* Main */
.main{
  padding:22px 0.9in 40px 22px;
}

/* Solo (no sidebar) */
.solo{
  padding:22px 0.9in;
}

/* ── SECTION HEADERS (main) ────────────────────────── */
.sh{
  display:flex;
  align-items:center;
  gap:8px;
  margin-top:24px;
  margin-bottom:10px;
  padding-bottom:4px;
  border-bottom:1px solid #e2e8f0;
  page-break-after:avoid;
}
.sh::before{
  content:'';
  display:inline-block;
  width:3px;height:14px;
  background:#1d4ed8;
  border-radius:2px;
  flex-shrink:0;
}
.sh>span{
  font-size:7.5pt;
  font-weight:700;
  letter-spacing:2.5px;
  text-transform:uppercase;
  color:#0f172a;
}

/* Sidebar section headers */
.sh-side{
  border-bottom:1.5px solid #1d4ed8;
  margin-top:20px;
  margin-bottom:9px;
}
.sh-side::before{display:none;}
.sh-side>span{
  font-size:7pt;
  color:#1d4ed8;
  letter-spacing:2px;
}

/* ── EXPERIENCE ENTRIES ────────────────────────────── */
.entry-head{
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  gap:8px;
  margin-top:13px;
  margin-bottom:1px;
  page-break-after:avoid;
}
.company{
  font-size:10.5pt;
  font-weight:700;
  color:#0f172a;
  flex:1;
  margin-top:13px;
  page-break-after:avoid;
}
.entry-head .company{margin:0;}

.date{
  font-size:8pt;
  font-style:italic;
  color:#64748b;
  white-space:nowrap;
  flex-shrink:0;
}
.date.standalone{margin-bottom:2px;}

.role{
  font-size:9.5pt;
  font-style:italic;
  font-weight:500;
  color:#1d4ed8;
  margin-top:1px;
  margin-bottom:3px;
}

/* ── BODY TEXT ─────────────────────────────────────── */
.st{
  font-size:9.5pt;
  color:#374151;
  margin-bottom:3px;
  line-height:1.55;
}

/* ── PROFESSIONAL SUMMARY ──────────────────────────── */
.summary-para{
  font-size:9.5pt;
  color:#374151;
  line-height:1.7;
  margin-bottom:4px;
  padding-left:12px;
  border-left:3px solid #dde8f5;
}

/* ── BULLET LIST ───────────────────────────────────── */
ul{
  margin:5px 0 8px 16px;
  padding:0;
}
li{
  font-size:9.5pt;
  color:#374151;
  margin-bottom:3.5px;
  padding-left:3px;
  line-height:1.55;
}
li::marker{color:#94a3b8;}

/* ── SKILLS / CHIPS ────────────────────────────────── */
.cat-row{
  margin-bottom:8px;
}
.cat-label{
  font-size:7.5pt;
  font-weight:700;
  color:#0f172a;
  text-transform:uppercase;
  letter-spacing:0.5px;
  margin-bottom:4px;
}
.chip-grid{
  display:flex;
  flex-wrap:wrap;
  gap:4px;
  margin-bottom:8px;
}
.cat-row .chip-grid{margin-bottom:0;}

.chip{
  display:inline-block;
  background:#fff;
  color:#1d4ed8;
  border:1px solid #bfdbfe;
  border-radius:4px;
  padding:2px 8px;
  font-size:8pt;
  font-weight:500;
  white-space:nowrap;
  line-height:1.6;
}
/* Sidebar chips slightly smaller */
.sidebar .chip{
  font-size:7.5pt;
  padding:1.5px 6px;
}

/* ── INLINE ─────────────────────────────────────────── */
strong{font-weight:700;color:#0f172a;}
em{font-style:italic;color:inherit;}
</style>
</head>
<body>

<div class="hband">
  ${hasPhoto ? `<img class="photo" src="${photo}" alt=""/>` : ""}
  ${nameBlock ? `<div class="hname">${escape(nameBlock.text.replace(/\*\*/g, ""))}</div>` : ""}
  ${contactHtml ? `<div class="hcontact">${contactHtml}</div>` : ""}
</div>

<div class="stripe"></div>

${contentHtml}

</body>
</html>`;
}
