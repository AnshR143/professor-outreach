// Gemini AI module

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

function extractJSON(raw: string): Record<string, string> {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No JSON found in Gemini response")
  return JSON.parse(match[0])
}

function parseSubjectBody(raw: string): { subject: string; body: string } {
  const subjectMatch = raw.match(/SUBJECT:\s*(.+)/i)
  const bodyMatch = raw.match(/BODY:\s*\n?([\s\S]+)/i)
  return {
    subject: subjectMatch?.[1]?.trim() || "Reaching Out",
    body: bodyMatch?.[1]?.trim() || raw.trim(),
  }
}

export async function generateEmailGemini(params: {
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
  apiKey: string
}): Promise<{ subject: string; body: string }> {
  const toneGuide = {
    formal: "professional, respectful, concise",
    casual: "friendly, conversational, approachable but still professional",
    enthusiastic: "energetic, passionate, show genuine excitement about their work",
  }[params.tone]

  const recentPaper = params.papers[0]

  let prompt: string

  if (params.templateBody) {
    prompt = `You are helping a student fill out an email template to contact a professor for a research opportunity.

STUDENT INFO:
- Name: ${params.userName}
- Academic Level: ${params.userLevel}
- Research Interests: ${params.userInterests.join(", ")}
${params.resumeText ? `- Resume highlights: ${params.resumeText.slice(0, 500)}` : ""}

PROFESSOR INFO:
- Name: ${params.professorName}
- University: ${params.university}
- Research Areas: ${params.researchAreas.join(", ")}
${recentPaper ? `- Recent paper: "${recentPaper.title}"` : ""}

TEMPLATE SUBJECT: ${params.templateSubject}
TEMPLATE BODY:
${params.templateBody}

Fill in the [bracketed placeholders] using the information above. Keep the tone ${toneGuide}.
Return ONLY valid JSON: {"subject": "...", "body": "..."}`
  } else {
    prompt = `You are helping a student write a cold email to a professor for a research opportunity.

STUDENT INFO:
- Name: ${params.userName}
- Academic Level: ${params.userLevel}
- Research Interests: ${params.userInterests.join(", ")}
${params.resumeText ? `- Resume highlights: ${params.resumeText.slice(0, 500)}` : ""}

PROFESSOR INFO:
- Name: ${params.professorName}
- University: ${params.university}
- Research Areas: ${params.researchAreas.join(", ")}
${recentPaper ? `- Recent paper: "${recentPaper.title}"` : ""}

TONE: ${toneGuide}

Write a personalized cold email under 200 words. Reference their specific research. Sound like a real student.
Return ONLY valid JSON: {"subject": "...", "body": "..."}`
  }

  const raw = await callGemini(params.apiKey, prompt)
  const result = extractJSON(raw)
  return {
    subject: result.subject || "Research Opportunity Inquiry",
    body: result.body || "",
  }
}

export async function generateInternshipEmailGemini(params: {
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
  apiKey: string
}): Promise<{ subject: string; body: string }> {
  const toneGuide = {
    formal: "professional, respectful, concise",
    casual: "friendly, conversational, approachable but still professional",
    enthusiastic: "energetic, passionate, show genuine excitement about the person and company",
  }[params.tone]

  const personDetails: string[] = []
  if (params.bio) personDetails.push("About them: " + params.bio.slice(0, 400))
  if (params.notes) personDetails.push("Additional info: " + params.notes.slice(0, 300))
  if (params.website) personDetails.push("Their website/profile: " + params.website)
  if (params.linkedinUrl) personDetails.push("LinkedIn: " + params.linkedinUrl)
  if (params.whyApply) personDetails.push("Why I want to contact them: " + params.whyApply)

  const resumeSection = params.resumeText
    ? "STUDENT RESUME (use the 2-3 most relevant skills/projects for this role):\n" + params.resumeText.slice(0, 1500)
    : ""

  const recipientName = params.contactName || "the contact"
  const recipientCompany = params.company || "their company"
  const personInfo = personDetails.length > 0 ? personDetails.join("\n") : "(no additional info)"

  const lines = [
    "Write a cold email FROM a student TO a specific professional, asking about internship opportunities or mentorship.",
    "",
    "STUDENT (the sender - write in first person as this person):",
    "- Name: " + params.userName,
    "- Academic Level: " + params.userLevel,
    "- Interests: " + params.userInterests.join(", "),
    resumeSection,
    "",
    "RECIPIENT:",
    "- Name: " + recipientName,
    "- Company: " + recipientCompany,
    "- Role: " + params.role,
    personInfo,
    "",
    "INSTRUCTIONS:",
    "- Write in FIRST PERSON (I, my) - the student is the author",
    "- MUST reference something SPECIFIC about this person from their bio/notes (e.g. a specific article they wrote, a project they work on, their background)",
    "- Reference 1-2 SPECIFIC skills or projects from the student's resume that are relevant to this person's work",
    "- Keep it under 180 words - short and punchy",
    "- Do NOT use generic phrases like I admire your work or I came across your profile",
    "- Sound like a real, thoughtful student - not a template",
    "- Tone: " + toneGuide,
    "- If they have a Dev.to article, mention the article title specifically",
    "- End with a clear, low-pressure ask (e.g. a 15-min chat, not can I intern for you)",
    "",
    "Respond in EXACTLY this format:",
    "SUBJECT: <subject line>",
    "BODY:",
    "<email body>",
  ]

  const prompt = lines.join("\n")
  const raw = await callGemini(params.apiKey, prompt)
  return parseSubjectBody(raw)
}

export async function calculateMatchScoreGemini(params: {
  userInterests: string[]
  userLevel: string
  professorResearchAreas: string[]
  professorBio?: string
  apiKey: string
}): Promise<{ score: number; explanation: string }> {
  const prompt = `Rate how well this student matches a professor for research collaboration.

STUDENT: ${params.userLevel}, interests: ${params.userInterests.join(", ")}
PROFESSOR: research areas: ${params.professorResearchAreas.join(", ")}${params.professorBio ? `, bio: ${params.professorBio.slice(0, 200)}` : ""}

Return ONLY valid JSON: {"score": <0-100 integer>, "explanation": "<1-2 sentence reason>"}`

  const raw = await callGemini(params.apiKey, prompt)
  const result = extractJSON(raw)
  return {
    score: Math.min(100, Math.max(0, parseInt(result.score as any) || 70)),
    explanation: result.explanation || "",
  }
}

export async function generateFollowUpGemini(params: {
  originalEmail: string
  professorName: string
  daysSince: number
  apiKey: string
}): Promise<{ subject: string; body: string }> {
  const prompt = `Write a brief, polite follow-up email to Professor ${params.professorName}.
Original email sent ${params.daysSince} days ago. Keep it under 80 words, friendly, not pushy.
Original: "${params.originalEmail.slice(0, 300)}"
Return ONLY valid JSON: {"subject": "...", "body": "..."}`

  const raw = await callGemini(params.apiKey, prompt)
  const result = extractJSON(raw)
  return {
    subject: result.subject || `Following up - ${params.professorName}`,
    body: result.body || "",
  }
}
