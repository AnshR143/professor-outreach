import { createClient, createServiceClient } from "@/lib/supabase/server"
import { isGeminiKey } from "@/lib/ai/detect-key"
import {
  pickBestProfessorEmail,
  verifyWithAI,
  isUniversityEmail,
  isGenericInbox,
  type PageInput,
} from "@/lib/email/professor-extractor"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch a page and return its full HTML (or "" on any failure). */
async function fetchPage(url: string, timeoutMs = 8000): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; InternLink/1.0; +https://internlink.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    })
    clearTimeout(t)
    if (!res.ok) return ""
    return await res.text()
  } catch {
    clearTimeout(t)
    return ""
  }
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
  // Fallback: construct from name
  const clean = uLow
    .replace(/university of\s+/i, "")
    .replace(/\s+university$/i, "")
    .replace(/\s+/g, "")
    .slice(0, 12)
  return `${clean}.edu`
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

/**
 * Build a set of likely faculty-directory URLs and fetch them.
 * Returns the (url, html) pairs that succeeded — these are then passed
 * wholesale to the rule + AI pipeline so it can see surrounding text.
 */
async function scrapeUniversityPages(
  name: string,
  university: string
): Promise<PageInput[]> {
  const domain = guessUniversityDomain(university)
  const nameParts = name.trim().split(/\s+/)
  const lastName = nameParts[nameParts.length - 1]
  const firstName = nameParts[0]
  const nameQuery = encodeURIComponent(name)

  const urls = [
    `https://www.google.com/search?q=site:${domain}+${nameQuery}+email&num=5`,
    `https://www.${domain}/search?q=${nameQuery}`,
    `https://directory.${domain}/search?q=${nameQuery}`,
    `https://search.${domain}/?q=${nameQuery}+email`,
    `https://www.${domain}/people/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
    `https://www.${domain}/faculty/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
    `https://scholar.google.com/citations?view_op=search_authors&mauthors=${nameQuery}+${encodeURIComponent(university)}`,
  ]

  const results = await Promise.allSettled(urls.map((u) => fetchPage(u)))
  const out: PageInput[] = []
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      out.push({ url: urls[i], html: r.value })
    }
  })
  return out
}

async function scrapeDuckDuckGo(
  name: string,
  university: string,
  universityDomain: string
): Promise<PageInput[]> {
  const query = encodeURIComponent(`${name} ${university} email`)
  const seedUrl = `https://html.duckduckgo.com/html/?q=${query}`
  const seedHtml = await fetchPage(seedUrl)
  if (!seedHtml) return []

  // Extract result links and follow the few that point at the university
  // domain (or a `.edu` site in general).
  const urlMatches = seedHtml.match(/href="(https?:\/\/[^"]+)"/g) || []
  const resultUrls = urlMatches
    .map((m) => m.replace('href="', "").replace('"', ""))
    .filter(
      (u) =>
        !u.includes("duckduckgo.com") &&
        !u.includes("google.com") &&
        !u.includes("bing.com") &&
        (u.includes(universityDomain) || u.includes(".edu"))
    )
    .slice(0, 3)

  const pages = await Promise.allSettled(resultUrls.map((u) => fetchPage(u)))
  const out: PageInput[] = [{ url: seedUrl, html: seedHtml }]
  pages.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      out.push({ url: resultUrls[i], html: r.value })
    }
  })
  return out
}

// ─── AI search fallback (Gemini with grounding, or Groq) ──────────────────────

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

async function aiSearchEmail(
  apiKey: string,
  name: string,
  university: string,
  areas?: string[]
): Promise<{ email: string; snippet: string }> {
  const prompt = `Find the exact professional email address for professor "${name}" at "${university}".
${areas && areas.length > 0 ? `They work in: ${areas.join(", ")}.` : ""}
Search their university faculty page. The email must belong to the professor personally,
not a department mailbox, admin, or student.
Return ONLY the email address. No other text.`

  if (isGeminiKey(apiKey)) {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        apiKey,
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
    if (!res.ok) return { email: "", snippet: "" }
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    const email = raw.trim().match(EMAIL_RE)?.[0] || ""
    return { email, snippet: raw }
  } else {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 50,
      }),
    })
    if (!res.ok) return { email: "", snippet: "" }
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content || ""
    const email = raw.trim().match(EMAIL_RE)?.[0] || ""
    return { email, snippet: raw }
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { researcherName, university, areas } = await req.json()
  if (!researcherName || !university) {
    return new Response(JSON.stringify({ error: "Missing name or university" }), {
      status: 400,
    })
  }

  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_api_key")
    .eq("user_id", user.id)
    .single()
  const aiKey =
    (profile as any)?.ai_api_key ||
    process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY

  if (!aiKey) {
    return new Response(
      JSON.stringify({ error: "No AI API key found. Add one in Settings." }),
      { status: 400 }
    )
  }

  try {
    const expectedDomain = guessUniversityDomain(university)

    // Step 1+2: Fetch directory pages and DuckDuckGo results in parallel.
    const [uniPages, ddgPages] = await Promise.all([
      scrapeUniversityPages(researcherName, university),
      scrapeDuckDuckGo(researcherName, university, expectedDomain),
    ])
    const pages: PageInput[] = [...uniPages, ...ddgPages]

    // Step 3: Run the rule-based + AI verification pipeline.
    const pick = await pickBestProfessorEmail({
      pages,
      name: researcherName,
      university,
      expectedDomain,
      apiKey: aiKey,
      verifyTopN: 3,
    })

    if (pick.email && pick.source === "scraped+verified") {
      return new Response(
        JSON.stringify({
          email: pick.email,
          source: pick.source,
          confidence: pick.confidence,
          evidence: pick.evidence,
          alternatives: pick.alternatives,
          score: pick.score,
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // Step 4: AI search fallback. Result still has to pass the same filters.
    const ai = await aiSearchEmail(aiKey, researcherName, university, areas)
    if (ai.email) {
      const lower = ai.email.toLowerCase()
      const passes =
        isUniversityEmail(lower, { expectedDomain }) && !isGenericInbox(lower)
      if (passes) {
        // Verify with the LLM using whatever snippet it returned.
        const verdict = await verifyWithAI({
          email: lower,
          name: researcherName,
          university,
          url: "ai-search",
          title: "",
          snippet: ai.snippet || "",
          apiKey: aiKey,
        })
        if (verdict.is_professor && verdict.confidence >= 60) {
          return new Response(
            JSON.stringify({
              email: lower,
              source: "ai_search+verified",
              confidence: verdict.confidence,
              evidence: verdict.evidence,
              alternatives: pick.alternatives,
              score: 0,
            }),
            { headers: { "Content-Type": "application/json" } }
          )
        }
      }
    }

    // Step 5: If we have a rule-only pick, return it with lower confidence.
    if (pick.email) {
      return new Response(
        JSON.stringify({
          email: pick.email,
          source: pick.source,
          confidence: pick.confidence,
          alternatives: pick.alternatives,
          score: pick.score,
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        email: "",
        source: "none",
        confidence: 0,
        alternatives: [],
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
