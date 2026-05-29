// Gemini AI module

import { EMAIL_STYLE_RULES, HUMAN_TONE_GUIDE, STUDENT_ACCURACY_RULES } from "./email-style"

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
  
  let subject = subjectMatch?.[1]?.trim() || "Reaching Out"
  let body = bodyMatch?.[1]?.trim()
  
  if (!body) {
    // If the AI forgot 'BODY:', strip out the 'SUBJECT:' line manually
    body = raw.replace(/SUBJECT:\s*.+(\r?\n)*/i, "").trim()
  }
  
  return { subject, body: body || raw.trim() }
}

// ── Smart resume extraction ───────────────────────────────────────────────────
// Instead of dumping the whole resume, pull only the parts that are most
// relevant to this specific recipient's domain. A CS professor gets your
// CS projects; a finance contact gets your business experience.

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  engineering:  ["software", "engineer", "developer", "programming", "code", "system", "api", "backend", "frontend", "fullstack", "devops", "cloud", "algorithm", "computer science", "cs", "infrastructure", "architecture", "database", "distributed", "open source", "github"],
  ml_ai:        ["machine learning", "deep learning", "neural", "model", "training", "artificial intelligence", "nlp", "computer vision", "data science", "pytorch", "tensorflow", "huggingface", "llm", "transformer", "reinforcement", "kaggle", "scikit"],
  business:     ["business", "product", "management", "strategy", "market", "finance", "economics", "consulting", "startup", "venture", "revenue", "growth", "operations", "leadership", "mba", "analytics", "sales", "marketing", "p&l", "b2b", "saas"],
  research:     ["research", "paper", "publication", "lab", "study", "analysis", "experiment", "methodology", "thesis", "phd", "academic", "journal", "conference", "grant", "citation", "hypothesis"],
  design:       ["design", "ui", "ux", "product design", "figma", "user experience", "creative", "visual", "prototype", "wireframe", "typography", "branding"],
  biomedical:   ["biology", "medical", "health", "clinical", "biomedical", "genomics", "drug", "pharmaceutical", "life science", "chemistry", "neuroscience", "bioinformatics", "crispr", "sequencing"],
  data:         ["data", "analytics", "statistics", "sql", "tableau", "power bi", "excel", "pandas", "numpy", "etl", "pipeline", "warehouse", "visualization", "dashboard", "reporting"],
  security:     ["security", "cybersecurity", "cryptography", "penetration", "vulnerability", "network security", "firewall", "ethical hacking", "soc", "incident response"],
}

/** Identify which domain bucket best describes this recipient */
function detectRecipientDomain(role: string, company: string, bio: string, areas: string[]): string[] {
  const ctx = [role, company, bio, ...areas].join(" ").toLowerCase()
  const scores: [string, number][] = Object.entries(DOMAIN_KEYWORDS).map(([domain, kws]) => [
    domain,
    kws.filter(kw => ctx.includes(kw)).length,
  ])
  scores.sort((a, b) => b[1] - a[1])
  // Return keywords from top 1-2 domains that have any matches
  const top = scores.filter(s => s[1] > 0).slice(0, 2)
  if (top.length === 0) return []
  return top.flatMap(([domain]) => DOMAIN_KEYWORDS[domain])
}

/**
 * Extract the 3-5 most relevant resume lines for this specific recipient.
 * Lines are scored by overlap with the recipient's domain keywords.
 * Falls back to a generic snippet if nothing matches well.
 */
function extractRelevantResumeParts(
  resumeText: string,
  recipientRole: string,
  recipientCompany: string,
  recipientBio: string,
  recipientAreas: string[],
  maxLines: number = 4
): string {
  const domainKws = detectRecipientDomain(recipientRole, recipientCompany, recipientBio, recipientAreas)

  const lines = resumeText
    .split(/[\n\r•·–\-]/)
    .map(l => l.trim())
    .filter(l => l.length > 25)

  if (domainKws.length === 0 || lines.length === 0) {
    // No domain detected  fall back to first meaningful chunk
    return lines.slice(0, maxLines).join("\n")
  }

  const scored = lines.map(line => {
    const lower = line.toLowerCase()
    const score = domainKws.filter(kw => lower.includes(kw)).length
    // Bonus for lines that read like achievements (numbers, verbs)
    const achievementBonus = /\d+%|\d+x|built|developed|led|designed|reduced|increased|deployed|published|achieved/.test(lower) ? 0.5 : 0
    return { line, score: score + achievementBonus }
  })

  scored.sort((a, b) => b.score - a.score)

  const relevant = scored.filter(s => s.score > 0).slice(0, maxLines)

  if (relevant.length < 2) {
    // Not enough domain-specific lines  blend top relevant + top overall
    const fallback = lines.slice(0, Math.max(0, maxLines - relevant.length))
    return [...relevant.map(s => s.line), ...fallback].slice(0, maxLines).join("\n")
  }

  return relevant.map(s => s.line).join("\n")
}

// ── Professor email ───────────────────────────────────────────────────────────

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

  // Pull only the resume parts that overlap with this professor's research areas
  const smartResume = params.resumeText
    ? extractRelevantResumeParts(
        params.resumeText,
        params.researchAreas.join(" "),
        params.university,
        "",
        params.researchAreas
      )
    : ""

  const resumeBlock = smartResume
    ? `- Most relevant experience from resume:\n${smartResume}`
    : ""

  let prompt: string

  if (params.templateBody) {
    prompt = `You are helping a student fill out an email template to contact a professor for a research opportunity.

STUDENT INFO:
- Name: ${params.userName}
- Academic Level: ${params.userLevel}
- Research Interests: ${params.userInterests.join(", ")}
${resumeBlock}

PROFESSOR INFO:
- Name: ${params.professorName}
- University: ${params.university}
- Research Areas: ${params.researchAreas.join(", ")}
${recentPaper ? `- Recent paper: "${recentPaper.title}"` : ""}

TEMPLATE SUBJECT: ${params.templateSubject}
TEMPLATE BODY:
${params.templateBody}

Fill in the [bracketed placeholders] using the information above. Keep the tone ${toneGuide}.
Use proper paragraph spacing in the body — separate each paragraph with a blank line (\\n\\n).
Return ONLY valid JSON: {"subject": "...", "body": "..."}`
  } else {
    prompt = `You are helping a student write a cold email to a professor for a research opportunity.

STUDENT INFO:
- Name: ${params.userName}
- Academic Level: ${params.userLevel}
- Research Interests: ${params.userInterests.join(", ")}
${resumeBlock}

PROFESSOR INFO:
- Name: ${params.professorName}
- University: ${params.university}
- Research Areas: ${params.researchAreas.join(", ")}
${recentPaper ? `- Recent paper: "${recentPaper.title}"` : ""}

TONE: ${toneGuide}

Write a personalized cold email under 200 words. Reference their specific research. Sound like a real student.
The resume lines above are pre-selected as the most relevant to this professor  weave 1-2 of them naturally into the email.
Use proper paragraph spacing in the body — separate each paragraph with a blank line (\\n\\n). Each thought (intro, research reference, your fit, the ask, sign-off) should be its own paragraph.
Return ONLY valid JSON: {"subject": "...", "body": "..."}`
  }

  const raw = await callGemini(params.apiKey, prompt)
  const result = extractJSON(raw)
  return {
    subject: result.subject || "Research Opportunity Inquiry",
    body: result.body || "",
  }
}

// ── Internship / contact email ────────────────────────────────────────────────

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
  school?: string
  resumeText?: string
  tone: "formal" | "casual" | "enthusiastic"
  apiKey: string
}): Promise<{ subject: string; body: string }> {
  const toneGuide = HUMAN_TONE_GUIDE[params.tone]

  const personDetails: string[] = []
  if (params.bio) personDetails.push("About them: " + params.bio.slice(0, 400))
  if (params.notes) personDetails.push("Additional context: " + params.notes.slice(0, 300))
  if (params.website) personDetails.push("Their website/profile: " + params.website)
  if (params.linkedinUrl) personDetails.push("LinkedIn: " + params.linkedinUrl)
  if (params.whyApply) personDetails.push("Why I want to contact them: " + params.whyApply)

  // Pull only the resume parts relevant to this contact's domain
  const smartResume = params.resumeText
    ? extractRelevantResumeParts(
        params.resumeText,
        params.role,
        params.company,
        params.bio || "",
        params.userInterests
      )
    : ""

  const resumeBlock = smartResume
    ? `MOST RELEVANT RESUME LINES for this recipient's domain (use 1-2 of these specifically):\n${smartResume}`
    : ""

  const recipientName = params.contactName || "the contact"
  const recipientCompany = params.company || "their company"
  const personInfo = personDetails.length > 0 ? personDetails.join("\n") : "(no additional info)"

  const lines = [
    "Write a cold email FROM a student TO a specific professional, asking about internship opportunities or mentorship.",
    "",
    "Write in FIRST PERSON (I, my) as the student.",
    "",
    EMAIL_STYLE_RULES,
    "",
    STUDENT_ACCURACY_RULES,
    "",
    "STUDENT (write in first person as this person):",
    "- Name: " + params.userName,
    "- Academic Level: " + params.userLevel,
    params.school ? "- School: " + params.school : "",
    "- Interests: " + params.userInterests.join(", "),
    resumeBlock,
    "",
    "RECIPIENT:",
    "- Name: " + recipientName,
    "- Company/Org: " + recipientCompany,
    "- Role: " + params.role,
    personInfo,
    "",
    "WHAT THE EMAIL MUST DO (keep each step tight):",
    "- Open by saying who you are ACCURATELY: your name and real grade level + school as given above. Never call yourself a university/college student unless that is your stated level.",
    "- Reference something SPECIFIC about this person (from their bio/notes/website) — a real, concrete detail, not generic praise.",
    "- Connect 1-2 concrete skills or projects from the resume lines above to their work.",
    "- End with one clear, low-pressure ask (e.g. a 10-15 minute chat).",
    "- Sign off with the student's name on its own line: " + params.userName,
    "- Subject line must be specific — name the role or the ask, never generic like 'Internship Inquiry'.",
    "- Tone: " + toneGuide,
    "- Plain text. Separate each paragraph with a blank line; keep paragraphs to 1-2 sentences.",
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
