import { createClient, createServiceClient } from "@/lib/supabase/server"
import { isGeminiKey } from "@/lib/ai/detect-key"
import { callAI } from "@/lib/ai/call"
import {
  extractCandidates,
  isGenericInbox,
  looksLikePersonName,
  type PageInput,
} from "@/lib/email/professor-extractor"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

// Personal / commercial mail providers — a work email should never be one.
const FREE_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.co.in",
  "hotmail.com", "outlook.com", "live.com", "icloud.com", "me.com", "aol.com",
  "protonmail.com", "proton.me", "mail.com", "yandex.com", "qq.com", "163.com",
  "126.com", "foxmail.com", "zoho.com", "gmx.com", "msn.com",
])

function getDomain(email: string): string {
  return (email.split("@")[1] || "").toLowerCase()
}
function getLocalPart(email: string): string {
  return (email.split("@")[0] || "").toLowerCase()
}

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

/**
 * Work out the company's email domain. The explicit website is the most
 * reliable signal; otherwise fall back to a best-effort guess from the name
 * ("Acme Labs, Inc." -> "acme.com").
 */
function resolveCompanyDomain(website?: string, company?: string): string {
  if (website) {
    try {
      const u = new URL(website.startsWith("http") ? website : "https://" + website)
      const host = u.hostname.replace(/^www\./, "").toLowerCase()
      if (host && host.includes(".")) return host
    } catch {
      /* fall through to name guess */
    }
  }
  if (company) {
    const cleaned = company
      .toLowerCase()
      .replace(/\b(inc|llc|ltd|corp|corporation|co|company|technologies|technology|labs|group|holdings|the)\b/g, "")
      .replace(/[^a-z0-9]/g, "")
    if (cleaned) return cleaned + ".com"
  }
  return ""
}

function isCorporateEmail(email: string, expectedDomain?: string): boolean {
  const domain = getDomain(email)
  if (!domain) return false
  if (FREE_PROVIDERS.has(domain)) return false
  if (expectedDomain) {
    const exp = expectedDomain.toLowerCase().replace(/^www\./, "")
    return domain === exp || domain.endsWith("." + exp)
  }
  return true
}

/** 0–7 signal for how strongly the local-part matches the person's name. */
function nameSignal(email: string, name: string): number {
  const local = getLocalPart(email)
  if (!name) return looksLikePersonName(local) ? 1 : 0
  const parts = name
    .toLowerCase()
    .replace(/[^a-z\s.\-]/g, "")
    .split(/\s+/)
    .filter((p) => p.length > 1)
  if (parts.length === 0) return looksLikePersonName(local) ? 1 : 0
  const first = parts[0]
  const last = parts[parts.length - 1]
  let score = 0
  if (last && local.includes(last)) score += 6
  if (first && local.includes(first)) score += 4
  if (first && last && local === first[0] + last) score += 3
  if (score === 0 && looksLikePersonName(local)) score += 1
  return score
}

/**
 * Grounded 0–100 confidence for a contact email, built from observable signals
 * (how we found it, whether the domain matches the company, whether the local
 * part looks like the person). Mirrors the professor finder's philosophy but
 * uses corporate-domain rather than university-domain logic.
 */
function computeContactConfidence(opts: {
  email: string
  name: string
  expectedDomain?: string
  source: "scraped+verified" | "scraped" | "ai_search" | "none"
  aiVerified?: boolean
}): number {
  const { email, name, expectedDomain, source, aiVerified } = opts
  const domain = getDomain(email)

  let conf: number
  if (source === "scraped+verified") conf = 55
  else if (source === "scraped") conf = 35
  else if (source === "ai_search") conf = aiVerified ? 35 : 22
  else return 0

  let domainMatches = false
  if (expectedDomain) {
    const exp = expectedDomain.toLowerCase().replace(/^www\./, "")
    domainMatches = domain === exp || domain.endsWith("." + exp)
    conf += domainMatches ? 25 : -10
  } else {
    conf += isCorporateEmail(email) ? 5 : -15
  }

  const nm = nameSignal(email, name)
  if (nm >= 6) conf += 18
  else if (nm >= 4) conf += 10
  else if (nm >= 1) conf += 3
  else conf -= 12

  if (source === "ai_search") conf = Math.min(conf, aiVerified ? 68 : 50)
  if (expectedDomain && !domainMatches) conf = Math.min(conf, 60)
  if (nm === 0) conf = Math.min(conf, 55)
  if (source === "scraped") conf = Math.min(conf, 80)

  return Math.max(5, Math.min(96, Math.round(conf)))
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

async function scrapeBing(
  name: string,
  company: string,
  domain: string
): Promise<PageInput[]> {
  const queries = [
    `"${name}" "${company}" email`,
    domain ? `"${name}" ${company} email site:${domain}` : `"${name}" ${company} contact email`,
    `"${name}" ${company} contact`,
  ]
  const out: PageInput[] = []
  const seenUrls = new Set<string>()

  for (const q of queries) {
    const seedUrl = `https://www.bing.com/search?q=${encodeURIComponent(q)}`
    const seedHtml = await fetchPage(seedUrl)
    if (!seedHtml) continue
    // The SERP snippets themselves often contain the email in plain text.
    out.push({ url: seedUrl, html: seedHtml })

    // Follow the top result URLs on the company's own domain — that's where a
    // team/about/contact page listing the person's address tends to live.
    const urlMatches = seedHtml.match(/href="(https?:\/\/[^"]+)"/g) || []
    const resultUrls = Array.from(
      new Set(
        urlMatches
          .map((m) => m.replace('href="', "").replace('"', ""))
          .filter(
            (u) =>
              !u.includes("bing.com") &&
              !u.includes("microsoft.com") &&
              !u.includes("microsofttranslator.com") &&
              !seenUrls.has(u) &&
              (domain ? u.includes(domain) : false)
          )
      )
    ).slice(0, 4)

    resultUrls.forEach((u) => seenUrls.add(u))
    const pages = await Promise.allSettled(resultUrls.map((u) => fetchPage(u)))
    pages.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        out.push({ url: resultUrls[i], html: r.value })
      }
    })
  }
  return out
}

async function scrapeDuckDuckGo(
  name: string,
  company: string,
  domain: string
): Promise<PageInput[]> {
  const query = encodeURIComponent(`${name} ${company} email`)
  const seedUrl = `https://html.duckduckgo.com/html/?q=${query}`
  const seedHtml = await fetchPage(seedUrl)
  if (!seedHtml) return []

  const urlMatches = seedHtml.match(/href="(https?:\/\/[^"]+)"/g) || []
  const resultUrls = Array.from(
    new Set(
      urlMatches
        .map((m) => m.replace('href="', "").replace('"', ""))
        .map((u) => {
          try {
            const url = new URL(u, "https://duckduckgo.com")
            const u2 = url.searchParams.get("uddg")
            return u2 ? decodeURIComponent(u2) : u
          } catch {
            return u
          }
        })
        .filter(
          (u) =>
            !u.includes("duckduckgo.com") &&
            !u.includes("google.com") &&
            !u.includes("bing.com") &&
            domain !== "" &&
            u.includes(domain)
        )
    )
  ).slice(0, 4)

  const pages = await Promise.allSettled(resultUrls.map((u) => fetchPage(u)))
  const out: PageInput[] = [{ url: seedUrl, html: seedHtml }]
  pages.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      out.push({ url: resultUrls[i], html: r.value })
    }
  })
  return out
}

// ─── AI search + verification ─────────────────────────────────────────────────

async function aiSearchContactEmail(
  apiKey: string,
  name: string,
  company: string,
  role?: string,
  website?: string
): Promise<{ email: string; snippet: string }> {
  const prompt = `Find the official WORK email for the person below.

Person: ${name}
Company: ${company}
${role ? `Role: ${role}\n` : ""}${website ? `Company website: ${website}\n` : ""}
Instructions:
1. Search the web for this specific person's professional email at this company.
2. Strongly prefer an address on the company's own domain (e.g. firstname@company-domain).
3. It MUST be this person's personal work address — NOT a generic mailbox
   (info@, contact@, support@, careers@, jobs@, hr@, recruiting@, sales@), NOT a
   personal Gmail/Yahoo/Outlook, and NOT a different person on the same page.
4. If you find several candidates, pick the one whose local-part best matches
   the person's name.
5. If you genuinely cannot find a verified personal work email, output exactly: NONE

Output format:
EMAIL: <the email or NONE>
SOURCE: <the page URL where you found it, or "n/a">`

  const pickEmail = (raw: string): string => {
    const cleaned = raw.replace(/mailto:/gi, "").replace(/[`*]/g, "")
    const m = cleaned.match(EMAIL_RE)
    return m ? m[0].toLowerCase() : ""
  }

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
          generationConfig: { temperature: 0, maxOutputTokens: 400 },
        }),
      }
    )
    if (!res.ok) return { email: "", snippet: "" }
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    return { email: pickEmail(raw), snippet: raw }
  }
  try {
    const raw = await callAI(apiKey, prompt, { temperature: 0, maxTokens: 200 })
    return { email: pickEmail(raw), snippet: raw }
  } catch {
    return { email: "", snippet: "" }
  }
}

interface ContactVerdict {
  match: boolean
  confidence: number
  evidence: string
}

async function verifyContactWithAI(opts: {
  email: string
  name: string
  company: string
  role?: string
  url: string
  snippet: string
  apiKey: string
}): Promise<ContactVerdict> {
  const prompt = `You are verifying whether an email is the personal WORK address of a specific person at a company.

Target person: ${opts.name}
Company: ${opts.company}
${opts.role ? `Role: ${opts.role}\n` : ""}Candidate email: ${opts.email}
Page URL: ${opts.url}

Surrounding text on the page:
"""
${opts.snippet.slice(0, 400)}
"""

Decide if this email DEFINITELY belongs to the target person's own work account
— NOT an assistant, a generic mailbox (info@, careers@, hr@, recruiting@), a
shared team address, or a different person who appears on the same page. Be
skeptical: if the local-part doesn't plausibly match the person's name, say no.

Respond with JSON only, no prose, no markdown fences:
{"match": true|false, "confidence": 0-100, "evidence": "one short sentence"}`

  const parse = (raw: string): ContactVerdict => {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return { match: false, confidence: 0, evidence: "no JSON in AI response" }
    try {
      const obj = JSON.parse(m[0])
      return {
        match: !!obj.match,
        confidence: Math.max(0, Math.min(100, Number(obj.confidence) || 0)),
        evidence: String(obj.evidence || "").slice(0, 200),
      }
    } catch {
      return { match: false, confidence: 0, evidence: "parse error" }
    }
  }

  try {
    if (isGeminiKey(opts.apiKey)) {
      const r = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
          opts.apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 200,
              responseMimeType: "application/json",
            },
          }),
        }
      )
      if (!r.ok) return { match: false, confidence: 0, evidence: "AI call failed" }
      const data = await r.json()
      return parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "")
    }
    const raw = await callAI(opts.apiKey, prompt, { temperature: 0, maxTokens: 200 })
    return parse(raw)
  } catch {
    return { match: false, confidence: 0, evidence: "AI call exception" }
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

interface ScoredCandidate {
  email: string
  pageUrl: string
  snippet: string
  score: number
}

function scoreContactCandidates(
  pages: PageInput[],
  name: string,
  expectedDomain: string,
  enforceDomain: boolean
): ScoredCandidate[] {
  const byEmail = new Map<string, ScoredCandidate>()
  for (const p of pages) {
    if (!p.html) continue
    for (const c of extractCandidates(p.html, p.url)) {
      if (isGenericInbox(c.email)) continue
      const domainOk = isCorporateEmail(c.email, enforceDomain ? expectedDomain : undefined)
      if (!domainOk) continue
      let score = 2 // corporate, non-generic
      if (expectedDomain) {
        const exp = expectedDomain.toLowerCase().replace(/^www\./, "")
        const d = getDomain(c.email)
        if (d === exp || d.endsWith("." + exp)) score += 6
      }
      score += nameSignal(c.email, name)
      const prev = byEmail.get(c.email)
      if (!prev || score > prev.score) {
        byEmail.set(c.email, { email: c.email, pageUrl: c.pageUrl, snippet: c.snippet, score })
      }
    }
  }
  return [...byEmail.values()].sort((a, b) => b.score - a.score)
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { contactName, company, role, website } = await req.json()
  if (!contactName || !company) {
    return new Response(JSON.stringify({ error: "Missing contact name or company" }), {
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
    const expectedDomain = resolveCompanyDomain(website, company)

    // Step 1: scrape Bing + DuckDuckGo (SERP snippets + company-domain pages).
    const [bingPages, ddgPages] = await Promise.all([
      scrapeBing(contactName, company, expectedDomain),
      scrapeDuckDuckGo(contactName, company, expectedDomain),
    ])
    const pages: PageInput[] = [...bingPages, ...ddgPages]

    // Step 2: score candidates. Strict (must match company domain) first; if
    // that finds nothing, retry loose so a corporate address on a sibling
    // domain can still surface.
    let ranked = scoreContactCandidates(pages, contactName, expectedDomain, true)
    if (ranked.length === 0 && expectedDomain) {
      ranked = scoreContactCandidates(pages, contactName, expectedDomain, false)
    }

    // Step 3: verify the top scraped candidate with the AI.
    if (ranked.length > 0) {
      const top = ranked[0]
      const verdict = await verifyContactWithAI({
        email: top.email,
        name: contactName,
        company,
        role,
        url: top.pageUrl,
        snippet: top.snippet,
        apiKey: aiKey,
      })
      const alternatives = ranked.slice(1, 4).map((r) => r.email)
      if (verdict.match && verdict.confidence >= 60) {
        return Response.json({
          email: top.email,
          source: "scraped+verified",
          confidence: computeContactConfidence({
            email: top.email,
            name: contactName,
            expectedDomain,
            source: "scraped+verified",
            aiVerified: true,
          }),
          evidence: verdict.evidence,
          alternatives,
          score: top.score,
        })
      }
      // Couldn't verify, but a domain+name match is still a reasonable guess.
      return Response.json({
        email: top.email,
        source: "scraped",
        confidence: computeContactConfidence({
          email: top.email,
          name: contactName,
          expectedDomain,
          source: "scraped",
        }),
        evidence: verdict.evidence || "",
        alternatives,
        score: top.score,
      })
    }

    // Step 4: AI search fallback (Gemini grounding or universal model).
    const ai = await aiSearchContactEmail(aiKey, contactName, company, role, website)
    if (ai.email && !isGenericInbox(ai.email) && isCorporateEmail(ai.email)) {
      const lower = ai.email.toLowerCase()
      const exp = expectedDomain.toLowerCase().replace(/^www\./, "")
      const domainMatch =
        !!expectedDomain && (getDomain(lower) === exp || getDomain(lower).endsWith("." + exp))
      const verdict = await verifyContactWithAI({
        email: lower,
        name: contactName,
        company,
        role,
        url: "ai-search",
        snippet: ai.snippet || "",
        apiKey: aiKey,
      })
      const aiVerified = verdict.match && verdict.confidence >= 60
      return Response.json({
        email: lower,
        source: aiVerified ? "ai_search+verified" : "ai_search",
        confidence: computeContactConfidence({
          email: lower,
          name: contactName,
          expectedDomain,
          source: "ai_search",
          aiVerified,
        }),
        evidence: verdict.evidence || ai.snippet?.slice(0, 200) || "",
        alternatives: [],
        score: 0,
        domainMatch,
      })
    }

    return Response.json({ email: "", source: "none", confidence: 0, alternatives: [] })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
