import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { detectApiKey } from "@/lib/ai/detect-key"
import { callAI } from "@/lib/ai/call"
import { getAiKey } from "@/lib/ai/key-pool"
import { EMAIL_STYLE_RULES, HUMAN_TONE_GUIDE, STUDENT_ACCURACY_RULES } from "@/lib/ai/email-style"

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
  school?: string
  resumeText?: string
  tone: "formal" | "casual" | "enthusiastic"
  templateSubject?: string
  templateBody?: string
}): string {
  const toneGuide = HUMAN_TONE_GUIDE[p.tone]
  const schoolLine = p.school ? `\n- School: ${p.school}` : ""

  const recentPaper = p.papers[0]
  const resumeSection = p.resumeText
    ? `STUDENT BACKGROUND (their resume — pull the 1-2 most relevant CONCRETE things: a specific project, skill, course, or past research that genuinely connects to this professor's work. Use real specifics, not vague claims):\n---\n${p.resumeText.slice(0, 1800)}\n---`
    : ""

  if (p.templateBody) {
    return `Fill in an email template that a student (${p.userName}) is sending TO a professor. Write everything in FIRST PERSON ("I", "my", "me") — the student is the author.

${EMAIL_STYLE_RULES}

${STUDENT_ACCURACY_RULES}

STUDENT (the sender):
- Name: ${p.userName}
- Academic Level: ${p.userLevel}${schoolLine}
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
- Fill in the [bracketed placeholders] with real, specific details (the actual paper title above, real resume specifics).
- Reference 1-2 concrete things from the resume that genuinely connect to this professor's work.
- Keep the template's structure, but if any sentence sounds like AI filler or breaks the rules above, rewrite it so it sounds like a real person.
- Keep the tone ${toneGuide}.
- Plain text, no markdown. Separate each paragraph with a blank line.

Respond in EXACTLY this format:
SUBJECT: <subject line>
BODY:
<email body>`
  }

  return `Write a cold email FROM a student TO a professor asking about research opportunities.

CRITICAL: Write in FIRST PERSON from the student's perspective. Use "I", "my", "me".

${EMAIL_STYLE_RULES}

${STUDENT_ACCURACY_RULES}

STUDENT (the sender):
- Name: ${p.userName}
- Academic Level: ${p.userLevel}${schoolLine}
- Interests: ${p.userInterests.join(", ") || "general"}
${resumeSection}

PROFESSOR (the recipient):
- Name: ${p.professorName}
- University: ${p.university}
- Research Areas: ${p.researchAreas.join(", ")}
${recentPaper ? `- Recent paper: "${recentPaper.title}"${recentPaper.abstract ? `\n  Abstract: ${recentPaper.abstract.slice(0, 400)}` : ""}` : ""}

TONE: ${toneGuide}

WHAT THE EMAIL MUST DO (keep each step tight — one or two short sentences):
1. Greeting: "Dear Professor ${p.professorName.split(" ").pop()},"
2. Say who you are in one sentence, ACCURATELY: your name and your real grade level + school exactly as given above (e.g. a high-school junior at their named school — never call yourself a university/college student unless that is your stated level).
3. Reference the professor's SPECIFIC work — name the actual paper or topic above and say one genuine, concrete thing about it: an idea that caught your attention or a real question it raised. No empty praise.
4. Connect YOUR own concrete experience (from the resume above) to their work — show why you'd actually be useful, not just interested.
5. End with one clear, specific, low-pressure ask (e.g. whether they're taking students in their lab this term, or a 10-15 minute chat).
6. Sign off with your name on its own line: ${p.userName}

ALSO:
- Subject line must be specific — name the topic or the ask. Never generic like "Research Inquiry" or "Prospective Student".
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
    name?: string; academic_level?: string
    institution?: string; resume_text?: string; interests?: string[]
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

  const apiKey = getAiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service is temporarily unavailable. Please try again in a moment." },
      { status: 503 }
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
    school: profile?.institution || undefined,
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
