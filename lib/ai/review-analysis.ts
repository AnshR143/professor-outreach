/**
 * Review analysis with optional LLM summarization.
 *
 * Two paths:
 *   1. analyzeReviewsHeuristic — pure regex/keyword fallback. Always available.
 *   2. analyzeReviewsLLM — uses the user's configured Groq or Gemini key for
 *      a concise complaints/sentiment/opportunity object.
 *
 * The pipeline calls analyzeReviews(...) which picks the right path based on
 * which keys are available, so the feature degrades gracefully when no LLM
 * key is configured.
 */

import { detectApiKey } from "@/lib/ai/detect-key"

export interface ReviewInsight {
  complaints: string[]
  strengths: string[]
  sentiment: "positive" | "mixed" | "negative" | "unknown"
  opportunity: string
  source: "llm" | "heuristic"
}

export interface ReviewLite {
  rating?: number
  text?: string
}

const NEGATIVE_KEYWORDS: Record<string, string> = {
  slow:        "slow service",
  rude:        "rude staff",
  expensive:   "high prices",
  overpriced:  "high prices",
  dirty:       "cleanliness issues",
  unclean:     "cleanliness issues",
  cold:        "food temperature",
  late:        "late delivery",
  wait:        "long wait times",
  waiting:     "long wait times",
  parking:     "parking problems",
  website:     "poor website",
  online:      "weak online presence",
  app:         "app issues",
  scam:        "trust concerns",
  unprofessional: "unprofessional service",
  cancel:      "cancellation issues",
  refund:      "refund problems",
  noisy:       "noise issues",
  small:       "small portions/space",
  broken:      "broken equipment",
}

const POSITIVE_KEYWORDS = ["great","amazing","love","best","friendly","fast","clean","fresh","professional","helpful","kind","quality","recommend"]

function clip(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + "…" : s }

// ─── Heuristic fallback ─────────────────────────────────────────────────────

export function analyzeReviewsHeuristic(reviews: ReviewLite[]): ReviewInsight {
  if (!reviews?.length) {
    return { complaints: [], strengths: [], sentiment: "unknown", opportunity: "", source: "heuristic" }
  }

  const ratings = reviews.map(r => r.rating ?? 0).filter(Boolean)
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

  const complaintCounts = new Map<string, number>()
  let positiveHits = 0

  for (const r of reviews) {
    const txt = (r.text ?? "").toLowerCase()
    if (!txt) continue
    for (const w of POSITIVE_KEYWORDS) if (txt.includes(w)) positiveHits++
    for (const [kw, label] of Object.entries(NEGATIVE_KEYWORDS)) {
      if (txt.includes(kw)) complaintCounts.set(label, (complaintCounts.get(label) ?? 0) + 1)
    }
  }

  const complaints = [...complaintCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label]) => label)

  let sentiment: ReviewInsight["sentiment"] = "unknown"
  if (avg >= 4.3 && positiveHits > complaints.length) sentiment = "positive"
  else if (avg < 3.5 || complaints.length >= 3)        sentiment = "negative"
  else if (avg)                                         sentiment = "mixed"

  const opportunity =
    complaints.includes("poor website") ? "website improvement" :
    complaints.includes("weak online presence") ? "online presence / marketing" :
    complaints.includes("slow service") ? "operations / process help" :
    complaints.length > 0 ? `address: ${complaints[0]}` :
    sentiment === "positive" ? "scale what's working (marketing, content)" :
    ""

  return { complaints, strengths: [], sentiment, opportunity, source: "heuristic" }
}

// ─── LLM path ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You analyze customer reviews of a small business to find what an
intern could realistically help fix or improve. Output strict JSON only.`

function buildUserPrompt(name: string, reviews: ReviewLite[]) {
  const trimmed = reviews.slice(0, 12).map((r, i) =>
    `[${i + 1}] (${r.rating ?? "?"}/5) ${clip((r.text ?? "").replace(/\s+/g, " "), 280)}`,
  ).join("\n")
  return `Business: ${name}

Reviews:
${trimmed}

Return JSON exactly matching this shape (no markdown, no commentary):
{
  "complaints": [string, ...],   // up to 4 short phrases (e.g. "slow service")
  "strengths":  [string, ...],   // up to 3 short phrases
  "sentiment":  "positive"|"mixed"|"negative"|"unknown",
  "opportunity":string            // ONE concrete area an intern could improve
}`
}

async function callGroq(name: string, reviews: ReviewLite[], apiKey: string): Promise<ReviewInsight | null> {
  const Groq = (await import("groq-sdk")).default
  const client = new Groq({ apiKey })
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: buildUserPrompt(name, reviews) },
    ],
    temperature: 0.2,
    max_tokens: 400,
    response_format: { type: "json_object" },
  })
  return parseInsight(completion.choices[0]?.message?.content ?? "")
}

async function callGemini(name: string, reviews: ReviewLite[], apiKey: string): Promise<ReviewInsight | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + buildUserPrompt(name, reviews) }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return parseInsight(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "")
}

function parseInsight(raw: string): ReviewInsight | null {
  try {
    const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw
    const obj = JSON.parse(json)
    return {
      complaints:  Array.isArray(obj.complaints)  ? obj.complaints.slice(0, 4).map(String) : [],
      strengths:   Array.isArray(obj.strengths)   ? obj.strengths.slice(0, 3).map(String)  : [],
      sentiment:   ["positive","mixed","negative","unknown"].includes(obj.sentiment) ? obj.sentiment : "unknown",
      opportunity: typeof obj.opportunity === "string" ? obj.opportunity : "",
      source: "llm",
    }
  } catch { return null }
}

// ─── Public entry ───────────────────────────────────────────────────────────

export async function analyzeReviews(
  name: string,
  reviews: ReviewLite[],
  apiKey?: string | null,
): Promise<ReviewInsight> {
  if (!reviews?.length) {
    return { complaints: [], strengths: [], sentiment: "unknown", opportunity: "", source: "heuristic" }
  }

  if (apiKey) {
    try {
      const detected = detectApiKey(apiKey)
      if (detected.provider === "gemini") {
        const out = await callGemini(name, reviews, apiKey)
        if (out) return out
      } else if (detected.provider === "groq") {
        const out = await callGroq(name, reviews, apiKey)
        if (out) return out
      } else {
        // Default to Groq if the provider is something else but the key looks valid.
        const out = await callGroq(name, reviews, apiKey)
        if (out) return out
      }
    } catch {
      // fall through to heuristic
    }
  }

  return analyzeReviewsHeuristic(reviews)
}
