"use client"
import { useState } from "react"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import type { InternshipContact } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"
import dynamic from "next/dynamic"
import LiquidGlassButton from "@/components/ui/liquid-glass-button"
import FindInternshipContactsModal from "@/components/internships/FindInternshipContactsModal"
import FloatingActionMenu from "@/components/ui/floating-action-menu"
import "maplibre-gl/dist/maplibre-gl.css"
import { Map, MapMarker, MarkerContent, MarkerTooltip } from "@/components/ui/map"
const MapDiscoverModal = dynamic(() => import("./MapDiscoverModal"), { ssr: false })

const EMAIL_STATUS_CYCLE = ["not_emailed", "emailed", "rejected", "accepted"] as const
type EmailStatus = typeof EMAIL_STATUS_CYCLE[number]

const STATUS_CONFIG: Record<EmailStatus, { label: string; bg: string; text: string; border: string }> = {
  not_emailed: { label: "Not Emailed", bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" },
  emailed:     { label: "Emailed",     bg: "#c6d3e3", text: "#304674", border: "#98bad5" },
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
  const [showFind, setShowFind] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [expandedBios, setExpandedBios] = useState<Set<string>>(new Set())

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
          {contacts.length > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8" }}> click any card to open full details</span>}
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
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <LiquidGlassButton 
                  onClick={() => setShowMap(true)} 
                  size="md"
                  style={{ background: "#0f172a", color: "#fff" }}
                >
                  Map Discovery
                </LiquidGlassButton>
                <LiquidGlassButton onClick={() => setShowFind(true)} variant="primary" size="md">
                  Find Contacts
                </LiquidGlassButton>
                <LiquidGlassButton onClick={() => setShowAdd(true)} variant="secondary" size="md" style={{ color: "#475569" }}>
                  Add Manually
                </LiquidGlassButton>
              </div>
            )}
          </div>
        )}

        {filtered.length > 0 && viewMode === "list" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(c => {
              const status = (emailStatuses[c.id] ?? c.email_status ?? "not_emailed") as EmailStatus
              const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_emailed
              return (
                <div key={c.id} style={{ position: "relative" }}>
                  <button
                    onClick={e => deleteContact(e, c.id)}
                    title="Remove contact"
                    style={{ position: "absolute", top: -8, right: -8, zIndex: 10, width: 28, height: 28, borderRadius: "50%", background: "#fff", border: "2.5px solid #304674", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#304674", boxShadow: "2px 2px 0px #304674", transition: "all 0.1s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626" }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#304674"; e.currentTarget.style.color = "#304674" }}
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                  <div
                    onClick={() => router.push("/dashboard/internships/" + c.id)}
                    style={{
                      background: "#fff", 
                      borderRadius: 14, 
                      border: "3px solid #304674", 
                      padding: "18px 20px", 
                      cursor: "pointer", 
                      transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)", 
                      boxShadow: "6px 6px 0px #98bad5", 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: 12, 
                      height: "100%", 
                      boxSizing: "border-box",
                      position: "relative"
                    }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.boxShadow = "10px 10px 0px #98bad5"; 
                      e.currentTarget.style.transform = "translate(-2px, -2px)";
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.boxShadow = "6px 6px 0px #98bad5"; 
                      e.currentTarget.style.transform = "translate(0, 0)";
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{c.contact_name || "Unknown Contact"}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#304674", marginTop: 2 }}>{c.role}</div>
                      {c.company && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{c.company}</div>}
                    </div>
                    {c.bio && (
                      <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5, background: "#f8fafc", borderRadius: 8, padding: "8px 10px", borderLeft: "3px solid #e2e8f0" }}>
                        {expandedBios.has(c.id) ? c.bio : c.bio.slice(0, 120) + (c.bio.length > 120 ? "…" : "")}
                        {c.bio.length > 120 && (
                          <button
                            onClick={e => { e.stopPropagation(); setExpandedBios(prev => { const next = new Set(prev); next.has(c.id) ? next.delete(c.id) : next.add(c.id); return next }) }}
                            style={{ marginLeft: 4, fontSize: 10, color: "#304674", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                          >
                            {expandedBios.has(c.id) ? "less" : "more"}
                          </button>
                        )}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid #f1f5f9", marginTop: "auto" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#304674", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                          View Details
                        </span>
                        {c.website && (
                          <a
                            href={c.website.startsWith("http") ? c.website : "https://" + c.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 10, color: "#64748b", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            Website
                          </a>
                        )}
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

        {viewMode === "map" && (
          <div style={{ height: "65vh", borderRadius: 16, overflow: "hidden", border: "2px solid #304674", boxShadow: "4px 4px 0px #304674" }}>
            <Map center={[-98.5795, 39.8283]} zoom={3} minZoom={2} maxZoom={18}>
              {filtered.map(c => {
                const match = c.notes?.match(/Coordinates:\s*(-?[\d.]+),\s*(-?[\d.]+)/);
                if (!match) return null;
                const lat = parseFloat(match[1]);
                const lon = parseFloat(match[2]);
                const status = (emailStatuses[c.id] ?? c.email_status ?? "not_emailed") as EmailStatus
                const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_emailed
                return (
                  <MapMarker key={c.id} longitude={lon} latitude={lat} onClick={() => router.push("/dashboard/internships/" + c.id)}>
                    <MarkerContent>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: cfg.bg, border: `2.5px solid ${cfg.border}`, boxShadow: "0 2px 6px rgba(0,0,0,0.18)", cursor: "pointer" }} />
                    </MarkerContent>
                    <MarkerTooltip>{c.company} · {cfg.label}</MarkerTooltip>
                  </MapMarker>
                )
              })}
            </Map>
          </div>
        )}
      </div>

      {/* ── Add Contact Modal ── */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, border: "4px solid #304674", padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "10px 10px 0px #98bad5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Add Internship Contact</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "#f1f5f9", border: "2px solid #304674", borderRadius: 8, cursor: "pointer", color: "#304674", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 0px #304674", transition: "all 0.1s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626" }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#304674"; e.currentTarget.style.color = "#304674" }}>
                <X size={18} strokeWidth={3} />
              </button>
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

      {/* ── Find Contacts Modal ── */}
      {showFind && (
        <FindInternshipContactsModal onClose={handleFindClose} />
      )}

      {/* ── Map Discovery Modal ── */}
      {showMap && (
        <MapDiscoverModal onClose={handleMapClose} />
      )}

      {/* ── Floating Action Menu ── */}
      <FloatingActionMenu
        actions={[
          {
            label: "Find Contacts",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            ),
            color: "#304674",
            onClick: () => setShowFind(true),
          },
          {
            label: viewMode === "list" ? "Map View" : "List View",
            icon: viewMode === "list" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 11l19-9-9 19-2-8-8-2z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            ),
            color: "#0f172a",
            onClick: () => setViewMode(v => v === "list" ? "map" : "list"),
          },
          {
            label: "Map Discovery",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            ),
            color: "#304674",
            onClick: () => setShowMap(true),
          },
        ]}
      />
    </div>
  )
}