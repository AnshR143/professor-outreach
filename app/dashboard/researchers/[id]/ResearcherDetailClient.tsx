"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Researcher, Paper, Email, Template, Profile } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"
import { truncate } from "@/lib/utils"

const FIELD_COLORS: Record<string, { bg: string; text: string }> = {
  "AI": { bg: "#dbeafe", text: "#1d4ed8" },
  "Artificial Intelligence": { bg: "#dbeafe", text: "#1d4ed8" },
  "Finance": { bg: "#dcfce7", text: "#15803d" },
  "Quantitative Finance": { bg: "#d1fae5", text: "#047857" },
  "Mathematics": { bg: "#fce7f3", text: "#be185d" },
  "Statistics": { bg: "#fce7f3", text: "#be185d" },
  "Machine Learning": { bg: "#e0e7ff", text: "#4338ca" },
  "default": { bg: "#f1f5f9", text: "#475569" },
}

interface Props {
  researcher: Researcher
  papers: Paper[]
  emails: Email[]
  templates: Template[]
  profile: Profile | null
  position: { current: number; total: number; prevId: string | null; nextId: string | null }
}

export default function ResearcherDetailClient({ researcher, papers, emails: initialEmails, templates, profile, position }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [emails, setEmails] = useState(initialEmails)
  const [emailSubject, setEmailSubject] = useState(emails[0]?.subject || "")
  const [emailBody, setEmailBody] = useState(emails[0]?.body || "")
  const [tone, setTone] = useState<"formal" | "casual" | "enthusiastic">(emails[0]?.tone as any || "formal")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [notes, setNotes] = useState(researcher.notes || "")
  const [savingNotes, setSavingNotes] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpEmail, setFollowUpEmail] = useState<{ subject: string; body: string } | null>(null)
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null)
  const [emailError, setEmailError] = useState("")
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailValidationError, setEmailValidationError] = useState("")
  const [papersList, setPapersList] = useState(papers)
  const [fetchingPapers, setFetchingPapers] = useState(false)

  // Professor contact email
  const [professorEmail, setProfessorEmail] = useState<string>(
    (researcher.profile_links as Record<string, string>)?.["Email"] || ""
  )
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailAddressSaved, setEmailAddressSaved] = useState(false)

  function guessEmail(name: string, university: string): string {
    const parts = name.toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/)
    const first = parts[0] || ""
    const last = parts[parts.length - 1] || ""
    const uLow = university.toLowerCase()
    const domainMap: Record<string, string> = {
      "mit": "mit.edu", "harvard": "harvard.edu", "stanford": "stanford.edu",
      "princeton": "princeton.edu", "yale": "yale.edu", "columbia": "columbia.edu",
      "cornell": "cornell.edu", "duke": "duke.edu", "caltech": "caltech.edu",
      "berkeley": "berkeley.edu", "ucla": "ucla.edu", "michigan": "umich.edu",
      "carnegie mellon": "cmu.edu", "cmu": "cmu.edu", "nyu": "nyu.edu",
      "northwestern": "northwestern.edu", "johns hopkins": "jhu.edu",
      "upenn": "upenn.edu", "penn": "upenn.edu", "chicago": "uchicago.edu",
      "uiuc": "illinois.edu", "illinois": "illinois.edu", "purdue": "purdue.edu",
      "georgia tech": "gatech.edu", "gatech": "gatech.edu", "unc": "unc.edu",
      "ut austin": "utexas.edu", "texas": "utexas.edu", "usc": "usc.edu",
      "umass": "umass.edu", "ucsd": "ucsd.edu", "ucsb": "ucsb.edu",
      "oxford": "ox.ac.uk", "cambridge": "cam.ac.uk", "toronto": "utoronto.ca",
      "mcgill": "mcgill.ca", "waterloo": "uwaterloo.ca",
    }
    let domain = ""
    for (const [key, d] of Object.entries(domainMap)) {
      if (uLow.includes(key)) { domain = d; break }
    }
    if (!domain) {
      const clean = uLow.replace(/university of\s+/i, "").replace(/\s+university$/i, "").replace(/\s+/g, "").slice(0, 8)
      domain = `${clean}.edu`
    }
    return `${first}.${last}@${domain}`
  }

  async function saveProfessorEmail() {
    if (!professorEmail.trim()) return
    setSavingEmail(true)
    const updatedLinks = { ...(researcher.profile_links as Record<string, string> || {}), Email: professorEmail.trim() }
    await supabase.from("researchers").update({ profile_links: updatedLinks }).eq("id", researcher.id)
    setSavingEmail(false)
    setEmailAddressSaved(true)
    setTimeout(() => setEmailAddressSaved(false), 3000)
  }

  // Sync papersList when server sends fresh props (after router.refresh())
  useEffect(() => { setPapersList(papers) }, [papers])

  // Auto-fetch papers on load if none exist yet
  useEffect(() => {
    if (papers.length === 0) {
      setFetchingPapers(true)
      fetch(`/api/professors/papers?researcher_id=${researcher.id}`, { method: "POST" })
        .then(r => r.json())
        .then(d => {
          if (d.count > 0) router.refresh()
        })
        .catch(() => {})
        .finally(() => setFetchingPapers(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateEmail() {
    setGenerating(true)
    setEmailError("")
    try {
      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          researcherId: researcher.id,
          tone,
          templateId: selectedTemplate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setEmailError(data.error || "Failed to generate email. Check your API key in Settings.")
      } else {
        if (data.subject) setEmailSubject(data.subject)
        if (data.body) setEmailBody(data.body)
      }
    } catch (e: any) {
      setEmailError("Failed to generate email: " + (e.message || "Unknown error"))
    }
    setGenerating(false)
  }

  async function saveEmail() {
    setSaving(true)
    setEmailSaved(false)
    const existing = emails[0]
    if (existing) {
      const { data } = await supabase.from("emails").update({ subject: emailSubject, body: emailBody, tone }).eq("id", existing.id).select().single()
      if (data) setEmails([data, ...emails.slice(1)])
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from("emails").insert({ user_id: user!.id, researcher_id: researcher.id, subject: emailSubject, body: emailBody, tone, status: "draft" }).select().single()
      if (data) setEmails([data])
    }
    setSaving(false)
    setEmailSaved(true)
    setTimeout(() => setEmailSaved(false), 3000)
  }

  async function sendEmail() {
    if (!emailSubject || !emailBody) { setEmailValidationError("Please generate or write an email first."); return }
    setEmailValidationError("")
    setSending(true)
    const toEmail = professorEmail.trim() || guessEmail(researcher.name, researcher.university)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.open(gmailUrl, "_blank")

    // Mark as sent
    const supabaseClient = createClient()
    const existing = emails[0]
    if (existing) {
      await supabaseClient.from("emails").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", existing.id)
    } else {
      const { data: { user } } = await supabaseClient.auth.getUser()
      await supabaseClient.from("emails").insert({ user_id: user!.id, researcher_id: researcher.id, subject: emailSubject, body: emailBody, tone, status: "sent", sent_at: new Date().toISOString() })
    }

    await supabaseClient.from("researchers").update({ email_status: "emailed", status: "awaiting" }).eq("id", researcher.id)
    await supabaseClient.from("activities").insert({ user_id: (await supabaseClient.auth.getUser()).data.user!.id, type: "email_sent", researcher_id: researcher.id, researcher_name: researcher.name, university: researcher.university, description: "Research collaboration inquiry sent" })

    setSending(false)
    router.refresh()
  }

  async function generateFollowUp() {
    setShowFollowUp(true)
    const res = await fetch("/api/email/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ researcherId: researcher.id, originalBody: emailBody, daysSince: 7 }),
    })
    const data = await res.json()
    if (data.subject) setFollowUpEmail(data)
  }

  async function saveNotes() {
    setSavingNotes(true)
    await supabase.from("researchers").update({ notes }).eq("id", researcher.id)
    setSavingNotes(false)
  }

  const fc = (area: string) => FIELD_COLORS[area] || FIELD_COLORS.default

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <Link href="/dashboard/researchers" style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </Link>
        <div style={{ fontSize: 13, color: "#64748b" }}>Researcher {position.current} of {position.total}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={position.prevId ? `/dashboard/researchers/${position.prevId}` : "#"}
            style={{ padding: "6px 14px", background: position.prevId ? "#f1f5f9" : "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: position.prevId ? "pointer" : "not-allowed", color: position.prevId ? "#475569" : "#cbd5e1", textDecoration: "none" }}>
            ← Previous
          </Link>
          <Link href={position.nextId ? `/dashboard/researchers/${position.nextId}` : "#"}
            style={{ padding: "6px 14px", background: position.nextId ? "#f1f5f9" : "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: position.nextId ? "pointer" : "not-allowed", color: position.nextId ? "#475569" : "#cbd5e1", textDecoration: "none" }}>
            Next →
          </Link>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Profile Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>{researcher.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                {researcher.university}
              </div>
            </div>
          </div>
          {researcher.bio && <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, maxWidth: 800 }}>{researcher.bio}</p>}
          {researcher.why_match && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 13, color: "#15803d" }}>
               <strong>Why you match:</strong> {researcher.why_match}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>Research Tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {researcher.research_areas.map(area => {
                const c = fc(area)
                return <span key={area} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 12, background: c.bg, color: c.text, fontWeight: 500 }}>{area}</span>
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Papers */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Relevant Papers
              </h3>
              <button onClick={async () => {
                setFetchingPapers(true)
                const res = await fetch(`/api/professors/papers?researcher_id=${researcher.id}`, { method: "POST" })
                if (res.ok) router.refresh()
                setFetchingPapers(false)
              }} disabled={fetchingPapers} style={{ fontSize: 12, color: "#3b82f6", background: "none", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", cursor: fetchingPapers ? "not-allowed" : "pointer", opacity: fetchingPapers ? 0.6 : 1 }}>
                {fetchingPapers ? "Fetching..." : "Refresh Papers"}
              </button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {fetchingPapers && papersList.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>
                  <div style={{ width: 28, height: 28, border: "3px solid #f1f5f9", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  Looking up papers...
                </div>
              ) : papersList.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>No papers found. Click Refresh Papers to try again.</div>
              ) : papersList.map(p => (
                <div key={p.id} style={{ paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4, lineHeight: 1.4 }}>{p.title}</div>
                  {p.abstract && (
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                        {expandedPaper === p.id ? p.abstract : truncate(p.abstract, 120)}
                      </div>
                      {p.abstract.length > 120 && (
                        <button onClick={() => setExpandedPaper(expandedPaper === p.id ? null : p.id)}
                          style={{ fontSize: 11, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2 }}>
                          {expandedPaper === p.id ? "↑ Read Less" : "↓ Read More"}
                        </button>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                    {p.published_date && `Recent paper from ${p.published_date}`}
                  </div>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#3b82f6", textDecoration: "none", marginTop: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      View Paper
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Email Generator */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Generated Cold Email
              </h3>
            </div>
            <div style={{ padding: 20 }}>
              {/* Controls */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Tone</div>
                  <select value={tone} onChange={e => setTone(e.target.value as any)}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#0f172a", background: "#f8f9fb" }}>
                    <option value="formal">Formal</option>
                    <option value="casual">Casual</option>
                    <option value="enthusiastic">Enthusiastic</option>
                  </select>
                </div>
                <div style={{ flex: 2, minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Template</div>
                  <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#0f172a", background: "#f8f9fb" }}>
                    <option value="">AI-generated (no template)</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Professor Email Address */}
              <div style={{ marginBottom: 14, padding: "12px 14px", background: "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Professor's Email Address
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={professorEmail}
                    onChange={e => setProfessorEmail(e.target.value)}
                    placeholder={guessEmail(researcher.name, researcher.university)}
                    style={{ flex: 1, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#0f172a", outline: "none", background: "#fff" }}
                  />
                  <button onClick={saveProfessorEmail} disabled={savingEmail}
                    style={{ padding: "7px 12px", background: emailAddressSaved ? "#22c55e" : "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: savingEmail ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                    {savingEmail ? "Saving..." : emailAddressSaved ? "Saved ✓" : "Save Email"}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>
                  {professorEmail
                    ? "This email will be pre-filled when you open Gmail."
                    : `Estimated: ${guessEmail(researcher.name, researcher.university)} — confirm or correct before sending.`}
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>Email Subject</span>
                  <span>{emailSubject.length}/120</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                    placeholder="Email subject line..."
                    style={{ flex: 1, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#0f172a", outline: "none" }} />
                  <button onClick={() => navigator.clipboard.writeText(emailSubject)} title="Copy" style={{ padding: "8px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8f9fb", cursor: "pointer", color: "#64748b" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>Email Body</span>
                  <span>{emailBody.length}/1000</span>
                </div>
                <div style={{ position: "relative" }}>
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)}
                    rows={10} placeholder="Generate an email or write your own..."
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#0f172a", lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
                  <button onClick={() => navigator.clipboard.writeText(emailBody)} title="Copy" style={{ position: "absolute", top: 8, right: 8, padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#64748b" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </div>
              </div>

              {/* Error / success feedback */}
              {emailError && (
                <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", color: "#dc2626", fontSize: 12, marginBottom: 10 }}>
                  {emailError}
                </div>
              )}
              {emailValidationError && (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 12px", color: "#2563eb", fontSize: 12, marginBottom: 10 }}>
                  {emailValidationError}
                </div>
              )}
              {emailSaved && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", color: "#15803d", fontSize: 12, marginBottom: 10 }}>
                  Email saved successfully.
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={generateEmail} disabled={generating}
                  style={{ flex: 1, padding: "9px 14px", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer" }}>
                  {generating ? "Generating..." : "Generate Email"}
                </button>
                <button onClick={sendEmail} disabled={sending}
                  style={{ flex: 1, padding: "9px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>
                  {sending ? "Opening..." : "Open in Gmail"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={saveEmail} disabled={saving}
                  style={{ flex: 1, padding: "9px 14px", background: saving ? "#f1f5f9" : emailSaved ? "#22c55e" : "#f1f5f9", color: emailSaved ? "#fff" : "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving..." : emailSaved ? "Saved ✓" : "Save Draft"}
                </button>
                <button onClick={generateFollowUp}
                  style={{ flex: 1, padding: "9px 14px", background: "#f8f9fb", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Follow-Up
                </button>
              </div>

              {/* Follow-up email display */}
              {showFollowUp && followUpEmail && (
                <div style={{ marginTop: 16, padding: "14px 16px", background: "#f8f9fb", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>Follow-Up Email</div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 4 }}><strong>Subject:</strong> {followUpEmail.subject}</div>
                  <div style={{ fontSize: 12, color: "#475569", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{followUpEmail.body}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={() => { setEmailSubject(followUpEmail.subject); setEmailBody(followUpEmail.body); setShowFollowUp(false) }}
                      style={{ padding: "7px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Use This Follow-Up
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(followUpEmail.body) }}
                      style={{ padding: "7px 12px", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Copy
                    </button>
                    <button onClick={() => setShowFollowUp(false)}
                      style={{ padding: "7px 12px", background: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
              {showFollowUp && !followUpEmail && (
                <div style={{ marginTop: 16, padding: "14px 16px", background: "#f8f9fb", borderRadius: 8, border: "1px solid #e2e8f0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  <div style={{ width: 20, height: 20, border: "2px solid #f1f5f9", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 6px" }} />
                  Generating follow-up...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Private Notes
            </h3>
            <button onClick={saveNotes} disabled={savingNotes}
              style={{ padding: "6px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: savingNotes ? "not-allowed" : "pointer", opacity: savingNotes ? 0.7 : 1 }}>
              {savingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>
          <div style={{ padding: 20 }}>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Add private notes about this researcher — research interests, conversation history, reminders..."
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Email History */}
        {emails.length > 1 && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Email History</h3>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {emails.slice(1).map((e, i) => (
                <div key={e.id} style={{ padding: "12px 14px", background: "#f8f9fb", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{e.subject || `Email ${emails.length - i - 1}`}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {e.sent_at ? new Date(e.sent_at).toLocaleDateString() : e.status}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{e.body?.slice(0, 200)}{(e.body?.length || 0) > 200 ? "..." : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
