import { NextRequest, NextResponse } from "next/server"
import { nearbySearch, placeDetails } from "@/lib/maps/google-places"
import { scrapeWebsite } from "@/lib/maps/scraper"
import { scoreLead } from "@/lib/maps/lead-score"
import { analyzeReviews } from "@/lib/ai/review-analysis"
import { mapWithLimit } from "@/lib/maps/cache"
import { getAiKey } from "@/lib/ai/key-pool"

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, radius, keyword, type, maxResults = 15 } = await req.json()
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY
    const aiApiKey = getAiKey()

    if (!mapsApiKey) {
      return NextResponse.json({ error: "Missing GOOGLE_MAPS_API_KEY" }, { status: 500 })
    }

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 })
    }

    // 1. Initial Search
    const searchResults = await nearbySearch({
      apiKey: mapsApiKey,
      lat,
      lng,
      radius: radius || 5000,
      keyword,
      type,
      maxResults
    })

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // 2. Full Enrichment Pipeline (parallel with limit)
    const enrichedResults = await mapWithLimit(searchResults, 5, async (place) => {
      // Step A: Get Details
      const details = await placeDetails({
        apiKey: mapsApiKey,
        placeId: place.place_id
      })

      // Step B: Scrape Website (if exists)
      let scrapeData = null
      if (details.website) {
        scrapeData = await scrapeWebsite(details.website)
      }

      // Step C: Analyze Reviews (AI)
      const reviewsInsight = await analyzeReviews(details.name, details.reviews, aiApiKey)

      // Step D: Score Lead
      const leadScore = scoreLead({
        rating: details.rating,
        reviewCount: details.review_count,
        hasWebsite: !!details.website,
        emailCount: scrapeData?.emails.length || 0,
        socialCount: Object.keys(scrapeData?.socials || {}).length,
        complaints: reviewsInsight.complaints,
        businessStatus: details.business_status
      })

      return {
        ...details,
        scrape: scrapeData,
        analysis: reviewsInsight,
        leadScore
      }
    })

    // Filter out any errors from the pipeline
    const finalResults = enrichedResults.filter(r => !('error' in r))

    return NextResponse.json({ results: finalResults })
  } catch (error: any) {
    console.error("Pipeline Run API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
