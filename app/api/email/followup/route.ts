import { createClient } from "@/lib/supabase/server"
import { generateFollowUp } from "@/lib/ai/groq"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { researcherId, originalBody, daysSince } = await req.json()
  const { data: researcher } = await supabase.from("researchers").select("name").eq("id", researcherId).single()
  const { data: profileRaw } = await supabase.from("profiles").select("ai_api_key").eq("user_id", user.id).single()
  const profile = profileRaw as { ai_api_key?: string } | null

  const groqKey = profile?.ai_api_key || process.env.GROQ_API_KEY

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
      return NextResponse.json({ error: e.message || "Follow-up generation failed." }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "No AI API key configured. Add your API key in Settings." }, { status: 500 })
}
