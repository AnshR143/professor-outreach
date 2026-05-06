/**
 * Resume tailoring + outreach generation.
 *
 * Inputs: user resume text + a CompanyContext (name, industry, complaints,
 * opportunity, scraped keywords). Outputs:
 *   - tailored bullet points (rewritten, role-appropriate)
 *   - personalized outreach message (subject + body)
 *   - "why you fit"  short paragraph the user can paste anywhere
 *
 * Uses whichever LLM key is configured (Groq or Gemini). Falls back to a
 * deterministic template-based generator if no key is present so the route
 * still returns something useful.
 */

import { detectApiKey } from "@/lib/ai/detect-key"

export interface CompanyContext {
  name: string
  industry?: string
  address?: string
  website?: string | null
  rating?: number | null
  reviewCount?: number | null
  complaints?: string[]
  strengths?: string[]
  opportunity?: string
  keywords?: string[]
  role?: string
}

export interface TailoredResume {
  bullets: string[]
  outreach: { subject: string; body: string }
  whyFit: string
  source: "llm" | "fallback"
}

const SYS = `You are an expert career coach. You rewrite a student's resume bullets so they
match a specific company, and you draft a short, sincere outreach email. Do
not invent qualifications  only re-frame what's already in the resume. Keep
copy plain text, no markdown.`

function buildPrompt(resume: string, ctx: CompanyContext): string {
  const role = ctx.role || `${ctx.industry ?? "company"} intern`
  const lines = [
    `COMPANY: ${ctx.name}`,
    ctx.industry ? `INDUSTRY: ${ctx.industry}` : "",
    ctx.role ? `TARGET ROLE: ${ctx.role}` : `TARGET ROLE: Intern (${ctx.industry ?? "general"})`,
    ctx.rating != null ? `Public rating: ${ctx.rating} (${ctx.reviewCount ?? 0} reviews)` : "",
    ctx.opportunity ? `Where the company likely needs help: ${ctx.opportunity}` : "",
    ctx.complaints?.length ? `Reviewer complaints: ${ctx.complaints.join("; ")}` : "",
    ctx.strengths?.length  ? `Reviewer strengths: ${ctx.strengths.join("; ")}` : "",
    ctx.keywords?.length   ? `Site keywords: ${ctx.keywords.slice(0, 10).join(", ")}` : "",
  ].filter(Boolean).join("\n")

  return `${lines}

STUDENT RESUME (raw text  re-use the candidate's real skills/projects, do not fabricate):
---
${resume.slice(0, 3500)}
---

Return strict JSON only, exactly matching this shape:
{
  "bullets": [string, string, string, string, string],   // 4-6 tailored resume bullets, each <= 28 words, action-verb led
  "outreach": {
    "subject": string,                                    // <= 70 chars, specific to ${ctx.name}
    "body":    string                                     // <= 180 words, first person, plain text, signs off generically (no fake name)
  },
  "whyFit": string                                        // 2-3 sentences explaining the candidate's fit for "${role}" at ${ctx.name}
}`
}

// ─── LLM callers ────────────────────────────────────────────────────────────

async function callGroq(prompt: string, apiKey: string): Promise<TailoredResume | null> {
  const Groq = (await import("groq-sdk")).default
  const client = new Groq({ apiKey })
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYS },
      { role: "user",   content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  })
  return parseTailored(completion.choices[0]?.message?.content ?? "")
}

async function callGemini(prompt: string, apiKey: string): Promise<TailoredResume | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: SYS + "\n\n" + prompt }] }],
      generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return parseTailored(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "")
}

function parseTailored(raw: string): TailoredResume | null {
  try {
    const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw
    const obj = JSON.parse(json)
    if (!Array.isArray(obj.bullets) || !obj.outreach) return null
    return {
      bullets: obj.bullets.slice(0, 6).map(String).filter(Boolean),
      outreach: {
        subject: String(obj.outreach.subject ?? "").slice(0, 200),
        body:    String(obj.outreach.body ?? "").slice(0, 4000),
      },
      whyFit: String(obj.whyFit ?? "").slice(0, 1500),
      source: "llm",
    }
  } catch { return null }
}

// ─── Deterministic fallback (no LLM key) ───────────────────────────────────

function fallbackTailor(resume: string, ctx: CompanyContext): TailoredResume {
  const skills = (resume.match(/\b(react|node|typescript|python|figma|seo|ads|java|sql|excel|wordpress|shopify|css|html|next\.js|tailwind|aws|firebase|supabase|django|flask|spring|swift|kotlin|c\+\+|rust|go|graphql|rest|stripe|webflow|canva|premiere|photoshop|illustrator)\b/gi) ?? [])
    .map(s => s.toLowerCase())
  const uniqSkills = [...new Set(skills)].slice(0, 6)
  const opp = ctx.opportunity || (ctx.industry ? `${ctx.industry} growth` : "operations")
  const role = ctx.role || `${ctx.industry ?? "Operations"} Intern`

  const bullets = [
    `Tailored hands-on contribution toward ${opp} at ${ctx.name}, leveraging ${uniqSkills[0] ?? "relevant"} skills.`,
    uniqSkills.length > 1 ? `Applied ${uniqSkills.slice(0, 3).join(", ")} on prior projects directly relevant to ${ctx.industry ?? "this role"}.` :
                            `Brought a self-starter mindset to projects in ${ctx.industry ?? "this field"}.`,
    ctx.complaints?.[0] ? `Built fixes/process improvements addressing issues like "${ctx.complaints[0]}".` :
                          `Delivered measurable improvements to past projects' user experience.`,
    ctx.keywords?.[0] ? `Familiar with ${ctx.keywords.slice(0, 3).join(", ")}  directly relevant to ${ctx.name}'s focus.` :
                        `Quick to ramp on new tools and codebases.`,
    `Available for an internship; can start immediately and commit consistent weekly hours.`,
  ]

  const subject = `Internship interest  help with ${opp} at ${ctx.name}`
  const body = `Hi ${ctx.name} team,

I'm a student researching local companies where my skills could make an immediate impact, and ${ctx.name} stood out${ctx.industry ? ` in ${ctx.industry}` : ""}. ${ctx.opportunity ? `I noticed an opportunity around ${ctx.opportunity}.` : ""}

In past projects I've worked on${uniqSkills.length ? ` ${uniqSkills.slice(0, 3).join(", ")}` : " similar problems"}, and I'd love a chance to help  paid or unpaid  for a few weeks this term.

Would you be open to a 15-minute call?

Thanks for your time.`

  const whyFit = `${ctx.name} appears to be ${ctx.industry ? `a ${ctx.industry.toLowerCase()} business` : "a local business"}${ctx.opportunity ? ` with a clear need around ${ctx.opportunity}` : ""}. The candidate's background${uniqSkills.length ? ` in ${uniqSkills.slice(0, 3).join(", ")}` : ""} maps directly to that need, and an intern can ship visible improvements within weeks.`

  return { bullets, outreach: { subject, body }, whyFit, source: "fallback" }
}

// ─── Public entry ───────────────────────────────────────────────────────────

export async function tailorResume(
  resume: string,
  ctx: CompanyContext,
  apiKey?: string | null,
): Promise<TailoredResume> {
  const safeResume = (resume ?? "").trim()
  if (!safeResume) {
    return fallbackTailor("", ctx)
  }

  const prompt = buildPrompt(safeResume, ctx)

  if (apiKey) {
    try {
      const detected = detectApiKey(apiKey)
      if (detected.provider === "gemini") {
        const r = await callGemini(prompt, apiKey)
        if (r) return r
      } else {
        const r = await callGroq(prompt, apiKey)
        if (r) return r
      }
    } catch { /* fall through */ }
  }

  return fallbackTailor(safeResume, ctx)
}
