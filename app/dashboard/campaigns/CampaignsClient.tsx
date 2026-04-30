"use client"
import { useState } from "react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import FindResearchersModal from "@/components/researchers/FindResearchersModal"

interface Props { emails: any[]; userName: string }

export default function CampaignsClient({ emails, userName }: Props) {
  const [filter, setFilter] = useState("all")
  const [showFind, setShowFind] = useState(false)

  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: "#f1f5f9", text: "#64748b" },
    sent: { bg: "#dcfce7", text: "#16a34a" },
    opened: { bg: "#dbeafe", text: "#1d4ed8" },
    replied: { bg: "#f0fdf4", text: "#15803d" },
  }

  const filtered = emails.filter(e => filter === "all" || e.status === filter)

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Campaigns</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowFind(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#f97316", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Find Researchers
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{userName?.[0]?.toUpperCase() || "A"}</div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Email Campaigns</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Track all your outreach emails and their status</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total Emails", value: emails.length, color: "#3b82f6" },
            { label: "Sent", value: emails.filter(e => e.status === "sent").length, color: "#22c55e" },
            { label: "Opened", value: emails.filter(e => e.status === "opened").length, color: "#f59e0b" },
            { label: "Replied", value: emails.filter(e => e.status === "replied").length, color: "#8b5cf6" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#f1f5f9", padding: 4, borderRadius: 8, width: "fit-content" }}>
          {["all", "draft", "sent", "replied"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, background: filter === f ? "#fff" : "transparent", color: filter === f ? "#0f172a" : "#64748b", textTransform: "capitalize" }}>
              {f} ({emails.filter(e => f === "all" || e.status === f).length})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#475569", marginBottom: 8 }}>No emails yet</div>
            <div style={{ fontSize: 14 }}>Generate emails from the researcher detail page.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(e => {
              const sc = statusColors[e.status] || statusColors.draft
              return (
                <div key={e.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{e.subject || "(No subject)"}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        To: {e.researchers?.name} • {e.researchers?.university}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: sc.bg, color: sc.text, fontWeight: 500, textTransform: "capitalize" }}>
                        {e.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", gap: 16 }}>
                    <span> {formatDate(e.created_at)}</span>
                    {e.sent_at && <span> Sent: {formatDate(e.sent_at)}</span>}
                    <span> Tone: {e.tone}</span>
                  </div>
                  <Link href={`/dashboard/researchers/${e.researcher_id}`}
                    style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#f97316", textDecoration: "none" }}>
                    View Researcher →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {showFind && <FindResearchersModal onClose={() => setShowFind(false)} />}
    </div>
  )
}
