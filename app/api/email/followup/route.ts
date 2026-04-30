import { createClient } from "@/lib/supabase/server"
import { generateFollowUp } from "@/lib/ai/groq"
import { generateFollowUpGemini } from "@/lib/ai/gemini"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { researcherId, originalBody, daysSince } = await req.json()
  const { data: researcher } = await supabase.from("researchers").select("name").eq("id", researcherId).single()
  const { data: profileRaw } = await supabase.from("profiles").select("groq_api_key, gemini_api_key").eq("user_id", user.id).single()
  const profile = profileRaw as { groq_api_key?: string; gemini_api_key?: string } | null

  const groqKey = profile?.groq_api_key || process.env.GROQ_API_KEY
  const geminiKey = profile?.gemini_api_key || process.env.GEMINI_API_KEY

  const base = {
    originalEmail: originalBody || "",
    professorName: researcher?.name || "Professor",
    daysSince: daysSince || 7,
  }

  if (groqKey) {
    try {
      const result = await generateFollowUp({ ...base, apiKey: groqKey })
      return NextResponse.json(result)
    } catch (e: any) {
      console.error("Groq follow-up failed:", e.message)
    }
  }

  if (geminiKey) {
    try {
      const result = await generateFollowUpGemini({ ...base, apiKey: geminiKey })
      return NextResponse.json(result)
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "No AI API key configured." }, { status: 500 })
}
