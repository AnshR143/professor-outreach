import { createClient } from "@/lib/supabase/server"
import { generateInternshipEmail } from "@/lib/ai/groq"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { contactId, tone } = await req.json()

  const { data: contact } = await supabase
    .from("internship_contacts")
    .select("*")
    .eq("id", contactId)
    .single()

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()
  const profile = profileRaw as { ai_api_key?: string; name?: string; academic_level?: string; resume_text?: string; interests?: string[] } | null

  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 })

  const groqKey = profile?.ai_api_key || process.env.GROQ_API_KEY
  if (!groqKey) {
    return NextResponse.json(
      { error: "No Groq API key found. Add your Groq API key in Settings." },
      { status: 500 }
    )
  }

  try {
    const result = await generateInternshipEmail({
      companyName: contact.company,
      role: contact.role,
      contactName: contact.contact_name || "",
      bio: contact.bio || undefined,
      userInterests: profile?.interests || [],
      userLevel: profile?.academic_level || "Student",
      userName: profile?.name || "Student",
      resumeText: profile?.resume_text || undefined,
      tone: (tone || "formal") as "formal" | "casual" | "enthusiastic",
      apiKey: groqKey,
    })
    if (result.subject && result.body) return NextResponse.json(result)
    return NextResponse.json({ error: "Email generation returned empty result." }, { status: 500 })
  } catch (e: any) {
    console.error("Internship email gen failed:", e.message)
    return NextResponse.json({ error: e.message || "Email generation failed." }, { status: 500 })
  }
}
