import { NextRequest, NextResponse } from "next/server"
import { placeDetails } from "@/lib/maps/google-places"

export async function POST(req: NextRequest) {
  try {
    const { placeId } = await req.json()
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GOOGLE_MAPS_API_KEY" }, { status: 500 })
    }

    if (!placeId) {
      return NextResponse.json({ error: "Missing placeId" }, { status: 400 })
    }

    const details = await placeDetails({
      apiKey,
      placeId
    })

    return NextResponse.json({ details })
  } catch (error: any) {
    console.error("Maps Details API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
