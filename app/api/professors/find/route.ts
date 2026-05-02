import { createClient, createServiceClient } from "@/lib/supabase/server"
import { PRELOADED_PROFESSORS } from "@/lib/data/professors"

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
  return `Researcher at ${profUniversity} in ${profAreas[0] || "AI"} — expand your search criteria for a stronger match.`
}

export async function POST(req: Request) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const supabase = await createServiceClient()
  const { fields, universities, keyword, count: rawCount } = await req.json()
  const count = Math.min(Math.max(1, parseInt(rawCount) || 5), 10)

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

    const matching = PRELOADED_PROFESSORS.filter(prof => {
      if (existingNames.has(prof.name.toLowerCase())) return false

      const matchesField = fields.length === 0 || fields.some((f: string) =>
        prof.areas.some(a =>
          a.toLowerCase().includes(f.toLowerCase()) ||
          f.toLowerCase().includes(a.toLowerCase())
        )
      )
      const matchesUni = universities.length === 0 || universities.some((u: string) => {
        const uLow = u.toLowerCase().replace(/\buniversity\b/g, "").replace(/\buniv\b/g, "").replace(/\bcollege\b/g, "").trim()
        const pLow = prof.university.toLowerCase().replace(/\buniversity\b/g, "").replace(/\buniv\b/g, "").replace(/\bcollege\b/g, "").trim()
        return pLow.includes(uLow) || uLow.includes(pLow)
      })
      const matchesKeyword = !keyword ||
        prof.name.toLowerCase().includes(keyword.toLowerCase()) ||
        prof.areas.some(a => a.toLowerCase().includes(keyword.toLowerCase())) ||
        prof.university.toLowerCase().includes(keyword.toLowerCase())

      return matchesField && matchesUni && matchesKeyword
    })

    // Sort by match score desc, then shuffle within same score bucket for variety
    const scored = matching.map(prof => {
      const { score, fieldMatches, resumeMatches } = calcMatchScore(
        prof.areas, fields, resumeKeywords, prof.university
      )
      return { prof, score, fieldMatches, resumeMatches }
    })
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return Math.random() - 0.5
    })
    const toAdd = scored.slice(0, count)

    if (toAdd.length === 0) {
      send({ type: "done", found: 0 })
      writer.close()
      return
    }

    let added = 0
    for (const { prof, score, fieldMatches, resumeMatches } of toAdd) {
      send({ type: "progress", found: added, total: toAdd.length, current: `Adding ${prof.name}...` })

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

        added++
        send({ type: "progress", found: added, total: toAdd.length, current: `Added ${prof.name} (${score}% match)` })
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
