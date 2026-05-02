const BASE = "https://api.openalex.org"

export interface OAAuthor {
  id: string
  display_name: string
  hint?: string // usually affiliation
  works_count: number
  cited_by_count: number
  last_known_institution?: {
    display_name: string
    country_code: string
    type: string
  }
  topics?: Array<{ display_name: string; domain?: { display_name: string } }>
  ids?: { orcid?: string }
  homepage_url?: string
}

async function oaGet(path: string): Promise<any> {
  try {
    const res = await fetch(`${BASE}${path}&mailto=outreachai@app.dev`, {
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

/**
 * Search OpenAlex for authors by field/keyword, optionally filtered by institution name.
 */
export async function searchOpenAlexAuthors(
  field: string,
  institution?: string,
  limit = 20
): Promise<OAAuthor[]> {
  // Build query — search by display name or concept
  const query = institution ? `${field} ${institution}` : field
  const data = await oaGet(
    `/authors?search=${encodeURIComponent(query)}&filter=last_known_institution.type:education&per_page=${limit}&sort=cited_by_count:desc`
  )
  return data?.results || []
}

/**
 * Search specifically by concept/topic (more precise than text search).
 */
export async function searchByConceptAndInstitution(
  concept: string,
  institution?: string,
  limit = 25
): Promise<OAAuthor[]> {
  let filter = `last_known_institution.type:education`
  if (institution) {
    filter += `,last_known_institution.display_name.search:${encodeURIComponent(institution)}`
  }

  const data = await oaGet(
    `/authors?search=${encodeURIComponent(concept)}&filter=${filter}&per_page=${limit}&sort=cited_by_count:desc`
  )
  return data?.results || []
}

/**
 * Convert an OpenAlex author to a flat structure we can store.
 */
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
    .map(t => t.display_name)
    .filter(Boolean)

  return {
    name: author.display_name,
    university: uni,
    research_areas: areas,
    bio: `${author.display_name} is a researcher at ${uni} with ${author.works_count} publications and ${author.cited_by_count} citations.`,
    profile_url: author.homepage_url || `https://openalex.org/${author.id.split("/").pop()}`,
  }
}
