/**
 * Global Professor Pool
 *
 * Strategy: Find researchers by their WORK. 
 * Instead of searching for names, we search for papers matching the topic, 
 * then extract the authors. This is the most reliable way to find professors 
 * in specific niches like "Agriculture" or "Entomology".
 */

import { searchPapers } from "@/lib/apis/semantic-scholar"
import { findProfessorsByField, normalizeOAAuthor } from "@/lib/apis/openalex"
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

// Name patterns that are likely paper titles or garbage
const BAD_NAME_PATTERNS = [
  /\.\./,                         
  /\d/,                           
  /^[A-Z]\.\s+\w+$/,              
  /^[A-Z]\.\s+[A-Z]\.\s+\w+$/,   
  /\s(writing|reading|notes|instruction|kindergarten|entomology|ecology|pathology|genomics|physiology|toxicology|botany|zoology)$/i,
  /^(effect|impact|role|study|review|analysis|writing|reading|instruction|department|laboratory|institute|center|journal|committee|cotton|wheat|rice|maize|soybean|corn|kindergarten)\s/i,
  /[A-Z]{2,}[a-z]/,
  /^\w+-\w+-\w+$/, // Likely a tag or ID
]

function isRealResearcher(name: string, university: string): boolean {
  if (!name || name.trim().length < 4) return false
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return false   
  if (parts.length > 5) return false   // Professors rarely have 6+ word names

  for (const pat of BAD_NAME_PATTERNS) {
    if (pat.test(name.trim())) return false
  }

  // Reject if all lowercase or all uppercase
  if (name === name.toLowerCase()) return false
  if (name === name.toUpperCase() && name.length > 5) return false

  return true
}

export async function findGlobalProfessors(
  supabase: SupabaseClient,
  fields: string[],
  universities: string[],
  keyword: string,
  needed: number
): Promise<GlobalProfessor[]> {

  // 1. Check local global_professors table
  const searchTerm = (keyword || fields[0] || "").trim()
  let query = supabase.from("global_professors").select("*")

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,university.ilike.%${searchTerm}%,research_areas.cs.{${searchTerm}}`)
  }

  if (universities.length > 0) {
    const uniFilter = universities[0]
    query = query.ilike('university', `%${uniFilter}%`)
  }

  const { data: globalRows } = await query
    .order("created_at", { ascending: false })
    .limit(needed)

  const filtered = (globalRows || []) as GlobalProfessor[]

  if (filtered.length >= needed) return filtered

  // 2. Live Discovery via Works/Papers (The Efficient Way)
  const existingNames = new Set(filtered.map(p => p.name.toLowerCase()))
  const fresh: GlobalProfessor[] = []

  const searchTerms = keyword ? [keyword] : fields.slice(0, 2)
  const uniFilter = universities[0]

  const promises: Promise<void>[] = []

  for (const term of searchTerms) {
    // OpenAlex Work-Based Search
    promises.push((async () => {
      try {
        const authors = await findProfessorsByField(term, uniFilter, 30)
        for (const a of authors) {
          if (!a.display_name || existingNames.has(a.display_name.toLowerCase())) continue
          const normalized = normalizeOAAuthor(a)
          if (!isRealResearcher(normalized.name, normalized.university)) continue
          
          fresh.push({ ...normalized, source: "openalex" })
          existingNames.add(a.display_name.toLowerCase())
        }
      } catch (e) { console.error("OA Search failed", e) }
    })())

    // Semantic Scholar Paper-Based Search
    promises.push((async () => {
      try {
        const query = uniFilter ? `${term} ${uniFilter}` : term
        const papers = await searchPapers(query, 20)
        for (const paper of papers) {
          for (const auth of paper.authors || []) {
            if (!auth.name || existingNames.has(auth.name.toLowerCase())) continue
            
            // Try to find an affiliation in the paper data
            const affiliation = (auth as any).affiliations?.[0] || uniFilter || "University"
            if (!isRealResearcher(auth.name, affiliation)) continue

            fresh.push({
              name: auth.name,
              university: affiliation,
              research_areas: [term],
              bio: `${auth.name} is a researcher working on ${paper.title}.`,
              profile_url: `https://www.semanticscholar.org/author/${auth.authorId}`,
              source: "semantic_scholar"
            })
            existingNames.add(auth.name.toLowerCase())
          }
        }
      } catch (e) { console.error("SS Search failed", e) }
    })())
  }

  await Promise.allSettled(promises)

  // 3. Save & Return
  if (fresh.length > 0) {
    const toInsert = fresh.map(p => ({
      name: p.name,
      university: p.university,
      research_areas: p.research_areas,
      bio: p.bio || null,
      profile_url: p.profile_url || null,
      source: p.source || "api",
    }))

    await supabase
      .from("global_professors")
      .upsert(toInsert, { onConflict: "name,university", ignoreDuplicates: true })
  }

  const merged = [...filtered, ...fresh]
  return merged.slice(0, needed)
}
