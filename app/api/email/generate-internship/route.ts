import { createClient } from "@/lib/supabase/server"
import { generateInternshipEmail } from "@/lib/ai/groq"
import { generateInternshipEmailGemini } from "@/lib/ai/gemini"
import { isGeminiKey as detectGemini } from "@/lib/ai/detect-key"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { contactId, tone } = await req.json()

  const { data: contactRaw } = await supabase
    .from("internship_contacts")
    .select("*")
    .eq("id", contactId)
    .single()
  const contact = contactRaw as {
    id: string; company: string; role: string; contact_name: string
    bio?: string | null; notes?: string | null; website?: string | null
    linkedin_url?: string | null; why_apply?: string | null; email?: string | null
  } | null

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()
  const profile = profileRaw as {
    ai_api_key?: string; name?: string; academic_level?: string
    resume_text?: string; interests?: string[]
  } | null

  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 })

  const apiKey = profile?.ai_api_key || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key found. Add your API key in Settings." },
      { status: 500 }
    )
  }

  const useGemini = detectGemini(apiKey) || (!detectGemini(apiKey) && !!process.env.GEMINI_API_KEY)

  try {
    let result: { subject: string; body: string }

    // Try Gemini first (better personalization) — fall back to Groq
    if (useGemini) {
      const geminiKey = (detectGemini(apiKey) ? apiKey : process.env.GEMINI_API_KEY) as string
      result = await generateInternshipEmailGemini({
        contactName: contact.contact_name || "",
        company: contact.company || "",
        role: contact.role || "",
        bio: contact.bio || undefined,
        notes: contact.notes || undefined,
        website: contact.website || undefined,
        linkedinUrl: contact.linkedin_url || undefined,
        whyApply: contact.why_apply || undefined,
        userInterests: profile?.interests || [],
        userLevel: profile?.academic_level || "Student",
        userName: profile?.name || "Student",
        resumeText: profile?.resume_text || undefined,
        tone: (tone || "formal") as "formal" | "casual" | "enthusiastic",
        apiKey: geminiKey,
      })
    } else {
      // Groq fallback
      result = await generateInternshipEmail({
        companyName: contact.company,
        role: contact.role,
        contactName: contact.contact_name || "",
        bio: [contact.bio, contact.notes].filter(Boolean).join("\n") || undefined,
        userInterests: profile?.interests || [],
        userLevel: profile?.academic_level || "Student",
        userName: profile?.name || "Student",
        resumeText: profile?.resume_text || undefined,
        tone: (tone || "formal") as "formal" | "casual" | "enthusiastic",
        apiKey,
      })
    }

    if (result.subject && result.body) return NextResponse.json(result)
    return NextResponse.json({ error: "Email generation returned empty result." }, { status: 500 })
  } catch (e: any) {
    console.error("Internship email gen failed:", e.message)
    return NextResponse.json({ error: e.message || "Email generation failed." }, { status: 500 })
  }
}
