import { createClient } from "@/lib/supabase/server"
import { generateAISummary } from "@/lib/ai/groq"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ summary: "" })

  const { data: profile } = await supabase
    .from("profiles")
    .select("groq_api_key, gemini_api_key, name")
    .eq("user_id", user.id)
    .single()

  const body = await req.json()
  const groqKey = profile?.groq_api_key || process.env.GROQ_API_KEY
  const geminiKey = profile?.gemini_api_key || process.env.GEMINI_API_KEY

  // Try Groq
  if (groqKey) {
    try {
      const summary = await generateAISummary({ ...body, userName: profile?.name || body.userName, apiKey: groqKey })
      return NextResponse.json({ summary })
    } catch (e) {
      console.error("Groq summary failed:", e)
    }
  }

  // Fallback: Gemini
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Give a one-sentence motivational insight for a student doing research outreach. They have found ${body.totalResearchers} researchers, sent ${body.emailsSent} emails, and are interested in ${(body.topFields || []).join(", ")}. Keep it under 30 words, encouraging, and specific.` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 100 },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
        if (text) return NextResponse.json({ summary: text })
      }
    } catch (e) {
      console.error("Gemini summary failed:", e)
    }
  }

  return NextResponse.json({ summary: "" })
}
