/**
 * lib/email/professor-extractor.ts
 * ---------------------------------
 * Rule-based + AI-assisted pipeline for identifying which scraped email
 * actually belongs to a target faculty member (vs. a department mailbox,
 * an admin, a student, or a generic role address).
 *
 * Public API:
 *   - extractCandidates(html, pageUrl) -> EmailCandidate[]
 *   - isUniversityEmail(email, opts?)  -> boolean
 *   - isGenericInbox(email)            -> boolean
 *   - isStudentEmail(email)            -> boolean
 *   - looksLikePersonName(localPart)   -> boolean
 *   - scoreCandidate(c, ctx)           -> ScoreBreakdown
 *   - verifyWithAI(opts)               -> Promise<AIVerdict>
 *   - pickBestProfessorEmail(opts)     -> Promise<BestPick>
 */

import { isGeminiKey } from "@/lib/ai/detect-key"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmailCandidate {
  email: string
  pageUrl: string
  pageTitle: string
  /** ~200 chars of plain text immediately around the email occurrence */
  snippet: string
  /** Position of the email in the cleaned page text */
  position: number
}

export interface ScoreContext {
  name: string
  pageUrl: string
  pageTitle: string
  /** Full plain-text content of the page (used for page-level keyword checks) */
  pageText: string
}

export interface ScoreBreakdown {
  total: number
  reasons: string[]
  /** True if the candidate fails a hard filter and should never be returned. */
  rejected: boolean
  rejectReason?: string
}

export interface AIVerdict {
  is_professor: boolean
  confidence: number
  evidence: string
  /** Set if the AI call itself failed; treat as inconclusive. */
  error?: string
}

export interface BestPick {
  email: string | null
  score: number
  source: "scraped+verified" | "scraped" | "ai_search" | "none"
  confidence: number
  evidence?: string
  /** Up to 3 alternates that passed the rule filter but lost on score. */
  alternatives: string[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

// All emails must match this regex shape. (Conservative; rejects display-name
// blobs, "name [at] domain" obfuscations are handled separately.)
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

// Domains explicitly excluded even if .edu/.ac.uk: these are student-only.
const STUDENT_SUBDOMAINS = [
  "student.", "students.", "alumni.", "alum.",
  "my.", "mail.student.", "studentmail.",
]

// Top-level patterns considered "university" domains.
const UNIVERSITY_TLDS = [
  /\.edu$/i,
  /\.edu\.[a-z]{2}$/i,            // .edu.au, .edu.cn, etc.
  /\.ac\.[a-z]{2,3}$/i,           // .ac.uk, .ac.jp, .ac.in
  /\.uni-[a-z0-9-]+\.[a-z]{2,}$/i, // .uni-muenchen.de etc.
]

// Domains we always reject (personal / commercial mail providers).
const FORBIDDEN_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.co.in",
  "hotmail.com", "outlook.com", "live.com", "icloud.com", "me.com",
  "aol.com", "protonmail.com", "proton.me", "mail.com", "yandex.com",
  "qq.com", "163.com", "126.com", "foxmail.com", "zoho.com",
])

// Generic-mailbox local parts. Hits here cause an immediate reject.
const GENERIC_INBOX_LOCALPARTS = new Set([
  "info", "support", "contact", "admin", "help", "admissions", "office",
  "webmaster", "newsletter", "careers", "noreply", "no-reply", "donotreply",
  "do-not-reply", "hr", "marketing", "billing", "alumni", "alum",
  "press", "media", "communications", "comms", "feedback", "service",
  "services", "registrar", "studentaffairs", "student-affairs",
  "helpdesk", "help-desk", "undergrad", "undergraduate", "grad",
  "graduate", "advising", "advisor", "advisors", "internships", "jobs",
  "recruiting", "events", "facilities", "it", "ithelp", "sysadmin",
])

// Keyword scoring tables. The numbers come straight from the spec.
const POSITIVE_NEAR_EMAIL: Array<[RegExp, number, string]> = [
  [/\bProfessor\b/i,                5, "\"Professor\" near email"],
  [/\bAssociate Professor\b/i,      5, "\"Associate Professor\" near email"],
  [/\bAssistant Professor\b/i,      5, "\"Assistant Professor\" near email"],
  [/\bFaculty\b/i,                  3, "\"Faculty\" near email"],
  [/\bResearch\b/i,                 2, "\"Research\" near email"],
  [/\bLab\b/i,                      2, "\"Lab\" near email"],
  [/\bPhD\b/i,                      2, "\"PhD\" near email"],
  [/\bDepartment\b/i,               1, "\"Department\" near email"],
]

const NEGATIVE_NEAR_EMAIL: Array<[RegExp, number, string]> = [
  [/\bContact Us\b/i,              -5, "\"Contact Us\" near email"],
  [/\bStudent\b/i,                 -4, "\"Student\" near email"],
  [/\bOffice Hours\b/i,            -3, "\"Office Hours\" near email"],
  [/\bAdmissions\b/i,              -5, "\"Admissions\" near email"],
  [/\bHelp Desk\b/i,               -3, "\"Help Desk\" near email"],
  [/\bRegistrar\b/i,               -3, "\"Registrar\" near email"],
  [/\bStudent Affairs\b/i,         -3, "\"Student Affairs\" near email"],
  [/\bUndergraduate Office\b/i,    -3, "\"Undergraduate Office\" near email"],
]

const PAGE_LEVEL_POSITIVE: Array<[RegExp, number, string]> = [
  [/Research Interests/i,             4, "\"Research Interests\" on page"],
  [/\bPublications?\b/i,            2, "page mentions publications"],
  [/\bCurriculum Vitae|\bCV\b/i,   2, "page has CV section"],
]

const URL_POSITIVE: Array<[RegExp, number, string]> = [
  [/\/faculty\//i,                  3, "URL contains /faculty/"],
  [/\/people\//i,                   2, "URL contains /people/"],
  [/\/profile\//i,                  2, "URL contains /profile/"],
]

const URL_NEGATIVE: Array<[RegExp, number, string]> = [
  [/\/admissions?\//i,             -3, "URL contains /admissions/"],
  [/\/students?\//i,               -3, "URL contains /students/"],
  [/\/staff\//i,                   -1, "URL contains /staff/"],
  [/\/news\//i,                    -1, "URL is a news article"],
]

// Score threshold below which a candidate is not even worth verifying.
export const CANDIDATE_SCORE_THRESHOLD = 5

// AI verifier confidence threshold required to declare a match.
export const AI_VERIFY_THRESHOLD = 60

// ─── Pure rule-based helpers ─────────────────────────────────────────────────

function getDomain(email: string): string {
  return (email.split("@")[1] || "").toLowerCase()
}

function getLocalPart(email: string): string {
  return (email.split("@")[0] || "").toLowerCase()
}

export function isUniversityEmail(
  email: string,
  opts?: { expectedDomain?: string }
): boolean {
  const domain = getDomain(email)
  if (!domain) return false
  if (FORBIDDEN_DOMAINS.has(domain)) return false
  // Reject *student* subdomains even on .edu.
  if (STUDENT_SUBDOMAINS.some((p) => domain.startsWith(p))) return false
  // Must look like a university TLD.
  const looksUni = UNIVERSITY_TLDS.some((re) => re.test(domain))
  if (!looksUni) return false
  // If we know the university domain, the email\'s domain must match
  // (same root or a subdomain).
  if (opts?.expectedDomain) {
    const exp = opts.expectedDomain.toLowerCase().replace(/^www\./, "")
    if (!(domain === exp || domain.endsWith("." + exp))) {
      return false
    }
  }
  return true
}

export function isGenericInbox(email: string): boolean {
  const local = getLocalPart(email)
  // Pure match: local part IS one of the generic terms.
  if (GENERIC_INBOX_LOCALPARTS.has(local)) return true
  // Common compound role accounts: "cs-office", "eecs-help", etc.
  if (/^[a-z0-9]+-?(office|help|info|support|admin|admissions|contact)$/i.test(local)) return true
  // Department-shared mailboxes like "cs", "eecs", "math" by themselves.
  if (/^(cs|ee|eecs|math|chem|bio|phys|stats|econ|hist)$/i.test(local)) return true
  return false
}

export function isStudentEmail(email: string): boolean {
  const domain = getDomain(email)
  return STUDENT_SUBDOMAINS.some((p) => domain.startsWith(p))
}

// Common role-account local parts that should never count as person names.
const ROLE_WORDS = new Set([
  "newsletter","webmaster","admin","admins","support","help","helpdesk",
  "info","contact","admissions","office","careers","jobs","hr","press",
  "media","comms","communications","feedback","service","services",
  "registrar","alumni","alum","internships","recruiting","events",
  "facilities","it","ithelp","sysadmin","staff","department","team",
  "noreply","donotreply","notify","notifications",
])

/** Heuristic: does the local part look like a person's name? */
export function looksLikePersonName(local: string): boolean {
  if (!local) return false
  const l = local.toLowerCase()
  if (l.length < 2 || l.length > 32) return false
  if (ROLE_WORDS.has(l)) return false
  // first.last / first_last / first-last (separator -> name-shaped)
  if (/^[a-z]{2,}[._-][a-z]{2,}$/.test(l)) return true
  // last.first / l.first
  if (/^[a-z]{2,}\.[a-z]{1,2}$/.test(l)) return true
  // Single-token flast pattern: short (<=8 chars), all letters.
  if (l.length <= 8 && /^[a-z]+$/.test(l)) return true
  return false
}

function nameMatchScore(email: string, name: string): { score: number; reasons: string[] } {
  const local = getLocalPart(email)
  const reasons: string[] = []
  let score = 0
  if (!name) return { score, reasons }
  const parts = name
    .toLowerCase()
    .replace(/[^a-z\s.\-]/g, "")
    .split(/\s+/)
    .filter((p) => p.length > 1)
  if (parts.length === 0) return { score, reasons }
  const first = parts[0]
  const last = parts[parts.length - 1]
  if (last && local.includes(last)) {
    score += 6
    reasons.push(`local-part contains last name "${last}"`)
  }
  if (first && local.includes(first)) {
    score += 4
    reasons.push(`local-part contains first name "${first}"`)
  }
  // Initial+last like "jsmith" for John Smith
  if (first && last && local === first[0] + last) {
    score += 3
    reasons.push("matches initial+lastname pattern")
  }
  if (looksLikePersonName(local) && score === 0) {
    score += 1
    reasons.push("local-part looks like a person name")
  }
  return { score, reasons }
}

// ─── Grounded confidence ─────────────────────────────────────────────────────

/**
 * Produce a 0–100 confidence we can actually defend, instead of echoing the
 * LLM's self-reported number (which trends to ~95 even when it's wrong).
 *
 * The score is built from observable signals:
 *   • how we found the address (a verified faculty page beats an LLM guess),
 *   • whether the domain matches the school we expected,
 *   • whether the local-part actually looks like this person's name.
 *
 * Hard caps encode "we are not allowed to look near-certain here": an address
 * the model produced but that we never saw on a real page can never read as a
 * sure thing, and a domain/name mismatch pulls the ceiling down further.
 */
export function computeGroundedConfidence(opts: {
  email: string
  name: string
  expectedDomain?: string
  source: BestPick["source"]
  /** Did an AI verifier independently judge this to be the professor? */
  aiVerified?: boolean
}): number {
  const { email, name, expectedDomain, source, aiVerified } = opts
  const domain = getDomain(email)

  // Base: page-corroborated sources start higher than an unseen LLM guess.
  let conf: number
  if (source === "scraped+verified") conf = 55
  else if (source === "scraped") conf = 35
  else if (source === "ai_search") conf = aiVerified ? 35 : 22
  else return 0 // "none"

  // Domain corroboration.
  let domainMatches = false
  if (expectedDomain) {
    const exp = expectedDomain.toLowerCase().replace(/^www\./, "")
    domainMatches = domain === exp || domain.endsWith("." + exp)
    conf += domainMatches ? 25 : -10
  } else {
    // We couldn't guess the school's domain; a university-looking TLD is only
    // a mild positive, and a non-university domain is a real warning sign.
    conf += isUniversityEmail(email) ? 5 : -15
  }

  // Name corroboration: does the local-part actually look like this person?
  const nm = nameMatchScore(email, name)
  if (nm.score >= 6) conf += 18 // last name present (strong)
  else if (nm.score >= 4) conf += 10 // first name present
  else if (nm.score >= 1) conf += 3 // generically person-shaped
  else conf -= 12 // no name signal at all

  // Ceilings. These can only lower the number, never raise it.
  if (source === "ai_search") conf = Math.min(conf, aiVerified ? 68 : 50)
  if (expectedDomain && !domainMatches) conf = Math.min(conf, 60)
  if (nm.score === 0) conf = Math.min(conf, 55)
  if (source === "scraped") conf = Math.min(conf, 80)

  return Math.max(5, Math.min(96, Math.round(conf)))
}

// ─── Email extraction with surrounding context ───────────────────────────────

/** Strip HTML tags + decode common entities into plain text. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;|&apos;/g, "\'")
    .replace(/\s+/g, " ")
    .trim()
}

/** Best-effort de-obfuscation of "name [at] domain [dot] edu" style. */
function deobfuscate(text: string): string {
  return text
    .replace(/\s*\[\s*at\s*\]\s*/gi, "@")
    .replace(/\s*\(\s*at\s*\)\s*/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s*\[\s*dot\s*\]\s*/gi, ".")
    .replace(/\s*\(\s*dot\s*\)\s*/gi, ".")
    .replace(/\s+dot\s+/gi, ".")
}

function getTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? m[1].trim() : ""
}

export function extractCandidates(html: string, pageUrl: string): EmailCandidate[] {
  const title = getTitle(html)
  const text = deobfuscate(htmlToText(html))
  const seen = new Set<string>()
  const out: EmailCandidate[] = []
  let m: RegExpExecArray | null
  // Reset lastIndex because we use the /g flag.
  EMAIL_RE.lastIndex = 0
  while ((m = EMAIL_RE.exec(text)) !== null) {
    const raw = m[0]
    const e = raw.toLowerCase()
    if (seen.has(e)) continue
    seen.add(e)
    // Reject obvious file-path matches.
    if (/\.(png|jpg|jpeg|gif|svg|css|js|ico|woff2?|ttf)$/i.test(e)) continue
    const start = Math.max(0, m.index - 200)
    const end = Math.min(text.length, m.index + raw.length + 200)
    out.push({
      email: e,
      pageUrl,
      pageTitle: title,
      snippet: text.slice(start, end),
      position: m.index,
    })
  }
  return out
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export function scoreCandidate(c: EmailCandidate, ctx: ScoreContext, expectedDomain?: string): ScoreBreakdown {
  const reasons: string[] = []

  // Hard rejects first — these short-circuit so we don\'t waste AI calls.
  if (!isUniversityEmail(c.email, { expectedDomain })) {
    return { total: 0, reasons: [], rejected: true, rejectReason: "not a university email" }
  }
  if (isGenericInbox(c.email)) {
    return { total: 0, reasons: [], rejected: true, rejectReason: "generic mailbox" }
  }
  if (isStudentEmail(c.email)) {
    return { total: 0, reasons: [], rejected: true, rejectReason: "student subdomain" }
  }

  let total = 0

  // Name-match bonus.
  const nm = nameMatchScore(c.email, ctx.name)
  total += nm.score
  reasons.push(...nm.reasons)

  // .edu / similar TLD: small flat bonus on top of having passed the filter.
  total += 2
  reasons.push("passes university-domain check (+2)")

  // Surrounding-text positive keywords.
  for (const [re, pts, label] of POSITIVE_NEAR_EMAIL) {
    if (re.test(c.snippet)) { total += pts; reasons.push(`+${pts} ${label}`) }
  }
  // Surrounding-text negative keywords.
  for (const [re, pts, label] of NEGATIVE_NEAR_EMAIL) {
    if (re.test(c.snippet)) { total += pts; reasons.push(`${pts} ${label}`) }
  }
  // Whole-page signals.
  for (const [re, pts, label] of PAGE_LEVEL_POSITIVE) {
    if (re.test(ctx.pageText)) { total += pts; reasons.push(`+${pts} ${label}`) }
  }
  // URL signals.
  for (const [re, pts, label] of URL_POSITIVE) {
    if (re.test(ctx.pageUrl)) { total += pts; reasons.push(`+${pts} ${label}`) }
  }
  for (const [re, pts, label] of URL_NEGATIVE) {
    if (re.test(ctx.pageUrl)) { total += pts; reasons.push(`${pts} ${label}`) }
  }

  return { total, reasons, rejected: false }
}

// ─── AI verification ─────────────────────────────────────────────────────────

const VERIFY_PROMPT = (e: {
  email: string
  name: string
  university: string
  url: string
  title: string
  snippet: string
}) => `You are verifying whether an email belongs to a specific faculty member at a university.

Target person: ${e.name}
University: ${e.university}
Candidate email: ${e.email}
Page URL: ${e.url}
Page title: ${e.title}

Surrounding text on the page (~400 chars around the email):
"""
${e.snippet}
"""

Decide if this email is DEFINITELY the personal address of the target faculty
member (Professor, Associate Professor, Assistant Professor, or core research
Faculty), as opposed to an administrator, lab manager, graduate student,
shared group mailbox, generic office address, or a different person who
happens to appear on the same page.

Watch for cues like "Administrative Assistant to Prof. X", "Lab Manager",
"For general inquiries, contact ...", or where the local-part doesn\'t match
the target person\'s name. Be skeptical.

Respond with JSON only, no prose, no markdown fences:
{"is_professor": true|false, "confidence": 0-100, "evidence": "one short sentence"}`

// Per-process cache so repeated calls within a single Next.js process re-use
// the AI verdict for the same (email, pageUrl) pair.
const verifyCache = new Map<string, AIVerdict>()

export async function verifyWithAI(opts: {
  email: string
  name: string
  university: string
  url: string
  title: string
  snippet: string
  apiKey: string
}): Promise<AIVerdict> {
  const cacheKey = `${opts.email}|${opts.url}`
  const hit = verifyCache.get(cacheKey)
  if (hit) return hit

  const prompt = VERIFY_PROMPT(opts)
  let raw = ""
  try {
    if (isGeminiKey(opts.apiKey)) {
      const r = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + opts.apiKey,
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
      if (!r.ok) {
        const v: AIVerdict = { is_professor: false, confidence: 0, evidence: "AI call failed", error: `HTTP ${r.status}` }
        verifyCache.set(cacheKey, v)
        return v
      }
      const data = await r.json()
      raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    } else {
      // Groq / OpenAI-shape fallback.
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + opts.apiKey },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You output JSON only. Never wrap in markdown." },
            { role: "user", content: prompt },
          ],
          temperature: 0,
          max_tokens: 200,
          response_format: { type: "json_object" },
        }),
      })
      if (!r.ok) {
        const v: AIVerdict = { is_professor: false, confidence: 0, evidence: "AI call failed", error: `HTTP ${r.status}` }
        verifyCache.set(cacheKey, v)
        return v
      }
      const data = await r.json()
      raw = data.choices?.[0]?.message?.content || ""
    }
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) {
      const v: AIVerdict = { is_professor: false, confidence: 0, evidence: "no JSON in AI response", error: "parse" }
      verifyCache.set(cacheKey, v)
      return v
    }
    const obj = JSON.parse(match[0])
    const verdict: AIVerdict = {
      is_professor: !!obj.is_professor,
      confidence: Math.max(0, Math.min(100, Number(obj.confidence) || 0)),
      evidence: String(obj.evidence || "").slice(0, 200),
    }
    verifyCache.set(cacheKey, verdict)
    return verdict
  } catch (err: any) {
    const v: AIVerdict = { is_professor: false, confidence: 0, evidence: "AI call exception", error: err?.message }
    verifyCache.set(cacheKey, v)
    return v
  }
}

// ─── Orchestration ───────────────────────────────────────────────────────────

export interface PageInput {
  html: string
  url: string
}

/**
 * Take a set of fetched pages, extract every email candidate, score them all,
 * verify the top scoring ones with the AI, and return the single best match
 * (plus alternates).
 */
export async function pickBestProfessorEmail(opts: {
  pages: PageInput[]
  name: string
  university: string
  expectedDomain?: string
  apiKey?: string
  /** How many top-scored candidates to AI-verify. Default 3. */
  verifyTopN?: number
}): Promise<BestPick> {
  const verifyTopN = opts.verifyTopN ?? 3

  // Score every candidate against every page, optionally enforcing a
  // domain match. We run a strict pass first (must match `expectedDomain`).
  // If that pass yields nothing, the guessed domain is likely wrong, so we
  // retry without the domain constraint — the AI verifier downstream still
  // has to confirm the candidate is the right person.
  const scoreAll = (
    expectedDomain?: string
  ): Array<{ c: EmailCandidate; score: number; breakdown: ScoreBreakdown }> => {
    const out: Array<{ c: EmailCandidate; score: number; breakdown: ScoreBreakdown }> = []
    for (const p of opts.pages) {
      if (!p.html) continue
      const text = htmlToText(p.html)
      const ctx: ScoreContext = {
        name: opts.name,
        pageUrl: p.url,
        pageTitle: getTitle(p.html),
        pageText: text,
      }
      const candidates = extractCandidates(p.html, p.url)
      for (const c of candidates) {
        const b = scoreCandidate(c, ctx, expectedDomain)
        if (b.rejected) continue
        out.push({ c, score: b.total, breakdown: b })
      }
    }
    return out
  }
  let allScored = scoreAll(opts.expectedDomain)
  if (allScored.length === 0 && opts.expectedDomain) {
    allScored = scoreAll(undefined)
  }
  // Dedupe across pages: keep the highest-scoring instance of each email.
  const byEmail = new Map<string, { c: EmailCandidate; score: number; breakdown: ScoreBreakdown }>()
  for (const s of allScored) {
    const prev = byEmail.get(s.c.email)
    if (!prev || s.score > prev.score) byEmail.set(s.c.email, s)
  }
  const ranked = [...byEmail.values()]
    .filter((s) => s.score >= CANDIDATE_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)

  if (ranked.length === 0) {
    return { email: null, score: 0, source: "none", confidence: 0, alternatives: [] }
  }

  // If we have no AI key, we can still return the top-scoring rule-based pick.
  if (!opts.apiKey) {
    return {
      email: ranked[0].c.email,
      score: ranked[0].score,
      source: "scraped",
      confidence: computeGroundedConfidence({
        email: ranked[0].c.email,
        name: opts.name,
        expectedDomain: opts.expectedDomain,
        source: "scraped",
      }),
      alternatives: ranked.slice(1, 4).map((r) => r.c.email),
    }
  }

  // Verify the top N with the LLM.
  const verifyPicks = ranked.slice(0, verifyTopN)
  const verdicts = await Promise.all(
    verifyPicks.map((s) =>
      verifyWithAI({
        email: s.c.email,
        name: opts.name,
        university: opts.university,
        url: s.c.pageUrl,
        title: s.c.pageTitle,
        snippet: s.c.snippet,
        apiKey: opts.apiKey!,
      })
    )
  )
  // Pick the verified candidate with highest confidence; among ties, prefer
  // the higher rule score.
  let bestIdx = -1
  let bestScore = -1
  for (let i = 0; i < verifyPicks.length; i++) {
    const v = verdicts[i]
    if (!v.is_professor || v.confidence < AI_VERIFY_THRESHOLD) continue
    const combined = v.confidence + verifyPicks[i].score
    if (combined > bestScore) {
      bestScore = combined
      bestIdx = i
    }
  }
  if (bestIdx >= 0) {
    const winner = verifyPicks[bestIdx]
    const verdict = verdicts[bestIdx]
    return {
      email: winner.c.email,
      score: winner.score,
      source: "scraped+verified",
      confidence: computeGroundedConfidence({
        email: winner.c.email,
        name: opts.name,
        expectedDomain: opts.expectedDomain,
        source: "scraped+verified",
        aiVerified: true,
      }),
      evidence: verdict.evidence,
      alternatives: verifyPicks
        .filter((_, i) => i !== bestIdx)
        .map((r) => r.c.email)
        .slice(0, 3),
    }
  }
  // Nothing passed AI verification — return the top rule-based pick but
  // with a "scraped" (unverified) source label and lowered confidence.
  return {
    email: ranked[0].c.email,
    score: ranked[0].score,
    source: "scraped",
    confidence: computeGroundedConfidence({
      email: ranked[0].c.email,
      name: opts.name,
      expectedDomain: opts.expectedDomain,
      source: "scraped",
    }),
    alternatives: ranked.slice(1, 4).map((r) => r.c.email),
  }
}
