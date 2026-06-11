import { NextRequest, NextResponse } from "next/server"

// Map dropdown industry values (from MapDiscoverModal INDUSTRIES) to Geoapify categories.
// Keys MUST match the strings the client sends. Categories MUST be valid Geoapify category
// names  see https://apidocs.geoapify.com/docs/places/ for the full list.
// `office.*` covers actual company offices (the right thing for internship searches).
// `commercial.*` covers retail/shops. `service.*` covers banks, repair, etc.
const INDUSTRY_CATEGORIES: Record<string, string> = {
  "Technology / Software": "office.it,office.telecommunication,office.research,office.coworking",
  "Design / Creative": "office.advertising_agency,office.architect,entertainment.culture",
  "Marketing / Advertising": "office.advertising_agency,office.newspaper",
  "Finance / Accounting": "office.financial,office.accountant,office.tax_advisor,service.financial",
  "Healthcare / Medical": "healthcare",
  "Legal / Law": "office.lawyer,office.notary",
  "Media / Journalism": "office.newspaper,office.advertising_agency",
  "Education": "education,office.educational_institution,office.research",
  "Real Estate": "office.estate_agent,service.estate_agent",
  "Retail / E-commerce": "commercial",
  "Food & Hospitality": "catering,accommodation",
  "Architecture / Engineering": "office.architect,office.research,production",
  "Non-profit / NGO": "office.non_profit,office.charity,office.foundation,office.association",
  "Any": "office,commercial,healthcare,education,catering,service",
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lon, radius, keyword } = await req.json()
    const apiKey = process.env.GEOAPIFY_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEOAPIFY_API_KEY" }, { status: 500 })
    }
    if (typeof lat !== "number" || typeof lon !== "number" || typeof radius !== "number") {
      return NextResponse.json({ error: "lat, lon, radius must be numbers" }, { status: 400 })
    }

    const categories = INDUSTRY_CATEGORIES[keyword] || INDUSTRY_CATEGORIES["Any"]

    // Geoapify expects: circle:lon,lat,radius_in_meters. Cap radius at 50km (API limit).
    // bias=proximity ranks closer places first; limit 20 gives a real result set.
    const r = Math.min(Math.max(Math.round(radius), 100), 50000)
    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${r}&bias=proximity:${lon},${lat}&limit=20&apiKey=${apiKey}`

    const res = await fetch(url)
    const text = await res.text()
    if (!res.ok) {
      console.error("Geoapify upstream error", res.status, text)
      return NextResponse.json(
        { error: `Geoapify ${res.status}: ${text.slice(0, 200)}`, url: url.replace(apiKey, "***") },
        { status: 502 }
      )
    }
    const data = JSON.parse(text)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Geoapify route error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
