import { createClient } from "@/lib/supabase/server"
import { generateEmail } from "@/lib/ai/groq"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { researcherId, tone, templateId } = await req.json()

  const { data: researcher } = await supabase
    .from("researchers")
    .select("*, papers(*)")
    .eq("id", researcherId)
    .single()

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()
  const profile = profileRaw as { ai_api_key?: string; name?: string; academic_level?: string; resume_text?: string; interests?: string[] } | null

  if (!researcher) return NextResponse.json({ error: "Researcher not found" }, { status: 404 })

  let templateBody = ""
  let templateSubject = ""
  if (templateId) {
    const { data: template } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single()
    if (template) {
      templateBody = template.body
      templateSubject = template.subject_line
    }
  }

  const params = {
    professorName: researcher.name,
    university: researcher.university,
    researchAreas: researcher.research_areas || [],
    papers: (researcher as any).papers || [],
    userInterests: profile?.interests || [],
    userLevel: profile?.academic_level || "Student",
    userName: profile?.name || "Student",
    resumeText: profile?.resume_text || undefined,
    tone: (tone || "formal") as "formal" | "casual" | "enthusiastic",
    templateSubject: templateSubject || undefined,
    templateBody: templateBody || undefined,
  }

  const groqKey = profile?.ai_api_key || process.env.GROQ_API_KEY

  if (!groqKey) {
    return NextResponse.json(
      { error: "No Groq API key found. Add your Groq API key in Settings." },
      { status: 500 }
    )
  }

  try {
    const result = await generateEmail({ ...params, apiKey: groqKey })
    if (result.subject && result.body) return NextResponse.json(result)
    return NextResponse.json({ error: "Email generation returned empty result." }, { status: 500 })
  } catch (e: any) {
    console.error("Groq email gen failed:", e.message)
    return NextResponse.json({ error: e.message || "Email generation failed." }, { status: 500 })
  }
}
