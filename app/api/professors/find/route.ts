import { createClient, createServiceClient } from "@/lib/supabase/server"
import { PRELOADED_PROFESSORS } from "@/lib/data/professors"
import { findGlobalProfessors } from "@/lib/apis/global-professors"

// Extract meaningful keywords from resume text for matching
function extractResumeKeywords(resumeText: string): string[] {
  const stopWords = new Set([
    "the","a","an","and","or","in","of","to","for","with","that","this","is","was",
    "are","were","be","been","have","has","had","will","would","could","should","may",
    "can","not","from","by","at","as","on","it","its","we","i","my","our","their",
    "they","you","he","she","his","her","but","if","so","do","did","more","about",
    "also","which","when","where","what","who","how","all","one","two","three","four",
    "five","six","seven","eight","nine","ten","during","using","used","work","worked",
    "team","project","projects","skills","skills","experience","course","courses",
    "university","college","school","degree","gpa","year","years","month","months",
  ])
  return [...new Set(
    resumeText
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 4 && !stopWords.has(w))
  )].slice(0, 120)
}



// ── Abbreviation expansion ─────────────────────────────────────────────────
// Maps abbreviations ↔ full forms so "AI" matches "Artificial Intelligence" and vice versa
const ABBR_EXPANSIONS: Record<string, string[]> = {
  "ai":  ["artificial intelligence", "machine learning"],
  "ml":  ["machine learning", "artificial intelligence"],
  "dl":  ["deep learning", "neural networks", "machine learning"],
  "nlp": ["natural language processing", "computational linguistics", "language models"],
  "cv":  ["computer vision", "image recognition", "visual computing"],
  "rl":  ["reinforcement learning", "machine learning"],
  "ds":  ["data science", "machine learning", "statistics"],
  "cs":  ["computer science", "software engineering"],
  "hci": ["human-computer interaction", "user interface"],
  "ir":  ["information retrieval", "search engines"],
  "db":  ["databases", "data engineering", "distributed systems"],
  "se":  ["software engineering", "computer science"],
  "bio": ["biology", "bioinformatics", "computational biology"],
  "bioinformatics": ["computational biology", "genomics", "biology"],
  "artificial intelligence": ["ai", "machine learning", "deep learning"],
  "machine learning": ["ml", "ai", "deep learning", "statistical learning"],
  "deep learning": ["dl", "neural networks", "machine learning"],
  "natural language processing": ["nlp", "language models", "computational linguistics"],
  "computer vision": ["cv", "image recognition", "visual computing"],
  "reinforcement learning": ["rl", "machine learning"],
  "data science": ["ds", "machine learning", "statistics"],
  "neural networks": ["deep learning", "ml", "ai"],
  "large language models": ["nlp", "gpt", "transformers", "language models"],
  "transformers": ["natural language processing", "deep learning", "language models"],
  "robotics": ["automation", "mechatronics", "control systems"],
  "cybersecurity": ["security", "information security", "cryptography"],
  "blockchain": ["distributed systems", "cryptography", "decentralized"],
  "quantum computing": ["quantum information", "physics", "algorithms"],
}

/** Expand a single search term into itself + any known aliases */
function expandTerm(term: string): string[] {
  const key = term.toLowerCase().trim()
  const expansions = ABBR_EXPANSIONS[key] || []
  return [key, ...expansions]
}

/** Expand an array of user-typed terms, deduplicating */
function expandAllTerms(terms: string[]): string[] {
  const all = new Set<string>()
  for (const t of terms) {
    for (const exp of expandTerm(t)) all.add(exp)
  }
  return Array.from(all)
}

// ── Fuzzy matching helpers ─────────────────────────────────────────────────

/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

/** Strip noise words and punctuation for university comparison */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/(university|college|institute|institution|of|technology|the|state|and|at|&)/gi, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Fuzzy token match: returns true if every token in `input` has a close
 * match among the tokens in `candidate` (Levenshtein ≤ floor(len/4)+1).
 * Falls back to substring containment first.
 */
function fuzzyTokenMatch(input: string, candidate: string): boolean {
  const normInput = normalizeForMatch(input)
  const normCand  = normalizeForMatch(candidate)

  // Fast path: substring
  if (normCand.includes(normInput) || normInput.includes(normCand)) return true

  const iTokens = normInput.split(" ").filter(t => t.length >= 3)
  const cTokens = normCand.split(" ").filter(t => t.length >= 3)
  if (iTokens.length === 0 || cTokens.length === 0) return false

  // Every input token must match at least one candidate token fuzzily
  return iTokens.every(it =>
    cTokens.some(ct => {
      if (ct.includes(it) || it.includes(ct)) return true
      const maxLen = Math.max(it.length, ct.length)
      const allowedDist = Math.floor(maxLen / 4) + 1  // ~1 error per 4 chars
      return levenshtein(it, ct) <= allowedDist
    })
  )
}

/** Check if a user-typed university string fuzzy-matches a professor's university */
function fuzzyMatchUniversity(userInput: string, profUniversity: string): boolean {
  // Also try matching individual comma-separated entries
  return userInput
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .some(term => fuzzyTokenMatch(term, profUniversity))
}

/** Check if a keyword/field term (+ its abbreviation expansions) fuzzy-matches any research area */
function fuzzyMatchField(term: string, profAreas: string[]): boolean {
  // Expand the input term into aliases (e.g. "AI" → ["ai","artificial intelligence","machine learning"])
  const termsToTry = expandTerm(term)
  return termsToTry.some(expanded =>
    profAreas.some(area => {
      const normArea = area.toLowerCase()
      const normExpanded = expanded.toLowerCase().trim()
      if (normArea.includes(normExpanded) || normExpanded.includes(normArea)) return true
      return fuzzyTokenMatch(normExpanded, normArea)
    })
  )
}

// Hardcoded probability formula:
// Base = 50 (a student with resume found this prof)
// +12 per field selected by user that overlaps with prof areas (strong intentional signal)
// +6 per prof area that appears as keyword in resume (experience signal)
// +3 per keyword overlap on bio/university (weak context signal)
// Cap at 95
function calcMatchScore(
  profAreas: string[],
  selectedFields: string[],
  resumeKeywords: string[],
  profUniversity: string
): { score: number; fieldMatches: string[]; resumeMatches: string[] } {
  const fieldMatches = profAreas.filter(area =>
    selectedFields.some(f =>
      area.toLowerCase().includes(f.toLowerCase()) ||
      f.toLowerCase().includes(area.toLowerCase())
    )
  )

  const resumeMatches = profAreas.filter(area => {
    const areaWords = area.toLowerCase().split(/\s+/)
    return resumeKeywords.some(kw =>
      areaWords.some(w => w.includes(kw) || kw.includes(w))
    )
  })

  // University tier bonus (top-tier adds slight credibility signal)
  const topTierUnis = ["mit","stanford","carnegie","berkeley","harvard","caltech","princeton","yale","columbia","cornell","michigan","illinois","georgia tech","carnegie mellon"]
  const uniBonus = topTierUnis.some(t => profUniversity.toLowerCase().includes(t)) ? 3 : 0

  const raw = 50
    + fieldMatches.length * 12
    + resumeMatches.length * 6
    + uniBonus

  return {
    score: Math.min(95, Math.max(52, raw)),
    fieldMatches,
    resumeMatches,
  }
}

function buildWhyMatch(
  fieldMatches: string[],
  resumeMatches: string[],
  profAreas: string[],
  profUniversity: string
): string {
  if (fieldMatches.length > 0 && resumeMatches.length > 0) {
    return `Your search for "${fieldMatches.slice(0, 2).join(", ")}" matches their research, and your resume shows relevant experience in ${resumeMatches.slice(0, 2).join(", ")}.`
  }
  if (fieldMatches.length > 0) {
    return `Research in ${fieldMatches.slice(0, 2).join(", ")} directly matches your search criteria.`
  }
  if (resumeMatches.length > 0) {
    return `Your resume background in ${resumeMatches.slice(0, 2).join(", ")} aligns with their work.`
  }
  return `Researcher at ${profUniversity} in ${profAreas[0] || "AI"}  expand your search criteria for a stronger match.`
}

export async function POST(req: Request) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const supabase = await createServiceClient()
  const { fields, universities, keyword, count: rawCount } = await req.json()
  const count = Math.min(Math.max(1, parseInt(rawCount) || 5), 10)

  // Rate limit check: Don't allow more than 50 researchers added per hour
  const { count: recentCount } = await supabase
    .from("researchers")
    .select('*', { count: 'exact', head: true })
    .eq("user_id", user.id)
    .gt("created_at", new Date(Date.now() - 3600000).toISOString());

  if ((recentCount || 0) > 50) {
    return new Response(JSON.stringify({ type: "error", message: "Rate limit exceeded: You can only add 50 researchers per hour." }), { status: 429 });
  }

  const { data: profileRaw } = await supabase
    .from("profiles").select("*").eq("user_id", user.id).single()
  const profile = profileRaw as { resume_text?: string } | null

  // Extract resume keywords for matching
  const resumeKeywords = profile?.resume_text
    ? extractResumeKeywords(profile.resume_text)
    : []

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  function send(data: object) {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  async function run() {
    const { data: existing } = await supabase
      .from("researchers").select("name").eq("user_id", user!.id)
    const existingNames = new Set((existing || []).map(r => r.name.toLowerCase()))

    // Similar-field expansion map: if no results for a field, try these related terms
    const FIELD_EXPANSIONS: Record<string, string[]> = {
      "agriculture": ["Agricultural", "Agronomy", "Plant Science", "Crop", "Soil Science", "Food Science", "Farm"],
      "agronomy": ["Agriculture", "Plant Science", "Crop", "Soil Science"],
      "entomology": ["Insect", "Biology", "Ecology", "Entomology", "Chemical Ecology"],
      "botany": ["Plant Biology", "Plant Science", "Ecology", "Biology"],
      "zoology": ["Animal Biology", "Ecology", "Wildlife", "Biology"],
      "ecology": ["Environmental Science", "Biology", "Conservation", "Ecosystem"],
      "geology": ["Earth Science", "Environmental Science", "Geophysics"],
      "astronomy": ["Astrophysics", "Cosmology", "Physics"],
      "anthropology": ["Cultural Anthropology", "Sociology", "Archaeology"],
      "linguistics": ["Language", "NLP", "Cognitive Science"],
      "philosophy": ["Ethics", "Logic", "Political Theory"],
      "art history": ["History", "Cultural Studies", "Humanities"],
      "music": ["Music Theory", "Arts", "Acoustics"],
      "nursing": ["Medicine", "Public Health", "Healthcare"],
      "pharmacy": ["Pharmacology", "Chemistry", "Medicine"],
      "dentistry": ["Medicine", "Oral Health", "Biology"],
      "veterinary": ["Animal Science", "Biology", "Medicine"],
      "architecture": ["Urban Planning", "Engineering", "Design"],
      "urban planning": ["Architecture", "Sociology", "Environmental Science"],
      "social work": ["Sociology", "Psychology", "Public Policy"],
      "criminology": ["Criminal Justice", "Sociology", "Law"],
      "communications": ["Media Studies", "Journalism", "Sociology"],
      "journalism": ["Media Studies", "Communications", "Political Science"],
      "library science": ["Information Science", "Computer Science", "Education"],
    }

    // Expand fields with synonyms if needed
    function expandFields(inputFields: string[]): string[] {
      const expanded = new Set(inputFields)
      for (const f of inputFields) {
        const fLow = f.toLowerCase()
        for (const [key, vals] of Object.entries(FIELD_EXPANSIONS)) {
          if (fLow.includes(key) || key.includes(fLow)) {
            vals.forEach(v => expanded.add(v))
          }
        }
      }
      return Array.from(expanded)
    }

    function matchesFields(profAreas: string[], searchFields: string[]): boolean {
      if (searchFields.length === 0) return true
      // Each user-typed field term is fuzzy-matched against professor areas
      return searchFields.some(f => fuzzyMatchField(f, profAreas))
    }

    // ── Step 1: Match from preloaded list ──────────────────────────────────
    // Expand abbreviations first (AI→artificial intelligence etc.), then synonym-expand
    const abbrExpanded = expandAllTerms(fields)
    const expandedFields = expandFields([...fields, ...abbrExpanded])

    const matching = PRELOADED_PROFESSORS.filter(prof => {
      if (existingNames.has(prof.name.toLowerCase())) return false

      const matchesField = matchesFields(prof.areas, expandedFields)
      const matchesUni = universities.length === 0 ||
        universities.some((u: string) => fuzzyMatchUniversity(u, prof.university))
      // keyword can be comma-separated; each term is fuzzy-matched
      const keywordTerms = keyword ? keyword.split(",").map((s: string) => s.trim()).filter(Boolean) : []
      const matchesKeyword = keywordTerms.length === 0 ||
        keywordTerms.some((term: string) =>
          fuzzyTokenMatch(term, prof.name) ||
          fuzzyMatchField(term, prof.areas) ||
          fuzzyTokenMatch(term, prof.university)
        )

      return matchesField && matchesUni && matchesKeyword
    })

    const scored = matching.map(prof => {
      const { score, fieldMatches, resumeMatches } = calcMatchScore(
        prof.areas, expandedFields, resumeKeywords, prof.university
      )
      return { prof, score, fieldMatches, resumeMatches }
    })
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return Math.random() - 0.5
    })
    const toAdd = scored.slice(0, count)

    // ── Step 2: If preloaded list didn't have enough, hit global pool ───────
    const stillNeeded = count - toAdd.length
    let globalProfs: Array<{ name: string; university: string; research_areas: string[]; bio?: string; profile_url?: string | null }> = []

    if (stillNeeded > 0) {
      send({ type: "progress", found: toAdd.length, total: count, current: "Searching Semantic Scholar & OpenAlex..." })
      try {
        const raw = await findGlobalProfessors(supabase, fields, universities, keyword, stillNeeded * 3)
        globalProfs = raw
          .filter(p => !existingNames.has(p.name.toLowerCase()) && !toAdd.some(t => t.prof.name.toLowerCase() === p.name.toLowerCase()))
          .slice(0, stillNeeded)
      } catch (e) {
        console.error("Global pool fetch failed:", e)
      }
    }

    const totalToAdd = toAdd.length + globalProfs.length
    if (totalToAdd === 0) {
      // Suggest related fields
      const suggestions = expandedFields
        .filter(f => !fields.map((x: string) => x.toLowerCase()).includes(f.toLowerCase()))
        .slice(0, 4)
      send({
        type: "done",
        found: 0,
        suggestion: suggestions.length > 0
          ? `No results for "${fields.join(", ")}". Try: ${suggestions.join(", ")}`
          : `No results found. Try broader terms or clear university filters.`
      })
      writer.close()
      return
    }

    let added = 0

    // Insert from preloaded list
    for (const { prof, score, fieldMatches, resumeMatches } of toAdd) {
      send({ type: "progress", found: added, total: totalToAdd, current: `Adding ${prof.name}...` })

      const whyMatch = buildWhyMatch(fieldMatches, resumeMatches, prof.areas, prof.university)

      const { data: researcher } = await supabase.from("researchers").insert({
        user_id: user!.id,
        name: prof.name,
        university: prof.university,
        department: null,
        bio: `${prof.name} is a researcher at ${prof.university} working on ${prof.areas.slice(0, 3).join(", ")}.`,
        match_score: score,
        status: "unsorted",
        research_areas: prof.areas,
        profile_links: prof.url ? { Homepage: prof.url } : {},
        semantic_scholar_id: null,
        why_match: whyMatch,
        email_status: "not_emailed",
      }).select().single()

      if (researcher) {
        await supabase.from("activities").insert({
          user_id: user!.id,
          type: "researcher_found",
          researcher_id: researcher.id,
          researcher_name: prof.name,
          university: prof.university,
          description: resumeKeywords.length > 0
            ? "Researcher matched via field selection + resume analysis"
            : "Researcher matched via field selection",
        }).then(() => {}).catch(() => {})

        // Also auto-add to internship contacts (for research internship outreach)
        await supabase.from("internship_contacts").insert({
          user_id: user!.id,
          company: prof.university,
          contact_name: prof.name,
          role: "Research Internship / Lab Position",
          email: null,
          linkedin_url: null,
          website: prof.url || null,
          bio: `${prof.name} is a researcher at ${prof.university} working on ${prof.areas.slice(0, 3).join(", ")}.`,
          notes: "Auto-added from researcher search. Research areas: " + prof.areas.join(", "),
          status: "unsorted",
          email_status: "not_emailed",
        }).then(() => {}).catch(() => {})

        added++
        send({ type: "progress", found: added, total: totalToAdd, current: `Added ${prof.name} (${score}% match)` })
      }
    }

    // Insert from global pool (Semantic Scholar / OpenAlex)
    for (const prof of globalProfs) {
      send({ type: "progress", found: added, total: totalToAdd, current: `Adding ${prof.name} from live search...` })

      const areas = prof.research_areas || []
      const { score, fieldMatches, resumeMatches } = calcMatchScore(areas, fields, resumeKeywords, prof.university)
      const whyMatch = buildWhyMatch(fieldMatches, resumeMatches, areas, prof.university)

      const { data: researcher } = await supabase.from("researchers").insert({
        user_id: user!.id,
        name: prof.name,
        university: prof.university,
        department: null,
        bio: prof.bio || `${prof.name} is a researcher at ${prof.university} working on ${areas.slice(0, 3).join(", ")}.`,
        match_score: score,
        status: "unsorted",
        research_areas: areas,
        profile_links: prof.profile_url ? { Homepage: prof.profile_url } : {},
        semantic_scholar_id: null,
        why_match: whyMatch,
        email_status: "not_emailed",
      }).select().single()

      if (researcher) {
        await supabase.from("activities").insert({
          user_id: user!.id,
          type: "researcher_found",
          researcher_id: researcher.id,
          researcher_name: prof.name,
          university: prof.university,
          description: "Researcher discovered via Semantic Scholar / OpenAlex live search",
        }).then(() => {}).catch(() => {})

        // Also auto-add to internship contacts
        await supabase.from("internship_contacts").insert({
          user_id: user!.id,
          company: prof.university,
          contact_name: prof.name,
          role: "Research Internship / Lab Position",
          email: null,
          linkedin_url: null,
          website: prof.profile_url || null,
          bio: prof.bio || `${prof.name} is a researcher at ${prof.university} working on ${areas.slice(0, 3).join(", ")}.`,
          notes: "Auto-added from researcher search. Research areas: " + areas.join(", "),
          status: "unsorted",
          email_status: "not_emailed",
        }).then(() => {}).catch(() => {})

        added++
        send({ type: "progress", found: added, total: totalToAdd, current: `Added ${prof.name} from live database (${score}% match)` })
      }
    }

    send({ type: "done", found: added })
    writer.close()
  }

  run().catch(e => {
    send({ type: "error", message: e.message })
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
