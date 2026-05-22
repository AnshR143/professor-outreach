import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { detectApiKey } from "@/lib/ai/detect-key"
import { callAI } from "@/lib/ai/call"

function parseSubjectBody(raw: string): { subject: string; body: string } {
  const subjectMatch = raw.match(/SUBJECT:\s*(.+)/i)
  const bodyMatch = raw.match(/BODY:\s*\n?([\s\S]+)/i)
  const subject = subjectMatch?.[1]?.trim() || "Research Opportunity Inquiry"
  let body = bodyMatch?.[1]?.trim()
  if (!body) body = raw.replace(/SUBJECT:\s*.+(\r?\n)*/i, "").trim()
  return { subject, body: body || raw.trim() }
}

function buildProfessorEmailPrompt(p: {
  professorName: string
  university: string
  researchAreas: string[]
  papers: Array<{ title: string; abstract?: string }>
  userInterests: string[]
  userLevel: string
  userName: string
  resumeText?: string
  tone: "formal" | "casual" | "enthusiastic"
  templateSubject?: string
  templateBody?: string
}): string {
  const toneGuide = {
    formal: "professional, respectful, concise, third-person references",
    casual: "friendly, conversational, approachable but still professional",
    enthusiastic: "energetic, passionate, show genuine excitement about their work",
  }[p.tone]

  const recentPaper = p.papers[0]
  const resumeSection = p.resumeText
    ? `STUDENT RESUME (use specific skills, projects, courses, and experience from this to personalize the email — pick the 2-3 most relevant things that match the professor's work):\n---\n${p.resumeText.slice(0, 1800)}\n---`
    : ""

  if (p.templateBody) {
    return `Fill in an email template that a student (${p.userName}) is sending TO a professor. Write everything in FIRST PERSON ("I", "my", "me") — the student is the author.

STUDENT (the sender):
- Name: ${p.userName}
- Academic Level: ${p.userLevel}
${resumeSection}

PROFESSOR (the recipient):
- Name: ${p.professorName}
- University: ${p.university}
- Research Areas: ${p.researchAreas.join(", ")}
${recentPaper ? `- Recent paper: "${recentPaper.title}"${recentPaper.abstract ? `\n  Abstract: ${recentPaper.abstract.slice(0, 400)}` : ""}` : ""}

TEMPLATE SUBJECT: ${p.templateSubject}
TEMPLATE BODY:
${p.templateBody}

INSTRUCTIONS:
- Fill in the [bracketed placeholders] using real details
- Write in FIRST PERSON ("I", "my", "me") — the student is the author
- Reference SPECIFIC skills/projects from the resume relevant to this professor
- Keep the tone ${toneGuide}
- Use proper paragraph spacing — separate each paragraph with a blank line

Respond in EXACTLY this format:
SUBJECT: <subject line>
BODY:
<email body>`
  }

  return `Write a cold email FROM a student TO a professor asking about research opportunities.

CRITICAL: Write in FIRST PERSON from the student's perspective. Use "I", "my", "me".

STUDENT (the sender):
- Name: ${p.userName}
- Academic Level: ${p.userLevel}
- Interests: ${p.userInterests.join(", ") || "general"}
${resumeSection}

PROFESSOR (the recipient):
- Name: ${p.professorName}
- University: ${p.university}
- Research Areas: ${p.researchAreas.join(", ")}
${recentPaper ? `- Recent paper: "${recentPaper.title}"${recentPaper.abstract ? `\n  Abstract: ${recentPaper.abstract.slice(0, 400)}` : ""}` : ""}

TONE: ${toneGuide}

Requirements:
1. Address: "Dear Professor ${p.professorName.split(" ").pop()},"
2. Introduce yourself (name, level, field of study)
3. Reference the professor's specific research area (not generic praise)
4. Pull 1-2 SPECIFIC things from the resume that connect to their work
5. Make a clear ask (research opportunity, 15-min call, etc.)
6. Sign off with: ${p.userName}
7. Under 200 words, plain text, no markdown
8. Use proper paragraph spacing — separate each paragraph with a blank line (two newlines). Each distinct thought (intro, research reference, your connection, the ask, sign-off) should be its own paragraph.

Respond in EXACTLY this format:
SUBJECT: <subject line>
BODY:
<email body>`
}

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
  const profile = profileRaw as {
    ai_api_key?: string; name?: string; academic_level?: string
    resume_text?: string; interests?: string[]
  } | null

  if (!researcher) return NextResponse.json({ error: "Researcher not found" }, { status: 404 })

  let templateBody = ""
  let templateSubject = ""
  if (templateId) {
    const { data: template } = await supabase
      .from("templates").select("*").eq("id", templateId).single()
    if (template) {
      templateBody = (template as any).body
      templateSubject = (template as any).subject_line
    }
  }

  const apiKey = profile?.ai_api_key || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key found. Add your API key in Settings." },
      { status: 500 }
    )
  }

  const { label } = detectApiKey(apiKey)

  const prompt = buildProfessorEmailPrompt({
    professorName: researcher.name,
    university: researcher.university,
    researchAreas: (researcher as any).research_areas || [],
    papers: (researcher as any).papers || [],
    userInterests: profile?.interests || [],
    userLevel: profile?.academic_level || "Student",
    userName: profile?.name || "Student",
    resumeText: profile?.resume_text || undefined,
    tone: (tone || "formal") as "formal" | "casual" | "enthusiastic",
    templateSubject: templateSubject || undefined,
    templateBody: templateBody || undefined,
  })

  try {
    const raw = await callAI(apiKey, prompt, { temperature: 0.7, maxTokens: 900 })
    const result = parseSubjectBody(raw)
    console.log(`Professor email generated via ${label}`)
    if (result.subject && result.body) return NextResponse.json(result)
    return NextResponse.json({ error: "Email generation returned empty result." }, { status: 500 })
  } catch (e: any) {
    console.error("Email gen failed:", e.message)
    return NextResponse.json({ error: e.message || "Email generation failed." }, { status: 500 })
  }
}
