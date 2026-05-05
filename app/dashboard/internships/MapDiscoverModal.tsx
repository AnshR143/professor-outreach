"use client"
import "maplibre-gl/dist/maplibre-gl.css"
import { useState, useCallback, useRef } from "react"
import { Map, MapMarker, MarkerContent, MarkerTooltip, MapControls } from "@/components/ui/map"
import { createClient } from "@/lib/supabase/client"
// Inline type — avoids importing from an API route file (causes webpack bundling issues)
export interface DiscoveredBusiness {
  id: string
  name: string
  lat: number
  lon: number
  type: string
  address: string
  website: string | null
  phone: string | null
  internScore: number
  scoreReason: string
  industry: string
}

// ─── Score colour helper ──────────────────────────────────────────────────────

function scoreColor(s: number): { bg: string; text: string; border: string } {
  if (s >= 8) return { bg: "#dcfce7", text: "#15803d", border: "#86efac" }
  if (s >= 6) return { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" }
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
      background: selected ? "#6366f1" : bg,
      border: `2.5px solid ${selected ? "#4338ca" : border}`,
      boxShadow: selected ? "0 0 0 4px rgba(99,102,241,0.25)" : "0 2px 6px rgba(0,0,0,0.18)",
      transition: "all 0.15s",
      cursor: "pointer",
    }} />
  )
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

  // Results
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [businesses, setBusinesses] = useState<DiscoveredBusiness[]>([])
  const [center, setCenter]       = useState<[number, number] | null>(null)
  const [selected, setSelected]   = useState<DiscoveredBusiness | null>(null)

  // Adding contacts
  const [adding, setAdding]       = useState<Set<string>>(new Set())
  const [added, setAdded]         = useState<Set<string>>(new Set())

  const listRef = useRef<HTMLDivElement>(null)

  // ── Search ──────────────────────────────────────────────────────────────────

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!location.trim()) return
    setLoading(true)
    setError("")
    setBusinesses([])
    setSelected(null)

    try {
      const res = await fetch("/api/internships/discover-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: location.trim(), industry, radius, minScore }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Search failed."); return }
      setBusinesses(data.businesses || [])
      setCenter(data.center || null)
      if (data.message) setError(data.message)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Add to contacts ──────────────────────────────────────────────────────────

  async function addContact(biz: DiscoveredBusiness) {
    if (added.has(biz.id)) return
    setAdding(prev => new Set([...prev, biz.id]))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdding(prev => { const s = new Set(prev); s.delete(biz.id); return s }); return }

    await supabase.from("internship_contacts").insert({
      user_id: user.id,
      company: biz.name,
      role: `${biz.industry} Intern`,
      contact_name: "",
      email: null,
      website: biz.website || null,
      phone: biz.phone || null,
      bio: `${biz.type ? biz.type.charAt(0).toUpperCase() + biz.type.slice(1) : "Business"} in ${biz.address || location}. AI intern fit score: ${biz.internScore}/10. ${biz.scoreReason}`,
      notes: `Discovered via map search for "${industry}" in ${location}. Coordinates: ${biz.lat.toFixed(5)}, ${biz.lon.toFixed(5)}`,
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
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Location</label>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Chicago, IL or Boston, MA" style={{ ...inp, paddingLeft: 30 }} required />
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
            <input type="range" min={500} max={10000} step={500} value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ width: "100%", accentColor: "#6366f1" }} />
          </div>

          <div style={{ flex: "1 1 130px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Min score: {minScore}/10</label>
            <input type="range" min={1} max={9} step={1} value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={{ width: "100%", accentColor: "#6366f1" }} />
          </div>

          <button type="submit" disabled={loading || !location.trim()}
            style={{ padding: "8px 20px", background: loading ? "#c7d2fe" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, flexShrink: 0, height: 36 }}>
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
                <div style={{ fontSize: 36, marginBottom: 12 }}>📍</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Search a location</div>
                <div style={{ fontSize: 13 }}>Enter a city and industry above to find businesses near you</div>
              </div>
            )}

            {loading && (
              <div style={{ padding: 32, textAlign: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" style={{ animation: "spin 1s linear infinite", marginBottom: 12 }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                <div style={{ fontSize: 13, color: "#64748b" }}>Finding businesses & scoring with AI...</div>
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
                        borderLeft: isSelected ? "3px solid #6366f1" : "3px solid transparent",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#f8fafc" }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#fff" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{biz.name}</div>
                        <ScoreBadge score={biz.internScore} />
                      </div>
                      <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, marginBottom: 2, textTransform: "capitalize" }}>{biz.type}</div>
                      {biz.address && <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{biz.address}</div>}
                      <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", marginBottom: 8 }}>{biz.scoreReason}</div>

                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        {biz.website && (
                          <a href={biz.website.startsWith("http") ? biz.website : "https://" + biz.website} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 11, color: "#3b82f6", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
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
                            background: isAdded ? "#dcfce7" : "#6366f1",
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
                  <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginBottom: 2, textTransform: "capitalize" }}>{selected.type}</div>
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
                    style={{ padding: "6px 16px", background: added.has(selected.id) ? "#dcfce7" : "#6366f1", color: added.has(selected.id) ? "#15803d" : "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: added.has(selected.id) ? "default" : "pointer" }}>
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
