import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { detectApiKey } from "@/lib/ai/detect-key"

interface BizInput { name: string; type: string; address: string }

async function scoreWithGroq(
  businesses: BizInput[],
  industry: string,
  apiKey: string,
): Promise<{ score: number; reason: string; industry: string }[]> {
  const Groq = (await import("groq-sdk")).default
  const client = new Groq({ apiKey })
  const prompt = `You are an expert at identifying which local businesses are likely to hire interns.

Given this list of businesses and the target industry "${industry}", rate each 1–10 for likelihood of hiring interns.
Consider: small/medium = higher score, relevant industry = higher score, large chains = lower score.

Businesses:
${businesses.map((b, i) => `${i + 1}. "${b.name}" | ${b.type} | ${b.address || "local"}`).join("\n")}

Respond ONLY with valid JSON array of exactly ${businesses.length} objects:
[{"score":N,"reason":"max 60 chars","industry":"category"}]`

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1200,
  })
  const raw = completion.choices[0]?.message?.content || "[]"
  const jsonStr = raw.match(/\[[\s\S]*\]/)?.[0] || "[]"
  try {
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed) && parsed.length === businesses.length) return parsed
  } catch { /* fallback */ }
  return businesses.map(() => ({ score: 5, reason: "Could be a fit", industry }))
}

async function scoreWithGemini(
  businesses: BizInput[],
  industry: string,
  apiKey: string,
): Promise<{ score: number; reason: string; industry: string }[]> {
  const prompt = `Rate each business 1-10 for likelihood of hiring interns in "${industry}".
Small/medium businesses score higher, relevant industry = higher score.

${businesses.map((b, i) => `${i + 1}. "${b.name}" (${b.type})`).join("\n")}

Reply ONLY with JSON array of ${businesses.length} objects: [{"score":N,"reason":"short reason","industry":"category"}]`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )
  const data = await res.json()
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
  const jsonStr = raw.match(/\[[\s\S]*\]/)?.[0] || "[]"
  try {
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed) && parsed.length === businesses.length) return parsed
  } catch { /* fallback */ }
  return businesses.map(() => ({ score: 5, reason: "Could be a fit", industry }))
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profileRaw } = await supabase
      .from("profiles").select("ai_api_key").eq("user_id", user.id).single() as { data: { ai_api_key: string | null } | null }

    const body = await request.json()
    const { businesses, industry = "technology" } = body as {
      businesses: BizInput[]
      industry: string
    }

    if (!Array.isArray(businesses) || businesses.length === 0) {
      return NextResponse.json({ scores: [] })
    }

    // Cap at 50
    const capped = businesses.slice(0, 50)

    const apiKey = profileRaw?.ai_api_key || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY
    let scores: { score: number; reason: string; industry: string }[] =
      capped.map(() => ({ score: 5, reason: "Local business", industry }))

    if (apiKey) {
      try {
        const detected = detectApiKey(apiKey)
        if (detected.provider === "gemini") {
          scores = await scoreWithGemini(capped, industry, apiKey)
        } else {
          scores = await scoreWithGroq(capped, industry, apiKey)
        }
      } catch (aiErr) {
        console.warn("AI scoring failed, using defaults:", aiErr)
      }
    }

    return NextResponse.json({ scores })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
