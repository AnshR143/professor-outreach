"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Profile, Researcher } from "@/lib/supabase/types"
import FindResearchersModal from "@/components/researchers/FindResearchersModal"
import { createClient } from "@/lib/supabase/client"
import LiquidGlassButton from "@/components/ui/liquid-glass-button"
import FloatingActionMenu from "@/components/ui/floating-action-menu"

const EMAIL_STATUS_CYCLE = ["not_emailed", "emailed", "rejected", "accepted"] as const
type EmailStatus = typeof EMAIL_STATUS_CYCLE[number]

const EMAIL_STATUS_CONFIG: Record<EmailStatus, { label: string; bg: string; text: string; border: string }> = {
  not_emailed: { label: "Not Emailed",  bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" },
  emailed:     { label: "Emailed",      bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  rejected:    { label: "Rejected",     bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  accepted:    { label: "Accepted",     bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
}

const TAG_COLORS: [string, { bg: string; text: string }][] = [
  ["Machine Learning",       { bg: "#e0e7ff", text: "#4338ca" }],
  ["Deep Learning",          { bg: "#e0e7ff", text: "#4338ca" }],
  ["Artificial Intelligence",{ bg: "#dbeafe", text: "#1d4ed8" }],
  ["LLM",                    { bg: "#dbeafe", text: "#1d4ed8" }],
  ["NLP",                    { bg: "#dbeafe", text: "#1d4ed8" }],
  ["Computer Vision",        { bg: "#f3e8ff", text: "#7c3aed" }],
  ["Robotics",               { bg: "#fce7f3", text: "#be185d" }],
  ["Security",               { bg: "#dcfce7", text: "#15803d" }],
  ["Cybersecurity",          { bg: "#dcfce7", text: "#15803d" }],
  ["Data Science",           { bg: "#fef3c7", text: "#b45309" }],
  ["Reinforcement Learning", { bg: "#fef3c7", text: "#b45309" }],
  ["Finance",                { bg: "#d1fae5", text: "#047857" }],
  ["Economics",              { bg: "#d1fae5", text: "#047857" }],
  ["Biomedical",             { bg: "#fce7f3", text: "#be185d" }],
  ["Neuroscience",           { bg: "#fce7f3", text: "#be185d" }],
  ["Physics",                { bg: "#ede9fe", text: "#6d28d9" }],
  ["Mathematics",            { bg: "#ede9fe", text: "#6d28d9" }],
]

function tagColor(field: string) {
  const lower = field.toLowerCase()
  for (const [key, color] of TAG_COLORS) {
    if (lower.includes(key.toLowerCase())) return color
  }
  return { bg: "#f1f5f9", text: "#475569" }
}

function timeLabel(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = diff / 3600000
  if (hours < 24) return "Found Today"
  const days = Math.floor(hours / 24)
  return days === 1 ? "Found Yesterday" : `Found ${days}d ago`
}

function scoreColor(score: number) {
  if (score >= 85) return { border: "#22c55e", bg: "#f0fdf4", text: "#15803d" }
  if (score >= 70) return { border: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" }
  return { border: "#f59e0b", bg: "#fffbeb", text: "#92400e" }
}

interface ResearcherWithPapers extends Researcher {
  papers?: { id: string }[]
}

interface Props {
  researchers: ResearcherWithPapers[]
  profile: Profile | null
}

export default function ResearchersClient({ researchers: initial, profile }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [researchers, setResearchers] = useState(initial)
  const [search, setSearch] = useState("")
  const [fieldFilter, setFieldFilter] = useState("")
  const [showFind, setShowFind] = useState(false)
  const [highMatchOnly, setHighMatchOnly] = useState(false)
  // Track optimistic email status per researcher id
  const [emailStatuses, setEmailStatuses] = useState<Record<string, EmailStatus>>({})
  const [resetting, setResetting] = useState(false)

  async function resetAllResearchers() {
    if (!confirm("Delete ALL researchers from your list? This cannot be undone.")) return
    setResetting(true)
    await supabase.from("researchers").delete().eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
    setResearchers([])
    setResetting(false)
    router.refresh()
  }

  // Sync when server refreshes data (e.g. after finding new researchers)
  useEffect(() => { setResearchers(initial) }, [initial])

  async function cycleEmailStatus(e: React.MouseEvent, researcher: ResearcherWithPapers) {
    e.preventDefault()
    e.stopPropagation()
    const current = (emailStatuses[researcher.id] ?? researcher.email_status ?? "not_emailed") as EmailStatus
    const idx = EMAIL_STATUS_CYCLE.indexOf(current)
    const next = EMAIL_STATUS_CYCLE[(idx + 1) % EMAIL_STATUS_CYCLE.length]
    // Optimistic update
    setEmailStatuses(prev => ({ ...prev, [researcher.id]: next }))
    // Persist to DB
    await supabase.from("researchers").update({ email_status: next }).eq("id", researcher.id)
  }

  async function deleteResearcher(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("researchers").delete().eq("id", id)
    await supabase.from("activities").delete().eq("researcher_id", id)
    setResearchers(prev => prev.filter(r => r.id !== id))
  }

  const allFields = Array.from(new Set(researchers.flatMap(r => r.research_areas))).sort()

  const filtered = [...researchers]
    .filter(r => {
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        r.name.toLowerCase().includes(q) ||
        r.university.toLowerCase().includes(q) ||
        r.research_areas.some(a => a.toLowerCase().includes(q))
      const matchesField = !fieldFilter || r.research_areas.some(a => a.toLowerCase().includes(fieldFilter.toLowerCase()))
      const matchesScore = !highMatchOnly || r.match_score >= 75
      return matchesSearch && matchesField && matchesScore
    })
    .sort((a, b) => b.match_score - a.match_score)

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Research Matches</h1>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>
            {researchers.length} total
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={resetAllResearchers}
            disabled={resetting}
            style={{ padding: "7px 14px", background: "#fff", color: resetting ? "#94a3b8" : "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: resetting ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
          >
            {resetting ? "Resetting..." : "Reset All"}
          </button>
          <LiquidGlassButton
            onClick={() => setShowFind(true)}
            variant="primary"
            size="sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Find Researchers
          </LiquidGlassButton>
          <button
            onClick={() => router.refresh()}
            title="Refresh list"
            style={{ padding: "8px 10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", color: "#64748b" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>
            {profile?.name?.[0]?.toUpperCase() || "A"}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Search & Filter bar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, university, or research area..."
              style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", background: "#fff", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={fieldFilter}
            onChange={e => setFieldFilter(e.target.value)}
            style={{ padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", background: "#fff", outline: "none" }}
          >
            <option value="">All Fields</option>
            {allFields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <button
            onClick={() => setHighMatchOnly(v => !v)}
            style={{
              padding: "9px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              border: highMatchOnly ? "none" : "1px solid #e2e8f0",
              background: highMatchOnly ? "#3b82f6" : "#fff",
              color: highMatchOnly ? "#fff" : "#64748b",
            }}
          >
            75%+ Match
          </button>
        </div>

        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Showing <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> of {researchers.length} researchers
          {highMatchOnly && <span style={{ color: "#3b82f6", marginLeft: 6 }}>(75%+ match filter active)</span>}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "72px 20px", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
              {researchers.length === 0 ? "No researchers yet" : `No results for "${search || fieldFilter}"`}
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24, maxWidth: 380, margin: "0 auto 24px" }}>
              {researchers.length === 0
                ? "Use Find Researchers to add professors to your list."
                : "Try a different search term or clear the filters."}
            </div>
            {researchers.length === 0 ? (
              <button
                onClick={() => setShowFind(true)}
                style={{ padding: "10px 28px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Find Researchers
              </button>
            ) : search.length > 0 ? (
              <button
                onClick={() => setShowFind(true)}
                style={{ padding: "10px 28px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, margin: "0 auto" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                AI Search for "{search}"
              </button>
            ) : null}
          </div>
        )}

        {/* Researcher Grid */}
        {filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(r => {
              const sc = scoreColor(r.match_score)
              const paperCount = r.papers?.length ?? 0
              const linkCount = Object.keys(r.profile_links || {}).length
              const dateStr = r.found_at || r.created_at

              return (
                <div key={r.id} style={{ position: "relative" }}>
                  <button
                    onClick={e => deleteResearcher(e, r.id)}
                    title="Remove researcher"
                    style={{ position: "absolute", top: 10, right: 10, zIndex: 2, width: 22, height: 22, borderRadius: "50%", background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14, lineHeight: 1, padding: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#94a3b8" }}
                  >×</button>
                  <Link href={`/dashboard/researchers/${r.id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 12, height: "100%", boxSizing: "border-box" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)"; e.currentTarget.style.borderColor = "#3b82f6" }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0" }}
                  >
                    {/* Name + score + date */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.university}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: "50%",
                          border: `2.5px solid ${sc.border}`,
                          background: sc.bg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800, color: sc.text,
                        }}>
                          {r.match_score}
                        </div>
                        {dateStr && (
                          <div style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>{timeLabel(dateStr)}</div>
                        )}
                      </div>
                    </div>

                    {/* Research area tags */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Research Areas</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {r.research_areas.slice(0, 4).map((area, i) => {
                          const c = tagColor(area)
                          return (
                            <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 10, background: c.bg, color: c.text }}>
                              {area}
                            </span>
                          )
                        })}
                        {r.research_areas.length > 4 && (
                          <span style={{ fontSize: 10, color: "#94a3b8", padding: "3px 0" }}>+{r.research_areas.length - 4} more</span>
                        )}
                      </div>
                    </div>

                    {/* Why match */}
                    {r.why_match && (
                      <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5, background: "#f8fafc", borderRadius: 8, padding: "8px 10px", borderLeft: "3px solid #3b82f6" }}>
                        {r.why_match}
                      </div>
                    )}

                    {/* Stats row: profile links + papers */}
                    <div style={{ display: "flex", gap: 14, paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        {linkCount} profile {linkCount === 1 ? "link" : "links"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        {paperCount} {paperCount === 1 ? "paper" : "papers"}
                      </div>
                    </div>

                    {/* Email status — click to cycle */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {(() => {
                        const status = (emailStatuses[r.id] ?? r.email_status ?? "not_emailed") as EmailStatus
                        const cfg = EMAIL_STATUS_CONFIG[status] ?? EMAIL_STATUS_CONFIG.not_emailed
                        return (
                          <button
                            onClick={e => cycleEmailStatus(e, r)}
                            title="Click to cycle status"
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "3px 9px", borderRadius: 10, border: `1.5px solid ${cfg.border}`,
                              background: cfg.bg, color: cfg.text,
                              fontSize: 11, fontWeight: 600, cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            {cfg.label}
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showFind && (
        <FindResearchersModal
          initialKeyword={search}
          onClose={() => {
            setShowFind(false)
            router.refresh()
          }}
        />
      )}

      {/* Floating Action Menu */}
      <FloatingActionMenu
        actions={[
          {
            label: "Find Researchers",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
            color: "#3b82f6",
            onClick: () => setShowFind(true),
          },
          {
            label: "Refresh List",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
            color: "#3b82f6",
            onClick: () => router.refresh(),
          },
          {
            label: "High Match Only",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
            color: "#22c55e",
            onClick: () => setHighMatchOnly(v => !v),
          },
        ]}
      />
    </div>
  )
}
