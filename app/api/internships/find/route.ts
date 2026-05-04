import { createClient, createServiceClient } from "@/lib/supabase/server"

// ── Apollo.io people search ──────────────────────────────────────────────────

interface ApolloContact {
  name: string
  title: string
  headline: string | null
  linkedin_url: string | null
  email: string | null
  organization: { name: string } | null
  photo_url: string | null
}

async function searchApollo(
  apolloKey: string,
  company: string,
  role: string,
  count: number
): Promise<Array<{ name: string; role: string; bio: string; website: string | null; linkedin: string | null; email: string | null }>> {
  const titles = role
    ? [role]
    : ["Software Engineer", "Product Manager", "Data Scientist", "Engineering Manager", "Designer", "Researcher"]

  const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({
      api_key: apolloKey,
      q_organization_name: company,
      person_titles: titles,
      per_page: count,
      page: 1,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error("Apollo error " + res.status + ": " + err.slice(0, 200))
  }

  const data = await res.json()
  const people: ApolloContact[] = data.people || []

  // Filter out low-quality results
  const validName = (name: string) => /^[A-Za-z\s\-\'\.\.]+$/.test(name) && name.trim().split(" ").length >= 2
  
  return people
    .filter(p => p.name && p.title && validName(p.name))
    .map(p => {
      const bioLines: string[] = []
      if (p.headline) bioLines.push(p.headline)
      if (p.organization?.name) bioLines.push("Works at " + p.organization.name + " as " + p.title)
      const bio = bioLines.join(". ") || (p.title + " at " + company)
      return {
        name: p.name,
        role: p.title,
        bio,
        website: null,
        linkedin: p.linkedin_url || null,
        email: p.email || null,
      }
    })
}

// ── Gemini fallback for company search ──────────────────────────────────────

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
    }),
  })
  if (!res.ok) throw new Error("Gemini error " + res.status)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

interface GeminiContact {
  name: string
  role: string
  bio: string
  website?: string
  linkedin?: string
}

async function findByCompanyWithGemini(
  company: string, role: string, count: number, apiKey: string
): Promise<GeminiContact[]> {
  const roleHint = role || "software engineer, PM, researcher, or designer"
  const prompt = [
    "List " + count + " REAL, publicly known professionals who currently work or have recently worked at " + company + " in roles like " + roleHint + ".",
    "",
    "Only include people who have a public presence (blog, GitHub, LinkedIn, speaker profile, etc.)",
    "",
    "For each person return a JSON object with:",
    '- name: full real name',
    '- role: their actual title at ' + company,
    '- bio: 2-3 sentences about their background and what they work on',
    '- website: personal site or GitHub profile URL (if known, else null)',
    '- linkedin: LinkedIn slug like "linkedin.com/in/username" (if known, else null)',
    "",
    "Respond ONLY with a valid JSON array. Example:",
    '[{"name":"Jane Smith","role":"Senior ML Engineer","bio":"Works on recommendation systems at ' + company + '.","website":"https://janesmith.dev","linkedin":"linkedin.com/in/janesmith"}]',
  ].join("\n")

  const raw = await callGemini(apiKey, prompt)
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const parsed = JSON.parse(match[0]) as GeminiContact[]
    return parsed.filter(p => p.name && p.role)
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
    twitter_username?: string
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
        const key = a.user.username
        if (seen.has(key) || !a.user.name) continue
        seen.add(key)
        results.push({
          name: a.user.name,
          username: a.user.username,
          bio: "Writes about " + a.tag_list.join(", ") + ' on Dev.to. Recent: "' + a.title + '". ' + (a.description || "").trim(),
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

  // Load user's API keys
  const { data: profileRaw } = await supabase
    .from("profiles").select("ai_api_key, apollo_api_key").eq("user_id", user.id).single()
  const profile = profileRaw as { ai_api_key?: string | null; apollo_api_key?: string | null } | null
  const apolloKey = profile?.apollo_api_key || process.env.APOLLO_API_KEY || ""
  const aiKey = profile?.ai_api_key || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || ""

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  function send(data: object) {
    writer.write(encoder.encode("data: " + JSON.stringify(data) + "\n\n"))
  }

  async function run() {
    // Deduplicate against existing contacts
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

      // Try Apollo first, fall back to Gemini
      let contacts: Array<{ name: string; role: string; bio: string; website: string | null; linkedin: string | null; email?: string | null }> = []

      if (apolloKey) {
        send({ type: "progress", found: 0, total: count, current: "Searching Apollo for professionals at " + company + "..." })
        try {
          contacts = await searchApollo(apolloKey, company, role || "", count)
        } catch (e: any) {
          // Apollo failed, fall through to Gemini
          send({ type: "progress", found: 0, total: count, current: "Apollo search failed, trying AI fallback..." })
        }
      }

      if (contacts.length === 0) {
        // Fall back to Gemini
        if (!aiKey) {
          send({ type: "error", message: "Add your Apollo API key in Settings to search by company. Get a free key at apollo.io." })
          writer.close(); return
        }
        const geminiKey = aiKey.startsWith("gsk_") ? "" : aiKey
        if (!geminiKey) {
          send({ type: "error", message: "Add your Apollo or Gemini API key in Settings to search by company." })
          writer.close(); return
        }
        send({ type: "progress", found: 0, total: count, current: "Asking AI to find professionals at " + company + "..." })
        try {
          const geminiContacts = await findByCompanyWithGemini(company, role || "", count, geminiKey)
          contacts = geminiContacts.map(c => ({ ...c, website: c.website || null, email: null, linkedin: c.linkedin || null }))
        } catch (e: any) {
          send({ type: "error", message: "Search failed: " + e.message })
          writer.close(); return
        }
      }

      const fresh = contacts.filter(c => !existingNames.has(c.name.toLowerCase().trim()))
      if (fresh.length === 0) {
        send({ type: "done", found: 0, suggestion: 'No new results for "' + company + '". Try a different company or role filter.' })
        writer.close(); return
      }

      let added = 0
      for (const c of fresh) {
        send({ type: "progress", found: added, total: fresh.length, current: "Adding " + c.name + "..." })
        const noteParts = ["Found via search at " + company]
        if (apolloKey && contacts.length > 0) noteParts.push("Source: Apollo.io")
        else noteParts.push("Verify this person exists before emailing.")
        if (c.linkedin) noteParts.push("LinkedIn: " + c.linkedin)

        await supabase.from("internship_contacts").insert({
          user_id: user!.id,
          company: company.trim(),
          contact_name: c.name,
          role: c.role,
          email: c.email || null,
          linkedin_url: c.linkedin ? (c.linkedin.startsWith("http") ? c.linkedin : "https://" + c.linkedin) : null,
          website: c.website || null,
          bio: c.bio,
          notes: noteParts.join("\n"),
          status: "unsorted",
          email_status: "not_emailed",
        })

        await supabase.from("activities").insert({
          user_id: user!.id, type: "contact_added", category: "internship",
          researcher_name: c.name, university: company,
          description: "Found via search: " + c.role + " at " + company,
        }).then(() => {}).catch(() => {})

        added++
        send({ type: "progress", found: added, total: fresh.length, current: "Added " + c.name + " — " + c.role })
      }
      send({ type: "done", found: added })

    } else if (mode === "field") {
      if (!field?.trim() && !role?.trim()) {
        send({ type: "done", found: 0, suggestion: "Enter a field or role to search." })
        writer.close(); return
      }

      send({ type: "progress", found: 0, total: count, current: "Searching Dev.to for " + (field || role) + " developers..." })
      let devs: Awaited<ReturnType<typeof searchDevTo>> = []
      try {
        devs = await searchDevTo(field || "", role || "", count)
      } catch (e: any) {
        send({ type: "error", message: "Dev.to search failed: " + e.message })
        writer.close(); return
      }

      const fresh = devs.filter(d => !existingNames.has(d.name.toLowerCase().trim()))
      if (fresh.length === 0) {
        send({ type: "done", found: 0, suggestion: 'No results for "' + (field || role) + '" on Dev.to. Try a broader field like "Machine Learning" or "Web Development".' })
        writer.close(); return
      }

      let added = 0
      for (const d of fresh) {
        send({ type: "progress", found: added, total: fresh.length, current: "Adding " + d.name + "..." })
        const notes = [
          "Dev.to: https://dev.to/" + d.username,
          'Recent article: "' + d.articleTitle + '"',
          "Topics: " + d.tags.join(", "),
        ].join("\n")

        await supabase.from("internship_contacts").insert({
          user_id: user!.id,
          company: "",
          contact_name: d.name,
          role: role || field || "Developer",
          email: null,
          linkedin_url: null,
          website: d.website || null,
          bio: d.bio,
          notes,
          status: "unsorted",
          email_status: "not_emailed",
        })

        await supabase.from("activities").insert({
          user_id: user!.id, type: "contact_added", category: "internship",
          researcher_name: d.name, university: "",
          description: "Found via Dev.to for " + (field || role),
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
