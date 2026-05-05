import { NextRequest, NextResponse } from "next/server"
import { nearbySearch } from "@/lib/maps/google-places"

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, radius, keyword, type, maxResults } = await req.json()
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GOOGLE_MAPS_API_KEY" }, { status: 500 })
    }

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 })
    }

    const results = await nearbySearch({
      apiKey,
      lat,
      lng,
      radius: radius || 5000,
      keyword,
      type,
      maxResults: maxResults || 60
    })

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error("Maps Search API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
