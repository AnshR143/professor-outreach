"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
  /** Email-sent activities from the last ~2 weeks, for the Weekly Activity chart. */
  weeklyOutreach: Pick<Activity, "type" | "created_at">[]
  emails: Email[]
}

export default function DashboardClient({ profile, researchers, activities, weeklyOutreach, emails }: Props) {
  const [showFind, setShowFind] = useState(false)

  const emailsSent = researchers.filter(r => ["emailed", "accepted", "rejected"].includes(r.email_status || "")).length
  const accepted = researchers.filter(r => r.email_status === "accepted").length
  const awaiting = researchers.filter(r => r.email_status === "emailed").length

  const barData = (() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const counts = new Array(7).fill(0)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - mondayOffset)
    monday.setHours(0, 0, 0, 0)

    // Only outreach (emails sent) counts here — discovery/status/note actions
    // are excluded so the chart matches its "Outreach actions this week" label.
    weeklyOutreach.forEach(a => {
      const d = new Date(a.created_at)
      if (d >= monday) {
        const idx = d.getDay() === 0 ? 6 : d.getDay() - 1
        counts[idx]++
      }
    })
    const max = Math.max(...counts, 1)
    return days.map((day, i) => ({ day, count: counts[i], pct: (counts[i] / max) * 100 }))
  })()

  const kpis = [
    {
      label: "Researchers Found", value: researchers.length, sub: "Academic contacts", color: "#1e3a5f",
      border: "#1e3a5f", shadow: "#1e3a5f", cardBg: "#dbeafe",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: "Internships Found", value: 0, sub: "Total opportunities", color: "#1e4d7a",
      border: "#1e4d7a", shadow: "#1e4d7a", cardBg: "#bfdbfe",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e4d7a" strokeWidth="2.5"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
    },
    {
      label: "Emails Sent", value: emailsSent, sub: `${researchers.length ? Math.round(emailsSent / researchers.length * 100) : 0}% outreach rate`, color: "#304674",
      border: "#304674", shadow: "#304674", cardBg: "#c6d3e3",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#304674" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    },
    {
      label: "Accepted", value: accepted, sub: "Positive responses", color: "#2d5986",
      border: "#2d5986", shadow: "#2d5986", cardBg: "#d8e1e8",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d5986" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    },
    {
      label: "Pending", value: awaiting, sub: "Awaiting response", color: "#3b6fa0",
      border: "#3b6fa0", shadow: "#3b6fa0", cardBg: "#e0eaf4",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b6fa0" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
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
              Your internship &amp; research outreach hub
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <img src="/link.png" alt="InternLink" style={{ width: 48, height: 48, objectFit: "contain" }} />
              <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>InternLink</span>
            </Link>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(48, 70, 116,0.85)", border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, backdropFilter: "blur(8px)" }}>
              {profile?.name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "28px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Overview</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            Welcome back, {profile?.name?.split(" ")[0] || "there"}. Here is your outreach summary.
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{
              background: k.cardBg,
              borderRadius: 14,
              padding: "18px 16px",
              border: `2.5px solid ${k.border}`,
              boxShadow: `4px 4px 0px ${k.shadow}`,
              transition: "transform 0.15s, box-shadow 0.15s",
              cursor: "default",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0px ${k.shadow}` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = `4px 4px 0px ${k.shadow}` }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: k.color, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.3, maxWidth: "70%" }}>{k.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fff", border: `2px solid ${k.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `2px 2px 0px ${k.shadow}` }}>
                  {k.icon}
                </div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: k.color, lineHeight: 1, letterSpacing: "-0.03em" }}>{k.value}</div>
              <div style={{ fontSize: 11, color: k.color, marginTop: 6, fontWeight: 600, opacity: 0.7 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Weekly Activity Bar Graph */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Weekly Activity</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>Outreach actions this week</p>
            </div>
            <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "flex-end", gap: 10, height: 160 }}>
              {barData.map((bar, i) => (
                <div key={bar.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(bar.pct, 8)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        width: "100%",
                        maxWidth: 36,
                        background: bar.count > 0 ? "#304674" : "#e2e8f0",
                        borderRadius: "6px 6px 3px 3px",
                        position: "relative",
                      }}
                    >
                      {bar.count > 0 && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 + i * 0.08 }}
                          style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, color: "#304674" }}
                        >
                          {bar.count}
                        </motion.span>
                      )}
                    </motion.div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{bar.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Recent Activity</h3>
              <Link href="/dashboard/history" style={{ fontSize: 12, color: "#304674", textDecoration: "none", fontWeight: 500 }}>View all</Link>
            </div>
            <div style={{ maxHeight: 180, overflowY: "auto" }}>
              {activities.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                  No activity yet. Find researchers to get started.
                </div>
              ) : activities.slice(0, 4).map(a => (
                <div key={a.id} style={{ padding: "10px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: a.type === "email_sent" ? "#dcfce7" : "#c6d3e3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {a.type === "email_sent"
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#304674" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{a.researcher_name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{a.university}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{timeAgo(a.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showFind && <FindResearchersModal onClose={() => setShowFind(false)} />}
    </div>
  )
}
