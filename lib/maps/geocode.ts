/**
 * lib/maps/geocode.ts
 * -------------------
 * Multi-provider forward geocoding with fallback. Works in both server
 * routes and client components (plain fetch, no Node-only APIs).
 *
 * Provider order:
 *   1. Nominatim (best structured matching)
 *   2. Photon / komoot (typo-tolerant, great fallback when Nominatim
 *      rate-limits or finds nothing)
 *
 * Both are free OSM-backed services. Results are validated against each
 * other when both respond: if they disagree wildly (>100km) we prefer
 * Nominatim but flag low confidence via `corroborated: false`.
 */

export interface GeocodeResult {
  lat: number
  lon: number
  /** Human-readable place that was actually matched (sanity check for users). */
  displayName: string
  provider: "nominatim" | "photon"
  /** True when a second provider agreed within ~25km. */
  corroborated: boolean
}

const NOMINATIM_HEADERS = {
  "User-Agent": "InternLink/1.0 (internship & professor outreach; contact: vraohomes@gmail.com)",
}

async function fetchWithTimeout(url: string, ms: number, headers?: Record<string, string>) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers })
    clearTimeout(t)
    return res
  } catch {
    clearTimeout(t)
    return null
  }
}

async function geocodeNominatim(q: string): Promise<GeocodeResult | null> {
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
    `&format=json&limit=1&addressdetails=0`
  const res = await fetchWithTimeout(url, 7000, NOMINATIM_HEADERS)
  if (!res || !res.ok) return null
  try {
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name || q,
      provider: "nominatim",
      corroborated: false,
    }
  } catch {
    return null
  }
}

async function geocodePhoton(q: string): Promise<GeocodeResult | null> {
  // Photon is typo-tolerant: "chicgo" still finds Chicago.
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=en`
  const res = await fetchWithTimeout(url, 7000)
  if (!res || !res.ok) return null
  try {
    const data = await res.json()
    const f = data?.features?.[0]
    if (!f?.geometry?.coordinates) return null
    const [lon, lat] = f.geometry.coordinates
    const p = f.properties || {}
    const label = [p.name, p.city, p.state, p.country].filter(Boolean).join(", ")
    return {
      lat,
      lon,
      displayName: label || q,
      provider: "photon",
      corroborated: false,
    }
  } catch {
    return null
  }
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/**
 * Geocode a free-form location string. Runs Nominatim first; if it fails or
 * returns nothing, falls back to Photon. When both succeed we cross-check
 * the two answers and mark the result `corroborated` if they agree.
 */
export async function geocodeLocation(q: string): Promise<GeocodeResult | null> {
  const query = q.trim()
  if (!query) return null

  // Fire both in parallel — fastest accurate answer wins, and we can
  // cross-validate when both return.
  const [nom, pho] = await Promise.all([geocodeNominatim(query), geocodePhoton(query)])

  if (nom && pho) {
    const agree = distanceKm(nom, pho) <= 25
    return { ...nom, corroborated: agree }
  }
  return nom || pho || null
}
