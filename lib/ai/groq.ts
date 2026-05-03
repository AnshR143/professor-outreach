import Groq from "groq-sdk"

let groqClient: Groq | null = null

function getGroq(apiKey?: string): Groq {
  const key = apiKey || process.env.GROQ_API_KEY
  if (!key) throw new Error("No Groq API key found. Add GROQ_API_KEY to .env.local or set it in Settings.")
  if (!groqClient || apiKey) {
    groqClient = new Groq({ apiKey: key })
  }
  return groqClient
}

const MODEL = "llama-3.3-70b-versatile"

// Parse plain-text "SUBJECT: ...\nBODY:\n..." format — avoids JSON escaping issues
function parseSubjectBody(raw: string): { subject: string; body: string } {
  const subjectMatch = raw.match(/SUBJECT:\s*(.+)/i)
  const bodyMatch = raw.match(/BODY:\s*\n?([\s\S]+)/i)
  const subject = subjectMatch?.[1]?.trim() || "Research Opportunity Inquiry"
  const body = bodyMatch?.[1]?.trim() || raw.trim()
  return { subject, body }
}

export async function generateEmail(params: {
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
  apiKey?: string
}): Promise<{ subject: string; body: string }> {
  const groq = getGroq(params.apiKey)

  const toneGuide = {
    formal: "professional, respectful, concise, third-person references",
    casual: "friendly, conversational, approachable but still professional",
    enthusiastic: "energetic, passionate, show genuine excitement about their work",
  }[params.tone]

  const recentPaper = params.papers[0]
  
  let prompt = ""

  const resumeSection = params.resumeText
    ? `STUDENT RESUME (use specific skills, projects, courses, and experience from this to personalize the email — pick the 2-3 most relevant things that match the professor's work):
---
${params.resumeText.slice(0, 1800)}
---`
    : ""

  if (params.templateBody) {
    prompt = `Fill in an email template that a student (${params.userName}) is sending TO a professor. Write everything in FIRST PERSON ("I", "my", "me") — the student is the author.

STUDENT (the sender):
- Name: ${params.userName}
- Academic Level: ${params.userLevel}
${resumeSection}

PROFESSOR (the recipient):
- Name: ${params.professorName}
- University: ${params.university}
- Research Areas: ${params.researchAreas.join(", ")}
${recentPaper ? `- Recent paper: "${recentPaper.title}"${recentPaper.abstract ? `\n  Abstract: ${recentPaper.abstract.slice(0, 400)}` : ""}` : ""}

TEMPLATE SUBJECT: ${params.templateSubject}
TEMPLATE BODY:
${params.templateBody}

INSTRUCTIONS:
- Fill in the [bracketed placeholders] using the student's actual resume details
- Reference SPECIFIC skills/projects/courses from the resume that relate to this professor's work
- Write all filled-in content in FIRST PERSON ("I am...", "I have...", "My research...")
- Do NOT change non-bracketed text significantly
- Keep the tone ${toneGuide}

Respond in EXACTLY this format with no other text:
SUBJECT: <subject line>
BODY:
<email body>`
  } else {
    prompt = `Write a cold email FROM a student TO a professor, asking for a research opportunity.

CRITICAL: Write the email body in FIRST PERSON from the student's perspective. Use "I", "my", "me". The student is writing this email themselves. Do NOT write about the student in third person.

STUDENT (the sender):
- Name: ${params.userName}
- Academic Level: ${params.userLevel}
${resumeSection}

PROFESSOR (the recipient):
- Name: ${params.professorName}
- University: ${params.university}
- Research Areas: ${params.researchAreas.join(", ")}
${recentPaper ? `- Recent paper: "${recentPaper.title}"${recentPaper.abstract ? `\n  Abstract: ${recentPaper.abstract.slice(0, 400)}` : ""}` : ""}

TONE: ${toneGuide}

Requirements:
1. Start with "Dear Professor ${params.professorName.split(" ").pop()}," or "Dear Dr. ${params.professorName.split(" ").pop()},"
2. First sentence: briefly introduce yourself (name, level, institution if available from resume)
3. Reference their specific research or recent paper naturally
4. Pull 1-2 SPECIFIC things from the resume (a project name, a course, a skill, a past role) that connect to this professor's work — make it feel hand-written, not generic
5. Make a clear ask (research collaboration, meeting, unpaid internship, etc.)
6. Sign off with the student's name: ${params.userName}
7. Under 220 words, plain text, no markdown, no bullet points in body

Respond in EXACTLY this format with no other text:
SUBJECT: <subject line>
BODY:
<email body>`
  }

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
  })

  const raw = completion.choices[0].message.content || ""
  return parseSubjectBody(raw)
}

export async function calculateMatchScore(params: {
  userInterests: string[]
  userLevel: string
  professorResearchAreas: string[]
  professorBio?: string
  apiKey?: string
}): Promise<{ score: number; explanation: string }> {
  const groq = getGroq(params.apiKey)

  const prompt = `Rate how well a student matches a professor for research collaboration.

STUDENT: ${params.userLevel}, interests: ${params.userInterests.join(", ")}
PROFESSOR: research areas: ${params.professorResearchAreas.join(", ")}${params.professorBio ? `, bio: ${params.professorBio.slice(0, 200)}` : ""}

Return JSON: {"score": <0-100 integer>, "explanation": "<1-2 sentence why they match>"}
Be realistic. Only 85+ if there's very strong overlap.`

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 200,
  })

  const raw = completion.choices[0].message.content || ""
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
  const result = JSON.parse(clean || "{}")
  return { score: Math.min(100, Math.max(0, result.score || 70)), explanation: result.explanation || "" }
}

export async function summarizePaper(title: string, abstract: string, apiKey?: string): Promise<string> {
  const groq = getGroq(apiKey)
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{
      role: "user",
      content: `Summarize this research paper in 2-3 sentences for a high school/undergrad student:\nTitle: ${title}\nAbstract: ${abstract}`
    }],
    temperature: 0.3,
    max_tokens: 150,
  })
  return completion.choices[0].message.content || ""
}

export async function generateFollowUp(params: {
  originalEmail: string
  professorName: string
  daysSince: number
  apiKey?: string
}): Promise<{ subject: string; body: string }> {
  const groq = getGroq(params.apiKey)
  const prompt = `Write a brief, polite follow-up email to Professor ${params.professorName}.
Original email sent ${params.daysSince} days ago. Keep it under 80 words, friendly, not pushy.
Original: "${params.originalEmail.slice(0, 300)}"

Respond in EXACTLY this format with no other text:
SUBJECT: <subject line>
BODY:
<email body>`

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 300,
  })

  const raw = completion.choices[0].message.content || ""
  const result = parseSubjectBody(raw)
  return { subject: result.subject || "Following Up", body: result.body || "" }
}

export async function generateInternshipEmail(params: {
  companyName: string
  role: string
  contactName: string
  bio?: string
  userInterests: string[]
  userLevel: string
  userName: string
  resumeText?: string
  tone: "formal" | "casual" | "enthusiastic"
  templateSubject?: string
  templateBody?: string
  apiKey?: string
}): Promise<{ subject: string; body: string }> {
  const groq = getGroq(params.apiKey)

  const toneGuide = {
    formal: "professional, respectful, concise",
    casual: "friendly, conversational, approachable but still professional",
    enthusiastic: "energetic, passionate, show genuine excitement about the company and role",
  }[params.tone]

  const resumeSection = params.resumeText
    ? `STUDENT RESUME (pick the 2-3 most relevant skills/projects/experiences for this role):
---
${params.resumeText.slice(0, 1800)}
---`
    : ""

  let prompt = ""

  if (params.templateBody) {
    prompt = `Fill in an email template that a student (${params.userName}) is sending TO a company contact about an internship.

STUDENT (the sender):
- Name: ${params.userName}
- Academic Level: ${params.userLevel}
${resumeSection}

COMPANY / ROLE:
- Company: ${params.companyName}
- Role: ${params.role}
- Contact: ${params.contactName || "Hiring Manager"}
${params.bio ? `- Company info: ${params.bio.slice(0, 300)}` : ""}

TEMPLATE SUBJECT: ${params.templateSubject}
TEMPLATE BODY:
${params.templateBody}

INSTRUCTIONS:
- Fill in the [bracketed placeholders] using real details
- Write in FIRST PERSON ("I", "my", "me") — the student is the author
- Reference SPECIFIC skills/projects from the resume relevant to this role
- Keep the tone ${toneGuide}

Respond in EXACTLY this format:
SUBJECT: <subject line>
BODY:
<email body>`
  } else {
    prompt = `Write a cold email FROM a student TO a company contact, asking for an internship opportunity.

CRITICAL: Write in FIRST PERSON from the student's perspective. Use "I", "my", "me".

STUDENT (the sender):
- Name: ${params.userName}
- Academic Level: ${params.userLevel}
${resumeSection}

COMPANY / ROLE (the recipient):
- Company: ${params.companyName}
- Role/Position: ${params.role}
- Contact Person: ${params.contactName || "Hiring Manager"}
${params.bio ? `- About the company/role: ${params.bio.slice(0, 300)}` : ""}

TONE: ${toneGuide}

Requirements:
1. Address: "Dear ${params.contactName || "Hiring Manager"},"
2. Introduce yourself (name, level, school if in resume)
3. Mention the specific role and why THIS company/role excites you
4. Pull 1-2 SPECIFIC things from the resume (a project, skill, course) that directly relate to this role
5. Make a clear ask (internship opportunity, 15-min call, etc.)
6. Sign off with: ${params.userName}
7. Under 200 words, plain text, no markdown, no bullet points in body

Respond in EXACTLY this format:
SUBJECT: <subject line>
BODY:
<email body>`
  }

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 900,
  })

  const raw = completion.choices[0].message.content || ""
  return parseSubjectBody(raw)
}

export async function generateAISummary(params: {
  totalResearchers: number
  emailsSent: number
  topFields: string[]
  topUniversities: string[]
  userName: string
  apiKey?: string
}): Promise<string> {
  const groq = getGroq(params.apiKey)
  const prompt = `Write a 2-sentence encouraging AI summary for a student's research outreach dashboard.
Student: ${params.userName}
Stats: ${params.totalResearchers} researchers found, ${params.emailsSent} emails sent
Top fields: ${params.topFields.join(", ")}
Top universities: ${params.topUniversities.join(", ")}
Be specific, encouraging, and actionable. Plain text only.`

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
    max_tokens: 100,
  })
  return completion.choices[0].message.content || ""
}
