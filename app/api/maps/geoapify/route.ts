import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { lat, lon, radius, keyword } = await req.json()
    const apiKey = process.env.GEOAPIFY_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEOAPIFY_API_KEY" }, { status: 500 })
    }

    // Geoapify Places API uses categories. 
    // We'll map keywords to categories or use text search.
    // Category 'commercial' is good for companies.
    const categories = keyword === "commercial" ? "commercial" : "commercial.office"
    
    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&limit=20&apiKey=${apiKey}`
    
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
