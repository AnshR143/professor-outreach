"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Activity } from "@/lib/supabase/types"
import { formatDate, formatTime } from "@/lib/utils"
import FindResearchersModal from "@/components/researchers/FindResearchersModal"
import { createClient } from "@/lib/supabase/client"

interface Props {
  researchActivities: Activity[]
  internshipActivities: Activity[]
  userName: string
}

export default function HistoryClient({ researchActivities, internshipActivities, userName }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [researchActs, setResearchActs] = useState(researchActivities)
  const [internshipActs, setInternshipActs] = useState(internshipActivities)
  const [activeTab, setActiveTab] = useState<"research" | "internships">("research")
  const [search, setSearch] = useState("")
  const [showFind, setShowFind] = useState(false)
  const [resetting, setResetting] = useState(false)

  const activities = activeTab === "research" ? researchActs : internshipActs

  async function resetHistory() {
    const label = activeTab === "research" ? "research" : "internship"
    if (!confirm(`Clear all ${label} activity history? This cannot be undone.`)) return
    setResetting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      if (activeTab === "research") {
        await supabase.from("activities").delete().eq("user_id", user.id).or("category.eq.research,category.is.null")
        setResearchActs([])
      } else {
        await supabase.from("activities").delete().eq("user_id", user.id).eq("category", "internship")
        setInternshipActs([])
      }
    }
    setResetting(false)
  }

  const filtered = activities.filter(a =>
    a.researcher_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.university?.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  )

  const grouped: Record<string, Activity[]> = {}
  filtered.forEach(a => {
    const date = formatDate(a.created_at)
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(a)
  })

  const typeConfig: Record<string, { label: string; bg: string }> = {
    email_sent:                { label: "Email Sent",       bg: "#dcfce7" },
    researcher_found:          { label: "Researcher Found", bg: "#dbeafe" },
    status_changed:            { label: "Status Changed",   bg: "#fef9c3" },
    note_added:                { label: "Note Added",        bg: "#f3e8ff" },
    profile_updated:           { label: "Profile Updated",  bg: "#f1f5f9" },
    contact_added:             { label: "Contact Added",    bg: "#fde68a" },
    internship_email_sent:     { label: "Email Sent",       bg: "#dcfce7" },
    internship_status_changed: { label: "Status Changed",   bg: "#fef9c3" },
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>History</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={resetHistory} disabled={resetting}
            style={{ padding: "7px 14px", background: "#fff", color: resetting ? "#94a3b8" : "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: resetting ? "not-allowed" : "pointer" }}>
            {resetting ? "Clearing..." : "Reset History"}
          </button>
          <button onClick={() => router.refresh()}
            style={{ padding: "8px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#475569" }}>
            Refresh
          </button>
          <button onClick={() => setShowFind(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Find Researchers
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Category toggle */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", padding: 4, borderRadius: 10, width: "fit-content" }}>
          {([["research", "Research Outreach"], ["internships", "Internship Outreach"]] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: "8px 18px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: activeTab === tab ? "#fff" : "transparent",
                color: activeTab === tab ? "#0f172a" : "#64748b",
                boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
              {label}
              <span style={{ marginLeft: 6, fontSize: 11, background: activeTab === tab ? "#e2e8f0" : "transparent", padding: "1px 6px", borderRadius: 8, color: "#64748b" }}>
                {tab === "research" ? researchActs.length : internshipActs.length}
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
            {activeTab === "research" ? "Research Activity Timeline" : "Internship Activity Timeline"}
          </h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            {activeTab === "research"
              ? "Track all your research activities and interactions"
              : "Track all your internship outreach activities"}
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>Search Activity</div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === "research" ? "Search by researcher name, university, or activity..." : "Search by contact name, company, or activity..."}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#f8f9fb", color: "#0f172a", boxSizing: "border-box" }} />
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#475569", marginBottom: 8 }}>No activity yet</div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>
              {activeTab === "research"
                ? "Your research activities will appear here."
                : "Your internship outreach activities will appear here."}
            </div>
          </div>
        ) : Object.entries(grouped).map(([date, items]) => (
          <div key={date} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 16px", padding: "0 0 10px", borderBottom: "1px solid #e2e8f0" }}>{date}</h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {items.map(a => {
                const cfg = typeConfig[a.type] || { label: a.type, bg: "#f1f5f9" }
                return (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 0", borderBottom: "1px solid #f1f5f9", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 10, background: cfg.bg, color: "#374151", fontWeight: 500, marginBottom: 4 }}>{cfg.label}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                        {a.researcher_id
                          ? <Link href={"/dashboard/researchers/" + a.researcher_id} style={{ color: "#0f172a", textDecoration: "none" }}>{a.researcher_name}</Link>
                          : a.researcher_name}
                      </div>
                      {a.university ? <div style={{ fontSize: 12, color: "#64748b" }}>{a.university}</div> : null}
                      {a.description ? <div style={{ fontSize: 12, color: "#94a3b8" }}>{a.description}</div> : null}
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
