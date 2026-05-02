/**
 * Global Professor Pool
 *
 * Flow:
 * 1. Check global_professors table for matches (instant, free)
 * 2. If not enough results → query Semantic Scholar + OpenAlex in parallel
 * 3. Save any newly discovered professors back to global_professors
 * 4. Return merged, deduplicated list
 */

import { searchAuthors } from "@/lib/apis/semantic-scholar"
import { searchByConceptAndInstitution, normalizeOAAuthor } from "@/lib/apis/openalex"
import { SupabaseClient } from "@supabase/supabase-js"

export interface GlobalProfessor {
  id?: string
  name: string
  university: string
  research_areas: string[]
  email?: string | null
  bio?: string
  profile_url?: string | null
  source?: string
}

/**
 * Search the global pool first, then live APIs if needed.
 * Newly found professors are automatically saved back to global_professors.
 */
export async function findGlobalProfessors(
  supabase: SupabaseClient,
  fields: string[],
  universities: string[],
  keyword: string,
  needed: number
): Promise<GlobalProfessor[]> {

  // ── 1. Query global_professors table ────────────────────────────────────
  let dbQuery = supabase
    .from("global_professors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  const { data: globalRows } = await dbQuery
  const globalPool: GlobalProfessor[] = (globalRows || []) as GlobalProfessor[]

  // Filter by fields, universities, keyword
  const filtered = globalPool.filter(p => {
    const areas = p.research_areas || []
    const uni = (p.university || "").toLowerCase()

    const fieldMatch = fields.length === 0 || fields.some(f =>
      areas.some(a => a.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(a.toLowerCase()))
    )
    const uniMatch = universities.length === 0 || universities.some(u => {
      const uLow = u.toLowerCase().replace(/\buniversity\b/g, "").replace(/\buniv\b/g, "").replace(/\bcollege\b/g, "").trim()
      return uni.includes(uLow) || uLow.includes(uni.replace(/\buniversity\b/g, "").replace(/\bcollege\b/g, "").trim())
    })
    const kwMatch = !keyword ||
      p.name.toLowerCase().includes(keyword.toLowerCase()) ||
      areas.some(a => a.toLowerCase().includes(keyword.toLowerCase())) ||
      uni.includes(keyword.toLowerCase())

    return fieldMatch && uniMatch && kwMatch
  })

  if (filtered.length >= needed) {
    return filtered.slice(0, needed)
  }

  // ── 2. Hit live APIs in parallel ─────────────────────────────────────────
  const existingNames = new Set(globalPool.map(p => p.name.toLowerCase()))
  const fresh: GlobalProfessor[] = []

  const searchTerms = keyword
    ? [keyword, ...fields.slice(0, 2)]
    : fields.slice(0, 3)

  const uniTargets = universities.length > 0 ? universities : [undefined]

  // Semantic Scholar + OpenAlex searches in parallel
  const promises: Promise<void>[] = []

  for (const term of searchTerms) {
    for (const uni of uniTargets.slice(0, 2)) {
      // Semantic Scholar
      promises.push((async () => {
        try {
          const query = uni ? `${term} ${uni}` : term
          const authors = await searchAuthors(query, 15)
          for (const a of authors) {
            if (!a.name || existingNames.has(a.name.toLowerCase())) continue
            const affiliation = a.affiliations?.[0] || uni || "Unknown"
            fresh.push({
              name: a.name,
              university: affiliation,
              research_areas: [term],
              bio: `${a.name} is a researcher at ${affiliation}. h-index: ${a.hIndex || "N/A"}.`,
              profile_url: a.homepage || `https://www.semanticscholar.org/author/${a.authorId}`,
              source: "semantic_scholar",
            })
            existingNames.add(a.name.toLowerCase())
          }
        } catch {}
      })())

      // OpenAlex
      promises.push((async () => {
        try {
          const authors = await searchByConceptAndInstitution(term, uni, 20)
          for (const a of authors) {
            if (!a.display_name || existingNames.has(a.display_name.toLowerCase())) continue
            const normalized = normalizeOAAuthor(a)
            if (!normalized.university || normalized.university === "Unknown") continue
            fresh.push({ ...normalized, source: "openalex" })
            existingNames.add(a.display_name.toLowerCase())
          }
        } catch {}
      })())
    }
  }

  await Promise.allSettled(promises)

  // ── 3. Save newly discovered professors to global_professors ─────────────
  if (fresh.length > 0) {
    const toInsert = fresh.map(p => ({
      name: p.name,
      university: p.university,
      research_areas: p.research_areas,
      bio: p.bio || null,
      profile_url: p.profile_url || null,
      source: p.source || "api",
    }))

    // upsert with UNIQUE(name, university) — no duplicates ever
    await supabase
      .from("global_professors")
      .upsert(toInsert, { onConflict: "name,university", ignoreDuplicates: true })
  }

  // ── 4. Merge and return ───────────────────────────────────────────────────
  const merged = [...filtered, ...fresh]
  return merged.slice(0, needed)
}
