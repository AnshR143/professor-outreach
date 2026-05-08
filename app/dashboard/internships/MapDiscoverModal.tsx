"use client"
import "maplibre-gl/dist/maplibre-gl.css"
import { useState, useCallback, useRef, useEffect } from "react"
import { Map, MapMarker, MarkerContent, MarkerTooltip, MapControls, useMap } from "@/components/ui/map"
import { createClient } from "@/lib/supabase/client"
import { US_CITIES } from "@/lib/data/us-cities"
// ─── OSM helpers (client-side Overpass parsing) ───────────────────────────────

interface RawBiz {
  id: number
  lat?: number               // present for node elements
  lon?: number               // present for node elements
  center?: { lat: number; lon: number }  // present for way/relation elements
  tags: Record<string, string>
}

function osmTagToType(tags: Record<string, string>): string {
  if (tags.office)  return tags.office
  if (tags.shop)    return `${tags.shop} shop`
  if (tags.amenity) return tags.amenity
  if (tags.craft)   return tags.craft
  return "business"
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:state"]].filter(Boolean)
  return parts.length ? parts.join(" ") : tags["addr:full"] || ""
}

// ─── Types ────────────────────────────────────────────────────────────────────

// Inline type  avoids importing from an API route file (causes webpack bundling issues)
export interface DiscoveredBusiness {
  id: string
  name: string
  lat: number
  lon: number
  type: string
  address: string
  website: string | null
  phone: string | null
  email?: string | null
  internScore: number
  description: string
  industry: string
}

// ─── Score colour helper ──────────────────────────────────────────────────────

function scoreColor(s: number): { bg: string; text: string; border: string } {
  if (s >= 8) return { bg: "#dcfce7", text: "#15803d", border: "#86efac" }
  if (s >= 6) return { bg: "#c6d3e3", text: "#304674", border: "#98bad5" }
  if (s >= 4) return { bg: "#fff7ed", text: "#c2410c", border: "#fdba74" }
  return { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" }
}

function ScoreBadge({ score }: { score: number }) {
  const { bg, text, border } = scoreColor(score)
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: bg, color: text, border: `1.5px solid ${border}`, flexShrink: 0 }}>
      {score}/10
    </span>
  )
}

function MarkerDot({ score, selected }: { score: number; selected: boolean }) {
  const { bg, border } = scoreColor(score)
  return (
    <div style={{
      width: selected ? 20 : 14,
      height: selected ? 20 : 14,
      borderRadius: "50%",
      background: selected ? "#304674" : bg,
      border: `2.5px solid ${selected ? "#1f2f55" : border}`,
      boxShadow: selected ? "0 0 0 4px rgba(48, 70, 116,0.25)" : "0 2px 6px rgba(0,0,0,0.18)",
      transition: "all 0.15s",
      cursor: "pointer",
    }} />
  )
}

// ─── Flatten cities for suggestions ──────────────────────────────────────────

const US_LOCATIONS = Object.entries(US_CITIES).flatMap(([state, cities]) => 
  cities.map(city => `${city}, ${state}`)
).sort()

// ─── FlyTo helper  must be inside Map context ────────────────────────────────

function FlyToCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const { map, isLoaded } = useMap()
  useEffect(() => {
    if (!map || !isLoaded) return
    map.flyTo({ center, zoom, essential: true, duration: 1200 })
  }, [map, isLoaded, center[0], center[1], zoom]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// ─── Industry options ─────────────────────────────────────────────────────────

const INDUSTRIES = [
  "Technology / Software",
  "Design / Creative",
  "Marketing / Advertising",
  "Finance / Accounting",
  "Healthcare / Medical",
  "Legal / Law",
  "Media / Journalism",
  "Education",
  "Real Estate",
  "Retail / E-commerce",
  "Food & Hospitality",
  "Architecture / Engineering",
  "Non-profit / NGO",
  "Any",
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  onContactAdded?: () => void
}

export default function MapDiscoverModal({ onClose, onContactAdded }: Props) {
  const supabase = createClient()

  // Search form
  const [location, setLocation]   = useState("")
  const [industry, setIndustry]   = useState("Technology / Software")
  const [radius, setRadius]       = useState(3000)
  const [minScore, setMinScore]   = useState(6)
  const [locating, setLocating]   = useState(false)

  // Results
  const [loading, setLoading]     = useState(false)
  const [step, setStep]           = useState("")
  const [error, setError]         = useState("")
  const [businesses, setBusinesses] = useState<DiscoveredBusiness[]>([])
  const [center, setCenter]       = useState<[number, number] | null>(null)
  const [selected, setSelected]   = useState<DiscoveredBusiness | null>(null)

  // Adding contacts
  const [adding, setAdding]       = useState<Set<string>>(new Set())
  const [added, setAdded]         = useState<Set<string>>(new Set())

  // Google vs OSM vs Geoapify toggle
  const [provider, setProvider]   = useState<"osm" | "google" | "geoapify">("osm")
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [geoapifyEnabled, setGeoapifyEnabled] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)

  // Check if Google is enabled
  useEffect(() => {
    fetch("/api/settings/features")
      .then(res => res.json())
      .then(data => {
        if (data.googleMapsEnabled) {
          setGoogleEnabled(true)
          setProvider("google")
        }
        if (data.geoapifyEnabled) {
          setGeoapifyEnabled(true)
          if (!data.googleMapsEnabled) setProvider("geoapify")
        }
      })
      .catch(() => {})
  }, [])

  // Auto-detect location on mount
  useEffect(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "InternLink/1.0 (internship map)" } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ""
          const stateCode = data.address?.["ISO3166-2-lvl4"]?.split("-")[1] || data.address?.state || ""
          if (city) setLocation(stateCode ? `${city}, ${stateCode}` : city)
        } catch { /* ignore */ }
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }, [])

  // ── Client-side geocode via Nominatim ───────────────────────────────────────

  async function geocodeLocation(loc: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`,
        { headers: { "User-Agent": "InternLink/1.0" }, signal: ctrl.signal }
      )
      clearTimeout(t)
      const data = await res.json()
      if (!data.length) return null
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    } catch { return null }
  }

  // ── Client-side Overpass (tries endpoints in parallel, takes first win) ───────

  async function queryOverpass(lat: number, lon: number, radiusM: number): Promise<RawBiz[]> {
    const r = Math.min(radiusM, 10000)
    // Include both node AND way  US cities map most businesses as ways (building polygons)
    // "out center" returns centroid coords for ways so we can place markers
    const q = (tag: string) =>
      `node["${tag}"]["name"](around:${r},${lat},${lon});way["${tag}"]["name"](around:${r},${lat},${lon});`
    const query = `[out:json][timeout:15];(${q("office")}${q("shop")}${q("craft")}${q("company")}${q("industrial")}${q("business")}node["amenity"~"^(cafe|studio|coworking|clinic|school|college|library|marketplace|bank|post_office)$"]["name"](around:${r},${lat},${lon});way["amenity"~"^(cafe|studio|coworking|clinic|school|college|library|marketplace|bank|post_office)$"]["name"](around:${r},${lat},${lon}););out center 100;`

    const ENDPOINTS = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.openstreetmap.ru/api/interpreter",
    ]

    // Try all endpoints in parallel, return first successful non-empty result
    const tryEndpoint = async (url: string): Promise<RawBiz[]> => {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 15000)
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
          signal: ctrl.signal,
        })
        clearTimeout(t)
        if (!res.ok) throw new Error("non-ok")
        const data = await res.json()
        // Keep elements that have a name AND usable coordinates (node has lat/lon, way has center)
        const els = (data.elements || []).filter(
          (e: any) => e.tags?.name && (e.lat != null || e.center?.lat != null)
        ) as RawBiz[]
        if (els.length === 0) throw new Error("empty")
        return els
      } catch {
        clearTimeout(t)
        throw new Error("failed")
      }
    }

    try {
      return await Promise.any(ENDPOINTS.map(tryEndpoint))
    } catch {
      return []
    }
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!location.trim()) return
    setLoading(true)
    setStep("Locating city…")
    setError("")
    setBusinesses([])
    setSelected(null)

    try {
      // 1. Geocode (needed for both providers to set map center)
      const coords = await geocodeLocation(location.trim())
      if (!coords) {
        setError(`Could not find "${location}". Try a city name like "Chicago, IL".`)
        setLoading(false)
        return
      }
      setCenter([coords.lon, coords.lat])

      if (provider === "google") {
        setStep("Running Google enrichment pipeline…")
        const pipelineRes = await fetch("/api/pipeline/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: coords.lat,
            lng: coords.lon,
            radius,
            keyword: industry === "Any" ? "software company" : industry, // "software company" is a better default than "companies"
            maxResults: 20
          })
        })

        if (!pipelineRes.ok) {
          const errData = await pipelineRes.json().catch(() => ({}))
          throw new Error(errData.error || "Pipeline failed")
        }
        
        const data = await pipelineRes.json()
        const results: DiscoveredBusiness[] = (data.results || []).map((p: any) => ({
          id: p.place_id,
          name: p.name,
          lat: p.lat,
          lon: p.lng,
          type: p.types?.[0]?.replace(/_/g, " ") || "business",
          address: p.address,
          website: p.website,
          phone: p.phone,
          internScore: Math.round((p.leadScore?.score || 50) / 10),
          scoreReason: p.leadScore?.reasons?.[0] || "Google Verified Business",
          industry: industry,
          emails: p.scrape?.emails || [],
          sentiment: p.analysis?.sentiment,
          opportunity: p.analysis?.opportunity
        }))

        setBusinesses(results)
        if (results.length === 0) {
          setError("No businesses found via Google. Try a different keyword or larger radius.")
        }
      } else if (provider === "geoapify") {
        setStep("Searching Geoapify Places…")
        
        const coords = await geocodeLocation(location.trim())
        if (!coords) {
          setError(`Could not find "${location}".`)
          setLoading(false)
          return
        }
        setCenter([coords.lon, coords.lat])

        const res = await fetch("/api/maps/geoapify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: coords.lat,
            lon: coords.lon,
            radius,
            keyword: industry,
          })
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.error || `Geoapify search failed (${res.status})`)
        }

        const results: DiscoveredBusiness[] = (data.features || [])
          .map((f: any) => ({
            id: f.properties.place_id,
            name: f.properties.name || f.properties.company || "Business",
            lat: f.properties.lat,
            lon: f.properties.lon,
            type: f.properties.categories?.[0]?.replace(/\./g, " ") || "business",
            address: f.properties.address_line2,
            website: f.properties.website || null,
            phone: f.properties.contact?.phone || null,
            internScore: 7,
            scoreReason: "Verified local business",
            industry: industry
          }))
          .slice(0, 5)

        setBusinesses(results)
        if (results.length === 0) setError("No businesses found via Geoapify. Try a larger radius or different industry.")
      } else {
        // 1. Geocode
        const coords = await geocodeLocation(location.trim())
        if (!coords) {
          setError(`Could not find "${location}". Try a city name like "Chicago, IL".`)
          return
        }
        setCenter([coords.lon, coords.lat])
        setStep("Fetching nearby businesses…")

        // 2. Overpass (browser-side, parallel endpoints)
        const elements = await queryOverpass(coords.lat, coords.lon, radius)
        if (elements.length === 0) {
          setError("No businesses found in this area. Try a larger radius or different city.")
          return
        }

        // 3. Deduplicate and shape for scoring
        const seen = new Set<string>()
        const unique: RawBiz[] = []
        for (const el of elements) {
          if (!seen.has(el.tags.name)) {
            seen.add(el.tags.name)
            unique.push(el)
          }
          if (unique.length >= 50) break
        }
        const forScoring = unique.map(el => ({
          name: el.tags.name,
          type: osmTagToType(el.tags),
          address: buildAddress(el.tags),
        }))

        // 4. Ask server only for AI scoring (fast, no external calls)
        setStep("Scoring businesses with AI…")
        let scores: { score: number; reason: string; industry: string }[] =
          forScoring.map(() => ({ score: 5, reason: "Local business", industry }))
        try {
          const scoreRes = await fetch("/api/internships/score-businesses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businesses: forScoring, industry }),
          })
          if (scoreRes.ok) {
            const scoreData = await scoreRes.json()
            if (Array.isArray(scoreData.scores) && scoreData.scores.length === forScoring.length) {
              scores = scoreData.scores
            }
          }
        } catch { /* use default scores */ }

        // 5. Build final list
        const results: DiscoveredBusiness[] = unique
          .map((el, i) => ({
            id: String(el.id),
            name: el.tags.name,
            lat: el.lat ?? el.center!.lat,
            lon: el.lon ?? el.center!.lon,
            type: osmTagToType(el.tags),
            address: buildAddress(el.tags),
            website: el.tags.website || el.tags["contact:website"] || null,
            phone: el.tags.phone || el.tags["contact:phone"] || null,
            email: el.tags.email || el.tags["contact:email"] || null,
            internScore: scores[i]?.score ?? 5,
            scoreReason: scores[i]?.reason ?? "Local business",
            industry: scores[i]?.industry ?? industry,
          }))
          .filter(b => b.internScore >= minScore)
          .sort((a, b) => b.internScore - a.internScore)

        setBusinesses(results)
      }

      if (businesses.length === 0 && !error) {
        // Wait, state update is async. We should check results length.
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your connection and try again.")
    } finally {
      setLoading(false)
      setStep("")
    }
  }

  // ── Add to contacts ──────────────────────────────────────────────────────────

  async function addContact(biz: DiscoveredBusiness) {
    if (added.has(biz.id)) return
    setAdding(prev => new Set([...prev, biz.id]))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdding(prev => { const s = new Set(prev); s.delete(biz.id); return s }); return }

    const phoneLine = biz.phone ? `Phone: ${biz.phone}. ` : ""
    await supabase.from("internship_contacts").insert({
      user_id: user.id,
      company: biz.name,
      role: `${biz.industry} Intern`,
      contact_name: "",
      email: biz.email || null,
      website: biz.website || null,
      bio: `${biz.type ? biz.type.charAt(0).toUpperCase() + biz.type.slice(1) : "Business"} in ${biz.address || location}. AI intern fit score: ${biz.internScore}/10. ${biz.scoreReason}`,
      notes: `${phoneLine}Discovered via map search for "${industry}" in ${location}. Coordinates: ${biz.lat.toFixed(5)}, ${biz.lon.toFixed(5)}`,
    })

    await supabase.from("activities").insert({
      user_id: user.id,
      type: "contact_added",
      category: "internship",
      researcher_name: biz.name,
      university: biz.address || location,
      description: `Discovered "${biz.name}" via map search for ${industry} internships in ${location}`,
    })

    setAdded(prev => new Set([...prev, biz.id]))
    setAdding(prev => { const s = new Set(prev); s.delete(biz.id); return s })
    onContactAdded?.()
  }

  // ── Select a business (from list or map) ────────────────────────────────────

  const selectBusiness = useCallback((biz: DiscoveredBusiness | null) => {
    setSelected(biz)
    if (biz && listRef.current) {
      const el = listRef.current.querySelector(`[data-id="${biz.id}"]`) as HTMLElement
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [])

  const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", background: "#f8fafc", outline: "none", boxSizing: "border-box" }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 1100, height: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#304674,#1f2f55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Map Discovery</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Find local businesses that need interns</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* ── Search bar ── */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, padding: "12px 20px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc", flexShrink: 0, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>
              Location {locating && <span style={{ fontWeight: 400, color: "#94a3b8" }}>· detecting…</span>}
            </label>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <input
                list="us-locations"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={locating ? "Detecting your location…" : "e.g. Chicago, IL or Boston, MA"}
                style={{ ...inp, paddingLeft: 30 }}
                required
              />
              <datalist id="us-locations">
                {US_LOCATIONS.map(l => <option key={l} value={l} />)}
              </datalist>
            </div>
          </div>

          <div style={{ flex: "2 1 180px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Industry</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)} style={{ ...inp }}>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div style={{ flex: "1 1 130px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Radius: {(radius / 1000).toFixed(1)} km</label>
            <input type="range" min={500} max={10000} step={500} value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ width: "100%", accentColor: "#304674" }} />
          </div>

          <div style={{ flex: "1 1 130px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Min score: {minScore}/10</label>
            <input type="range" min={1} max={9} step={1} value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={{ width: "100%", accentColor: "#304674" }} />
          </div>

          {(googleEnabled || geoapifyEnabled) && (
            <div style={{ flex: "0 0 auto" }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Provider</label>
              <div style={{ display: "flex", background: "#f1f5f9", padding: 2, borderRadius: 8 }}>
                {googleEnabled && (
                  <button
                    type="button"
                    onClick={() => setProvider("google")}
                    style={{
                      padding: "6px 12px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      cursor: "pointer", background: provider === "google" ? "#fff" : "transparent",
                      color: provider === "google" ? "#304674" : "#64748b",
                      boxShadow: provider === "google" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                    }}
                  >Google</button>
                )}
                <button
                  type="button"
                  onClick={() => setProvider("osm")}
                  style={{
                    padding: "6px 12px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    cursor: "pointer", background: provider === "osm" ? "#fff" : "transparent",
                    color: provider === "osm" ? "#304674" : "#64748b",
                    boxShadow: provider === "osm" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  }}
                >OSM</button>
                {geoapifyEnabled && (
                  <button
                    type="button"
                    onClick={() => setProvider("geoapify")}
                    style={{
                      padding: "6px 12px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      cursor: "pointer", background: provider === "geoapify" ? "#fff" : "transparent",
                      color: provider === "geoapify" ? "#304674" : "#64748b",
                      boxShadow: provider === "geoapify" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                    }}
                  >Geoapify</button>
                )}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || !location.trim()}
            style={{ padding: "8px 20px", background: loading ? "#b2cbde" : "#304674", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, flexShrink: 0, height: 36 }}>
            {loading ? (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>Searching...</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search</>
            )}
          </button>
        </form>

        {/* ── Body: map + list ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left: scrollable business list */}
          <div ref={listRef} style={{ width: 320, flexShrink: 0, overflowY: "auto", borderRight: "1px solid #e2e8f0", background: "#fff" }}>
            {error && (
              <div style={{ margin: 12, padding: "10px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, color: "#c2410c", fontSize: 13 }}>{error}</div>
            )}

            {!loading && businesses.length === 0 && !error && (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Search a location</div>
                <div style={{ fontSize: 13 }}>Enter a city and industry above to find businesses near you</div>
              </div>
            )}

            {loading && (
              <div style={{ padding: 32, textAlign: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#304674" strokeWidth="2" style={{ animation: "spin 1s linear infinite", marginBottom: 12 }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#304674", marginBottom: 4 }}>{step}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>This may take up to 15 seconds</div>
              </div>
            )}

            {businesses.length > 0 && (
              <div>
                <div style={{ padding: "10px 14px 6px", fontSize: 11, fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>
                  {businesses.length} businesses found · sorted by fit score
                </div>
                {businesses.map(biz => {
                  const isSelected = selected?.id === biz.id
                  const isAdded = added.has(biz.id)
                  const isAdding = adding.has(biz.id)
                  return (
                    <div
                      key={biz.id}
                      data-id={biz.id}
                      onClick={() => selectBusiness(isSelected ? null : biz)}
                      style={{
                        padding: "12px 14px",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        background: isSelected ? "#f5f3ff" : "#fff",
                        borderLeft: isSelected ? "3px solid #304674" : "3px solid transparent",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#f8fafc" }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#fff" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{biz.name}</div>
                        <ScoreBadge score={biz.internScore} />
                      </div>
                      <div style={{ fontSize: 11, color: "#304674", fontWeight: 600, marginBottom: 4, textTransform: "capitalize" }}>{biz.type}</div>
                      
                      <div style={{ position: "relative", marginBottom: 8 }}>
                        <div style={{ 
                          fontSize: 11, 
                          color: "#64748b", 
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: isSelected ? "unset" : 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          {biz.description}
                        </div>
                        {!isSelected && biz.description?.length > 60 && (
                          <div style={{ fontSize: 10, color: "#304674", fontWeight: 700, marginTop: 2 }}>View more</div>
                        )}
                      </div>
                      
                      {biz.email && (
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: 10, background: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: 4, border: "1px solid #86efac" }}>
                            {biz.email}
                          </span>
                        </div>
                      )}
                      
                      {(biz as any).emails?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                          {(biz as any).emails.slice(0, 2).map((email: string) => (
                            <span key={email} style={{ fontSize: 10, background: "#d8e1e8", color: "#304674", padding: "1px 6px", borderRadius: 4, border: "1px solid #98bad5" }}>
                              {email}
                            </span>
                          ))}
                          {(biz as any).emails.length > 2 && <span style={{ fontSize: 10, color: "#94a3b8" }}>+{ (biz as any).emails.length - 2} more</span>}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        {biz.website && (
                          <a href={biz.website.startsWith("http") ? biz.website : "https://" + biz.website} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 11, color: "#304674", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            Website
                          </a>
                        )}
                        {biz.phone && (
                          <span style={{ fontSize: 11, color: "#64748b" }}>{biz.phone}</span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); addContact(biz) }}
                          disabled={isAdded || isAdding}
                          style={{
                            marginLeft: "auto",
                            padding: "4px 10px", fontSize: 11, fontWeight: 600,
                            background: isAdded ? "#dcfce7" : "#304674",
                            color: isAdded ? "#15803d" : "#fff",
                            border: "none", borderRadius: 6, cursor: isAdded || isAdding ? "default" : "pointer",
                          }}
                        >
                          {isAdding ? "Adding..." : isAdded ? "Added" : "+ Add Contact"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: map */}
          <div style={{ flex: 1, position: "relative" }}>
            {!center && !loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8", zIndex: 1, flexDirection: "column", gap: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>Map will appear here after search</div>
              </div>
            )}

            <Map
              center={center ?? [-87.6298, 41.8781]}
              zoom={center ? 13 : 3}
              minZoom={2}
              maxZoom={18}
            >
              {center && <FlyToCenter center={center} zoom={13} />}
              <MapControls showZoom showLocate />

              {businesses.map(biz => (
                <MapMarker
                  key={biz.id}
                  longitude={biz.lon}
                  latitude={biz.lat}
                  onClick={() => selectBusiness(selected?.id === biz.id ? null : biz)}
                >
                  <MarkerContent>
                    <MarkerDot score={biz.internScore} selected={selected?.id === biz.id} />
                  </MarkerContent>
                  {selected?.id !== biz.id && (
                    <MarkerTooltip>{biz.name} · {biz.internScore}/10</MarkerTooltip>
                  )}
                </MapMarker>
              ))}
            </Map>

            {/* Selected business popup overlay */}
            {selected && (
              <div style={{
                position: "absolute", bottom: 16, left: 16, right: 16, background: "#fff",
                borderRadius: 12, padding: "14px 16px", boxShadow: "0 8px 28px rgba(0,0,0,0.16)",
                border: "1px solid #e2e8f0", zIndex: 10, display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.name}</span>
                    <ScoreBadge score={selected.internScore} />
                  </div>
                  <div style={{ fontSize: 12, color: "#304674", fontWeight: 600, marginBottom: 2, textTransform: "capitalize" }}>{selected.type}</div>
                  {selected.address && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{selected.address}</div>}
                  <div style={{ fontSize: 12, color: "#475569", fontStyle: "italic" }}>{selected.scoreReason}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  {selected.website && (
                    <a href={selected.website.startsWith("http") ? selected.website : "https://" + selected.website} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#374151", textDecoration: "none", fontWeight: 600 }}>
                      Website
                    </a>
                  )}
                  <button
                    onClick={() => addContact(selected)}
                    disabled={added.has(selected.id) || adding.has(selected.id)}
                    style={{ padding: "6px 16px", background: added.has(selected.id) ? "#dcfce7" : "#304674", color: added.has(selected.id) ? "#15803d" : "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: added.has(selected.id) ? "default" : "pointer" }}>
                    {adding.has(selected.id) ? "Adding..." : added.has(selected.id) ? "Added" : "+ Add to Contacts"}
                  </button>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 18, padding: 2 }}>×</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .maplibregl-popup-content { padding: 0 !important; border-radius: 10px !important; box-shadow: none !important; }
        .maplibregl-popup-tip { display: none !important; }
      `}</style>
    </div>
  )
}
