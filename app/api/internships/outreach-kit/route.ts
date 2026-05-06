import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isGeminiKey } from "@/lib/ai/detect-key"

interface OutreachKit {
  subject: string
  body: string
  callScript?: string
}

const SYSTEM = `You write outreach materials for a student looking for an internship.
Output STRICT JSON matching the requested shape. No markdown fences, no commentary.`

function buildPrompt(p: {
  studentName: string
  studentLevel: string
  studentInterests: string[]
  resumeText?: string
  company: string
  industry: string
  type: string
  address: string
  scoreReason: string
  complaints: string[]
  opportunity: string
  hasPhone: boolean
}) {
  const resume = p.resumeText ? `\nResume excerpt:\n${p.resumeText.slice(0, 1200)}\n` : ""
  const complaintLine = p.complaints.length
    ? `Recent customer complaints we could help with: ${p.complaints.join(", ")}.`
    : ""
  const oppLine = p.opportunity ? `Where an intern could plausibly help: ${p.opportunity}.` : ""

  return `Student: ${p.studentName} (${p.studentLevel})
Student interests: ${p.studentInterests.join(", ") || "general"}
${resume}

Target company: ${p.company}
Industry: ${p.industry}
Type: ${p.type}
Address: ${p.address}
Why they're a good fit: ${p.scoreReason}
${complaintLine}
${oppLine}

Write a SHORT, specific cold email asking about an internship at this company.
- Subject line: under 60 chars, no clickbait, mentions the company.
- Body: 90–150 words. First person. Reference one concrete thing about the company
  (their industry, the complaint area, or the opportunity above) — not generic
  "I admire your work". End with a clear ask for a 15-minute call or to send a resume.

${p.hasPhone ? `Also write a 30-second voicemail script the student could leave if they call the company's listed phone number. Friendly, names the company, says who's calling, why, and leaves a callback ask. Plain text, ~60 words.` : ""}

Return JSON:
{
  "subject": string,
  "body": string${p.hasPhone ? `,\n  "callScript": string` : ""}
}`
}

async function callGroq(apiKey: string, prompt: string): Promise<OutreachKit | null> {
  const Groq = (await import("groq-sdk")).default
  const client = new Groq({ apiKey })
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 800,
    response_format: { type: "json_object" },
  })
  return parse(completion.choices[0]?.message?.content ?? "")
}

async function callGemini(apiKey: string, prompt: string): Promise<OutreachKit | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: SYSTEM + "\n\n" + prompt }] }],
      generationConfig: { temperature: 0.5, responseMimeType: "application/json" },
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return parse(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "")
}

function parse(raw: string): OutreachKit | null {
  try {
    const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw
    const obj = JSON.parse(json)
    if (typeof obj.subject !== "string" || typeof obj.body !== "string") return null
    return {
      subject: obj.subject,
      body: obj.body,
      callScript: typeof obj.callScript === "string" ? obj.callScript : undefined,
    }
  } catch { return null }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { contactId, meta } = body as {
    contactId?: string
    meta?: {
      company?: string; industry?: string; type?: string; address?: string
      scoreReason?: string; complaints?: string[]; opportunity?: string
      hasPhone?: boolean
    }
  }

  let dbContact: any = null
  if (contactId) {
    const { data } = await supabase
      .from("internship_contacts")
      .select("*")
      .eq("id", contactId)
      .single()
    dbContact = data
  }

  const company = meta?.company || dbContact?.company || ""
  if (!company) return NextResponse.json({ error: "Missing company name" }, { status: 400 })

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()
  const profile = profileRaw as {
    ai_api_key?: string; name?: string; academic_level?: string
    resume_text?: string; interests?: string[]
  } | null

  const apiKey = profile?.ai_api_key || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "No AI API key configured. Add one in Settings." },
      { status: 500 }
    )
  }

  const prompt = buildPrompt({
    studentName: profile?.name || "Student",
    studentLevel: profile?.academic_level || "undergraduate",
    studentInterests: profile?.interests || [],
    resumeText: profile?.resume_text,
    company,
    industry: meta?.industry || dbContact?.role?.replace(/ Intern$/, "") || "",
    type: meta?.type || "Business",
    address: meta?.address || "",
    scoreReason: meta?.scoreReason || "",
    complaints: meta?.complaints || [],
    opportunity: meta?.opportunity || "",
    hasPhone: !!meta?.hasPhone,
  })

  try {
    const useGemini = isGeminiKey(apiKey) || (!isGeminiKey(apiKey) && !!process.env.GEMINI_API_KEY)
    let result: OutreachKit | null = null
    if (useGemini) {
      const key = isGeminiKey(apiKey) ? apiKey : (process.env.GEMINI_API_KEY as string)
      result = await callGemini(key, prompt)
    }
    if (!result) result = await callGroq(apiKey, prompt)
    if (!result) return NextResponse.json({ error: "AI returned empty result." }, { status: 502 })
    return NextResponse.json(result)
  } catch (e: any) {
    console.error("Outreach kit gen failed:", e.message)
    return NextResponse.json({ error: e.message || "Generation failed." }, { status: 500 })
  }
}
