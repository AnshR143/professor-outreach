import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { callAI } from "@/lib/ai/call"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ summary: "" })

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("ai_api_key, name")
    .eq("user_id", user.id)
    .single()
  const profile = profileRaw as { ai_api_key?: string; name?: string } | null

  const apiKey = profile?.ai_api_key || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ summary: "" })

  const body = await req.json()
  const { totalResearchers, emailsSent, topFields, topUniversities, userName } = body

  const prompt = `Write a 2-sentence encouraging AI summary for a student's research outreach dashboard.
Student: ${profile?.name || userName || "Student"}
Stats: ${totalResearchers} researchers found, ${emailsSent} emails sent
Top fields: ${(topFields || []).join(", ")}
Top universities: ${(topUniversities || []).join(", ")}
Be specific, encouraging, and actionable. Plain text only.`

  try {
    const summary = await callAI(apiKey, prompt, { temperature: 0.6, maxTokens: 100 })
    return NextResponse.json({ summary })
  } catch (e) {
    console.error("AI summary failed:", e)
    return NextResponse.json({ summary: "" })
  }
}
