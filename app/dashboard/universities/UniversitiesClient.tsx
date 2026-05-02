"use client"
import { useState } from "react"
import Link from "next/link"
import type { Researcher } from "@/lib/supabase/types"
import FindResearchersModal from "@/components/researchers/FindResearchersModal"

const UNI_RANKINGS: Record<string, { us?: number; qs?: number; fields: string[] }> = {
  "Princeton University": { us: 1, qs: 16, fields: ["Theoretical Physics","Quantum Computing","Neuroscience","Political Theory","AI and Philosophy"] },
  "Massachusetts Institute of Technology": { us: 2, qs: 1, fields: ["Artificial Intelligence","Aerospace Engineering","Nuclear Science","Materials Science","Quantum Computing"] },
  "Stanford University": { us: 3, qs: 6, fields: ["Artificial Intelligence","Human-Centered Design","Neurosciences","Climate Solutions","Data Science"] },
  "Harvard University": { us: 4, qs: 4, fields: ["Biological Sciences","Economics","Public Health","Artificial Intelligence","Law"] },
  "Yale University": { us: 5, qs: 14, fields: ["Quantum Science","Genomics","Cancer Biology","Global Health","Psychology"] },
  "University of Pennsylvania": { us: 6, qs: 12, fields: ["Neuroscience","Genomics","Biomedical Informatics","AI in Finance","Robotic Surgery"] },
  "Duke University": { us: 7, qs: 66, fields: ["Biomedical Engineering","Environment","Economics","Political Science"] },
  "Johns Hopkins University": { us: 8, qs: 25, fields: ["Medicine","Public Health","Engineering","Neuroscience"] },
  "Northwestern University": { us: 9, qs: 46, fields: ["Materials Science","Journalism","Business","Law"] },
  "Columbia University": { us: 10, qs: 33, fields: ["Finance","Law","Journalism","Political Science","Computer Science"] },
}

interface Props { researchers: Researcher[]; userName: string }

export default function UniversitiesClient({ researchers, userName }: Props) {
  const [search, setSearch] = useState("")
  const [showFind, setShowFind] = useState(false)

  // Build university map from matched researchers
  const uniMap = new Map<string, Researcher[]>()
  researchers.forEach(r => {
    if (!uniMap.has(r.university)) uniMap.set(r.university, [])
    uniMap.get(r.university)!.push(r)
  })

  // Known universities (from researchers + top list)
  const allUnis = [...new Set([...uniMap.keys(), ...Object.keys(UNI_RANKINGS)])].filter(u =>
    u.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const ra = UNI_RANKINGS[a]?.us || 999
    const rb = UNI_RANKINGS[b]?.us || 999
    return ra - rb
  })

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Universities</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowFind(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Find Researchers
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{userName?.[0]?.toUpperCase() || "A"}</div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px", textAlign: "center" }}>Research Universities</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px", textAlign: "center" }}>View universities where you have matched researchers</p>

          {/* Info banner */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>ℹ</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1d4ed8", marginBottom: 2 }}>Your Matched Researchers</div>
              <div style={{ fontSize: 12, color: "#3b82f6" }}>This page shows researchers you have already been matched with from each university. These are YOUR matches, not a general database of all researchers. Use the "Find Researchers" feature on your dashboard to discover new matches.</div>
            </div>
          </div>

          {/* Search */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>Search Universities</div>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by university name, location, or research focus..."
                style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#f8f9fb", color: "#0f172a" }} />
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Search through universities by name, location, or research interests</div>
          </div>

          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Showing {allUnis.length} of {allUnis.length} universities</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {allUnis.map(uni => {
              const ranking = UNI_RANKINGS[uni]
              const matched = uniMap.get(uni) || []
              return (
                <div key={uni} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{uni}</span>
                      {ranking?.us && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#fef9c3", color: "#92400e", fontWeight: 600 }}> US #{ranking.us}</span>}
                      {ranking?.qs && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#fef3c7", color: "#b45309", fontWeight: 600 }}> QS #{ranking.qs}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}> USA &nbsp;|&nbsp; {matched.length > 0 && `${matched.length} matched researchers`}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {Array.from(new Set(ranking?.fields || matched.flatMap(r => r.research_areas))).slice(0, 5).map((f, i) => (
                        <span key={`${f}-${i}`} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#f1f5f9", color: "#475569", fontWeight: 500 }}>{f}</span>
                      ))}
                      {(ranking?.fields || []).length > 5 && <span style={{ fontSize: 10, color: "#94a3b8" }}>+{(ranking?.fields?.length || 0) - 5} more</span>}
                    </div>
                  </div>
                  {matched.length > 0 && (
                    <Link href={`/dashboard/researchers?university=${encodeURIComponent(uni)}`}
                      style={{ padding: "10px 20px", background: "#0f172a", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0, marginLeft: 16 }}>
                      View Researchers
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {showFind && <FindResearchersModal onClose={() => setShowFind(false)} />}
    </div>
  )
}