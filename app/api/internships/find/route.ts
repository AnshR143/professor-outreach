import { createClient, createServiceClient } from "@/lib/supabase/server"
import { detectApiKey, isGeminiKey } from "@/lib/ai/detect-key"

// ── Groq AI company search (uses user's existing AI key) ─────────────────────

async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1500,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error("Groq error " + res.status + ": " + err.slice(0, 200))
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
      }),
    }
  )
  if (!res.ok) throw new Error("Gemini error " + res.status)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

interface AIContact {
  name: string
  role: string
  bio: string
  website?: string | null
  linkedin?: string | null
  email?: string | null
}

async function findByCompanyWithAI(
  company: string,
  role: string,
  count: number,
  apiKey: string
): Promise<AIContact[]> {
  const roleHint = role || "software engineer, product manager, researcher, data scientist, or designer"
  const prompt = [
    "List " + count + " REAL, publicly known professionals who currently work or have recently worked at " + company + " in roles like " + roleHint + ".",
    "Only include people with a public presence (LinkedIn, GitHub, personal blog, speaker profile, etc.) that a student could realistically find and cold-email.",
    "",
    "For each person return a JSON object with:",
    "  name: full real name (first + last)",
    "  role: their actual job title at " + company,
    "  bio: 2-3 sentences about their background and what they work on  be specific, mention actual projects or talks if known",
    "  website: personal site or GitHub URL if known, else null",
    "  linkedin: LinkedIn slug like linkedin.com/in/username if known, else null",
    "  email: their actual professional or public email address if known and publicly available online, else null",
    "",
    "IMPORTANT: Only include people you are confident are real and at this company. Do not invent people.",
    "Respond ONLY with a valid JSON array. No explanation. Example:",
    '[{"name":"Jane Smith","role":"Senior ML Engineer","bio":"Works on recommendation systems at ' + company + '. Previously at DeepMind. Open source contributor to PyTorch.","website":"https://janesmith.dev","linkedin":"linkedin.com/in/janesmith","email":"jane@janesmith.dev"}]',
  ].join("\n")

  const raw = isGeminiKey(apiKey) ? await callGemini(apiKey, prompt) : await callGroq(apiKey, prompt)

  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const parsed = JSON.parse(match[0]) as AIContact[]
    // Filter out clearly fake / no-last-name entries
    return parsed.filter(p =>
      p.name && p.role &&
      p.name.trim().split(/\s+/).length >= 2 &&
      /^[A-Za-z\s\-\'.]+$/.test(p.name.trim())
    )
  } catch {
    return []
  }
}


// ── AI-powered field/role search (LinkedIn-aware) ────────────────────────────

async function findByFieldWithAI(
  field: string,
  role: string,
  count: number,
  apiKey: string
): Promise<AIContact[]> {
  const target = [field, role].filter(Boolean).join(" / ")
  const prompt = [
    "List " + count + " REAL professionals who actively work in the field of " + target + ".",
    "These should be practitioners, researchers, or engineers with a public online presence that a student could realistically find and cold-email.",
    "Prioritize people who have LinkedIn profiles or personal websites.",
    "",
    "For each person return a JSON object with:",
    "  name: full real name (first + last)",
    "  role: their actual job title and company",
    "  bio: 2-3 sentences about their background, what they actually work on, and any notable projects or talks",
    "  website: personal site, GitHub, or portfolio URL if known, else null",
    "  linkedin: LinkedIn URL like linkedin.com/in/username if publicly known, else null",
    "  email: their actual professional or public email address if known and publicly available online, else null",
    "",
    "Only include people you are confident exist and are findable. Do not invent people.",
    "Respond ONLY with a valid JSON array.",
  ].join("\n")

  const raw = isGeminiKey(apiKey) ? await callGemini(apiKey, prompt) : await callGroq(apiKey, prompt)
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const parsed = JSON.parse(match[0]) as AIContact[]
    return parsed.filter(p =>
      p.name && p.role &&
      p.name.trim().split(/\s+/).length >= 2 &&
      /^[A-Za-z\s\-\'.]+$/.test(p.name.trim())
    )
  } catch {
    return []
  }
}

// ── Dev.to API (free, no auth) ───────────────────────────────────────────────

interface DevToArticle {
  id: number
  title: string
  description: string
  tag_list: string[]
  user: {
    name: string
    username: string
    github_username?: string
    website_url?: string
  }
}

const DEVTO_TAG_MAP: Record<string, string[]> = {
  "machine learning":        ["machinelearning", "ai", "python"],
  "deep learning":           ["deeplearning", "machinelearning", "ai"],
  "data science":            ["datascience", "python", "machinelearning"],
  "artificial intelligence": ["ai", "machinelearning", "deeplearning"],
  "web development":         ["webdev", "javascript", "react"],
  "frontend":                ["webdev", "javascript", "react", "css"],
  "backend":                 ["node", "python", "backend", "api"],
  "full stack":              ["webdev", "fullstack", "javascript"],
  "mobile":                  ["mobile", "reactnative", "flutter"],
  "ios":                     ["ios", "swift", "apple"],
  "android":                 ["android", "kotlin", "java"],
  "devops":                  ["devops", "docker", "kubernetes"],
  "cloud":                   ["aws", "cloud", "devops"],
  "cybersecurity":           ["security", "cybersecurity", "hacking"],
  "blockchain":              ["blockchain", "web3", "ethereum"],
  "game":                    ["gamedev", "unity", "cpp"],
  "robotics":                ["robotics", "cpp", "python"],
  "computer vision":         ["computervision", "python", "machinelearning"],
  "nlp":                     ["nlp", "python", "machinelearning"],
  "rust":                    ["rust", "systems"],
  "go":                      ["go", "golang", "backend"],
  "software engineering":    ["programming", "coding", "softwareengineering"],
  "systems":                 ["systems", "cpp", "rust"],
  "quantitative":            ["python", "datascience", "machinelearning"],
  "bioinformatics":          ["python", "bioinformatics", "machinelearning"],
}

function getDevToTags(field: string, role: string): string[] {
  const combined = (field + " " + role).toLowerCase()
  for (const [key, tags] of Object.entries(DEVTO_TAG_MAP)) {
    if (combined.includes(key)) return tags
  }
  return [field.toLowerCase().replace(/\s+/g, ""), "programming"]
}

async function searchDevTo(field: string, role: string, count: number): Promise<Array<{
  name: string; username: string; bio: string; website: string | null
  articleTitle: string; tags: string[]
}>> {
  const tags = getDevToTags(field, role)
  const seen = new Set<string>()
  const results: Array<{ name: string; username: string; bio: string; website: string | null; articleTitle: string; tags: string[] }> = []

  for (const tag of tags) {
    if (results.length >= count * 2) break
    try {
      const res = await fetch(
        "https://dev.to/api/articles?tag=" + tag + "&per_page=20&top=1",
        { headers: { "User-Agent": "internship-outreach-app" }, next: { revalidate: 0 } }
      )
      if (!res.ok) continue
      const articles: DevToArticle[] = await res.json()
      for (const a of articles) {
        const uname = a.user.username
        // Skip usernames that look like handles (no real name) or have numbers only
        if (seen.has(uname) || !a.user.name) continue
        // Require name to look like a real person (at least 2 words or common name)
        const nameParts = a.user.name.trim().split(/\s+/)
        if (nameParts.length < 2 && a.user.name === uname) continue // username = name, skip
        seen.add(uname)
        results.push({
          name: a.user.name,
          username: uname,
          bio: "Writes and publishes about " + a.tag_list.join(", ") + '. Recent post: "' + a.title + '". ' + (a.description || "").slice(0, 120).trim(),
          website: a.user.website_url || (a.user.github_username ? "https://github.com/" + a.user.github_username : null),
          articleTitle: a.title,
          tags: a.tag_list,
        })
        if (results.length >= count * 2) break
      }
    } catch { /* skip tag */ }
  }
  return results.slice(0, count)
}

// ── Main route ────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const supabase = await createServiceClient()
  const { mode, company, field, role, count: rawCount } = await req.json()
  const count = Math.min(Math.max(1, parseInt(rawCount) || 5), 10)

  // Rate limit check: Don't allow more than 50 contacts added per hour
  const { count: recentCount } = await supabase
    .from("internship_contacts")
    .select('*', { count: 'exact', head: true })
    .eq("user_id", user.id)
    .gt("created_at", new Date(Date.now() - 3600000).toISOString());

  if ((recentCount || 0) > 50) {
    return new Response(JSON.stringify({ type: "error", message: "Rate limit exceeded: You can only add 50 contacts per hour." }), { status: 429 });
  }

  // Load user's AI key (works with Groq OR Gemini  whatever they set in Settings)
  const { data: profileRaw } = await supabase
    .from("profiles").select("ai_api_key").eq("user_id", user.id).single()
  const profile = profileRaw as { ai_api_key?: string | null } | null
  const aiKey = profile?.ai_api_key || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || ""

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  function send(data: object) {
    writer.write(encoder.encode("data: " + JSON.stringify(data) + "\n\n"))
  }

  async function run() {
    const { data: existing } = await supabase
      .from("internship_contacts").select("contact_name").eq("user_id", user!.id)
    const existingNames = new Set(
      (existing || []).map(c => (c as { contact_name: string }).contact_name?.toLowerCase().trim())
    )

    send({ type: "progress", found: 0, total: count, current: "Searching for professionals..." })

    if (mode === "company") {
      if (!company?.trim()) {
        send({ type: "done", found: 0, suggestion: "Enter a company name to search." })
        writer.close(); return
      }
      if (!aiKey) {
        send({ type: "error", message: "Add your AI API key in Settings (Groq or Gemini) to search by company." })
        writer.close(); return
      }

      const provider = detectApiKey(aiKey).label

      send({ type: "progress", found: 0, total: count, current: "Asking " + provider + " to find professionals at " + company + "..." })
      let contacts: AIContact[] = []
      try {
        contacts = await findByCompanyWithAI(company, role || "", count, aiKey)
      } catch (e: any) {
        send({ type: "error", message: "AI search failed: " + e.message })
        writer.close(); return
      }

      if (contacts.length === 0) {
        send({ type: "done", found: 0, suggestion: 'No results found for "' + company + '". Try a more well-known company or different role filter.' })
        writer.close(); return
      }

      const fresh = contacts.filter(c => !existingNames.has(c.name.toLowerCase().trim()))
      if (fresh.length === 0) {
        send({ type: "done", found: 0, suggestion: 'All found contacts already exist in your list. Try a different role filter.' })
        writer.close(); return
      }

      let added = 0
      for (const c of fresh) {
        send({ type: "progress", found: added, total: fresh.length, current: "Adding " + c.name + "..." })
        await supabase.from("internship_contacts").insert({
          user_id: user!.id,
          company: company.trim(),
          contact_name: c.name,
          role: c.role,
          email: c.email || null,
          linkedin_url: c.linkedin ? (c.linkedin.startsWith("http") ? c.linkedin : "https://" + c.linkedin) : null,
          website: c.website || null,
          bio: c.bio,
          notes: "Found via " + provider + " AI search. Verify this person before emailing." + (c.linkedin ? "\nLinkedIn: " + c.linkedin : ""),
          status: "unsorted",
          email_status: "not_emailed",
        })
        await supabase.from("activities").insert({
          user_id: user!.id, type: "contact_added", category: "internship",
          researcher_name: c.name, university: company,
          description: "Found via AI: " + c.role + " at " + company,
        }).then(() => {}).catch(() => {})
        added++
        send({ type: "progress", found: added, total: fresh.length, current: "Added " + c.name + "  " + c.role })
      }
      send({ type: "done", found: added })

    } else if (mode === "field") {
      if (!field?.trim() && !role?.trim()) {
        send({ type: "done", found: 0, suggestion: "Enter a field or role to search." })
        writer.close(); return
      }

      const fieldLabel = field || role || "Developer"

      // If user has an AI key, use AI search for richer results with LinkedIn profiles
      if (aiKey) {
        const provider = detectApiKey(aiKey).label
        send({ type: "progress", found: 0, total: count, current: "Finding " + fieldLabel + " professionals via " + provider + "..." })

        let contacts: AIContact[] = []
        try {
          contacts = await findByFieldWithAI(field || "", role || "", count, aiKey)
        } catch {}

        const freshAI = contacts.filter(c => !existingNames.has(c.name.toLowerCase().trim()))
        if (freshAI.length > 0) {
          let added = 0
          for (const c of freshAI) {
            send({ type: "progress", found: added, total: freshAI.length, current: "Adding " + c.name + "..." })
            await supabase.from("internship_contacts").insert({
              user_id: user!.id,
              company: fieldLabel,
              contact_name: c.name,
              role: c.role,
              email: c.email || null,
              linkedin_url: c.linkedin ? (c.linkedin.startsWith("http") ? c.linkedin : "https://" + c.linkedin) : null,
              website: c.website || null,
              bio: c.bio,
              notes: "Found via AI search for " + fieldLabel + "." + (c.linkedin ? "\nLinkedIn: " + c.linkedin : ""),
              status: "unsorted",
              email_status: "not_emailed",
            })
            await supabase.from("activities").insert({
              user_id: user!.id, type: "contact_added", category: "internship",
              researcher_name: c.name, university: fieldLabel,
              description: "Found via AI for " + fieldLabel,
            }).then(() => {}).catch(() => {})
            added++
            send({ type: "progress", found: added, total: freshAI.length, current: "Added " + c.name })
          }
          send({ type: "done", found: added })
          writer.close(); return
        }
        // Fall through to community search if AI returned nothing
      }

      // Community search (public data, no auth required)
      send({ type: "progress", found: 0, total: count, current: "Searching for " + fieldLabel + " professionals..." })
      let devs: Awaited<ReturnType<typeof searchDevTo>> = []
      try {
        devs = await searchDevTo(field || "", role || "", count)
      } catch (e: any) {
        send({ type: "error", message: "Search failed: " + e.message })
        writer.close(); return
      }

      const fresh = devs.filter(d => !existingNames.has(d.name.toLowerCase().trim()))
      if (fresh.length === 0) {
        send({ type: "done", found: 0, suggestion: 'No results for "' + fieldLabel + '". Try a broader field like "Machine Learning" or "Web Development".' })
        writer.close(); return
      }

      let added = 0
      for (const d of fresh) {
        send({ type: "progress", found: added, total: fresh.length, current: "Adding " + d.name + "..." })
        await supabase.from("internship_contacts").insert({
          user_id: user!.id,
          company: fieldLabel,
          contact_name: d.name,
          role: role || field || "Developer",
          email: null,
          linkedin_url: null,
          website: d.website || null,
          bio: d.bio,
          notes: [
            d.website ? "Profile: " + d.website : "",
            'Recent post: "' + d.articleTitle + '"',
            "Topics: " + d.tags.join(", "),
          ].filter(Boolean).join("\n"),
          status: "unsorted",
          email_status: "not_emailed",
        })
        await supabase.from("activities").insert({
          user_id: user!.id, type: "contact_added", category: "internship",
          researcher_name: d.name, university: fieldLabel,
          description: "Found via community search for " + fieldLabel,
        }).then(() => {}).catch(() => {})
        added++
        send({ type: "progress", found: added, total: fresh.length, current: "Added " + d.name })
      }
      send({ type: "done", found: added })

    } else {
      send({ type: "done", found: 0, suggestion: "Unknown mode." })
    }

    writer.close()
  }

  run().catch(e => {
    send({ type: "error", message: e.message || "An unexpected error occurred." })
    writer.close()
  })

  return new Response(stream.readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
  })
}
