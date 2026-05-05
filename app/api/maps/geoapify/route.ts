import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { lat, lon, radius, keyword } = await req.json()
    const apiKey = process.env.GEOAPIFY_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEOAPIFY_API_KEY" }, { status: 500 })
    }

    // Map user industries to Geoapify categories
    const industryMap: Record<string, string> = {
      "Software / Tech": "commercial.office",
      "Marketing / Creative": "commercial.office",
      "Finance / Accounting": "commercial.financial,commercial.office",
      "Healthcare / Medical": "healthcare",
      "Education / Research": "education",
      "Non-Profit / NGO": "commercial.office",
      "Any": "commercial,office,production,industrial"
    }

    const categories = industryMap[keyword] || "commercial,office"
    
    // We can also use 'name' if the keyword is not a direct category match
    const nameParam = (keyword && !industryMap[keyword]) ? `&name=${encodeURIComponent(keyword)}` : ""
    
    const url = `https://api.geoapify.com/v2/places?categories=${categories}${nameParam}&filter=circle:${lon},${lat},${radius}&limit=40&apiKey=${apiKey}`
    
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Geoapify API error: ${res.status}`)
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Geoapify API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
