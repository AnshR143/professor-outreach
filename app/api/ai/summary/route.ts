import { createClient } from "@/lib/supabase/server"
import { generateAISummary } from "@/lib/ai/groq"
import { NextResponse } from "next/server"

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

  const body = await req.json()
  const groqKey = profile?.ai_api_key || process.env.GROQ_API_KEY
  
  // Try Groq
  if (groqKey) {
    try {
      const summary = await generateAISummary({ ...body, userName: profile?.name || body.userName, apiKey: groqKey })
      return NextResponse.json({ summary })
    } catch (e) {
      console.error("Groq summary failed:", e)
    }
  }

  return NextResponse.json({ summary: "" })
}
