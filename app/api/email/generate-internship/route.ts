import { createClient } from "@/lib/supabase/server"
import { generateInternshipEmailGemini } from "@/lib/ai/gemini"
import { detectApiKey } from "@/lib/ai/detect-key"
import { callAI } from "@/lib/ai/call"
import { EMAIL_STYLE_RULES, HUMAN_TONE_GUIDE, STUDENT_ACCURACY_RULES } from "@/lib/ai/email-style"
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
  school?: string
  resumeText?: string
  tone: "formal" | "casual" | "enthusiastic"
}): string {
  const toneGuide = HUMAN_TONE_GUIDE[p.tone]
  const schoolLine = p.school ? `\n- School: ${p.school}` : ""

  const resumeSection = p.resumeText
    ? `STUDENT BACKGROUND (their resume — pull the 1-2 most relevant CONCRETE things: a specific project, skill, or experience that directly relates to this role):\n---\n${p.resumeText.slice(0, 1800)}\n---`
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

${EMAIL_STYLE_RULES}

${STUDENT_ACCURACY_RULES}

STUDENT (the sender):
- Name: ${p.userName}
- Academic Level: ${p.userLevel}${schoolLine}
- Interests: ${p.userInterests.join(", ") || "general"}
${resumeSection}

COMPANY / ROLE (the recipient):
- Company: ${p.company}
- Role/Position: ${p.role}
- Contact Person: ${p.contactName || "Hiring Manager"}
${contextLines}

TONE: ${toneGuide}

WHAT THE EMAIL MUST DO (keep each step tight — one or two short sentences):
1. Greeting: "Dear ${p.contactName || "Hiring Manager"},"
2. Say who you are in one sentence, ACCURATELY: your name and your real grade level + school exactly as given above (e.g. a high-school junior at their named school — never call yourself a university/college student unless that is your stated level).
3. Name the specific role and one concrete, genuine reason this company/role fits you — not generic excitement.
4. Connect 1-2 CONCRETE things from the resume (a project, skill, course) that directly relate to this role.
5. End with one clear, specific, low-pressure ask (e.g. whether they're taking interns, or a 10-15 minute chat).
6. Sign off with your name on its own line: ${p.userName}

ALSO:
- Subject line must be specific — name the role or the ask. Never generic like "Internship Inquiry".
- Plain text, no markdown, no bullet points inside the email.
- Separate each paragraph with a blank line. Keep paragraphs to 1-2 sentences.

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
    institution?: string; resume_text?: string; interests?: string[]
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
        school: profile?.institution || undefined,
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
        school: profile?.institution || undefined,
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
