import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { detectApiKey } from "@/lib/ai/detect-key"
import { callAIJson } from "@/lib/ai/call"
import { getAiKey } from "@/lib/ai/key-pool"

interface BizInput { name: string; type: string; address: string }
type ScoreRow = { score: number; reason: string; industry: string }

async function scoreBusinesses(
  businesses: BizInput[],
  industry: string,
  apiKey: string,
): Promise<ScoreRow[]> {
  const prompt = `You are an expert at identifying which local businesses are likely to hire interns.

Given this list of businesses and the target industry "${industry}", rate each 1–10 for likelihood of hiring interns.
Consider: small/medium = higher score, relevant industry = higher score, large chains = lower score.

Businesses:
${businesses.map((b, i) => `${i + 1}. "${b.name}" | ${b.type} | ${b.address || "local"}`).join("\n")}

Respond ONLY with a valid JSON array of exactly ${businesses.length} objects:
[{"score":N,"reason":"max 60 chars","industry":"category"}]`

  try {
    const parsed = await callAIJson<ScoreRow[]>(apiKey, prompt, {
      temperature: 0.3,
      maxTokens: 1200,
    })
    if (Array.isArray(parsed) && parsed.length === businesses.length) return parsed
  } catch { /* fallback below */ }

  return businesses.map(() => ({ score: 5, reason: "Could be a fit", industry }))
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { businesses, industry = "technology" } = body as {
      businesses: BizInput[]
      industry: string
    }

    if (!Array.isArray(businesses) || businesses.length === 0) {
      return NextResponse.json({ scores: [] })
    }

    const capped = businesses.slice(0, 50)
    const apiKey = getAiKey()

    let scores: ScoreRow[] = capped.map(() => ({ score: 5, reason: "Local business", industry }))

    if (apiKey) {
      try {
        const { label } = detectApiKey(apiKey)
        console.log(`Scoring via ${label}`)
        scores = await scoreBusinesses(capped, industry, apiKey)
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
