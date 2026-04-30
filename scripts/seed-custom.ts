import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"
import Groq from "groq-sdk"

// Load .env.local manually
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  envContent.split("\n").forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GROQ_API_KEY = process.env.GROQ_API_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const groq = new Groq({ apiKey: GROQ_API_KEY })

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function processChunk(chunk: string[], userId: string) {
  const prompt = `Parse the following lines into a JSON array of objects.
Each line has a professor's info: University, Name, Research Areas, and an optional URL bounded by "__" (e.g. __https://...__).
Extract these exactly. Do not truncate the research areas.
Return ONLY valid JSON like: {"professors": [{"university": "...", "name": "...", "researchAreas": ["...", "..."], "url": "..."}]}

Lines:
${chunk.join("\n")}`

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    })

    const result = JSON.parse(completion.choices[0].message.content || "{}")
    const profs = result.professors || []

    for (const prof of profs) {
      if (!prof.name || !prof.university) continue

      console.log(`    Adding: ${prof.name} (${prof.university})`)

      const profileLinks: Record<string, string> = {}
      if (prof.url) profileLinks["Homepage"] = prof.url

      const matchScore = Math.round(70 + Math.random() * 25)

      const { data, error } = await supabase.from("researchers").insert({
        user_id: userId,
        name: prof.name,
        university: prof.university,
        bio: `${prof.name} is a researcher at ${prof.university}.`,
        match_score: matchScore,
        status: "unsorted",
        research_areas: prof.researchAreas || [],
        profile_links: profileLinks,
        why_match: `Strong overlap in ${prof.researchAreas?.[0] || 'research'}.`,
        email_status: "not_emailed",
      }).select().single()

      if (error) {
        if (error.code === "23505") {
          console.log(`    Duplicate: ${prof.name}`)
        } else {
          console.log(`    Error inserting ${prof.name}:`, error.message)
        }
      }
    }
  } catch (err: any) {
    console.error(" Error parsing chunk:", err.message)
  }
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GROQ_API_KEY) {
    console.error("Missing ENV variables.")
    process.exit(1)
  }

  const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
  if (uErr || !users || users.length === 0) {
    console.error("No users found in the authentication system. Please sign up first at localhost:3000.")
    process.exit(1)
  }

  const userId = users[0].id
  console.log(` Using User ID: ${userId}`)

  const dataPath = path.join(process.cwd(), "data.txt")
  if (!fs.existsSync(dataPath)) {
    console.error("data.txt not found")
    process.exit(1)
  }

  const text = fs.readFileSync(dataPath, "utf-8")
  const lines = text.split("\n").filter(l => l.trim().length > 0)

  const CHUNK_SIZE = 15
  for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
    const chunk = lines.slice(i, i + CHUNK_SIZE)
    console.log(`\n Processing chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(lines.length / CHUNK_SIZE)}...`)
    await processChunk(chunk, userId)
    await sleep(2000)
  }

  console.log("\n Finished seeding custom data.")
}

main().catch(e => { console.error("Fatal error:", e); process.exit(1) })
