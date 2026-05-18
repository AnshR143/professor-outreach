import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { callAI } from "@/lib/ai/call"

function parseSubjectBody(raw: string): { subject: string; body: string } {
  const subjectMatch = raw.match(/SUBJECT:\s*(.+)/i)
  const bodyMatch = raw.match(/BODY:\s*\n?([\s\S]+)/i)
  const subject = subjectMatch?.[1]?.trim() || "Following Up"
  let body = bodyMatch?.[1]?.trim()
  if (!body) body = raw.replace(/SUBJECT:\s*.+(\r?\n)*/i, "").trim()
  return { subject, body: body || raw.trim() }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { researcherId, originalBody, daysSince } = await req.json()
  const { data: researcher } = await supabase.from("researchers").select("name").eq("id", researcherId).single()
  const { data: profileRaw } = await supabase.from("profiles").select("ai_api_key").eq("user_id", user.id).single()
  const profile = profileRaw as { ai_api_key?: string } | null

  const apiKey = profile?.ai_api_key || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "No AI API key configured. Add your API key in Settings." }, { status: 500 })
  }

  const professorName = researcher?.name || "Professor"
  const prompt = `Write a brief, polite follow-up email to Professor ${professorName}.
Original email sent ${daysSince || 7} days ago. Keep it under 80 words, friendly, not pushy.
Original: "${(originalBody || "").slice(0, 300)}"

Respond in EXACTLY this format with no other text:
SUBJECT: <subject line>
BODY:
<email body>`

  try {
    const raw = await callAI(apiKey, prompt, { temperature: 0.7, maxTokens: 300 })
    const result = parseSubjectBody(raw)
    return NextResponse.json({ subject: result.subject, body: result.body })
  } catch (e: any) {
    console.error("Follow-up generation failed:", e.message)
    return NextResponse.json({ error: e.message || "Follow-up generation failed." }, { status: 500 })
  }
}
