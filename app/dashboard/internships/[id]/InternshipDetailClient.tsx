"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { InternshipContact, InternshipEmail } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"

type Tone = "formal" | "casual" | "enthusiastic"

interface Props {
  contact: InternshipContact
  emails: InternshipEmail[]
  profile: any
}

export default function InternshipDetailClient({ contact: initial, emails: initialEmails }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [contact, setContact] = useState(initial)
  const [emails, setEmails] = useState(initialEmails)

  const [tone, setTone] = useState<Tone>("formal")
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [gmailCopied, setGmailCopied] = useState(false)
  const [manualEmail, setManualEmail] = useState(contact.email || "")
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [notes, setNotes] = useState(contact.notes || "")
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    company: contact.company, role: contact.role, contact_name: contact.contact_name,
    email: contact.email || "", linkedin_url: contact.linkedin_url || "",
    website: contact.website || "", bio: contact.bio || "",
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Live email lookup — populated by /api/internships/find-email. We never
  // fabricate a guess; if the backend can't find one, we say so honestly.
  type EmailLookup = {
    status: "idle" | "loading" | "found" | "not_found" | "error"
    email?: string
    source?: string
    confidence?: number
    alternatives?: string[]
    evidence?: string
    error?: string
  }
  const [emailLookup, setEmailLookup] = useState<EmailLookup>({ status: "idle" })

  const MAX_SUBJECT = 120
  const MAX_BODY = 2000

  async function lookupContactEmail() {
    if (!contact.contact_name || !contact.company) {
      setEmailLookup({ status: "error", error: "Add a contact name and company first." })
      return
    }
    setEmailLookup({ status: "loading" })
    try {
      const res = await fetch("/api/internships/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contact.contact_name,
          company: contact.company,
          role: contact.role,
          website: contact.website,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEmailLookup({ status: "error", error: data.error || `HTTP ${res.status}` })
        return
      }
      if (data.email) {
        setEmailLookup({
          status: "found",
          email: data.email,
          source: data.source,
          confidence: data.confidence,
          alternatives: data.alternatives || [],
          evidence: data.evidence,
        })
      } else {
        setEmailLookup({ status: "not_found", alternatives: data.alternatives || [] })
      }
    } catch (e: any) {
      setEmailLookup({ status: "error", error: e?.message || "Lookup failed" })
    }
  }

  // Auto-look-up once on mount when we don't already have an email saved.
  useEffect(() => {
    if (!contact.email && contact.contact_name && contact.company && emailLookup.status === "idle") {
      lookupContactEmail()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function useFoundEmail(email: string) {
    setManualEmail(email)
  }

  async function saveManualEmail() {
    if (!manualEmail.trim()) return
    setSavingEmail(true)
    await updateField("email", manualEmail.trim())
    setSavingEmail(false)
    setEmailSaved(true)
    setTimeout(() => setEmailSaved(false), 3000)
  }

  async function generateEmail() {
    setGenerating(true); setGenError("")
    try {
      const res = await fetch("/api/email/generate-internship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, tone }),
      })
      const data = await res.json()
      if (!res.ok) { setGenError(data.error || "Generation failed."); return }
      setSubject(data.subject || ""); setBody(data.body || "")
    } catch { setGenError("Network error. Please try again.") }
    finally { setGenerating(false) }
  }

  async function generateFollowUp() {
    if (!subject && !body) return
    setGenerating(true); setGenError("")
    try {
      const res = await fetch("/api/email/generate-internship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, tone, followUp: true, originalEmail: body }),
      })
      const data = await res.json()
      if (!res.ok) { setGenError(data.error || "Follow-up generation failed."); return }
      setSubject(data.subject || subject); setBody(data.body || "")
    } catch { setGenError("Network error.") }
    finally { setGenerating(false) }
  }

  async function saveDraft() {
    if (!subject && !body) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: saved } = await supabase.from("internship_emails").insert({
        user_id: user.id, contact_id: contact.id,
        subject, body, tone, status: "draft",
      }).select().single()
      if (saved) setEmails(prev => [saved as InternshipEmail, ...prev])
      await supabase.from("activities").insert({
        user_id: user.id, type: "internship_email_sent", category: "internship",
        researcher_name: contact.contact_name || contact.company,
        university: contact.company,
        description: "Draft saved for " + contact.role + " at " + contact.company,
      })
    }
    setSaving(false)
  }

  async function copyEmail() {
    await navigator.clipboard.writeText(subject + "\n\n" + body)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function openGmail() {
    // Copy body to clipboard so user can paste in Gmail  avoids URL-length limit that causes tab to close
    try { await navigator.clipboard.writeText(body) } catch {}
    const url = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(contact.email || manualEmail.trim()) +
      "&su=" + encodeURIComponent(subject)
    window.open(url, "_blank", "noopener,noreferrer")
    setGmailCopied(true)
    setTimeout(() => setGmailCopied(false), 6000)
  }

  async function saveNotes() {
    setSavingNotes(true)
    await supabase.from("internship_contacts").update({ notes }).eq("id", contact.id)
    setContact(prev => ({ ...prev, notes }))
    setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000)
    setSavingNotes(false)
  }

  async function updateField(field: string, value: string) {
    await supabase.from("internship_contacts").update({ [field]: value }).eq("id", contact.id)
    setContact(prev => ({ ...prev, [field]: value }))
  }

  async function saveEdit() {
    setSavingEdit(true)
    await supabase.from("internship_contacts").update({
      company: editForm.company, role: editForm.role,
      contact_name: editForm.contact_name, email: editForm.email || null,
      linkedin_url: editForm.linkedin_url || null, website: editForm.website || null,
      bio: editForm.bio || null,
    }).eq("id", contact.id)
    setContact(prev => ({ ...prev, ...editForm, email: editForm.email || null, linkedin_url: editForm.linkedin_url || null, website: editForm.website || null, bio: editForm.bio || null }))
    setEditing(false); setSavingEdit(false)
  }

  async function handleDelete() {
    if (!confirm("Delete this contact? This cannot be undone.")) return
    setDeleting(true)
    await supabase.from("internship_contacts").delete().eq("id", contact.id)
    router.push("/dashboard/internships")
  }

  function loadEmail(e: InternshipEmail) { setSubject(e.subject); setBody(e.body) }

  const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13,
    color: "#0f172a", background: "#f8fafc", outline: "none", boxSizing: "border-box", ...extra,
  })

  const toneColors: Record<Tone, { bg: string; color: string; border: string }> = {
    formal:       { bg: "#d8e1e8", color: "#304674", border: "#98bad5" },
    casual:       { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
    enthusiastic: { bg: "#fdf4ff", color: "#7c3aed", border: "#c4b5fd" },
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    draft:   { bg: "#f1f5f9", color: "#475569" },
    sent:    { bg: "#c6d3e3", color: "#304674" },
    opened:  { bg: "#fef9c3", color: "#92400e" },
    replied: { bg: "#dcfce7", color: "#15803d" },
  }

  const tags = contact.bio
    ? contact.bio.match(/(?:about|on|for)\s+([\w,\s]+)/i)?.[1]?.split(/,\s*/).slice(0, 5) || []
    : []

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/internships" style={{ color: "#64748b", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back
          </Link>
          <span style={{ color: "#e2e8f0" }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{contact.company || contact.contact_name}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={contact.status} onChange={e => updateField("status", e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, color: "#0f172a", background: "#fff", cursor: "pointer" }}>
            <option value="unsorted">Unsorted</option>
            <option value="awaiting">Awaiting</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={() => setEditing(e => !e)}
            style={{ padding: "6px 14px", background: editing ? "#304674" : "#fff", color: editing ? "#fff" : "#475569", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            {editing ? "Cancel" : "Edit"}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            style={{ padding: "6px 12px", background: "transparent", color: "#94a3b8", border: "none", borderRadius: 7, fontSize: 11, cursor: "pointer" }}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 57px)", overflow: "hidden" }}>
        {/* Left panel */}
        <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid #e2e8f0", background: "#fff", overflowY: "auto", padding: "20px" }}>
          {!editing ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{contact.contact_name || "Unknown Person"}</h2>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#304674", marginBottom: 4 }}>{contact.role}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>{contact.company}</div>

                {contact.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginBottom: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <a href={"mailto:" + contact.email} style={{ color: "#304674", textDecoration: "none" }}>{contact.email}</a>
                  </div>
                )}
                {contact.linkedin_url && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginBottom: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                    <a href={contact.linkedin_url.startsWith("http") ? contact.linkedin_url : "https://" + contact.linkedin_url} target="_blank" rel="noreferrer" style={{ color: "#304674", textDecoration: "none" }}>LinkedIn Profile</a>
                  </div>
                )}
                {contact.website && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginBottom: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    <a href={contact.website.startsWith("http") ? contact.website : "https://" + contact.website} target="_blank" rel="noreferrer" style={{ color: "#304674", textDecoration: "none" }}>{contact.website.replace(/^https?:\/\//, "")}</a>
                  </div>
                )}
              </div>

              {contact.bio && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>About</div>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>{contact.bio}</p>
                </div>
              )}

              {tags.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Tags</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {tags.map(t => (
                      <span key={t} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#d8e1e8", color: "#304674", fontWeight: 500 }}>{t.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Why Apply</div>
                <textarea defaultValue={contact.why_apply || ""} onBlur={e => updateField("why_apply", e.target.value)}
                  placeholder="Why are you interested in this role/company?"
                  rows={4} style={{ ...inp(), resize: "vertical" as any, lineHeight: 1.5 }} />
              </div>

              {/* Private Notes */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Private Notes</div>
                  <button onClick={saveNotes} disabled={savingNotes}
                    style={{ fontSize: 11, padding: "2px 8px", background: notesSaved ? "#dcfce7" : "#f1f5f9", color: notesSaved ? "#15803d" : "#64748b", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 500 }}>
                    {notesSaved ? "Saved!" : savingNotes ? "Saving..." : "Save"}
                  </button>
                </div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any private notes about this application..."
                  rows={5} style={{ ...inp(), resize: "vertical" as any, lineHeight: 1.5 }} />
              </div>
            </>
          ) : (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Edit Contact</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Company *", key: "company", placeholder: "Google" },
                  { label: "Role *", key: "role", placeholder: "SWE Intern" },
                  { label: "Contact Name", key: "contact_name", placeholder: "Jane Smith" },
                  { label: "Email", key: "email", placeholder: "jane@company.com" },
                  { label: "LinkedIn", key: "linkedin_url", placeholder: "linkedin.com/in/..." },
                  { label: "Website", key: "website", placeholder: "company.com" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{label}</label>
                    <input value={(editForm as any)[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inp()} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Bio / Notes</label>
                  <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={4} style={{ ...inp(), resize: "vertical" as any }} />
                </div>
                <button onClick={saveEdit} disabled={savingEdit}
                  style={{ padding: "9px 16px", background: "#304674", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#f8fafc" }}>
          {/* Email generator card */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Generated Cold Email</h3>

            {/* Tone */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginRight: 4 }}>Tone</span>
              {(["formal", "casual", "enthusiastic"] as Tone[]).map(t => {
                const tc = toneColors[t]; const active = tone === t
                return (
                  <button key={t} onClick={() => setTone(t)}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid " + (active ? tc.border : "#e2e8f0"), background: active ? tc.bg : "#fff", color: active ? tc.color : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                    {t}
                  </button>
                )
              })}
            </div>

            {/* Contact email — found via lookup or entered manually */}
            <div style={{ marginBottom: 14, padding: "10px 12px", background: "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 8 }}>
              {contact.email ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Sending to: <a href={"mailto:" + contact.email} style={{ color: "#304674", textDecoration: "none", fontWeight: 600 }}>{contact.email}</a>
                  </div>
                  <button onClick={lookupContactEmail} disabled={emailLookup.status === "loading"}
                    style={{ padding: "3px 10px", fontSize: 11, color: "#64748b", background: "transparent", border: "1px solid #e2e8f0", borderRadius: 4, cursor: "pointer" }}>
                    {emailLookup.status === "loading" ? "Searching…" : "Find again"}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {contact.contact_name || "Contact"}'s Email Address
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={e => setManualEmail(e.target.value)}
                      placeholder={
                        emailLookup.status === "loading"
                          ? "Looking up email…"
                          : emailLookup.status === "found"
                            ? emailLookup.email
                            : "Enter " + (contact.contact_name || "the contact") + "'s email address"
                      }
                      style={{ flex: 1, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#0f172a", outline: "none", background: "#fff" }}
                    />
                    <button onClick={saveManualEmail} disabled={savingEmail || !manualEmail.trim()}
                      style={{ padding: "7px 12px", background: emailSaved ? "#22c55e" : "#304674", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: savingEmail || !manualEmail.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap", opacity: !manualEmail.trim() ? 0.5 : 1 }}>
                      {savingEmail ? "Saving..." : emailSaved ? "Saved ✓" : "Save Email"}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                    {manualEmail.trim() ? (
                      "This email will be pre-filled when you open Gmail. Click Save Email to keep it."
                    ) : emailLookup.status === "loading" ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                        Searching the web for {contact.contact_name}'s email…
                      </span>
                    ) : emailLookup.status === "found" ? (
                      <span>
                        Found <strong style={{ color: "#0f172a" }}>{emailLookup.email}</strong>
                        {typeof emailLookup.confidence === "number" && (
                          <span style={{ color: emailLookup.confidence >= 75 ? "#16a34a" : emailLookup.confidence >= 55 ? "#b45309" : "#dc2626" }}> · {Math.round(emailLookup.confidence)}% confidence</span>
                        )}
                        {emailLookup.source && <span> · via {emailLookup.source.replace(/[+_]/g, " ")}</span>}
                        {typeof emailLookup.confidence === "number" && emailLookup.confidence < 75 && (
                          <span style={{ color: "#b45309" }}> — double-check before sending</span>
                        )}
                        {" "}
                        <button onClick={() => useFoundEmail(emailLookup.email!)}
                          style={{ marginLeft: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#304674", background: "#eef2f7", border: "1px solid #c6d3e3", borderRadius: 4, cursor: "pointer" }}>
                          Use this
                        </button>
                      </span>
                    ) : emailLookup.status === "not_found" ? (
                      <span>
                        Couldn't find a verified email — type it in above, or{" "}
                        <button onClick={lookupContactEmail} style={{ padding: "2px 8px", fontSize: 11, color: "#304674", background: "transparent", border: "1px solid #c6d3e3", borderRadius: 4, cursor: "pointer" }}>
                          Retry search
                        </button>
                      </span>
                    ) : emailLookup.status === "error" ? (
                      <span>
                        {emailLookup.error}{" "}
                        <button onClick={lookupContactEmail} style={{ padding: "2px 8px", fontSize: 11, color: "#304674", background: "transparent", border: "1px solid #c6d3e3", borderRadius: 4, cursor: "pointer" }}>
                          Retry
                        </button>
                      </span>
                    ) : (
                      <button onClick={lookupContactEmail}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#304674", background: "#eef2f7", border: "1px solid #c6d3e3", borderRadius: 6, cursor: "pointer" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        Find it for me
                      </button>
                    )}
                  </div>
                  {!manualEmail.trim() && emailLookup.alternatives && emailLookup.alternatives.length > 0 && (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                      Other candidates:{" "}
                      {emailLookup.alternatives.map((alt, i) => (
                        <span key={alt}>
                          {i > 0 && ", "}
                          <button onClick={() => useFoundEmail(alt)}
                            style={{ padding: "1px 6px", fontSize: 11, color: "#304674", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 4, cursor: "pointer" }}>
                            {alt}
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subject */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Email Subject</label>
              </div>
              <input value={subject} onChange={e => setSubject(e.target.value.slice(0, MAX_SUBJECT))}
                placeholder="Subject line will appear here..."
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", background: subject ? "#fff" : "#f8fafc", outline: "none", boxSizing: "border-box", fontWeight: 600 }} />
            </div>

            {/* Body */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Email Body</label>
              </div>
              <textarea value={body} onChange={e => setBody(e.target.value.slice(0, MAX_BODY))} rows={13}
                placeholder="Email body will appear here after generation..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", background: body ? "#fff" : "#f8fafc", outline: "none", boxSizing: "border-box", resize: "vertical" as any, lineHeight: 1.6, fontFamily: "inherit" }} />
            </div>

            {genError && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14 }}>
                {genError}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={generateEmail} disabled={generating}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: generating ? "#b2cbde" : "#304674", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer" }}>
                {generating ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>Generating...</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Generate Email</>
                )}
              </button>
              <button onClick={openGmail} disabled={!subject && !body}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: gmailCopied ? "#dcfce7" : "#fff", color: gmailCopied ? "#15803d" : "#374151", border: `1px solid ${gmailCopied ? "#86efac" : "#e2e8f0"}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !subject && !body ? 0.4 : 1, transition: "all 0.2s" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {gmailCopied ? "Body copied  paste in Gmail!" : "Open in Gmail"}
              </button>
              <button onClick={copyEmail} disabled={!subject && !body}
                style={{ padding: "9px 16px", background: copied ? "#dcfce7" : "#f1f5f9", color: copied ? "#15803d" : "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !subject && !body ? 0.4 : 1 }}>
                {copied ? "Copied!" : "Copy"}
              </button>
              <button onClick={saveDraft} disabled={saving || (!subject && !body)}
                style={{ padding: "9px 16px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: (!subject && !body) ? 0.4 : 1 }}>
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button onClick={generateFollowUp} disabled={generating || (!subject && !body)}
                style={{ padding: "9px 16px", background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !subject && !body ? 0.4 : 1 }}>
                Follow-Up
              </button>
            </div>
          </div>

          {/* Saved emails */}
          {emails.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 14px" }}>Saved Drafts ({emails.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {emails.map(e => {
                  const sc = statusColors[e.status] || statusColors.draft
                  return (
                    <div key={e.id} onClick={() => loadEmail(e)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: 8, cursor: "pointer", border: "1px solid #e2e8f0" }}
                      onMouseEnter={el => (el.currentTarget.style.borderColor = "#304674")}
                      onMouseLeave={el => (el.currentTarget.style.borderColor = "#e2e8f0")}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{e.subject || "(no subject)"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(e.created_at).toLocaleDateString()} · {e.tone}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: sc.bg, color: sc.color, fontWeight: 600 }}>{e.status}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
