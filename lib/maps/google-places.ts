/**
 * Google Places API client.
 *
 * Wraps two endpoints from the Places API (Legacy) Nearby Search + Details:
 *   - https://maps.googleapis.com/maps/api/place/nearbysearch/json
 *   - https://maps.googleapis.com/maps/api/place/details/json
 *
 * The legacy endpoints are used because they return next_page_token (so we
 * can pull >20 results) and they are still fully supported alongside the
 * newer Places API (New). If you migrate to the New API, swap fetchNearby /
 * fetchDetails — public surface stays the same.
 *
 * IMPORTANT: per Google ToS we only call official endpoints. We never scrape
 * google.com or maps.google.com.
 */

const NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

const DETAILS_FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "international_phone_number",
  "formatted_phone_number",
  "website",
  "url",
  "rating",
  "user_ratings_total",
  "reviews",
  "geometry",
  "types",
  "business_status",
  "opening_hours",
].join(",")

export interface NearbyPlaceLite {
  place_id: string
  name: string
  vicinity?: string
  rating?: number
  user_ratings_total?: number
  geometry?: { location: { lat: number; lng: number } }
  types?: string[]
  business_status?: string
}

export interface PlaceReview {
  author_name?: string
  rating?: number
  text?: string
  time?: number
  relative_time_description?: string
}

export interface PlaceDetails {
  place_id: string
  name: string
  address: string
  phone: string | null
  website: string | null
  google_maps_url: string | null
  rating: number | null
  review_count: number | null
  reviews: PlaceReview[]
  lat: number | null
  lng: number | null
  types: string[]
  business_status: string | null
}

export interface NearbySearchInput {
  apiKey: string
  lat: number
  lng: number
  radius: number      // metres, max 50000
  keyword?: string    // e.g. "software company"
  type?: string       // optional Places type, e.g. "cafe", "store"
  maxResults?: number // hard cap (default 60 — Google returns max 60 across 3 pages)
  signal?: AbortSignal
}

interface NearbyApiResponse {
  status: string
  error_message?: string
  results?: NearbyPlaceLite[]
  next_page_token?: string
}

interface DetailsApiResponse {
  status: string
  error_message?: string
  result?: {
    place_id: string
    name?: string
    formatted_address?: string
    vicinity?: string
    international_phone_number?: string
    formatted_phone_number?: string
    website?: string
    url?: string
    rating?: number
    user_ratings_total?: number
    reviews?: PlaceReview[]
    geometry?: { location: { lat: number; lng: number } }
    types?: string[]
    business_status?: string
  }
}

// ─── Low-level fetch with retry on 429/5xx ────────────────────────────────────

async function fetchJson<T>(url: string, signal?: AbortSignal, attempt = 0): Promise<T> {
  const res = await fetch(url, { signal })
  if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
    if (attempt >= 3) throw new Error(`Google Places HTTP ${res.status} after ${attempt} retries`)
    const wait = 500 * Math.pow(2, attempt) + Math.random() * 250
    await new Promise(r => setTimeout(r, wait))
    return fetchJson<T>(url, signal, attempt + 1)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Google Places HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

// next_page_token is only valid after a short delay (Google docs).
function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

// ─── Nearby Search (paginated to maxResults) ──────────────────────────────────

export async function nearbySearch(input: NearbySearchInput): Promise<NearbyPlaceLite[]> {
  const { apiKey, lat, lng, radius, keyword, type, maxResults = 60, signal } = input
  if (!apiKey) throw new Error("Missing Google Maps API key")

  const baseParams = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(Math.min(Math.max(radius, 100), 50_000)),
    key: apiKey,
  })
  if (keyword) baseParams.set("keyword", keyword)
  if (type)    baseParams.set("type", type)

  const out: NearbyPlaceLite[] = []
  let pageToken: string | undefined
  let pages = 0

  while (out.length < maxResults && pages < 3) {
    const params = new URLSearchParams(baseParams)
    if (pageToken) {
      // Per Google: next_page_token + key are the only valid params on subsequent pages.
      params.delete("location")
      params.delete("radius")
      params.delete("keyword")
      params.delete("type")
      params.set("pagetoken", pageToken)
      // Token isn't immediately valid — wait a moment.
      await sleep(2000)
    }
    const url = `${NEARBY_URL}?${params.toString()}`
    const data = await fetchJson<NearbyApiResponse>(url, signal)

    // INVALID_REQUEST on a paged call usually means the token is still warming up.
    if (data.status === "INVALID_REQUEST" && pageToken) {
      await sleep(2000)
      const retry = await fetchJson<NearbyApiResponse>(url, signal)
      if (retry.results) out.push(...retry.results)
      pageToken = retry.next_page_token
    } else if (data.status === "OK" || data.status === "ZERO_RESULTS") {
      if (data.results) out.push(...data.results)
      pageToken = data.next_page_token
    } else {
      throw new Error(`Google Places error: ${data.status} — ${data.error_message ?? "no detail"}`)
    }

    pages++
    if (!pageToken) break
  }

  return out.slice(0, maxResults)
}

// ─── Place Details ────────────────────────────────────────────────────────────

export async function placeDetails(opts: {
  apiKey: string
  placeId: string
  signal?: AbortSignal
}): Promise<PlaceDetails> {
  const { apiKey, placeId, signal } = opts
  if (!apiKey) throw new Error("Missing Google Maps API key")
  if (!placeId) throw new Error("Missing place_id")

  const params = new URLSearchParams({
    place_id: placeId,
    fields: DETAILS_FIELDS,
    key: apiKey,
  })
  const url = `${DETAILS_URL}?${params.toString()}`
  const data = await fetchJson<DetailsApiResponse>(url, signal)

  if (data.status !== "OK") {
    throw new Error(`Google Place Details error: ${data.status} — ${data.error_message ?? "no detail"}`)
  }
  const r = data.result!

  return {
    place_id: r.place_id,
    name: r.name ?? "",
    address: r.formatted_address ?? r.vicinity ?? "",
    phone: r.international_phone_number ?? r.formatted_phone_number ?? null,
    website: r.website ?? null,
    google_maps_url: r.url ?? null,
    rating: r.rating ?? null,
    review_count: r.user_ratings_total ?? null,
    reviews: r.reviews ?? [],
    lat: r.geometry?.location.lat ?? null,
    lng: r.geometry?.location.lng ?? null,
    types: r.types ?? [],
    business_status: r.business_status ?? null,
  }
}

// ─── Geocoding (text → lat/lng) ───────────────────────────────────────────────

export async function geocode(opts: {
  apiKey: string
  address: string
  signal?: AbortSignal
}): Promise<{ lat: number; lng: number; formatted: string } | null> {
  const { apiKey, address, signal } = opts
  if (!apiKey) throw new Error("Missing Google Maps API key")

  const params = new URLSearchParams({ address, key: apiKey })
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
  const data = await fetchJson<{
    status: string
    error_message?: string
    results: Array<{ geometry: { location: { lat: number; lng: number } }; formatted_address: string }>
  }>(url, signal)

  if (data.status === "ZERO_RESULTS") return null
  if (data.status !== "OK") throw new Error(`Geocode error: ${data.status} — ${data.error_message ?? ""}`)

  const r = data.results[0]
  return { lat: r.geometry.location.lat, lng: r.geometry.location.lng, formatted: r.formatted_address }
}
