"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { InternshipContact } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"
import dynamic from "next/dynamic"
import FindInternshipContactsModal from "@/components/internships/FindInternshipContactsModal"
import LiquidGlassButton from "@/components/ui/liquid-glass-button"
const MapDiscoverModal = dynamic(() => import("./MapDiscoverModal"), { ssr: false })

const EMAIL_STATUS_CYCLE = ["not_emailed", "emailed", "rejected", "accepted"] as const
type EmailStatus = typeof EMAIL_STATUS_CYCLE[number]
type Tone = "formal" | "casual" | "enthusiastic"

const STATUS_CONFIG: Record<EmailStatus, { label: string; bg: string; text: string; border: string }> = {
  not_emailed: { label: "Not Emailed", bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" },
  emailed:     { label: "Emailed",     bg: "#c6d3e3", text: "#304674", border: "#98bad5" },
  rejected:    { label: "Rejected",    bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  accepted:    { label: "Accepted",    bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
}

const TONE_COLORS: Record<Tone, { bg: string; color: string; border: string }> = {
  formal:       { bg: "#d8e1e8", color: "#304674", border: "#98bad5" },
  casual:       { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  enthusiastic: { bg: "#fdf4ff", color: "#7c3aed", border: "#c4b5fd" },
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
  const [showFind, setShowFind] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Email modal state
  const [emailContact, setEmailContact] = useState<InternshipContact | null>(null)
  const [genTone, setGenTone] = useState<Tone>("formal")
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState("")
  const [genSubject, setGenSubject] = useState("")
  const [genBody, setGenBody] = useState("")
  const [copied, setCopied] = useState(false)
  const [gmailCopied, setGmailCopied] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  async function cycleEmailStatus(e: React.MouseEvent, contact: InternshipContact) {
    e.preventDefault(); e.stopPropagation()
    const current = (emailStatuses[contact.id] ?? contact.email_status ?? "not_emailed") as EmailStatus
    const idx = EMAIL_STATUS_CYCLE.indexOf(current)
    const next = EMAIL_STATUS_CYCLE[(idx + 1) % EMAIL_STATUS_CYCLE.length]
    setEmailStatuses(prev => ({ ...prev, [contact.id]: next }))
    await supabase.from("internship_contacts").update({ email_status: next }).eq("id", contact.id)
  }

  function openEmailModal(e: React.MouseEvent, contact: InternshipContact) {
    e.preventDefault(); e.stopPropagation()
    setEmailContact(contact)
    setGenSubject(""); setGenBody(""); setGenError(""); setCopied(false)
  }

  async function generateEmail() {
    if (!emailContact) return
    setGenerating(true); setGenError("")
    try {
      const res = await fetch("/api/email/generate-internship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: emailContact.id, tone: genTone }),
      })
      const data = await res.json()
      if (!res.ok) { setGenError(data.error || "Generation failed."); return }
      setGenSubject(data.subject || ""); setGenBody(data.body || "")
    } catch { setGenError("Network error. Please try again.") }
    finally { setGenerating(false) }
  }

  async function saveDraft() {
    if (!emailContact || (!genSubject && !genBody)) return
    setSavingDraft(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("internship_emails").insert({
        user_id: user.id, contact_id: emailContact.id,
        subject: genSubject, body: genBody, tone: genTone, status: "draft",
      })
      await supabase.from("activities").insert({
        user_id: user.id, type: "internship_email_sent", category: "internship",
        researcher_name: emailContact.contact_name || emailContact.company,
        university: emailContact.company,
        description: "Draft saved for " + emailContact.role + " at " + emailContact.company,
      })
    }
    setSavingDraft(false)
  }

  async function copyEmail() {
    await navigator.clipboard.writeText(genSubject + "\n\n" + genBody)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function openGmail() {
    if (!emailContact) return
    // Copy body to clipboard so user can paste in Gmail  avoids URL-length limit that causes tab to close
    try { await navigator.clipboard.writeText(genBody) } catch {}
    const url = "https://mail.google.com/mail/?view=cm&fs=1&to=" +
      encodeURIComponent(emailContact.email || "") +
      "&su=" + encodeURIComponent(genSubject)
    window.open(url, "_blank", "noopener,noreferrer")
    setGmailCopied(true)
    setTimeout(() => setGmailCopied(false), 6000)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company.trim() || !form.role.trim()) return
    setAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdding(false); return }
    const { data: newContact } = await supabase.from("internship_contacts").insert({
      user_id: user.id,
      company: form.company.trim(), role: form.role.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      website: form.website.trim() || null,
      bio: form.bio.trim() || null,
    }).select().single()
    if (newContact) {
      setContacts(prev => [newContact as InternshipContact, ...prev])
      await supabase.from("activities").insert({
        user_id: user.id, type: "contact_added", category: "internship",
        researcher_name: form.contact_name.trim() || form.role.trim(),
        university: form.company.trim(),
        description: "Added " + form.role.trim() + " at " + form.company.trim(),
      })
    }
    setForm(EMPTY_FORM); setShowAdd(false); setAdding(false)
  }

  async function resetAll() {
    if (!confirm("Delete ALL internship contacts? This cannot be undone.")) return
    setResetting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from("internship_contacts").delete().eq("user_id", user.id)
    setContacts([]); setResetting(false)
  }

  async function deleteContact(e: React.MouseEvent, id: string) {
    e.preventDefault(); e.stopPropagation()
    await supabase.from("internship_contacts").delete().eq("id", id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  async function refreshContacts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from("internship_contacts").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      if (data) setContacts(data as InternshipContact[])
    }
  }

  async function handleFindClose() {
    setShowFind(false)
    await refreshContacts()
  }

  async function handleMapClose() {
    setShowMap(false)
    await refreshContacts()
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
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Internship Contacts</h1>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>
            {contacts.length} total
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={resetAll}
            disabled={resetting || contacts.length === 0}
            title="Reset all contacts"
            aria-label="Reset all contacts"
            style={{ width: 30, height: 30, padding: 0, background: "transparent", color: resetting || contacts.length === 0 ? "#cbd5e1" : "#94a3b8", border: "none", borderRadius: 6, cursor: resetting || contacts.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => { if (!resetting && contacts.length > 0) { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626" } }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = resetting || contacts.length === 0 ? "#cbd5e1" : "#94a3b8" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
          <button onClick={() => setShowMap(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Map Discovery
          </button>
          <LiquidGlassButton onClick={() => setShowFind(true)} variant="primary" size="md">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Find Contacts
          </LiquidGlassButton>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#304674", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company, role, or contact name..."
              style={{ ...inp(), paddingLeft: 34 }} />
          </div>
        </div>

        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Showing <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> of {contacts.length} contacts
          {contacts.length > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8" }}> click any card to generate an email</span>}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "72px 20px", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
              {contacts.length === 0 ? "No internship contacts yet" : "No results for \"" + search + "\""}
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24 }}>
              {contacts.length === 0 ? "Use Map Discovery or Find Contacts to discover real opportunities." : "Try a different search term."}
            </div>
            {contacts.length === 0 && (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setShowMap(true)}
                  style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Map Discovery
                </button>
                <button onClick={() => setShowFind(true)}
                  style={{ padding: "10px 24px", background: "#304674", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Find Contacts
                </button>
                <button onClick={() => setShowAdd(true)}
                  style={{ padding: "10px 24px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Add Manually
                </button>
              </div>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(c => {
              const status = (emailStatuses[c.id] ?? c.email_status ?? "not_emailed") as EmailStatus
              const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_emailed
              return (
                <div key={c.id} style={{ position: "relative" }}>
                  <button
                    onClick={e => deleteContact(e, c.id)}
                    title="Remove contact"
                    style={{ position: "absolute", top: 10, right: 10, zIndex: 2, width: 22, height: 22, borderRadius: "50%", background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14, lineHeight: 1, padding: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#94a3b8" }}
                  >�</button>
                  <div
                    onClick={e => openEmailModal(e, c)}
                    style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 12, height: "100%", boxSizing: "border-box" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)"; e.currentTarget.style.borderColor = "#304674" }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0" }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{c.company || "Unknown Company"}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#304674", marginTop: 2 }}>{c.role}</div>
                      {c.contact_name && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{c.contact_name}</div>}
                    </div>
                    {c.bio && (
                      <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5, background: "#f8fafc", borderRadius: 8, padding: "8px 10px", borderLeft: "3px solid #e2e8f0" }}>
                        {c.bio.slice(0, 100)}{c.bio.length > 100 ? "..." : ""}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid #f1f5f9", marginTop: "auto" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#304674", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                          Generate Email
                        </span>
                        {c.email && <span style={{ fontSize: 10, color: "#94a3b8" }}>· has email</span>}
                      </div>
                      <button onClick={e => cycleEmailStatus(e, c)}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 10, border: "1.5px solid " + cfg.border, background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        {cfg.label}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add Contact Modal ── */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Add Internship Contact</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20, lineHeight: 1 }}>x</button>
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
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Website</label>
                    <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="company.com" style={inp()} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Notes / About Role</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Any notes about this company or role..." rows={3} style={{ ...inp(), resize: "vertical" as const }} />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                  <button type="button" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM) }}
                    style={{ padding: "9px 18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#475569" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={adding || !form.company.trim() || !form.role.trim()}
                    style={{ padding: "9px 20px", background: adding ? "#98bad5" : "#304674", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: adding ? "not-allowed" : "pointer" }}>
                    {adding ? "Adding..." : "Add Contact"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Email Generation Modal ── */}
      {emailContact && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={() => setEmailContact(null)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{emailContact.contact_name || emailContact.company}</div>
                <div style={{ fontSize: 12, color: "#304674", fontWeight: 600, marginTop: 2 }}>{emailContact.role}{emailContact.company ? " at " + emailContact.company : ""}</div>
              </div>
              <button onClick={() => setEmailContact(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20, lineHeight: 1, padding: 4 }}>x</button>
            </div>

            <div style={{ padding: "16px 24px 24px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginRight: 2 }}>Tone</span>
                {(["formal", "casual", "enthusiastic"] as Tone[]).map(t => {
                  const tc = TONE_COLORS[t]; const active = genTone === t
                  return (
                    <button key={t} onClick={() => setGenTone(t)}
                      style={{ padding: "6px 13px", borderRadius: 8, border: "1.5px solid " + (active ? tc.border : "#e2e8f0"), background: active ? tc.bg : "#fff", color: active ? tc.color : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                      {t}
                    </button>
                  )
                })}
              </div>

              {genError && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14 }}>
                  {genError}
                  {(genError.toLowerCase().includes("key") || genError.toLowerCase().includes("api")) && (
                    <span> <a href="/settings" style={{ color: "#dc2626", fontWeight: 600 }}>Add your API key in Settings.</a></span>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Email Subject</label>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{genSubject.length}/120</span>
                </div>
                <input value={genSubject} onChange={e => setGenSubject(e.target.value.slice(0, 120))}
                  placeholder="Subject line..."
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", background: genSubject ? "#fff" : "#f8fafc", outline: "none", boxSizing: "border-box", fontWeight: 600 }} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Email Body</label>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{genBody.length}/1000</span>
                </div>
                <textarea value={genBody} onChange={e => setGenBody(e.target.value.slice(0, 1000))} rows={10}
                  placeholder="Email body will appear here after generation..."
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", background: genBody ? "#fff" : "#f8fafc", outline: "none", boxSizing: "border-box", resize: "vertical" as const, lineHeight: 1.6, fontFamily: "inherit" }} />
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={generateEmail} disabled={generating}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: generating ? "#b2cbde" : "#304674", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer" }}>
                  {generating ? (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>Generating...</>
                  ) : (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Generate Email</>
                  )}
                </button>
                <button onClick={openGmail} disabled={!genSubject && !genBody}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: gmailCopied ? "#dcfce7" : "#fff", color: gmailCopied ? "#15803d" : "#374151", border: `1px solid ${gmailCopied ? "#86efac" : "#e2e8f0"}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !genSubject && !genBody ? 0.4 : 1, transition: "all 0.2s" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {gmailCopied ? "Body copied  paste in Gmail!" : "Open in Gmail"}
                </button>
                <button onClick={copyEmail} disabled={!genSubject && !genBody}
                  style={{ padding: "9px 14px", background: copied ? "#dcfce7" : "#f1f5f9", color: copied ? "#15803d" : "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !genSubject && !genBody ? 0.4 : 1 }}>
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button onClick={saveDraft} disabled={savingDraft || (!genSubject && !genBody)}
                  style={{ padding: "9px 14px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !genSubject && !genBody ? 0.4 : 1 }}>
                  {savingDraft ? "Saving..." : "Save Draft"}
                </button>
                <Link href={"/dashboard/internships/" + emailContact.id}
                  style={{ marginLeft: "auto", padding: "9px 14px", background: "#fff", color: "#304674", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center" }}>
                  Full Details →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Find Contacts Modal ── */}
      {showFind && (
        <FindInternshipContactsModal onClose={handleFindClose} />
      )}

      {/* ── Map Discovery Modal ── */}
      {showMap && (
        <MapDiscoverModal onClose={handleMapClose} />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
