import { createClient, createServiceClient } from "@/lib/supabase/server"
import { detectApiKey } from "@/lib/ai/detect-key"
import { callAI } from "@/lib/ai/call"

// ── InternLink Partner organisations ─────────────────────────────────────────
// Partners appear at the top of results when the search query matches their keywords.

const PARTNERS = [
  {
    name: "Behind The Mask",
    role: "Student Healthcare Intern",
    bio: "Behind The Mask prepares students for future healthcare careers by introducing critical care thinking, patient safety awareness, and real-world clinical career experiences. Student-led initiative with 1,000+ followers.",
    website: "https://behindthemaskinitiative.org/",
    keywords: ["healthcare", "medical", "clinical", "nursing", "doctor", "pre-med", "premed", "hospital", "patient", "health", "medicine", "physician", "surgery", "pharmacy", "dentistry", "public health", "biology", "biomedical"],
  },
  {
    name: "See The World Foundation",
    role: "Nonprofit & Medical Intern",
    bio: "A nonprofit dedicated to providing financial relief for children who cannot afford critical eye procedures and care, removing barriers to life-changing pediatric vision care. 100+ volunteers, 12 associations, $3,000+ fundraised.",
    website: "https://www.seetheworldfoundation.org/",
    keywords: ["eye", "vision", "pediatric", "optometry", "ophthalmology", "medical", "health", "nonprofit", "children", "eye care", "fundraising", "humanitarian", "global health"],
  },
  {
    name: "Sports Trinity",
    role: "Nonprofit & Community Intern",
    bio: "Sports Trinity bridges the economic disparity within sports by channeling equipment to youth sport programs in under-resourced communities. US Congress recognised, $15,000+ raised, helping 200+ kids in Nigeria.",
    website: "https://sportstrinity3.wixsite.com/home",
    keywords: ["sports", "youth", "athletics", "nonprofit", "ngo", "community", "fundraising", "social impact", "international development", "soccer", "basketball", "football", "tennis", "physical education", "kinesiology", "recreation"],
  },
  {
    name: "The International Economics Post",
    role: "Writer & Editorial Intern",
    bio: "A student-run publication connecting international schools through opinion-driven writing on Economics, Finance, and Policy. Writers from 6+ countries with full author attribution.",
    website: "https://www.internationaleconomicspost.com/",
    keywords: ["economics", "finance", "policy", "writing", "journalism", "international", "publication", "editorial", "business", "trade", "macroeconomics", "microeconomics", "political science", "public policy", "investment", "banking", "accounting"],
  },
  {
    name: "FinanceMeta",
    role: "Financial Education & Research Intern",
    bio: "Finance4All Meta is a global financial literacy initiative that has impacted 25,000+ students across 15+ countries. Started as grassroots outreach in India, now a worldwide network of 50+ members running programs in economics education, student research, school clubs, podcasts, and an Economics Olympiad. Collaborators include Jane Street, Stanford, MIT, Harvard, and UC Berkeley researchers.",
    website: "https://finance4all-global-reach.vercel.app/",
    keywords: ["finance", "financial literacy", "economics", "education", "research", "financial education", "investing", "markets", "entrepreneurship", "nonprofit", "global", "international", "policy", "economic research", "business", "accounting", "banking", "public policy", "development economics", "international economics", "economic development", "social impact", "humanitarian", "outreach", "publication", "journalism", "writing", "edtech"],
  },
  {
    name: "Advanced Equities",
    role: "Investment Research & Equity Analyst Intern",
    bio: "Advanced Equities is a student-run investment and research organization with $15.5K+ in live capital, focused on developing the next generation of disciplined, research-driven investors. Sector-based coverage teams produce institutional-style equity research, with only highest-conviction case studies earning portfolio inclusion. Structure mirrors a real investment fund with Executive Directors, Senior Partners, Sector Heads, and analysts.",
    website: "https://advancedequities.org/",
    keywords: ["investing", "investment", "equity", "equity research", "finance", "financial", "stock market", "portfolio", "economics", "banking", "capital markets", "financial modeling", "hedge fund", "asset management", "securities", "derivatives", "macroeconomics", "microeconomics", "accounting", "business", "corporate finance", "valuation", "fundamental analysis", "quantitative", "trading", "fintech", "private equity", "venture capital", "wealth management"],
  },
  {
    name: "Finctory",
    role: "FinTech & Quantitative Finance Intern",
    bio: "Finctory is an institutional-grade, no-code algorithmic trading platform. Build, backtest, and deploy powerful quant strategies using a visual node builder — no programming required. Features AI strategy synthesis via Phi-3 Mini, a real-time sentiment engine, and one-click export to Python (CCXT) or PineScript. Founded to dismantle the barriers that have historically gatekept algorithmic trading from non-coders.",
    website: "https://finctory.app/",
    keywords: ["finance", "financial", "trading", "algorithmic trading", "quant", "quantitative", "fintech", "investing", "investment", "stock market", "markets", "hedge fund", "economics", "financial engineering", "data science", "machine learning", "ai", "artificial intelligence", "blockchain", "cryptocurrency", "portfolio management", "risk management", "banking", "capital markets", "financial modeling", "derivatives", "securities", "asset management"],
  },
  {
    name: "PeerPath",
    role: "Education & Tutoring Intern",
    bio: "PeerPath is a peer-to-peer tutoring platform built for students navigating IB, MYP and IGCSE curricula. Founded by students who have been through these programmes themselves, PeerPath connects learners with tutors who understand the pressure, marking schemes, and what it takes to succeed. Serving students across 20+ countries.",
    website: "https://peerpath.lovable.app/",
    keywords: ["education", "tutoring", "teaching", "curriculum", "ib", "international baccalaureate", "igcse", "myp", "e-learning", "edtech", "student", "academic", "school", "learning", "pedagogy", "instructional design", "test prep", "exam", "education policy", "higher education", "elementary education", "secondary education", "language education"],
  },
  {
    name: "Casharoo",
    role: "FinTech & Financial Education Intern",
    bio: "Casharoo is a student-built platform that gamifies financial literacy for middle and high school students through daily challenges, leaderboards, and rewards. Founded by six high school students spanning development, business, marketing, and curriculum design, it covers budgeting, investing, saving, and credit in an engaging game-like format. Already deployed in schools across the US and internationally, with 501(c)(3) nonprofit partners in the financial education space.",
    website: "https://skillnestlearning.com/",
    keywords: ["finance", "financial", "financial literacy", "economics", "business", "accounting", "banking", "investment", "investing", "budgeting", "saving", "credit", "money", "personal finance", "fintech", "entrepreneurship", "microeconomics", "macroeconomics", "public policy", "trade", "quantitative"],
  },
]

function matchPartners(query: string): typeof PARTNERS {
  const q = query.toLowerCase().trim()
  // Tokenise the query so short keywords only match whole words, not substrings.
  // Multi-word keywords (e.g. "machine learning") still match as phrases.
  const tokens = new Set(q.split(/\s+/))
  return PARTNERS.filter(p =>
    p.keywords.some(k => {
      if (k.includes(" ")) {
        // Multi-word keyword: require it as an exact substring phrase
        return q.includes(k)
      }
      // Single-word keyword: only match if it is one of the actual query tokens
      return tokens.has(k)
    })
  )
}

// ── AI company search (uses user's existing AI key — any supported provider) ──

interface AIContact {
  name: string
  role: string
  bio: string
  website?: string | null
  linkedin?: string | null
}

async function findByCompanyWithAI(
  company: string,
  role: string,
  count: number,
  apiKey: string
): Promise<AIContact[]> {
  const roleHint = role || "software engineer, product manager, data scientist, or designer"
  const prompt = [
    "List " + count + " REAL, publicly known industry professionals who currently work or have recently worked at " + company + " in roles like " + roleHint + ".",
    "Do NOT include university professors, academic researchers, or anyone primarily affiliated with a university.",
    "Only include people with a public presence (LinkedIn, GitHub, personal blog, speaker profile, etc.) that a student could realistically find and cold-email.",
    "",
    "For each person return a JSON object with:",
    "  name: full real name (first + last)",
    "  role: their actual job title at " + company,
    "  bio: 2-3 sentences about their background and what they work on  be specific, mention actual projects or talks if known",
    "  website: personal site or GitHub URL if known, else null",
    "  linkedin: LinkedIn slug like linkedin.com/in/username if known, else null",
    "",
    "IMPORTANT: Only include people you are confident are real and at this company. Do not invent people.",
    "Respond ONLY with a valid JSON array. No explanation. Example:",
    '[{"name":"Jane Smith","role":"Senior ML Engineer","bio":"Works on recommendation systems at ' + company + '. Previously at DeepMind. Open source contributor to PyTorch.","website":"https://janesmith.dev","linkedin":"linkedin.com/in/janesmith"}]',
  ].join("\n")

  const raw = await callAI(apiKey, prompt, { temperature: 0.4, maxTokens: 1500 })

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
    "List " + count + " REAL industry professionals who actively work in the field of " + target + " at companies, startups, or tech organizations.",
    "IMPORTANT: Do NOT include university professors, academic researchers, PhD students, or anyone primarily affiliated with a university or research institution.",
    "These should be industry practitioners — software engineers, product managers, data scientists, ML engineers, developers, or similar — who work at real companies and could offer internships or mentorship to students.",
    "Prioritize people who have LinkedIn profiles or personal websites.",
    "",
    "For each person return a JSON object with:",
    "  name: full real name (first + last)",
    "  role: their actual job title and company (must be a company, not a university)",
    "  bio: 2-3 sentences about their background, what they actually work on, and any notable projects or talks",
    "  website: personal site, GitHub, or portfolio URL if known, else null",
    "  linkedin: LinkedIn URL like linkedin.com/in/username if publicly known, else null",
    "",
    "Only include people you are confident exist, work at companies (not universities), and are findable. Do not invent people.",
    "Respond ONLY with a valid JSON array.",
  ].join("\n")

  const raw = await callAI(apiKey, prompt, { temperature: 0.4, maxTokens: 1500 })
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
        if (seen.has(uname) || !a.user.name) continue

        // Require a proper two-word name (First Last). Single-word display names
        // are almost always usernames/handles, not real people.
        const rawName = a.user.name.trim()
        const nameParts = rawName.split(/\s+/)
        if (nameParts.length < 2) continue
        // Skip if name is identical to username (handle used as display name)
        if (rawName.toLowerCase() === uname.toLowerCase()) continue
        // Skip names with obvious non-person patterns (numbers, all-caps acronyms)
        if (/\d/.test(rawName) || rawName === rawName.toUpperCase()) continue

        // Clean up bio: dev.to descriptions sometimes append " in AuthorName" or
        // trailing punctuation artifacts. Strip that trailing fragment.
        const rawDesc = (a.description || "")
          .replace(/\s+in\s+[A-Z][a-zA-Z\s]{2,30}$/, "") // remove " in Firstname Lastname"
          .slice(0, 120)
          .trim()

        seen.add(uname)
        results.push({
          name: rawName,
          username: uname,
          bio: "Writes about " + a.tag_list.join(", ") + '. Recent post: "' + a.title + '".' + (rawDesc ? " " + rawDesc : ""),
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

    // Insert matched InternLink partners LAST so they float to the top (created_at DESC ordering)
    async function insertPartners(query: string): Promise<number> {
      const matched = matchPartners(query)
      if (matched.length === 0) return 0

      // Fresh DB check — don't rely on the stale existingNames snapshot
      const { data: currentRows } = await supabase
        .from("internship_contacts")
        .select("contact_name")
        .eq("user_id", user!.id)
      const currentNames = new Set(
        (currentRows || []).map((c: any) => (c.contact_name as string)?.toLowerCase().trim())
      )

      let partnerCount = 0
      for (const p of matched) {
        if (!currentNames.has(p.name.toLowerCase())) {
          send({ type: "progress", found: partnerCount, total: matched.length, current: "Adding InternLink partner: " + p.name + "..." })
          const { error } = await supabase.from("internship_contacts").insert({
            user_id: user!.id,
            company: "InternLink Partner",
            contact_name: p.name,
            role: p.role,
            email: null,
            linkedin_url: null,
            website: p.website,
            bio: p.bio,
            notes: "InternLink Partner\nWebsite: " + p.website,
            status: "unsorted",
            email_status: "not_emailed",
          })
          if (error) throw new Error("Partner insert failed: " + error.message)
          partnerCount++
        }
      }
      return partnerCount
    }

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
          email: null,
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
      added += await insertPartners(company + " " + (role || ""))
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
              email: null,
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
          added += await insertPartners((field || "") + " " + (role || ""))
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
      added += await insertPartners((field || "") + " " + (role || ""))
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
