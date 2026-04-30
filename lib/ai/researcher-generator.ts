/**
 * AI-powered researcher discovery fallback.
 * When Semantic Scholar returns no results, this uses Groq/Gemini to generate
 * a list of real professors working in the requested fields, along with their
 * known papers and research details.
 */

interface GeneratedResearcher {
  name: string
  university: string
  department?: string
  bio: string
  research_areas: string[]
  homepage?: string
  papers?: Array<{ title: string; abstract?: string; year?: string; url?: string }>
}

interface GenerateParams {
  fields: string[]
  universities: string[]
  keyword?: string
  count: number
  apiKey?: string
}

const GROQ_MODEL = "llama-3.3-70b-versatile"

function buildPrompt(params: GenerateParams): string {
  const fieldList = params.fields.join(", ")
  const uniList = params.universities.length > 0 ? params.universities.join(", ") : "top US/international research universities"
  const keyword = params.keyword ? ` with focus on "${params.keyword}"` : ""

  return `You are a research database. List ${params.count} REAL professors who work on ${fieldList}${keyword} at ${uniList}.

For each professor, provide:
- Their actual real name (real person, not fictional)
- Their actual university affiliation
- Their actual research focus
- 1-2 of their real published paper titles (approximate is fine)

Return a JSON array like this:
[
  {
    "name": "Jane Smith",
    "university": "MIT",
    "department": "Computer Science",
    "bio": "Professor Smith researches machine learning and neural networks at MIT CSAIL.",
    "research_areas": ["Machine Learning", "Neural Networks", "Deep Learning"],
    "homepage": "https://example.mit.edu/jsmith",
    "papers": [
      {"title": "Attention Is All You Need", "year": "2023"},
      {"title": "BERT: Pre-training of Deep Bidirectional Transformers", "year": "2022"}
    ]
  }
]

RULES:
- Only include real, verifiable professors — not fictional people
- Use their actual university, not a made-up one
- Research areas should be specific (not just "AI" — say "Transformer Models" or "Reinforcement Learning")
- Do not repeat professors
- Return valid JSON array only, no extra text`
}

async function callGroq(prompt: string, apiKey: string): Promise<GeneratedResearcher[]> {
  const Groq = (await import("groq-sdk")).default
  const groq = new Groq({ apiKey })
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 3000,
  })
  const raw = completion.choices[0].message.content || ""
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
  // Try to find a JSON array in the response
  const arrayMatch = clean.match(/\[[\s\S]*\]/)
  const toParse = arrayMatch ? arrayMatch[0] : clean
  const parsed = JSON.parse(toParse || "[]")
  // Handle both {researchers: [...]} and [...] shapes
  const arr = Array.isArray(parsed) ? parsed : (parsed.researchers || parsed.professors || parsed.data || [])
  return arr.filter((r: any) => r.name && r.university)
}

export async function generateResearchersWithAI(params: GenerateParams): Promise<GeneratedResearcher[]> {
  const prompt = buildPrompt(params)

  const groqKey = params.apiKey || process.env.GROQ_API_KEY
  if (!groqKey) {
    console.error("No Groq API key available for researcher generation")
    return []
  }

  try {
    return await callGroq(prompt, groqKey)
  } catch (e) {
    console.error("Groq researcher generation failed:", e)
    return []
  }
}
