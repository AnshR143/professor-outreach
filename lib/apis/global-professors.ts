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

// Known non-person words that appear in Semantic Scholar/OpenAlex topic results
const TOPIC_WORDS = new Set([
  "entomology","biology","chemistry","physics","ecology","genomics","proteomics",
  "neuroscience","pharmacology","epidemiology","toxicology","botany","zoology",
  "microbiology","immunology","pathology","oncology","cardiology","dermatology",
  "radiology","pediatrics","psychiatry","endocrinology","hematology","nephrology",
  "gastroenterology","pulmonology","rheumatology","orthopedics","ophthalmology",
  "cotton","wheat","rice","maize","soybean","corn","tomato","potato","barley",
  "management","department","laboratory","institute","center","programme","program",
  "research","studies","science","engineering","technology","analysis","review",
  "journal","proceedings","committee","society","association","foundation","group",
  "effect","effects","impact","role","study","comparison","evaluation","assessment",
])

/**
 * Returns true only if the name looks like a real person's name.
 * Rejects topic names, single words, all-caps acronyms, etc.
 */
function isRealPersonName(name: string, university: string): boolean {
  if (!name || name.trim().length < 4) return false
  if (!university || university.toLowerCase() === "unknown") return false

  const parts = name.trim().split(/\s+/)
  // Must have at least 2 parts (first + last)
  if (parts.length < 2) return false
  // Must not be longer than 6 words (not a sentence)
  if (parts.length > 6) return false

  const lower = name.toLowerCase()

  // Reject if any word in the name is a known topic word
  for (const part of parts) {
    const cleaned = part.replace(/[^a-z]/gi, "").toLowerCase()
    if (TOPIC_WORDS.has(cleaned)) return false
  }

  // Reject all-uppercase names (likely acronyms or department names)
  if (name === name.toUpperCase() && name.length > 4) return false

  // Each part should start with a capital letter (proper noun)
  const properNoun = parts.every(p => /^[A-Z]/.test(p) || /^[a-z]{1,3}$/.test(p)) // allow "de", "von", etc.
  if (!properNoun) return false

  // Reject names that contain numbers
  if (/\d/.test(name)) return false

  return true
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
            // Only accept real person names with a known institution
            if (!isRealPersonName(a.name, affiliation)) continue
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
            // Only accept real person names
            if (!isRealPersonName(normalized.name, normalized.university)) continue
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
