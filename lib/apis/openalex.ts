const BASE = "https://api.openalex.org"
const MAILTO = "mailto=outreachai@app.dev"

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
  ids?: { orcid?: string }
}

/**
 * Step 1: Resolve a concept name to an OpenAlex concept ID.
 * Example: "Machine Learning" → "C119857082"
 */
export async function resolveConceptId(field: string): Promise<string | null> {
  try {
    const data = await oaGet(`/concepts?search=${encodeURIComponent(field)}&per_page=5&select=id,display_name,level`)
    const results: Array<{ id: string; display_name: string; level: number }> = data?.results || []
    // Prefer exact matches or level 1/2 concepts (specific enough)
    const match = results.find(r =>
      r.display_name.toLowerCase() === field.toLowerCase()
    ) || results[0]
    if (!match) return null
    // Extract the short concept ID from the URL
    return match.id.split("/").pop() || null
  } catch {
    return null
  }
}

/**
 * Step 2: Fetch authors who publish in a given concept, optionally filtered by institution name.
 * This is the reliable way — searching by research topic, not author name.
 */
export async function searchAuthorsByConcept(
  conceptId: string,
  institution?: string,
  limit = 25
): Promise<OAAuthor[]> {
  let filter = `topics.id:${conceptId},last_known_institution.type:education`

  if (institution) {
    // OpenAlex doesn't support full-text institution filter in authors endpoint well,
    // so we fetch more results and filter client-side
  }

  const data = await oaGet(
    `/authors?filter=${filter}&sort=cited_by_count:desc&per_page=${Math.min(limit * 2, 50)}&select=id,display_name,works_count,cited_by_count,last_known_institution,topics,homepage_url`
  )

  let results: OAAuthor[] = data?.results || []

  // Client-side institution filter if needed
  if (institution) {
    const iLow = institution.toLowerCase().replace(/\buniversity\b/g, "").replace(/\bcollege\b/g, "").trim()
    const filtered = results.filter(a => {
      const uName = (a.last_known_institution?.display_name || "").toLowerCase()
      return uName.includes(iLow) || iLow.includes(uName.replace(/\buniversity\b/g, "").trim())
    })
    // If filtered is too narrow, return all (user might have typed slightly wrong uni name)
    results = filtered.length > 0 ? filtered : results
  }

  return results.slice(0, limit)
}

/**
 * Convenience: resolve concept then fetch authors in one call.
 */
export async function findProfessorsByField(
  field: string,
  institution?: string,
  limit = 25
): Promise<OAAuthor[]> {
  // Try to resolve the concept ID for this field
  const conceptId = await resolveConceptId(field)
  if (!conceptId) {
    // Fallback: text search on author display_name (less reliable but better than nothing)
    const data = await oaGet(
      `/authors?filter=last_known_institution.type:education&search=${encodeURIComponent(field)}&sort=cited_by_count:desc&per_page=${limit}`
    )
    return data?.results || []
  }
  return searchAuthorsByConcept(conceptId, institution, limit)
}

/**
 * Convert an OpenAlex author to a flat structure for storage.
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
    .map(t => t.subfield?.display_name || t.display_name)
    .filter(Boolean)

  return {
    name: author.display_name,
    university: uni,
    research_areas: areas.length > 0 ? areas : ["Research"],
    bio: `${author.display_name} is a researcher at ${uni} with ${author.works_count} publications and ${author.cited_by_count} citations.`,
    profile_url: author.homepage_url || `https://openalex.org/authors/${author.id.split("/").pop()}`,
  }
}

// Keep old export for backward compatibility
export { findProfessorsByField as searchByConceptAndInstitution }
