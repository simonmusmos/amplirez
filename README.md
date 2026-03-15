# Amplirez

AI-powered resume optimizer. Upload your resume, paste a job URL, and get an ATS-optimized rewrite in seconds.

## How it works

1. User uploads a resume (PDF or DOCX)
2. User pastes a job listing URL
3. App scrapes the job description from that page
4. Both are sent to Claude AI with an optimization prompt
5. The rewritten resume is displayed side-by-side with the original
6. User downloads the optimized version as a `.txt` file

## Tech stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend   | Next.js API Routes (Node.js runtime) |
| AI        | Anthropic Claude API (`claude-opus-4-6`) |
| Parsing   | `pdf-parse` (PDF), `mammoth` (DOCX) |
| Scraping  | `cheerio` + native `fetch`        |

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd amplirez
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at [console.anthropic.com](https://console.anthropic.com/).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
amplirez/
├── app/
│   ├── page.tsx              # Main page (form → loading → results)
│   ├── layout.tsx            # Root layout + metadata
│   └── api/
│       ├── optimize/route.ts # Main endpoint: parse + scrape + AI
│       └── scrape/route.ts   # Standalone scrape endpoint
├── components/
│   ├── FileUpload.tsx        # Drag-and-drop file picker
│   ├── JobUrlInput.tsx       # URL input with validation
│   ├── ResumeComparison.tsx  # Side-by-side diff view
│   └── DownloadButton.tsx    # Client-side file download
├── lib/
│   ├── ai/claude.ts          # Claude API service
│   ├── parser/resumeParser.ts# PDF + DOCX text extraction
│   └── scraper/jobScraper.ts # Job description scraping
├── types/index.ts            # Shared TypeScript types
└── utils/text.ts             # Text helpers
```

## Roadmap (post-MVP)

- [ ] ATS match score (percentage match before/after)
- [ ] Cover letter generation from same inputs
- [ ] PDF output instead of plain text download
- [ ] Chrome extension to trigger from any job page
- [ ] User accounts + history
- [ ] Support for job description paste (fallback when scraping fails)
