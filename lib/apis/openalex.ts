const BASE = "https://api.openalex.org"
const MAILTO = "mailto=InternLink@app.dev"

async function oaGet(path: string): Promise<any> {
  try {
    const sep = path.includes("?") ? "&" : "?"
    const res = await fetch(`${BASE}${path}${sep}${MAILTO}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`OpenAlex error: ${res.status}`)
    return res.json()
  } catch (e) {
    console.error("OpenAlex fetch failed:", e)
    return null
  }
}

export interface OAAuthor {
  id: string
  display_name: string
  works_count: number
  cited_by_count: number
  last_known_institution?: {
    display_name: string
    country_code: string
    type: string
    id: string
  }
  topics?: Array<{
    id: string
    display_name: string
    subfield?: { display_name: string }
    field?: { display_name: string }
    domain?: { display_name: string }
  }>
  homepage_url?: string
}

/**
 * NEW STRATEGY: Search for WORKS (papers) by topic, then extract authors.
 * This is much more effective than searching for authors directly by name.
 */
export async function findProfessorsByWorkSearch(
  topic: string,
  institution?: string,
  limit = 25
): Promise<OAAuthor[]> {
  // Search for works matching the topic
  // Filter for education institutions to get professors/researchers
  let filter = "authorships.institutions.type:education"
  if (institution) {
    filter += `,authorships.institutions.display_name.search:${encodeURIComponent(institution)}`
  }

  // Search works by topic
  const data = await oaGet(
    `/works?search=${encodeURIComponent(topic)}&filter=${filter}&sort=cited_by_count:desc&per_page=50&select=authorships`
  )

  const results = data?.results || []
  const authorMap = new Map<string, OAAuthor>()

  for (const work of results) {
    for (const auth of work.authorships || []) {
      const author = auth.author
      if (!author || authorMap.has(author.id)) continue

      // Check if this author has an education institution in THIS authorship
      const hasEdu = auth.institutions?.some((i: any) => i.type === "education")
      if (!hasEdu) continue

      // We need more details for the author, but we can't fetch all individually fast.
      // We'll return a partial author and hope the detail fetcher picks it up, 
      // or we can do a bulk fetch later.
      // For now, let's use the institution from the authorship.
      const inst = auth.institutions.find((i: any) => i.type === "education")

      authorMap.set(author.id, {
        id: author.id,
        display_name: author.display_name,
        works_count: 0, // Unknown from works search
        cited_by_count: 0,
        last_known_institution: {
          display_name: inst.display_name,
          country_code: inst.country_code || "",
          type: "education",
          id: inst.id
        }
      })

      if (authorMap.size >= limit) break
    }
    if (authorMap.size >= limit) break
  }

  return Array.from(authorMap.values())
}

/**
 * Fallback: Search authors by name/bio if work search fails
 */
export async function findProfessorsByField(
  field: string,
  institution?: string,
  limit = 25
): Promise<OAAuthor[]> {
  // First try searching works - it's the "efficient" way
  const authorsFromWorks = await findProfessorsByWorkSearch(field, institution, limit)
  if (authorsFromWorks.length > 0) return authorsFromWorks

  // Fallback to searching authors directly
  const data = await oaGet(
    `/authors?filter=last_known_institutions.type:education&search=${encodeURIComponent(field)}&sort=cited_by_count:desc&per_page=${limit}`
  )
  return data?.results || []
}

export function normalizeOAAuthor(author: OAAuthor): {
  name: string
  university: string
  research_areas: string[]
  bio: string
  profile_url: string | null
} {
  const uni = author.last_known_institution?.display_name || "Unknown"
  const areas = (author.topics || [])
    .slice(0, 5)
    .map(t => t.subfield?.display_name || t.display_name)
    .filter(Boolean)

  return {
    name: author.display_name,
    university: uni,
    research_areas: areas.length > 0 ? areas : ["Research"],
    bio: `${author.display_name} is a researcher at ${uni}.`,
    profile_url: author.homepage_url || `https://openalex.org/authors/${author.id.split("/").pop()}`,
  }
}

