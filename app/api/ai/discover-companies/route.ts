import { NextRequest, NextResponse } from "next/server"
import { detectApiKey } from "@/lib/ai/detect-key"

export async function POST(req: NextRequest) {
  try {
    const { location, industry, count = 15 } = await req.json()
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing AI API Key" }, { status: 500 })
    }

    const sysPrompt = "You are a business research assistant. Output strict JSON only."
    const userPrompt = `List ${count} real, well-known ${industry} companies in or near ${location}.
    For each company, provide:
    - name: official company name
    - type: company type (e.g. Software Agency, Startup, Corporate)
    - website: official website URL
    - score: 1-10 rating of how good an internship there would be for a student
    - reason: 1 sentence explaining why
    
    Return JSON format: { "companies": [{ name, type, website, score, reason }, ...] }
    Only return real companies. Do not hallucinate.`

    let companies = []
    const { provider } = detectApiKey(apiKey)

    if (provider === "groq") {
      const Groq = (await import("groq-sdk")).default
      const client = new Groq({ apiKey })
      const completion = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: sysPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
      const data = JSON.parse(completion.choices[0]?.message?.content || "{}")
      companies = data.companies || []
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: sysPrompt + "\n\n" + userPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      })
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
      const parsed = JSON.parse(text)
      companies = parsed.companies || []
    }

    return NextResponse.json({ companies })
  } catch (error: any) {
    console.error("AI Discovery Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
