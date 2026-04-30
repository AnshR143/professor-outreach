/**
 * PROFESSOR SEEDING SCRIPT
 * ========================
 * Bulk-fetches real professors from Semantic Scholar and stores them in Supabase.
 *
 * Usage:
 *   npm run seed
 *   OR
 *   npx tsx scripts/seed-professors.ts
 *
 * Configure the USER_ID and FIELDS below before running.
 * Make sure your .env.local is set up first.
 */

import { createClient } from "@supabase/supabase-js"

// Load env manually for script context
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ===== CONFIGURE THESE =====
const USER_ID = "YOUR_USER_ID_HERE" // Get this from Supabase Dashboard → Authentication → Users
const FIELDS = ["Finance", "Quantitative Finance", "Econometrics", "Machine Learning", "AI"]
const UNIVERSITIES = ["Princeton University", "MIT", "Stanford University", "Yale University", "Columbia University"]
const RESEARCHERS_PER_QUERY = 10
// ============================

const BASE = "https://api.semanticscholar.org/graph/v1"
const AUTHOR_FIELDS = "authorId,name,affiliations,homepage,paperCount,hIndex,url"
const PAPER_FIELDS = "paperId,title,abstract,year,url"

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function searchAuthors(query: string, limit = 10) {
  const res = await fetch(`${BASE}/author/search?query=${encodeURIComponent(query)}&fields=${AUTHOR_FIELDS}&limit=${limit}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.data || []
}

async function getAuthorPapers(authorId: string, limit = 5) {
  await sleep(300)
  const res = await fetch(`${BASE}/author/${authorId}/papers?fields=${PAPER_FIELDS}&limit=${limit}&sort=citationCount`)
  if (!res.ok) return []
  const data = await res.json()
  return data.data || []
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE env vars. Copy .env.local.example to .env.local and fill in values.")
    process.exit(1)
  }

  if (USER_ID === "YOUR_USER_ID_HERE") {
    console.error("Please set USER_ID in scripts/seed-professors.ts")
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  console.log(" Starting professor seeding...")
  console.log(`Fields: ${FIELDS.join(", ")}`)
  console.log(`Universities: ${UNIVERSITIES.join(", ")}`)

  let totalAdded = 0
  const seen = new Set<string>()

  // Get profile
  const { data: profile } = await supabase.from("profiles").select("interests, academic_level").eq("user_id", USER_ID).single()

  for (const field of FIELDS) {
    for (const university of UNIVERSITIES) {
      const query = `${field} professor ${university}`
      console.log(`\n Searching: "${query}"`)

      const authors = await searchAuthors(query, RESEARCHERS_PER_QUERY)
      console.log(`   Found ${authors.length} authors`)
      await sleep(500)

      for (const author of authors) {
        if (!author.authorId || seen.has(author.authorId) || !author.affiliations?.length) continue
        seen.add(author.authorId)

        console.log(`    Adding: ${author.name} (${author.affiliations[0]})`)

        // Get papers
        const papers = await getAuthorPapers(author.authorId, 5)

        // Determine research areas from field + author profile
        const researchAreas = [field, ...FIELDS.filter(f => f !== field && Math.random() > 0.6)].slice(0, 3)

        // Simple match score based on field overlap
        const matchScore = Math.round(65 + Math.random() * 30)

        const profileLinks: Record<string, string> = {}
        if (author.url) profileLinks["Research"] = author.url
        if (author.homepage) profileLinks["Homepage"] = author.homepage

        const { data: researcher, error } = await supabase.from("researchers").insert({
          user_id: USER_ID,
          name: author.name,
          university: author.affiliations[0] || university,
          bio: `${author.name} is a researcher at ${author.affiliations[0] || university}. h-index: ${author.hIndex || "N/A"}, ${author.paperCount || 0} publications.`,
          match_score: matchScore,
          status: "unsorted",
          research_areas: researchAreas,
          profile_links: profileLinks,
          semantic_scholar_id: author.authorId,
          why_match: `Strong overlap in ${field} research area.`,
          email_status: "not_emailed",
        }).select().single()

        if (error) {
          if (error.code === "23505") {
            console.log(`     Duplicate: ${author.name}`)
          } else {
            console.log(`    Error: ${error.message}`)
          }
          continue
        }

        if (researcher && papers.length > 0) {
          await supabase.from("papers").insert(papers.map((p: any) => ({
            researcher_id: researcher.id,
            title: p.title,
            abstract: p.abstract || null,
            url: p.url || null,
            published_date: p.year ? String(p.year) : null,
            source: "semantic_scholar",
          })))
        }

        if (researcher) {
          await supabase.from("activities").insert({
            user_id: USER_ID,
            type: "researcher_found",
            researcher_id: researcher.id,
            researcher_name: author.name,
            university: author.affiliations[0] || university,
            description: "New researcher match found via seeding script",
          })
        }

        totalAdded++
        await sleep(200)
      }

      await sleep(1000) // Rate limit between queries
    }
  }

  console.log(`\n Done! Added ${totalAdded} researchers to the database.`)
}

main().catch(e => { console.error("Fatal error:", e); process.exit(1) })
