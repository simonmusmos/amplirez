import { getBrowser } from "@/lib/browser";
import { cleanText, truncateText } from "@/utils/text";

const MIN_DESCRIPTION_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 8000;

const JOB_DESCRIPTION_SELECTORS = [
  "[data-testid*='job-description']",
  "[class*='job-description']",
  "[id*='job-description']",
  "[class*='jobDescription']",
  "[id*='jobDescription']",
  "[class*='job-details']",
  "[class*='description']",
  "article",
  "main",
  ".content",
  "#content",
];

/**
 * Scrape a job posting URL using a stealth headless browser.
 * Bypasses most bot-detection (Cloudflare, Indeed, LinkedIn, etc.).
 */
export async function scrapeJobDescription(url: string): Promise<string> {
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Try specific selectors first
    for (const selector of JOB_DESCRIPTION_SELECTORS) {
      try {
        const text = await page.$eval(selector, (el: Element) => el.textContent ?? "");
        const cleaned = cleanText(text);
        if (cleaned.length >= MIN_DESCRIPTION_LENGTH) {
          return truncateText(cleaned, MAX_DESCRIPTION_LENGTH);
        }
      } catch {
        // Selector not present on this page — try next
      }
    }

    // Fallback: full visible page text
    const bodyText = await page.evaluate(() => document.body.innerText);
    const cleaned = cleanText(bodyText);

    if (cleaned.length < MIN_DESCRIPTION_LENGTH) {
      throw new Error(
        "Could not extract job description from this URL. " +
          'Try switching to "Paste description" instead.'
      );
    }

    return truncateText(cleaned, MAX_DESCRIPTION_LENGTH);
  } finally {
    await browser.close();
  }
}
