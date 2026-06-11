import { NextResponse } from "next/server"
import { getAiKey } from "@/lib/ai/key-pool"

export async function GET() {
  return NextResponse.json({
    googleMapsEnabled: !!process.env.GOOGLE_MAPS_API_KEY,
    geoapifyEnabled: !!process.env.GEOAPIFY_API_KEY,
    aiEnabled: !!getAiKey()
  })
}
