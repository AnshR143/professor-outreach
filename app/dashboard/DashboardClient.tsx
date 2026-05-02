"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import type { Profile, Researcher, Activity, Email } from "@/lib/supabase/types"
import { timeAgo } from "@/lib/utils"
import FindResearchersModal from "@/components/researchers/FindResearchersModal"
import { DottedSurface } from "@/components/ui/dotted-surface"
import LiquidGlassButton from "@/components/ui/liquid-glass-button"

interface Props {
  profile: Profile | null
  researchers: Researcher[]
  activities: Activity[]
  emails: Email[]
}

export default function DashboardClient({ profile, researchers, activities, emails }: Props) {
  const [showFind, setShowFind] = useState(false)
  const [aiSummary, setAiSummary] = useState("")
  const [loadingSummary, setLoadingSummary] = useState(false)

  const emailsSent = researchers.filter(r => ["emailed", "accepted", "rejected"].includes(r.email_status || "")).length
  const accepted = researchers.filter(r => r.email_status === "accepted").length
  const awaiting = researchers.filter(r => r.email_status === "emailed").length
  const topFields = [...new Set(researchers.flatMap(r => r.research_areas))].slice(0, 3)
  const topUnis = [...new Set(researchers.map(r => r.university))].slice(0, 2)

  useEffect(() => {
    if (researchers.length > 0 && !aiSummary) {
      setLoadingSummary(true)
      fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalResearchers: researchers.length,
          emailsSent,
          topFields,
          topUniversities: topUnis,
          userName: profile?.name || "Student",
        }),
      })
        .then(r => r.json())
        .then(d => { if (d.summary) setAiSummary(d.summary) })
        .catch(() => {})
        .finally(() => setLoadingSummary(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const kpis = [
    {
      label: "Researchers Found", value: researchers.length, sub: "Total matches", color: "#3b82f6",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      bg: "#eff6ff",
    },
    {
      label: "Emails Sent", value: emailsSent, sub: `${researchers.length ? Math.round(emailsSent / researchers.length * 100) : 0}% outreach rate`, color: "#22c55e",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      bg: "#f0fdf4",
    },
    {
      label: "Accepted", value: accepted, sub: "Positive responses", color: "#16a34a",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
      bg: "#f0fdf4",
    },
    {
      label: "Pending", value: awaiting, sub: "Awaiting response", color: "#f59e0b",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      bg: "#fffbeb",
    },
  ]

  return (
    <div>
      {/* Hero banner with dotted surface */}
      <div style={{ position: "relative", height: 160, overflow: "hidden", background: "#0f172a" }}>
        <DottedSurface contained />
        {/* Content overlay */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px",
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: -0.5 }}>
              Dashboard
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>
              Welcome back, {profile?.name?.split(" ")[0] || "there"} — your research outreach hub
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LiquidGlassButton
              onClick={() => setShowFind(true)}
              variant="primary"
              size="md"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Find Researchers
            </LiquidGlassButton>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(59,130,246,0.85)", border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, backdropFilter: "blur(8px)" }}>
              {profile?.name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "28px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Overview</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            Welcome back, {profile?.name?.split(" ")[0] || "there"}. Here is your research outreach summary.
          </p>
        </div>

        {/* AI Summary */}
        {(aiSummary || loadingSummary) && (
          <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #fef3c7 100%)", border: "1px solid #bfdbfe", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#3b82f6", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>AI Insight</div>
              <p style={{ margin: 0, fontSize: 14, color: "#7c3aed", lineHeight: 1.5 }}>
                {loadingSummary ? "Generating personalized insights..." : aiSummary}
              </p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>{k.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {k.icon}
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Recent Activity */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Recent Activity</h3>
              <Link href="/dashboard/history" style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>View all</Link>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {activities.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                  No activity yet. Find researchers to get started.
                </div>
              ) : activities.slice(0, 8).map(a => (
                <div key={a.id} style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: a.type === "email_sent" ? "#dcfce7" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {a.type === "email_sent"
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{a.researcher_name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{a.university}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{a.description}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{timeAgo(a.created_at)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Matches */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Top Matches</h3>
              <Link href="/dashboard/researchers" style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>View all</Link>
            </div>
            <div>
              {researchers.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                  No researchers found yet. Click "Find Researchers" to start.
                </div>
              ) : [...researchers].sort((a, b) => b.match_score - a.match_score).slice(0, 5).map(r => (
                <Link key={r.id} href={`/dashboard/researchers/${r.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid #f1f5f9", textDecoration: "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {r.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.university}</div>
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    border: `2.5px solid ${r.match_score >= 85 ? "#22c55e" : r.match_score >= 70 ? "#3b82f6" : "#f59e0b"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "#0f172a",
                  }}>
                    {r.match_score}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showFind && <FindResearchersModal onClose={() => setShowFind(false)} />}
    </div>
  )
}
