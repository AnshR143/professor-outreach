import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    googleMapsEnabled: !!process.env.GOOGLE_MAPS_API_KEY,
    geoapifyEnabled: !!process.env.GEOAPIFY_API_KEY,
    aiEnabled: !!(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY)
  })
}
