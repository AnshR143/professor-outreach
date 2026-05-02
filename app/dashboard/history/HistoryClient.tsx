"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Activity } from "@/lib/supabase/types"
import { formatDate, formatTime } from "@/lib/utils"
import FindResearchersModal from "@/components/researchers/FindResearchersModal"

interface Props { activities: Activity[]; userName: string }

export default function HistoryClient({ activities, userName }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [showFind, setShowFind] = useState(false)

  const filtered = activities.filter(a =>
    a.researcher_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.university?.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  )

  // Group by date
  const grouped: Record<string, Activity[]> = {}
  filtered.forEach(a => {
    const date = formatDate(a.created_at)
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(a)
  })

  const typeConfig: Record<string, { icon: string; label: string; iconBg: string }> = {
    email_sent: { icon: "", label: "Email Sent", iconBg: "#dcfce7" },
    researcher_found: { icon: "", label: "Researcher Found", iconBg: "#dbeafe" },
    status_changed: { icon: "", label: "Status Changed", iconBg: "#fef9c3" },
    note_added: { icon: "", label: "Note Added", iconBg: "#f3e8ff" },
    profile_updated: { icon: "", label: "Profile Updated", iconBg: "#f1f5f9" },
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>History</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.refresh()} style={{ padding: "8px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#475569" }}>↻ Refresh</button>
          <button onClick={() => setShowFind(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Find Researchers
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{userName?.[0]?.toUpperCase() || "A"}</div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Recent Activity Timeline</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Track all your research activities and interactions</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>Search Activity</div>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by researcher name, university, or activity..."
              style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#f8f9fb", color: "#0f172a" }} />
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Search through your activity timeline to find specific interactions</div>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#475569", marginBottom: 8 }}>No activity yet</div>
            <div style={{ fontSize: 14 }}>Your research activities will appear here.</div>
          </div>
        ) : Object.entries(grouped).map(([date, items]) => (
          <div key={date} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 16px", padding: "0 0 10px", borderBottom: "1px solid #e2e8f0" }}>{date}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {items.map(a => {
                const cfg = typeConfig[a.type] || { icon: "", label: a.type, iconBg: "#f1f5f9" }
                return (
                  <div key={a.id} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid #f1f5f9", alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, background: cfg.iconBg, color: "#374151", fontWeight: 500 }}>{cfg.label}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                        {a.researcher_id ? (
                          <Link href={`/dashboard/researchers/${a.researcher_id}`} style={{ color: "#0f172a", textDecoration: "none" }}>{a.researcher_name}</Link>
                        ) : a.researcher_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{a.university}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{a.description}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>{formatTime(a.created_at)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {showFind && <FindResearchersModal onClose={() => setShowFind(false)} />}
    </div>
  )
}
