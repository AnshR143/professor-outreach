"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Researcher, Email } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"
import FindResearchersModal from "@/components/researchers/FindResearchersModal"

const FIELD_COLORS: Record<string, string> = {
  "AI": "#dbeafe", "Artificial Intelligence": "#dbeafe", "Finance": "#dcfce7",
  "Quantitative Finance": "#d1fae5", "Mathematics": "#fce7f3", "Machine Learning": "#e0e7ff",
  "Economics": "#fef9c3", "default": "#f1f5f9",
}

interface Props { researchers: Researcher[]; emails: Email[]; userName: string }

export default function StatisticsClient({ researchers: initial, emails, userName }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [researchers, setResearchers] = useState(initial)
  const [activeTab, setActiveTab] = useState<"analytics" | "sankey">("analytics")
  const [showFind, setShowFind] = useState(false)
  const [search, setSearch] = useState("")
  const [dragging, setDragging] = useState<string | null>(null)

  // Email status cycling stats — driven by researchers.email_status (the clickable badge)
  const emailsSent = researchers.filter(r => ["emailed", "accepted", "rejected"].includes(r.email_status || "")).length
  const accepted = researchers.filter(r => r.email_status === "accepted").length
  const rejectedEmail = researchers.filter(r => r.email_status === "rejected").length
  const pending = researchers.filter(r => r.email_status === "emailed").length
  const notEmailed = researchers.filter(r => !r.email_status || r.email_status === "not_emailed").length

  // Kanban columns use researchers.status (drag-and-drop organize tab)
  const awaiting = researchers.filter(r => r.status === "awaiting")
  const rejected = researchers.filter(r => r.status === "rejected")
  const acceptedList = researchers.filter(r => r.status === "accepted")
  const unsorted = researchers.filter(r => r.status === "unsorted")

  const filtered = (list: Researcher[]) => list.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.university.toLowerCase().includes(search.toLowerCase())
  )

  async function updateStatus(researcherId: string, newStatus: string) {
    await supabase.from("researchers").update({ status: newStatus }).eq("id", researcherId)
    setResearchers(prev => prev.map(r => r.id === researcherId ? { ...r, status: newStatus as any } : r))
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragging(id)
    e.dataTransfer.setData("researcher_id", id)
  }

  function handleDrop(e: React.DragEvent, status: string) {
    e.preventDefault()
    const id = e.dataTransfer.getData("researcher_id")
    if (id) updateStatus(id, status)
    setDragging(null)
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault() }

  const topUniversities = [...new Map(researchers.map(r => [r.university, { name: r.university, count: researchers.filter(x => x.university === r.university).length }])).values()].sort((a, b) => b.count - a.count).slice(0, 5)
  const topFields = [...new Map(researchers.flatMap(r => r.research_areas).map(f => [f, { name: f, count: researchers.filter(r => r.research_areas.includes(f)).length }])).values()].sort((a, b) => b.count - a.count).slice(0, 5)

  const ResearcherCard = ({ r }: { r: Researcher }) => (
    <div draggable onDragStart={e => handleDragStart(e, r.id)}
      style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "14px 16px", cursor: "grab", opacity: dragging === r.id ? 0.5 : 1, transition: "box-shadow 0.15s", marginBottom: 10 }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <Link href={`/dashboard/researchers/${r.id}`} style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", textDecoration: "none" }}>{r.name}</Link>
          <div style={{ fontSize: 11, color: "#64748b" }}>{r.university}</div>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${r.match_score >= 85 ? "#22c55e" : "#3b82f6"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>
          {r.match_score}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {r.research_areas.slice(0, 3).map(area => (
          <span key={area} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: FIELD_COLORS[area] || "#f1f5f9", color: "#374151", fontWeight: 500 }}>{area}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8" }}>
        <span> {Object.keys(r.profile_links || {}).length} links</span>
        <span style={{ color: r.email_status === "emailed" ? "#16a34a" : "#94a3b8" }}>
          {r.email_status === "emailed" ? " Email Sent" : r.email_status === "replied" ? " Replied" : " Not Emailed"}
        </span>
      </div>
    </div>
  )

  const Column = ({ title, color, status, list, emptyMsg }: { title: string; color: string; status: string; list: Researcher[]; emptyMsg: string }) => (
    <div onDrop={e => handleDrop(e, status)} onDragOver={handleDragOver}
      style={{ flex: 1, minWidth: 260, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{title}</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{list.length} researchers</span>
      </div>
      <div style={{ padding: "12px", minHeight: 120, background: `${color}08` }}>
        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 4, opacity: 0.4 }}></div>
            No {title.toLowerCase()} researchers.<br/>Drag researchers here to organize
          </div>
        ) : list.map(r => <ResearcherCard key={r.id} r={r} />)}
      </div>
    </div>
  )

  return (
    <div>
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Statistics</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.refresh()} style={{ padding: "8px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#475569" }}>↻ Refresh</button>
          <button onClick={() => setShowFind(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Find Researchers
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Statistics</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Organize and track your researcher outreach progress</p>
        </div>

        {/* Search */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Researchers (e.g., '2h ago', 'MIT', 'robotics')"
              style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#f8f9fb", color: "#0f172a" }} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", padding: 4, borderRadius: 10, width: "fit-content" }}>
          {([["analytics", " Analytics Dashboard"], ["sankey", " Sankey View"]] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: "8px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#0f172a" : "#64748b", boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "analytics" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
              {[
                { label: "Researchers Found", value: researchers.length, sub: "Total in your list", pct: "100%", color: "#3b82f6" },
                { label: "Emails Sent", value: emailsSent, sub: `${notEmailed} not yet emailed`, pct: `${researchers.length ? Math.round(emailsSent/researchers.length*100) : 0}% outreach rate`, color: "#3b82f6" },
                { label: "Accepted", value: accepted, sub: "Replied positively", pct: `${emailsSent ? Math.round(accepted/emailsSent*100) : 0}% reply rate`, color: "#22c55e" },
                { label: "Rejected", value: rejectedEmail, sub: `${pending} awaiting reply`, pct: `${emailsSent ? Math.round(rejectedEmail/emailsSent*100) : 0}% rejected`, color: "#ef4444" },
              ].map((k, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>{k.label}</div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${k.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: k.color }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172a" }}>{k.value}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{k.sub}</span>
                    <span style={{ fontSize: 12, color: k.color, fontWeight: 600 }}>{k.pct}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                   Top Universities
                </h3>
                {topUniversities.map((u, i) => (
                  <div key={u.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < topUniversities.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i+1}</span>
                      <span style={{ fontSize: 13, color: "#0f172a" }}>{u.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{u.count} researchers</span>
                  </div>
                ))}
                {topUniversities.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 20 }}>No data yet</div>}
              </div>

              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                   Research Fields
                </h3>
                {topFields.map((f, i) => (
                  <div key={f.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < topFields.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i+1}</span>
                      <span style={{ fontSize: 13, color: "#0f172a" }}>{f.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{f.count} researchers</span>
                  </div>
                ))}
                {topFields.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 20 }}>No data yet</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "sankey" && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}></div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: "0 0 8px" }}>Sankey Flow View</h3>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>
              Visualizes your outreach funnel: Researchers Found → Emailed → Awaiting → Accepted
            </p>
            {/* Funnel flow diagram */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
              {[
                { label: "Found", value: researchers.length, color: "#3b82f6", sub: "total" },
                { label: "Emailed", value: emailsSent, color: "#3b82f6", sub: `${researchers.length ? Math.round(emailsSent/researchers.length*100) : 0}%` },
                { label: "Awaiting", value: pending, color: "#f59e0b", sub: `${emailsSent ? Math.round(pending/emailsSent*100) : 0}%` },
                { label: "Accepted", value: accepted, color: "#22c55e", sub: `${emailsSent ? Math.round(accepted/emailsSent*100) : 0}%` },
                { label: "Rejected", value: rejectedEmail, color: "#ef4444", sub: `${emailsSent ? Math.round(rejectedEmail/emailsSent*100) : 0}%` },
              ].map((node, i, arr) => (
                <div key={node.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 90, height: 70, borderRadius: 10, background: node.color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{node.value}</div>
                      <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>{node.sub}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, fontWeight: 600 }}>{node.label}</div>
                  </div>
                  {i < arr.length - 1 && <div style={{ color: "#cbd5e1", fontSize: 20, marginBottom: 18 }}>→</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              {notEmailed} researchers haven&apos;t been emailed yet •{" "}
              Overall acceptance rate: {emailsSent > 0 ? Math.round(accepted / emailsSent * 100) : 0}%
            </div>
          </div>
        )}
      </div>
      {showFind && <FindResearchersModal onClose={() => setShowFind(false)} />}
    </div>
  )
}
