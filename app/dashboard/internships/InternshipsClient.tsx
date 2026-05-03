"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { InternshipContact } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"

const EMAIL_STATUS_CYCLE = ["not_emailed", "emailed", "rejected", "accepted"] as const
type EmailStatus = typeof EMAIL_STATUS_CYCLE[number]

const STATUS_CONFIG: Record<EmailStatus, { label: string; bg: string; text: string; border: string }> = {
  not_emailed: { label: "Not Emailed", bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" },
  emailed:     { label: "Emailed",     bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  rejected:    { label: "Rejected",    bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  accepted:    { label: "Accepted",    bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
}

interface AddForm {
  company: string; role: string; contact_name: string; email: string
  linkedin_url: string; website: string; bio: string
}

const EMPTY_FORM: AddForm = { company: "", role: "", contact_name: "", email: "", linkedin_url: "", website: "", bio: "" }

interface Props { contacts: InternshipContact[]; userName: string }

export default function InternshipsClient({ contacts: initial, userName }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [contacts, setContacts] = useState(initial)
  const [emailStatuses, setEmailStatuses] = useState<Record<string, EmailStatus>>({})
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function cycleEmailStatus(e: React.MouseEvent, contact: InternshipContact) {
    e.preventDefault(); e.stopPropagation()
    const current = (emailStatuses[contact.id] ?? contact.email_status ?? "not_emailed") as EmailStatus
    const idx = EMAIL_STATUS_CYCLE.indexOf(current)
    const next = EMAIL_STATUS_CYCLE[(idx + 1) % EMAIL_STATUS_CYCLE.length]
    setEmailStatuses(prev => ({ ...prev, [contact.id]: next }))
    await supabase.from("internship_contacts").update({ email_status: next }).eq("id", contact.id)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company.trim() || !form.role.trim()) return
    setAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdding(false); return }
    const { data: newContact } = await supabase.from("internship_contacts").insert({
      user_id: user.id,
      company: form.company.trim(),
      role: form.role.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      website: form.website.trim() || null,
      bio: form.bio.trim() || null,
    }).select().single()
    if (newContact) {
      setContacts(prev => [newContact as InternshipContact, ...prev])
      await supabase.from("activities").insert({
        user_id: user.id,
        type: "contact_added",
        category: "internship",
        researcher_name: form.contact_name.trim() || form.role.trim(),
        university: form.company.trim(),
        description: `Added ${form.role.trim()} at ${form.company.trim()}`,
      })
    }
    setForm(EMPTY_FORM)
    setShowAdd(false)
    setAdding(false)
  }

  async function resetAll() {
    if (!confirm("Delete ALL internship contacts? This cannot be undone.")) return
    setResetting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from("internship_contacts").delete().eq("user_id", user.id)
    setContacts([])
    setResetting(false)
  }

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    return !q || c.company.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.contact_name.toLowerCase().includes(q)
  })

  const inp = (overrides: React.CSSProperties = {}): React.CSSProperties => ({
    width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13,
    color: "#0f172a", background: "#f8fafc", outline: "none", boxSizing: "border-box", ...overrides,
  })

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Internship Contacts</h1>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>
            {contacts.length} total
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={resetAll} disabled={resetting}
            style={{ padding: "7px 14px", background: "#fff", color: resetting ? "#94a3b8" : "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: resetting ? "not-allowed" : "pointer" }}>
            {resetting ? "Resetting..." : "Reset All"}
          </button>
          <button onClick={() => router.refresh()}
            style={{ padding: "8px 10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", color: "#64748b" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
          <button onClick={() => setShowAdd(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Contact
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company, role, or contact name..."
              style={{ ...inp(), paddingLeft: 34 }} />
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Showing <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> of {contacts.length} contacts
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "72px 20px", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
              {contacts.length === 0 ? "No internship contacts yet" : `No results for "${search}"`}
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24 }}>
              {contacts.length === 0 ? "Add companies and contacts to start cold emailing for internships." : "Try a different search term."}
            </div>
            {contacts.length === 0 && (
              <button onClick={() => setShowAdd(true)}
                style={{ padding: "10px 28px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Add First Contact
              </button>
            )}
          </div>
        )}

        {/* Contact grid */}
        {filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(c => {
              const status = (emailStatuses[c.id] ?? c.email_status ?? "not_emailed") as EmailStatus
              const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_emailed
              return (
                <Link key={c.id} href={`/dashboard/internships/${c.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 12, height: "100%", boxSizing: "border-box" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)"; e.currentTarget.style.borderColor = "#3b82f6" }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0" }}>
                    {/* Company + role */}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{c.company}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#3b82f6" }}>{c.role}</div>
                      {c.contact_name && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{c.contact_name}</div>}
                    </div>
                    {/* Why apply snippet */}
                    {c.why_apply && (
                      <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5, background: "#f8fafc", borderRadius: 8, padding: "8px 10px", borderLeft: "3px solid #3b82f6" }}>
                        {c.why_apply.slice(0, 120)}{c.why_apply.length > 120 ? "…" : ""}
                      </div>
                    )}
                    {/* Bottom row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {c.email && (
                          <span style={{ fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            email
                          </span>
                        )}
                        {c.linkedin_url && (
                          <span style={{ fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                            linkedin
                          </span>
                        )}
                      </div>
                      <button onClick={e => cycleEmailStatus(e, c)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 10, border: `1.5px solid ${cfg.border}`, background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        {cfg.label}
                      </button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Add Internship Contact</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleAdd}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Company Name *</label>
                  <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="e.g. Google, Stripe, OpenAI" style={inp()} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Role / Position *</label>
                  <input required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Software Engineering Intern" style={inp()} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Contact Name</label>
                    <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="e.g. Jane Smith" style={inp()} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Contact Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" style={inp()} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>LinkedIn URL</label>
                    <input value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="linkedin.com/in/..." style={inp()} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Company Website</label>
                    <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="company.com" style={inp()} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Notes / About Role</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Any notes about this company or role..." rows={3} style={{ ...inp(), resize: "vertical" as any }} />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                  <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM) }}
                    style={{ padding: "9px 18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#475569" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={adding || !form.company.trim() || !form.role.trim()}
                    style={{ padding: "9px 20px", background: adding ? "#93c5fd" : "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: adding ? "not-allowed" : "pointer" }}>
                    {adding ? "Adding..." : "Add Contact"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
