"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type Mode = "company" | "field" | "specific"
type Step = "config" | "loading" | "done"

const TECH_ROLES = [
  "Software Engineer", "Software Engineering Intern",
  "Data Scientist", "Data Science Intern",
  "Product Manager", "Product Manager Intern",
  "Machine Learning Engineer", "ML Research Intern",
  "Frontend Engineer", "Backend Engineer",
  "DevOps Engineer", "Research Engineer",
  "UX Designer", "UX Design Intern",
  "Data Analyst", "Quant Analyst",
]

const POPULAR_FIELDS = [
  "Machine Learning", "Data Science", "Software Engineering",
  "Web Development", "Mobile Development", "DevOps / Cloud",
  "Computer Vision", "Natural Language Processing",
  "Cybersecurity", "Systems Engineering",
  "Quantitative Finance", "Robotics",
  "Bioinformatics", "Research Engineering",
]

const POPULAR_COMPANIES = [
  "Google", "Meta", "Apple", "Microsoft", "Amazon",
  "OpenAI", "Anthropic", "Stripe", "Coinbase", "Figma",
  "Netflix", "Uber", "Airbnb", "Nvidia", "Salesforce",
  "Bloomberg", "Two Sigma", "Jane Street", "Citadel", "SpaceX",
]

interface Props {
  onClose: () => void
}

export default function FindInternshipContactsModal({ onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>("company")
  const [step, setStep] = useState<Step>("config")

  // Company mode
  const [company, setCompany] = useState("")
  const [companyRole, setCompanyRole] = useState("")

  // Field mode
  const [field, setField] = useState("")
  const [fieldRole, setFieldRole] = useState("")

  // Specific person mode
  const [specName, setSpecName] = useState("")
  const [specCompany, setSpecCompany] = useState("")
  const [specRole, setSpecRole] = useState("")
  const [specEmail, setSpecEmail] = useState("")
  const [specLinkedin, setSpecLinkedin] = useState("")
  const [specWebsite, setSpecWebsite] = useState("")
  const [specBio, setSpecBio] = useState("")
  const [addingSpec, setAddingSpec] = useState(false)
  const [specDone, setSpecDone] = useState(false)

  // Count & token
  const [count, setCount] = useState(5)
  const [githubToken, setGithubToken] = useState("")
  const [showToken, setShowToken] = useState(false)

  // Progress
  const [progress, setProgress] = useState({ found: 0, total: 0, current: "" })
  const [suggestion, setSuggestion] = useState("")
  const [error, setError] = useState("")

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  }

  async function handleFind() {
    if (mode === "company" && !company.trim()) {
      setError("Enter a company name to search.")
      return
    }
    if (mode === "field" && !field.trim() && !fieldRole.trim()) {
      setError("Enter a field or role to search.")
      return
    }
    setError("")
    setStep("loading")
    setSuggestion("")
    setProgress({ found: 0, total: count, current: "Connecting to GitHub..." })

    try {
      const res = await fetch("/api/internships/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          company: mode === "company" ? company : "",
          field: mode === "field" ? field : "",
          role: mode === "company" ? companyRole : fieldRole,
          count,
          githubToken: githubToken.trim() || undefined,
        }),
      })

      if (!res.ok || !res.body) {
        setError("Search failed. Please try again.")
        setStep("config")
        return
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop() || ""
        for (const line of lines) {
          if (!line.startsWith("data:")) continue
          try {
            const ev = JSON.parse(line.slice(5).trim())
            if (ev.type === "progress") {
              setProgress({ found: ev.found, total: ev.total, current: ev.current })
            } else if (ev.type === "done") {
              setProgress(p => ({ ...p, found: ev.found }))
              if (ev.suggestion) setSuggestion(ev.suggestion)
              setStep("done")
              router.refresh()
            } else if (ev.type === "error") {
              setError(ev.message)
              setStep("config")
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e: any) {
      setError(e.message || "Network error. Please try again.")
      setStep("config")
    }
  }

  async function handleAddSpecific(e: React.FormEvent) {
    e.preventDefault()
    if (!specName.trim() || !specCompany.trim() || !specRole.trim()) return
    setAddingSpec(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAddingSpec(false); return }

    await supabase.from("internship_contacts").insert({
      user_id: user.id,
      company: specCompany.trim(),
      contact_name: specName.trim(),
      role: specRole.trim(),
      email: specEmail.trim() || null,
      linkedin_url: specLinkedin.trim() || null,
      website: specWebsite.trim() || null,
      bio: specBio.trim() || null,
      status: "unsorted",
      email_status: "not_emailed",
    })

    await supabase.from("activities").insert({
      user_id: user.id,
      type: "contact_added",
      category: "internship",
      researcher_name: specName.trim(),
      university: specCompany.trim(),
      description: `Added specific contact: ${specRole.trim()} at ${specCompany.trim()}`,
    })

    setAddingSpec(false)
    setSpecDone(true)
    router.refresh()
  }

  const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 13,
    color: "#0f172a",
    background: "#f8fafc",
    outline: "none",
    boxSizing: "border-box",
    ...extra,
  })

  const modeTab = (m: Mode, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => { setMode(m); setError("") }}
      style={{
        flex: 1,
        padding: "10px 8px",
        background: mode === m ? "#3b82f6" : "#f8fafc",
        color: mode === m ? "#fff" : "#475569",
        border: `1.5px solid ${mode === m ? "#3b82f6" : "#e2e8f0"}`,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "all 0.15s",
      }}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9",
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Find Internship Contacts
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
              Discover real professionals on GitHub to cold email
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#94a3b8", fontSize: 22, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        <div style={{ padding: "20px 24px" }}>

          {/* ── CONFIG STEP ─────────────────────────────────────── */}
          {step === "config" && (
            <>
              {/* Mode selector */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  Search Mode
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {modeTab("company", "By Company", (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  ))}
                  {modeTab("field", "By Field / Major", (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  ))}
                  {modeTab("specific", "Specific Person", (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  ))}
                </div>
              </div>

              {/* ── BY COMPANY ── */}
              {mode === "company" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                      Company Name *
                    </label>
                    <input
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. Google, Stripe, Anthropic"
                      style={inp()}
                    />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                      {POPULAR_COMPANIES.map(c => (
                        <button
                          key={c}
                          onClick={() => setCompany(c)}
                          style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                            border: `1px solid ${company === c ? "#3b82f6" : "#e2e8f0"}`,
                            background: company === c ? "#eff6ff" : "#f8fafc",
                            color: company === c ? "#1d4ed8" : "#475569",
                            cursor: "pointer",
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                      Filter by Role Type <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
                    </label>
                    <select
                      value={companyRole}
                      onChange={e => setCompanyRole(e.target.value)}
                      style={{ ...inp(), background: "#fff" }}
                    >
                      <option value="">Any role</option>
                      {TECH_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* ── BY FIELD ── */}
              {mode === "field" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                      Field / Major *
                    </label>
                    <input
                      value={field}
                      onChange={e => setField(e.target.value)}
                      placeholder="e.g. Machine Learning, Data Science, Robotics"
                      style={inp()}
                    />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                      {POPULAR_FIELDS.map(f => (
                        <button
                          key={f}
                          onClick={() => setField(f)}
                          style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                            border: `1px solid ${field === f ? "#3b82f6" : "#e2e8f0"}`,
                            background: field === f ? "#eff6ff" : "#f8fafc",
                            color: field === f ? "#1d4ed8" : "#475569",
                            cursor: "pointer",
                          }}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                      Role Title <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional – narrows the search)</span>
                    </label>
                    <input
                      value={fieldRole}
                      onChange={e => setFieldRole(e.target.value)}
                      placeholder="e.g. Research Engineer, ML Engineer"
                      style={inp()}
                    />
                  </div>
                </div>
              )}

              {/* ── SPECIFIC PERSON ── */}
              {mode === "specific" && !specDone && (
                <form onSubmit={handleAddSpecific}>
                  <div style={{
                    background: "#eff6ff", borderRadius: 10, padding: "10px 14px",
                    marginBottom: 16, fontSize: 12, color: "#1d4ed8", lineHeight: 1.5,
                    border: "1px solid #bfdbfe",
                  }}>
                    Add a specific person you already know about. Your Gemini API key (from Settings) will generate a fully personalized email for them.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Full Name *</label>
                        <input required value={specName} onChange={e => setSpecName(e.target.value)} placeholder="Jane Smith" style={inp()} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Company *</label>
                        <input required value={specCompany} onChange={e => setSpecCompany(e.target.value)} placeholder="Google" style={inp()} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Role / Title *</label>
                      <input required value={specRole} onChange={e => setSpecRole(e.target.value)} placeholder="Senior Software Engineer" style={inp()} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Email</label>
                        <input type="email" value={specEmail} onChange={e => setSpecEmail(e.target.value)} placeholder="jane@google.com" style={inp()} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>LinkedIn URL</label>
                        <input value={specLinkedin} onChange={e => setSpecLinkedin(e.target.value)} placeholder="linkedin.com/in/..." style={inp()} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Website / Portfolio</label>
                      <input value={specWebsite} onChange={e => setSpecWebsite(e.target.value)} placeholder="janesmit.dev" style={inp()} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                        About Them <span style={{ fontWeight: 400, color: "#94a3b8" }}>(bio, projects, background — helps AI personalize)</span>
                      </label>
                      <textarea
                        value={specBio}
                        onChange={e => setSpecBio(e.target.value)}
                        placeholder="e.g. Works on ML infrastructure at Google, ex-DeepMind, open-source contributor to PyTorch..."
                        rows={3}
                        style={{ ...inp(), resize: "vertical" as any, lineHeight: 1.5 }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingSpec || !specName.trim() || !specCompany.trim() || !specRole.trim()}
                      style={{
                        padding: "10px 20px", background: addingSpec ? "#93c5fd" : "#3b82f6",
                        color: "#fff", border: "none", borderRadius: 8, fontSize: 13,
                        fontWeight: 600, cursor: addingSpec ? "not-allowed" : "pointer",
                        width: "100%",
                      }}
                    >
                      {addingSpec ? "Adding..." : "Add Contact"}
                    </button>
                  </div>
                </form>
              )}

              {specDone && mode === "specific" && (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", background: "#dcfce7",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 14px",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                    Contact Added!
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                    Open their profile to generate a personalized email with your Gemini key.
                  </div>
                  <button onClick={onClose}
                    style={{ padding: "9px 24px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Go to Contacts
                  </button>
                </div>
              )}

              {/* Count + token (only for company/field modes) */}
              {mode !== "specific" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                        How many contacts
                      </label>
                      <select
                        value={count}
                        onChange={e => setCount(Number(e.target.value))}
                        style={{ ...inp(), background: "#fff" }}
                      >
                        {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} contacts</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                        GitHub Token <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional, 5k req/hr)</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showToken ? "text" : "password"}
                          value={githubToken}
                          onChange={e => setGithubToken(e.target.value)}
                          placeholder="ghp_... (optional)"
                          style={{ ...inp(), paddingRight: 36 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(s => !s)}
                          style={{
                            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2,
                          }}
                        >
                          {showToken
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          }
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: "#f8fafc", borderRadius: 8, padding: "10px 12px",
                    marginTop: 12, fontSize: 11, color: "#64748b", lineHeight: 1.6,
                    border: "1px solid #e2e8f0",
                  }}>
                    Uses the free GitHub API (60 req/hr unauthenticated). For more results, create a free GitHub token at github.com/settings/tokens — no special scopes needed.
                  </div>

                  {error && (
                    <div style={{
                      background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8,
                      padding: "10px 14px", fontSize: 13, color: "#dc2626", marginTop: 12,
                    }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button onClick={onClose}
                      style={{ flex: 1, padding: "10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#475569" }}>
                      Cancel
                    </button>
                    <button
                      onClick={handleFind}
                      disabled={
                        (mode === "company" && !company.trim()) ||
                        (mode === "field" && !field.trim() && !fieldRole.trim())
                      }
                      style={{
                        flex: 2, padding: "10px 20px",
                        background: "#3b82f6", color: "#fff", border: "none",
                        borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        opacity: (
                          (mode === "company" && !company.trim()) ||
                          (mode === "field" && !field.trim() && !fieldRole.trim())
                        ) ? 0.5 : 1,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      Find Contacts
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── LOADING STEP ────────────────────────────────────── */}
          {step === "loading" && (
            <div style={{ padding: "20px 0" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  border: "3px solid #e2e8f0", borderTopColor: "#3b82f6",
                  margin: "0 auto 14px",
                  animation: "spin 0.8s linear infinite",
                }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                  Searching GitHub...
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {progress.current || "Looking up profiles..."}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: "#f1f5f9", borderRadius: 99, height: 6, marginBottom: 12, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                  width: progress.total > 0 ? `${Math.round((progress.found / progress.total) * 100)}%` : "20%",
                  transition: "width 0.4s ease",
                }} />
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                {progress.found} of {progress.total} contacts added
              </div>
            </div>
          )}

          {/* ── DONE STEP ───────────────────────────────────────── */}
          {step === "done" && (
            <div style={{ padding: "12px 0", textAlign: "center" }}>
              {progress.found > 0 ? (
                <>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%", background: "#dcfce7",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                    {progress.found} Contact{progress.found !== 1 ? "s" : ""} Added!
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
                    Found via GitHub {mode === "company" ? `at ${company}` : `in ${field || fieldRole}`}.
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 24, lineHeight: 1.5 }}>
                    Open any contact to generate a personalized cold email using your API key.
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%", background: "#fef9c3",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>No Results Found</div>
                  {suggestion && (
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>{suggestion}</div>
                  )}
                </>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  onClick={() => { setStep("config"); setSuggestion(""); setProgress({ found: 0, total: 0, current: "" }) }}
                  style={{ padding: "9px 20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#475569" }}
                >
                  Search Again
                </button>
                <button onClick={onClose}
                  style={{ padding: "9px 24px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {progress.found > 0 ? "View Contacts" : "Close"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
