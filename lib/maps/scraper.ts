/**
 * Lightweight homepage scraper.
 *
 * We are only allowed to scrape the company's own website (per Google Maps
 * ToS we never scrape google.com / maps.google.com). This module:
 *   - fetches the homepage HTML with a short timeout
 *   - extracts emails (mailto: + raw text)
 *   - extracts social links (linkedin / twitter / instagram / facebook / github)
 *   - extracts a small set of "company keywords" from <title>, meta description,
 *     and prominent headings for downstream relevance scoring
 *
 * No heavy DOM parsing dependency — Cheerio adds bundle weight and Next runs
 * fine without it. Regex is plenty for what we need.
 */

export interface ScrapedSite {
  ok: boolean
  status: number
  emails: string[]
  socials: {
    linkedin?: string
    twitter?: string
    instagram?: string
    facebook?: string
    github?: string
    youtube?: string
  }
  keywords: string[]
  title: string | null
  description: string | null
  finalUrl: string
  error?: string
}

const EMAIL_RE = /\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b/gi
const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i
const META_DESC_RE = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
const META_OG_DESC_RE = /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
const HEADING_RE = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi
const TAG_RE = /<[^>]+>/g

const SOCIAL_PATTERNS: Record<keyof ScrapedSite["socials"], RegExp> = {
  linkedin:  /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[^\s"'<>]+/i,
  twitter:   /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[A-Za-z0-9_]{1,30}(?:\/)?/i,
  instagram: /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.]{1,30}(?:\/)?/i,
  facebook:  /https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9.\-]+(?:\/)?/i,
  github:    /https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9\-]+(?:\/)?/i,
  youtube:   /https?:\/\/(?:www\.)?youtube\.com\/(?:c|channel|user|@)[^\s"'<>]+/i,
}

const STOP_EMAIL_DOMAINS = new Set([
  "sentry.io", "wixpress.com", "example.com", "domain.com", "email.com",
])

const STOP_WORDS = new Set([
  "the","and","for","with","you","your","our","this","that","from","are","not",
  "but","all","can","has","have","will","more","about","one","new","get","use",
  "any","like","just","when","they","them","their","what","who","why","how",
  "into","than","then","over","also","very","most","much","some","such","into",
  "home","page","contact","menu","login","sign","help","support",
])

function normalizeUrl(raw: string): string {
  if (!raw) return ""
  const trimmed = raw.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function htmlToText(html: string): string {
  return html.replace(TAG_RE, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim()
}

function extractKeywords(haystack: string, max = 12): string[] {
  const words = haystack
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 4 && w.length <= 20 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))

  const freq = new Map<string, number>()
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1)

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w)
}

/**
 * Scrape a company homepage. Always resolves — never throws — so callers can
 * fan it out across many sites without try/catch on every one.
 */
export async function scrapeWebsite(
  websiteUrl: string,
  opts: { timeoutMs?: number } = {},
): Promise<ScrapedSite> {
  const url = normalizeUrl(websiteUrl)
  const empty: ScrapedSite = {
    ok: false, status: 0, emails: [], socials: {}, keywords: [],
    title: null, description: null, finalUrl: url,
  }

  if (!url || !/^https?:\/\//i.test(url)) {
    return { ...empty, error: "Invalid URL" }
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 8000)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // Respectful UA — identify our app so site owners can recognise us.
        "User-Agent": "OutreachAI/1.0 (+https://outreach-ai.local; contact@outreach-ai.local)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.7",
      },
    })

    if (!res.ok) {
      return { ...empty, status: res.status, finalUrl: res.url, error: `HTTP ${res.status}` }
    }

    const ct = res.headers.get("content-type") ?? ""
    if (!ct.includes("html")) {
      return { ...empty, status: res.status, finalUrl: res.url, error: `Non-HTML content (${ct})` }
    }

    // Cap body to ~512KB to avoid pulling in massive single-page apps.
    const reader = res.body?.getReader()
    let html = ""
    if (reader) {
      const decoder = new TextDecoder()
      let total = 0
      const cap = 512 * 1024
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        total += value.byteLength
        html += decoder.decode(value, { stream: true })
        if (total >= cap) { try { await reader.cancel() } catch { /* ignore */ } break }
      }
    } else {
      html = await res.text()
    }

    // ── Emails ─────────────────────────────────────────────────────────────
    const rawEmails = (html.match(EMAIL_RE) ?? [])
      .map(e => e.toLowerCase())
      .filter(e => {
        const domain = e.split("@")[1]
        if (!domain) return false
        if (STOP_EMAIL_DOMAINS.has(domain)) return false
        // strip out obvious junk like .png, .jpg, .gif etc that get matched by greedy email regex
        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(e)) return false
        return true
      })
    const emails = [...new Set(rawEmails)].slice(0, 8)

    // ── Socials ────────────────────────────────────────────────────────────
    const socials: ScrapedSite["socials"] = {}
    for (const key of Object.keys(SOCIAL_PATTERNS) as (keyof ScrapedSite["socials"])[]) {
      const m = html.match(SOCIAL_PATTERNS[key])
      if (m) socials[key] = m[0]
    }

    // ── Title + description ───────────────────────────────────────────────
    const title = TITLE_RE.exec(html)?.[1]?.trim() ?? null
    const description =
      META_DESC_RE.exec(html)?.[1]?.trim()
      ?? META_OG_DESC_RE.exec(html)?.[1]?.trim()
      ?? null

    // ── Keywords (title + description + first 3 H1/H2) ─────────────────────
    const headings: string[] = []
    let h: RegExpExecArray | null
    let count = 0
    while ((h = HEADING_RE.exec(html)) && count < 3) {
      headings.push(htmlToText(h[1]))
      count++
    }
    const keywordSource = [title ?? "", description ?? "", ...headings].join(" ")
    const keywords = extractKeywords(keywordSource)

    return {
      ok: true,
      status: res.status,
      emails,
      socials,
      keywords,
      title,
      description,
      finalUrl: res.url,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed"
    return { ...empty, error: msg }
  } finally {
    clearTimeout(timer)
  }
}
