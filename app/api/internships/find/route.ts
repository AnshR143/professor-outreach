import { createClient, createServiceClient } from "@/lib/supabase/server"

const GITHUB_API = "https://api.github.com"

interface GitHubUser {
  login: string
  name: string | null
  company: string | null
  blog: string | null
  location: string | null
  email: string | null
  bio: string | null
  html_url: string
  public_repos: number
  followers: number
}

async function ghFetch(url: string, token?: string) {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "internship-outreach-app",
  }
  if (token) headers["Authorization"] = `token ${token}`
  const res = await fetch(url, { headers, next: { revalidate: 0 } })
  if (res.status === 403) throw new Error("GitHub API rate limit hit. Try again in a minute or provide a GitHub token.")
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

async function fetchUserDetail(url: string, token?: string): Promise<GitHubUser | null> {
  try {
    const u = await ghFetch(url, token)
    return u
  } catch {
    return null
  }
}

// Search GitHub users by company name
async function searchByCompany(company: string, role: string, count: number, token?: string): Promise<GitHubUser[]> {
  const roleQuery = role ? `${role} ` : ""
  const q = `${roleQuery}company:"${company}"`
  const url = `${GITHUB_API}/search/users?q=${encodeURIComponent(q)}&per_page=30&sort=followers&order=desc`

  let items: any[] = []
  try {
    const data = await ghFetch(url, token)
    items = data.items || []
  } catch (e: any) {
    // Fallback: try without quotes
    try {
      const q2 = `${roleQuery}${company} in:bio`
      const url2 = `${GITHUB_API}/search/users?q=${encodeURIComponent(q2)}&per_page=20&sort=followers`
      const data2 = await ghFetch(url2, token)
      items = data2.items || []
    } catch {
      throw e
    }
  }

  const profiles: GitHubUser[] = []
  for (const item of items) {
    if (profiles.length >= count * 2) break
    const detail = await fetchUserDetail(item.url, token)
    if (detail && (detail.name || detail.email)) {
      profiles.push(detail)
    }
  }
  return profiles
}

// Field-to-GitHub-language mapping for better results
const LANG_MAP: [string[], string][] = [
  [["machine learning", "deep learning", "data science", "ai ", "artificial intelligence", "python", "nlp", "computer vision"], "Python"],
  [["web", "frontend", "react", "javascript", "typescript", "node"], "JavaScript"],
  [["ios", "swift", "macos", "apple"], "Swift"],
  [["android", "kotlin", "mobile"], "Kotlin"],
  [["systems", "embedded", "firmware", "low level"], "C"],
  [["rust", "webassembly", "systems engineering"], "Rust"],
  [["go ", "golang", "devops", "cloud infrastructure"], "Go"],
  [["java", "backend", "spring", "enterprise"], "Java"],
  [["game", "unity", "unreal"], "C#"],
  [["data engineering", "spark", "hadoop", "big data"], "Scala"],
]

function getLanguage(field: string): string | null {
  const f = field.toLowerCase()
  for (const [keywords, lang] of LANG_MAP) {
    if (keywords.some(k => f.includes(k))) return lang
  }
  return null
}

// Search GitHub users by field / major
async function searchByField(field: string, role: string, count: number, token?: string): Promise<GitHubUser[]> {
  const lang = getLanguage(field)
  const searchTerm = role || field

  let q = lang
    ? `${searchTerm} in:bio language:${lang}`
    : `${searchTerm} in:bio`

  const url = `${GITHUB_API}/search/users?q=${encodeURIComponent(q)}&per_page=30&sort=followers&order=desc`

  let items: any[] = []
  try {
    const data = await ghFetch(url, token)
    items = data.items || []
  } catch (e) {
    throw e
  }

  const profiles: GitHubUser[] = []
  for (const item of items) {
    if (profiles.length >= count * 2) break
    const detail = await fetchUserDetail(item.url, token)
    if (detail && (detail.name || detail.email)) {
      profiles.push(detail)
    }
  }
  return profiles
}

export async function POST(req: Request) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const supabase = await createServiceClient()
  const { mode, company, field, role, count: rawCount, githubToken } = await req.json()
  const count = Math.min(Math.max(1, parseInt(rawCount) || 5), 10)

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  function send(data: object) {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  async function run() {
    // Load existing contacts to avoid duplicates
    const { data: existing } = await supabase
      .from("internship_contacts")
      .select("company, contact_name")
      .eq("user_id", user!.id)

    const existingKeys = new Set(
      (existing || []).map(c =>
        `${c.company?.toLowerCase().trim()}::${c.contact_name?.toLowerCase().trim()}`
      )
    )

    send({ type: "progress", found: 0, total: count, current: "Searching GitHub for professionals..." })

    let githubUsers: GitHubUser[] = []
    try {
      if (mode === "company" && company?.trim()) {
        githubUsers = await searchByCompany(company.trim(), role?.trim() || "", count, githubToken)
      } else if (mode === "field" && (field?.trim() || role?.trim())) {
        githubUsers = await searchByField(field?.trim() || "", role?.trim() || "", count, githubToken)
      } else {
        send({ type: "done", found: 0, suggestion: "Please provide a company name or field to search." })
        writer.close()
        return
      }
    } catch (e: any) {
      send({ type: "error", message: e.message || "GitHub search failed." })
      writer.close()
      return
    }

    // Filter duplicates and prefer users with more info
    const filtered = githubUsers
      .filter(u => {
        const name = (u.name || u.login).toLowerCase().trim()
        const co = (u.company?.replace(/^@/, "").trim() || company || "").toLowerCase().trim()
        return !existingKeys.has(`${co}::${name}`)
      })
      .sort((a, b) => {
        // Prefer users with name + email + bio
        const scoreA = (a.name ? 2 : 0) + (a.email ? 3 : 0) + (a.bio ? 1 : 0)
        const scoreB = (b.name ? 2 : 0) + (b.email ? 3 : 0) + (b.bio ? 1 : 0)
        return scoreB - scoreA
      })
      .slice(0, count)

    if (filtered.length === 0) {
      send({
        type: "done",
        found: 0,
        suggestion: mode === "company"
          ? `No results found for "${company}". Try a different spelling or a broader role type.`
          : `No results found for "${field || role}". Try a different field or role title.`,
      })
      writer.close()
      return
    }

    let added = 0
    for (const u of filtered) {
      const name = u.name || u.login
      const contactCompany = u.company?.replace(/^@/, "").trim() ||
        (mode === "company" ? company : "") || ""

      send({ type: "progress", found: added, total: filtered.length, current: `Adding ${name}...` })

      const roleFinal = role?.trim() || (mode === "field" ? (field?.trim() || "Professional") : "Professional")

      // Build a rich bio from GitHub profile
      const bioParts: string[] = []
      if (u.bio) bioParts.push(u.bio)
      if (u.location) bioParts.push(`Based in ${u.location}.`)
      if (u.public_repos > 0) bioParts.push(`${u.public_repos} public repos on GitHub.`)
      if (u.followers > 0) bioParts.push(`${u.followers} followers.`)

      const notesParts: string[] = [`GitHub: ${u.html_url}`]
      if (u.location) notesParts.push(`Location: ${u.location}`)
      if (u.followers > 0) notesParts.push(`GitHub followers: ${u.followers}`)
      if (u.public_repos > 0) notesParts.push(`Public repos: ${u.public_repos}`)

      const { data: contact } = await supabase
        .from("internship_contacts")
        .insert({
          user_id: user!.id,
          company: contactCompany,
          contact_name: name,
          role: roleFinal,
          email: u.email || null,
          linkedin_url: null,
          website: u.blog?.startsWith("http") ? u.blog : u.blog ? `https://${u.blog}` : null,
          bio: bioParts.join(" ") || null,
          notes: notesParts.join("\n"),
          status: "unsorted",
          email_status: "not_emailed",
        })
        .select()
        .single()

      if (contact) {
        await supabase.from("activities").insert({
          user_id: user!.id,
          type: "contact_added",
          category: "internship",
          researcher_name: name,
          university: contactCompany,
          description: mode === "company"
            ? `Found via GitHub at ${contactCompany}`
            : `Found via GitHub for ${field || role}`,
        }).then(() => {}).catch(() => {})

        added++
        send({
          type: "progress",
          found: added,
          total: filtered.length,
          current: `Added ${name}${contactCompany ? ` (${contactCompany})` : ""}`,
        })
      }
    }

    send({ type: "done", found: added })
    writer.close()
  }

  run().catch(e => {
    send({ type: "error", message: e.message || "An unexpected error occurred." })
    writer.close()
  })

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
