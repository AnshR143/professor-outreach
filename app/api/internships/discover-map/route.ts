import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { detectApiKey } from "@/lib/ai/detect-key"

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverpassElement {
  type: string
  id: number
  lat: number
  lon: number
  tags: Record<string, string>
}

interface OverpassResponse {
  elements: OverpassElement[]
}

export interface DiscoveredBusiness {
  id: string
  name: string
  lat: number
  lon: number
  type: string          // shop / office / cafe / etc.
  address: string
  website: string | null
  phone: string | null
  internScore: number   // 1–10
  scoreReason: string
  industry: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function geocode(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { "User-Agent": "OutreachAI/1.0 (internship discovery)" },
    })
    const data = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

function buildOverpassQuery(lat: number, lon: number, radiusM: number): string {
  return `[out:json][timeout:25];
(
  node["office"]["name"](around:${radiusM},${lat},${lon});
  node["shop"]["name"](around:${radiusM},${lat},${lon});
  node["amenity"~"^(restaurant|cafe|bar|studio|coworking|gym|salon|clinic|pharmacy|school|college|library|marketplace)$"]["name"](around:${radiusM},${lat},${lon});
  node["craft"]["name"](around:${radiusM},${lat},${lon});
  node["company"]["name"](around:${radiusM},${lat},${lon});
);
out body 80;`
}

function osmTagToType(tags: Record<string, string>): string {
  if (tags.office)  return tags.office
  if (tags.shop)    return `${tags.shop} shop`
  if (tags.amenity) return tags.amenity
  if (tags.craft)   return tags.craft
  if (tags.company) return tags.company
  return "business"
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
    tags["addr:state"],
  ].filter(Boolean)
  return parts.length ? parts.join(" ") : tags["addr:full"] || ""
}

async function scoreWithGroq(
  businesses: { name: string; type: string; address: string }[],
  industry: string,
  apiKey: string,
): Promise<{ score: number; reason: string; industry: string }[]> {
  const Groq = (await import("groq-sdk")).default
  const client = new Groq({ apiKey })

  const prompt = `You are an expert at identifying which local businesses are likely to hire interns or part-time workers.

Given the following list of businesses and the target internship industry "${industry}", rate each one on a scale of 1–10 for likelihood of hiring interns. Consider:
- Small/medium-sized = higher chance
- Relevance to "${industry}" field = higher score
- Tech, design, marketing, media companies tend to hire interns
- Very large chains or utilities = lower score

Businesses:
${businesses.map((b, i) => `${i + 1}. Name: "${b.name}" | Type: ${b.type} | Location: ${b.address || "local area"}`).join("\n")}

Respond ONLY with valid JSON — an array of exactly ${businesses.length} objects, each with:
{ "score": number 1-10, "reason": string max 60 chars, "industry": string (the relevant industry category) }

Example: [{"score":8,"reason":"Small digital agency, likely needs design interns","industry":"Design"}]`

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1200,
  })

  const raw = completion.choices[0]?.message?.content || "[]"
  const jsonStr = raw.match(/\[[\s\S]*\]/)?.[0] || "[]"
  try {
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed) && parsed.length === businesses.length) return parsed
  } catch { /* fallback below */ }
  // Fallback: return neutral scores
  return businesses.map(() => ({ score: 5, reason: "Could be a fit", industry: industry }))
}

async function scoreWithGemini(
  businesses: { name: string; type: string; address: string }[],
  industry: string,
  apiKey: string,
): Promise<{ score: number; reason: string; industry: string }[]> {
  const prompt = `Rate each business 1-10 for likelihood of hiring interns in the "${industry}" field.
Consider: small/medium businesses score higher, relevant industry = higher score.

Businesses:
${businesses.map((b, i) => `${i + 1}. "${b.name}" (${b.type})`).join("\n")}

Reply ONLY with JSON array of ${businesses.length} objects: [{"score":N,"reason":"short reason","industry":"category"}]`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )
  const data = await res.json()
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
  const jsonStr = raw.match(/\[[\s\S]*\]/)?.[0] || "[]"
  try {
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed) && parsed.length === businesses.length) return parsed
  } catch { /* fallback */ }
  return businesses.map(() => ({ score: 5, reason: "Could be a fit", industry }))
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("ai_api_key").eq("user_id", user.id).single() as { data: { ai_api_key: string | null } | null }

    const body = await request.json()
    const {
      location,
      industry = "technology",
      radius = 3000,  // metres
      minScore = 0,   // filter threshold
    } = body

    if (!location?.trim()) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 })
    }

    // 1. Geocode location
    const coords = await geocode(location)
    if (!coords) {
      return NextResponse.json({ error: `Could not find location: "${location}"` }, { status: 400 })
    }

    // 2. Query Overpass API for nearby businesses (try multiple endpoints)
    const OVERPASS_ENDPOINTS = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.openstreetmap.ru/api/interpreter",
    ]
    const query = buildOverpassQuery(coords.lat, coords.lon, Math.min(radius, 10000))
    let elements: OverpassElement[] = []
    let overpassOk = false

    for (const overpassUrl of OVERPASS_ENDPOINTS) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 18000)
        const ovRes = await fetch(overpassUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        })
        clearTimeout(timer)
        if (!ovRes.ok) continue
        const ovData: OverpassResponse = await ovRes.json()
        elements = ovData.elements?.filter(el => el.tags?.name) || []
        overpassOk = true
        break
      } catch {
        continue
      }
    }
    if (!overpassOk) {
      return NextResponse.json({ error: "Could not query business data. The map data service is temporarily unavailable — please try again in a moment." }, { status: 503 })
    }

    if (elements.length === 0) {
      return NextResponse.json({ businesses: [], center: [coords.lon, coords.lat], message: "No businesses found in this area. Try a broader search." })
    }

    // 3. Deduplicate and prepare for AI scoring (cap at 50 to keep AI cost low)
    const seen = new Set<string>()
    const unique: OverpassElement[] = []
    for (const el of elements) {
      if (!seen.has(el.tags.name)) {
        seen.add(el.tags.name)
        unique.push(el)
      }
      if (unique.length >= 50) break
    }

    const forScoring = unique.map(el => ({
      name: el.tags.name,
      type: osmTagToType(el.tags),
      address: buildAddress(el.tags),
    }))

    // 4. Score with AI
    const apiKey = profile?.ai_api_key || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY
    let scores: { score: number; reason: string; industry: string }[] = forScoring.map(() => ({ score: 5, reason: "Local business", industry }))

    if (apiKey) {
      try {
        const detected = detectApiKey(apiKey)
        if (detected.provider === "gemini") {
          scores = await scoreWithGemini(forScoring, industry, apiKey)
        } else {
          scores = await scoreWithGroq(forScoring, industry, apiKey)
        }
      } catch (aiErr) {
        console.warn("AI scoring failed, using defaults:", aiErr)
      }
    }

    // 5. Build response
    const businesses: DiscoveredBusiness[] = unique
      .map((el, i) => ({
        id: String(el.id),
        name: el.tags.name,
        lat: el.lat,
        lon: el.lon,
        type: osmTagToType(el.tags),
        address: buildAddress(el.tags),
        website: el.tags.website || el.tags["contact:website"] || null,
        phone: el.tags.phone || el.tags["contact:phone"] || null,
        internScore: scores[i]?.score ?? 5,
        scoreReason: scores[i]?.reason ?? "Local business",
        industry: scores[i]?.industry ?? industry,
      }))
      .filter(b => b.internScore >= minScore)
      .sort((a, b) => b.internScore - a.internScore)

    return NextResponse.json({
      businesses,
      center: [coords.lon, coords.lat],
      total: businesses.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("discover-map error:", message)
    return NextResponse.json({ error: "Discovery failed: " + message }, { status: 500 })
  }
}
