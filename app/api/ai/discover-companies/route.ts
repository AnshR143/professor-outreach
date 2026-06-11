import { NextRequest, NextResponse } from "next/server"
import { detectApiKey } from "@/lib/ai/detect-key"
import { callAIJson } from "@/lib/ai/call"
import { getAiKey } from "@/lib/ai/key-pool"

export async function POST(req: NextRequest) {
  try {
    const { location, industry, count = 15 } = await req.json()
    const apiKey = getAiKey()

    if (!apiKey) {
      return NextResponse.json({ error: "AI service is temporarily unavailable. Please try again in a moment." }, { status: 503 })
    }

    const { label } = detectApiKey(apiKey)

    const prompt = `You are a business research assistant. Output strict JSON only.

List ${count} real, well-known ${industry} companies in or near ${location}.
For each company, provide:
- name: official company name
- type: company type (e.g. Software Agency, Startup, Corporate)
- website: official website URL
- score: 1-10 rating of how good an internship there would be for a student
- reason: 1 sentence explaining why

Return JSON format: { "companies": [{ "name": "", "type": "", "website": "", "score": 0, "reason": "" }, ...] }
Only return real companies. Do not hallucinate.`

    const data = await callAIJson<{ companies: unknown[] }>(apiKey, prompt, {
      temperature: 0.2,
      maxTokens: 1500,
    })

    console.log(`Company discovery via ${label}`)
    return NextResponse.json({ companies: data?.companies ?? [] })
  } catch (error: any) {
    console.error("AI Discovery Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
