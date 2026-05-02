/**
 * Global Professor Pool
 *
 * Uses OpenAlex as the primary source (structured academic data, real institutions).
 * Semantic Scholar is skipped — its text search returns paper titles, not authors.
 *
 * Flow:
 * 1. Check global_professors table (instant, free)
 * 2. Query OpenAlex by concept + institution filter
 * 3. Save newly discovered professors back to global_professors
 */

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

// Topic/non-person patterns to reject
const BAD_NAME_PATTERNS = [
  /\.\./,                         // double dots: "K. J. .. Entomology"
  /\d/,                           // contains numbers
  /^[A-Z]\.\s+\w+$/,              // single initial + word: "N. Writing"
  /^[A-Z]\.\s+[A-Z]\.\s+\w+$/,   // "A. B. Writing"
  // Last word is a subject/topic
  /\s(writing|reading|notes|instruction|kindergarten|entomology|epidemiology|ecology|pathology|genomics|physiology|microbiology|toxicology|botany|zoology|nutrition|dentistry|cardiology|oncology)$/i,
  // Starts with a non-name word
  /^(effect|impact|role|study|review|analysis|writing|reading|instruction|department|laboratory|institute|center|journal|committee|cotton|wheat|rice|maize|soybean|corn|kindergarten)\s/i,
  // Mixed case like "INSTRuCTION" (has lowercase after uppercase in middle of word)
  /[A-Z]{2,}[a-z]/,
]

/**
 * Returns true only if this looks like a real human researcher name
 * with a valid institution.
 */
function isRealResearcher(name: string, university: string): boolean {
  // Must have a real institution
  if (!university || university.trim().length < 3) return false
  if (/^unknown$/i.test(university.trim())) return false

  // Name basics
  if (!name || name.trim().length < 4) return false
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return false   // need first + last
  if (parts.length > 6) return false   // too long = phrase, not a name

  // Check bad patterns
  for (const pat of BAD_NAME_PATTERNS) {
    if (pat.test(name.trim())) return false
  }

  return true
}

/**
 * Search the global pool first, then OpenAlex if needed.
 */
export async function findGlobalProfessors(
  supabase: SupabaseClient,
  fields: string[],
  universities: string[],
  keyword: string,
  needed: number
): Promise<GlobalProfessor[]> {

  // ── 1. Query global_professors table ────────────────────────────────────
  const { data: globalRows } = await supabase
    .from("global_professors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300)

  const globalPool: GlobalProfessor[] = (globalRows || []) as GlobalProfessor[]

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

  // ── 2. Query OpenAlex (structured academic data, reliable author records) ──
  const existingNames = new Set(globalPool.map(p => p.name.toLowerCase()))
  const fresh: GlobalProfessor[] = []

  // Build search terms: keyword first, then fields
  const searchTerms = keyword
    ? [keyword, ...fields.slice(0, 2)]
    : fields.slice(0, 3)

  const uniTargets = universities.length > 0 ? universities.slice(0, 3) : [undefined]

  const promises: Promise<void>[] = []

  for (const term of searchTerms) {
    for (const uni of uniTargets) {
      promises.push((async () => {
        try {
          const authors = await searchByConceptAndInstitution(term, uni, 25)
          for (const a of authors) {
            if (!a.display_name || existingNames.has(a.display_name.toLowerCase())) continue
            const normalized = normalizeOAAuthor(a)

            // Require real university
            if (!normalized.university || normalized.university === "Unknown") continue

            // Require valid person name
            if (!isRealResearcher(normalized.name, normalized.university)) continue

            // Must have at least 1 work (published something)
            if (a.works_count < 1) continue

            fresh.push({ ...normalized, source: "openalex" })
            existingNames.add(a.display_name.toLowerCase())
          }
        } catch (e) {
          console.error("OpenAlex search failed for term:", term, e)
        }
      })())
    }
  }

  await Promise.allSettled(promises)

  // ── 3. Save to global_professors ─────────────────────────────────────────
  if (fresh.length > 0) {
    const toInsert = fresh.map(p => ({
      name: p.name,
      university: p.university,
      research_areas: p.research_areas,
      bio: p.bio || null,
      profile_url: p.profile_url || null,
      source: p.source || "openalex",
    }))

    await supabase
      .from("global_professors")
      .upsert(toInsert, { onConflict: "name,university", ignoreDuplicates: true })
  }

  // ── 4. Merge and return ───────────────────────────────────────────────────
  const merged = [...filtered, ...fresh]
  return merged.slice(0, needed)
}
