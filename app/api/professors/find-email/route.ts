import { createClient, createServiceClient } from "@/lib/supabase/server"
import { isGeminiKey } from "@/lib/ai/detect-key"

// ─── Email regex ──────────────────────────────────────────────────────────────
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch a page and return its text content (HTML stripped down) */
async function fetchPage(url: string, timeoutMs = 8000): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; InternLink/1.0; +https://internlink.app)",
        "Accept": "text/html,application/xhtml+xml",
      },
    })
    clearTimeout(t)
    if (!res.ok) return ""
    const html = await res.text()
    return html
  } catch {
    clearTimeout(t)
    return ""
  }
}

/** Extract all email addresses from HTML/text */
function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_RE) || []
  // Filter out common false positives (image files, CSS, JS, etc.)
  return [...new Set(matches)].filter(e => {
    const lower = e.toLowerCase()
    return !lower.endsWith(".png") && !lower.endsWith(".jpg") &&
           !lower.endsWith(".gif") && !lower.endsWith(".svg") &&
           !lower.endsWith(".css") && !lower.endsWith(".js") &&
           !lower.includes("example.com") && !lower.includes("sentry") &&
           !lower.includes("webpack") && !lower.includes("wixpress") &&
           !lower.includes("schema.org") && !lower.includes("w3.org") &&
           lower.includes(".edu") || lower.includes(".ac.") || lower.includes(".org") ||
           lower.includes(".com") || lower.includes(".gov")
  })
}

/** Score how likely an email belongs to this professor */
function scoreEmail(email: string, name: string, university: string): number {
  const eLow = email.toLowerCase()
  const nameParts = name.toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/)
  const firstName = nameParts[0] || ""
  const lastName = nameParts[nameParts.length - 1] || ""
  const uniLow = university.toLowerCase()

  let score = 0

  // Contains first or last name
  if (eLow.includes(lastName)) score += 30
  if (eLow.includes(firstName)) score += 25

  // Is an .edu email
  if (eLow.includes(".edu")) score += 20

  // Domain contains university name fragments
  const domain = eLow.split("@")[1] || ""
  const uniWords = uniLow.replace(/university|of|the|at|&/gi, "").trim().split(/\s+/).filter(w => w.length > 2)
  for (const w of uniWords) {
    if (domain.includes(w)) { score += 15; break }
  }

  // Penalize generic/noreply addresses
  if (eLow.includes("noreply") || eLow.includes("info@") || eLow.includes("admin@") ||
      eLow.includes("webmaster") || eLow.includes("support@")) {
    score -= 50
  }

  return score
}

/** Build university domain from name for directory searches */
function guessUniversityDomain(university: string): string {
  const uLow = university.toLowerCase()
  const domainMap: Record<string, string> = {
    "mit": "mit.edu", "harvard": "harvard.edu", "stanford": "stanford.edu",
    "princeton": "princeton.edu", "yale": "yale.edu", "columbia": "columbia.edu",
    "cornell": "cornell.edu", "duke": "duke.edu", "caltech": "caltech.edu",
    "berkeley": "berkeley.edu", "ucla": "ucla.edu", "michigan": "umich.edu",
    "carnegie mellon": "cmu.edu", "cmu": "cmu.edu", "nyu": "nyu.edu",
    "northwestern": "northwestern.edu", "johns hopkins": "jhu.edu",
    "upenn": "upenn.edu", "penn": "upenn.edu", "chicago": "uchicago.edu",
    "uiuc": "illinois.edu", "illinois": "illinois.edu", "purdue": "purdue.edu",
    "georgia tech": "gatech.edu", "unc": "unc.edu", "arizona": "arizona.edu",
    "ut austin": "utexas.edu", "texas": "utexas.edu", "usc": "usc.edu",
    "umass": "umass.edu", "ucsd": "ucsd.edu", "ucsb": "ucsb.edu",
    "oxford": "ox.ac.uk", "cambridge": "cam.ac.uk", "toronto": "utoronto.ca",
    "mcgill": "mcgill.ca", "waterloo": "uwaterloo.ca", "rice": "rice.edu",
    "brown": "brown.edu", "dartmouth": "dartmouth.edu", "vanderbilt": "vanderbilt.edu",
    "emory": "emory.edu", "georgetown": "georgetown.edu", "tufts": "tufts.edu",
    "rutgers": "rutgers.edu", "virginia": "virginia.edu", "wisconsin": "wisc.edu",
    "minnesota": "umn.edu", "iowa": "uiowa.edu", "ohio state": "osu.edu",
    "penn state": "psu.edu", "maryland": "umd.edu", "florida": "ufl.edu",
    "washington": "washington.edu", "colorado": "colorado.edu",
    "boston university": "bu.edu", "boston college": "bc.edu",
    "north carolina": "unc.edu", "notre dame": "nd.edu",
  }
  for (const [key, d] of Object.entries(domainMap)) {
    if (uLow.includes(key)) return d
  }
  // Fallback: try to construct from name
  const clean = uLow.replace(/university of\s+/i, "").replace(/\s+university$/i, "")
    .replace(/\s+/g, "").slice(0, 12)
  return `${clean}.edu`
}

// ─── Step 1: Scrape university directory / faculty pages ──────────────────────

async function scrapeUniversityPages(name: string, university: string): Promise<string[]> {
  const domain = guessUniversityDomain(university)
  const nameParts = name.trim().split(/\s+/)
  const lastName = nameParts[nameParts.length - 1]
  const firstName = nameParts[0]
  const nameQuery = encodeURIComponent(name)

  // Try multiple common university directory & search URL patterns
  const urls = [
    // Google site-scoped search (public, no API key needed)
    `https://www.google.com/search?q=site:${domain}+${nameQuery}+email&num=5`,
    // Direct university directory searches
    `https://www.${domain}/search?q=${nameQuery}`,
    `https://directory.${domain}/search?q=${nameQuery}`,
    `https://search.${domain}/?q=${nameQuery}+email`,
    // Common faculty directory patterns
    `https://www.${domain}/people/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
    `https://www.${domain}/faculty/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
    // Google Scholar (often has email listed)
    `https://scholar.google.com/citations?view_op=search_authors&mauthors=${nameQuery}+${encodeURIComponent(university)}`,
  ]

  const allEmails: string[] = []

  // Fetch pages in parallel (with timeout)
  const results = await Promise.allSettled(
    urls.map(url => fetchPage(url))
  )

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      const emails = extractEmails(r.value)
      allEmails.push(...emails)
    }
  }

  return [...new Set(allEmails)]
}

// ─── Step 2: Use DuckDuckGo HTML search (no API key needed) ──────────────────

async function searchDuckDuckGo(name: string, university: string): Promise<string[]> {
  const query = encodeURIComponent(`${name} ${university} email`)
  const url = `https://html.duckduckgo.com/html/?q=${query}`

  const html = await fetchPage(url)
  if (!html) return []

  // Extract any emails directly visible in search results
  const emails = extractEmails(html)

  // Also extract result URLs and try to fetch a couple of them
  const urlMatches = html.match(/href="(https?:\/\/[^"]+)"/g) || []
  const resultUrls = urlMatches
    .map(m => m.replace('href="', '').replace('"', ''))
    .filter(u =>
      !u.includes("duckduckgo.com") &&
      !u.includes("google.com") &&
      !u.includes("bing.com") &&
      (u.includes(".edu") || u.includes(university.toLowerCase().split(/\s+/)[0]))
    )
    .slice(0, 3) // Only fetch top 3 results

  const pageResults = await Promise.allSettled(
    resultUrls.map(u => fetchPage(u))
  )

  for (const r of pageResults) {
    if (r.status === "fulfilled" && r.value) {
      emails.push(...extractEmails(r.value))
    }
  }

  return [...new Set(emails)]
}

// ─── Step 3: AI fallback (only if scraping finds nothing) ─────────────────────

async function aiGuessEmail(apiKey: string, name: string, university: string, areas?: string[]): Promise<string> {
  const prompt = `Find the exact professional email address for professor "${name}" at "${university}".
${areas && areas.length > 0 ? `They work in: ${areas.join(", ")}.` : ""}
Search their university faculty page and return the real email address.
Return ONLY the email address. No other text.`

  if (isGeminiKey(apiKey)) {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0, maxOutputTokens: 100 },
        }),
      }
    )
    if (!res.ok) return ""
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    return raw.trim().match(EMAIL_RE)?.[0] || ""
  } else {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 50,
      }),
    })
    if (!res.ok) return ""
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content || ""
    return raw.trim().match(EMAIL_RE)?.[0] || ""
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { researcherName, university, areas } = await req.json()
  if (!researcherName || !university) {
    return new Response(JSON.stringify({ error: "Missing name or university" }), { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data: profile } = await supabase.from("profiles").select("ai_api_key").eq("user_id", user.id).single()
  const aiKey = (profile as any)?.ai_api_key || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY

  if (!aiKey) {
    return new Response(JSON.stringify({ error: "No AI API key found. Add one in Settings." }), { status: 400 })
  }

  try {
    // Step 1 & 2: Scrape university pages AND search DuckDuckGo in parallel
    const [uniEmails, searchEmails] = await Promise.all([
      scrapeUniversityPages(researcherName, university),
      searchDuckDuckGo(researcherName, university),
    ])

    const allScrapedEmails = [...new Set([...uniEmails, ...searchEmails])]

    // Score and rank the scraped emails
    const scored = allScrapedEmails
      .map(e => ({ email: e, score: scoreEmail(e, researcherName, university) }))
      .filter(e => e.score > 10)  // Must at least contain a name fragment
      .sort((a, b) => b.score - a.score)

    if (scored.length > 0) {
      // Return the best scraped result
      return new Response(JSON.stringify({
        email: scored[0].email,
        source: "scraped",
        confidence: scored[0].score,
        alternatives: scored.slice(1, 4).map(e => e.email),
      }), { headers: { "Content-Type": "application/json" } })
    }

    // Step 3: AI fallback with Google Search grounding
    const aiEmail = await aiGuessEmail(aiKey, researcherName, university, areas)

    return new Response(JSON.stringify({
      email: aiEmail,
      source: aiEmail ? "ai_search" : "none",
      confidence: aiEmail ? 40 : 0,
      alternatives: [],
    }), { headers: { "Content-Type": "application/json" } })

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
