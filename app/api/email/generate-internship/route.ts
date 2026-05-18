import { createClient } from "@/lib/supabase/server"
import { generateInternshipEmailGemini } from "@/lib/ai/gemini"
import { detectApiKey } from "@/lib/ai/detect-key"
import { callAI } from "@/lib/ai/call"
import { NextResponse } from "next/server"

function parseSubjectBody(raw: string): { subject: string; body: string } {
  const subjectMatch = raw.match(/SUBJECT:\s*(.+)/i)
  const bodyMatch = raw.match(/BODY:\s*\n?([\s\S]+)/i)
  const subject = subjectMatch?.[1]?.trim() || "Internship Opportunity Inquiry"
  let body = bodyMatch?.[1]?.trim()
  if (!body) body = raw.replace(/SUBJECT:\s*.+(\r?\n)*/i, "").trim()
  return { subject, body: body || raw.trim() }
}

function buildUniversalPrompt(p: {
  contactName: string
  company: string
  role: string
  bio?: string
  notes?: string
  website?: string
  linkedinUrl?: string
  whyApply?: string
  userInterests: string[]
  userLevel: string
  userName: string
  resumeText?: string
  tone: "formal" | "casual" | "enthusiastic"
}): string {
  const toneGuide = {
    formal: "professional, respectful, concise",
    casual: "friendly, conversational, approachable but still professional",
    enthusiastic: "energetic, passionate, show genuine excitement about the company and role",
  }[p.tone]

  const resumeSection = p.resumeText
    ? `STUDENT RESUME (pick the 2-3 most relevant skills/projects/experiences for this role):\n---\n${p.resumeText.slice(0, 1800)}\n---`
    : ""

  const contextLines = [
    p.bio ? `About the company/role: ${p.bio.slice(0, 300)}` : "",
    p.notes ? `Additional context: ${p.notes.slice(0, 200)}` : "",
    p.website ? `Website: ${p.website}` : "",
    p.linkedinUrl ? `LinkedIn: ${p.linkedinUrl}` : "",
    p.whyApply ? `Why they want this internship: ${p.whyApply}` : "",
  ].filter(Boolean).join("\n")

  return `Write a cold email FROM a student TO a company contact, asking for an internship opportunity.

CRITICAL: Write in FIRST PERSON from the student's perspective. Use "I", "my", "me".

STUDENT (the sender):
- Name: ${p.userName}
- Academic Level: ${p.userLevel}
- Interests: ${p.userInterests.join(", ") || "general"}
${resumeSection}

COMPANY / ROLE (the recipient):
- Company: ${p.company}
- Role/Position: ${p.role}
- Contact Person: ${p.contactName || "Hiring Manager"}
${contextLines}

TONE: ${toneGuide}

Requirements:
1. Address: "Dear ${p.contactName || "Hiring Manager"},"
2. Introduce yourself (name, level, school if in resume)
3. Mention the specific role and why THIS company/role excites you
4. Pull 1-2 SPECIFIC things from the resume (a project, skill, course) that directly relate to this role
5. Make a clear ask (internship opportunity, 15-min call, etc.)
6. Sign off with: ${p.userName}
7. Under 200 words, plain text, no markdown, no bullet points in body

Respond in EXACTLY this format:
SUBJECT: <subject line>
BODY:
<email body>`
}

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

  const { provider, label } = detectApiKey(apiKey)

  try {
    let result: { subject: string; body: string }

    if (provider === "gemini") {
      // Gemini has a dedicated function with smart resume extraction
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
        apiKey,
      })
    } else {
      // Universal path — works with Groq, OpenAI, OpenRouter, Cerebras, xAI, Perplexity, Fireworks, Anthropic, Together, Mistral, etc.
      const prompt = buildUniversalPrompt({
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
      })
      const raw = await callAI(apiKey, prompt, { temperature: 0.7, maxTokens: 900 })
      result = parseSubjectBody(raw)
    }

    console.log(`Internship email generated via ${label}`)
    if (result.subject && result.body) return NextResponse.json(result)
    return NextResponse.json({ error: "Email generation returned empty result." }, { status: 500 })
  } catch (e: any) {
    console.error("Internship email gen failed:", e.message)
    return NextResponse.json({ error: e.message || "Email generation failed." }, { status: 500 })
  }
}
