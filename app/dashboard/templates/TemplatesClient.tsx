"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Template } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"
import FindResearchersModal from "@/components/researchers/FindResearchersModal"
import LiquidGlassButton from "@/components/ui/liquid-glass-button"

interface Props { templates: Template[]; userId: string; userName: string }

export default function TemplatesClient({ templates: initial, userId, userName }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [templates, setTemplates] = useState(initial)
  const [selected, setSelected] = useState<Template | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showFind, setShowFind] = useState(false)
  const [search, setSearch] = useState("")
  const [newTemplate, setNewTemplate] = useState({ name: "", subject_line: "", body: "", description: "" })
  const [saving, setSaving] = useState(false)

  const general = templates.filter(t => t.type === "general")
  const personal = templates.filter(t => t.type === "personal" && t.user_id === userId)
  const filtered = (list: Template[]) => list.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject_line.toLowerCase().includes(search.toLowerCase()) ||
    t.body.toLowerCase().includes(search.toLowerCase())
  )

  async function saveTemplate() {
    setSaving(true)
    const { data } = await supabase.from("templates").insert({ ...newTemplate, user_id: userId, type: "personal" }).select().single()
    if (data) { setTemplates([...templates, data]); setShowCreate(false); setNewTemplate({ name: "", subject_line: "", body: "", description: "" }) }
    setSaving(false)
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return
    await supabase.from("templates").delete().eq("id", id)
    setTemplates(templates.filter(t => t.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const TemplateCard = ({ t }: { t: Template }) => (
    <div onClick={() => setSelected(t)}
      style={{ background: selected?.id === t.id ? "#d8e1e8" : "#fff", borderRadius: 10, border: `1px solid ${selected?.id === t.id ? "#98bad5" : "#e2e8f0"}`, padding: 16, cursor: "pointer", transition: "all 0.15s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{t.name}</div>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: t.type === "general" ? "#c6d3e3" : "#f0fdf4", color: t.type === "general" ? "#304674" : "#16a34a", fontWeight: 500 }}>
          {t.type === "general" ? "General" : "Personal"}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Email Template</div>
      <div style={{ background: "#f8f9fb", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#94a3b8" }}>
         Template
      </div>
      <div style={{ marginTop: 8, padding: "6px 10px", background: selected?.id === t.id ? "#d8e1e8" : "#f8f9fb", borderRadius: 6, fontSize: 11, color: "#64748b", textAlign: "center", border: "1px solid #e2e8f0" }}>
        {selected?.id === t.id ? " Selected" : "Click to Preview"}
      </div>
    </div>
  )

  return (
    <div>
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Template Generation</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <LiquidGlassButton onClick={() => setShowFind(true)} variant="primary" size="md">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Find Researchers
          </LiquidGlassButton>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#304674", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{userName?.[0]?.toUpperCase() || "A"}</div>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 57px)" }}>
        {/* Main content */}
        <div style={{ flex: 1, overflow: "auto", padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Template Generation</h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Browse and preview email templates for your researcher outreach</p>
          </div>

          {/* Search */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>Search Templates</div>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates by name, subject, or content..."
                style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#f8f9fb", color: "#0f172a" }} />
            </div>
          </div>

          {/* General templates */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: "0 0 2px" }}>General Templates</h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Pre-built templates for common scenarios</p>
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered(general).length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {filtered(general).map(t => <TemplateCard key={t.id} t={t} />)}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 320, borderLeft: "1px solid #e2e8f0", background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Personal</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Your templates</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{personal.length}/10</span>
              <button onClick={() => setShowCreate(true)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "#304674", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                + Create Template
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
            {personal.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>No personal templates</div>
                <div style={{ fontSize: 12 }}>Create your first template</div>
              </div>
            ) : personal.map(t => (
              <div key={t.id} style={{ background: "#f8f9fb", borderRadius: 8, border: "1px solid #e2e8f0", padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4, flex: 1 }}>{t.name}</div>
                  <button onClick={() => deleteTemplate(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, padding: "0 0 0 8px" }}>�</button>
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{t.description}</div>
                <button onClick={() => setSelected(t)}
                  style={{ marginTop: 8, fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#475569" }}>Preview</button>
              </div>
            ))}
          </div>

          {/* Preview panel */}
          {selected && (
            <div style={{ borderTop: "1px solid #e2e8f0", padding: 16, maxHeight: "50%", overflow: "auto" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                ← Back to Templates
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{selected.name}</div>
              <div style={{ background: "#f8f9fb", borderRadius: 8, border: "1px solid #e2e8f0", padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>Subject:</div>
                <div style={{ fontSize: 12, color: "#0f172a", marginBottom: 10 }}>{selected.subject_line}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>Body:</div>
                <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-line" }}>{selected.body.slice(0, 300)}...</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ marginTop: 8, fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>Close preview</button>
            </div>
          )}
        </div>
      </div>

      {/* Create template modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 520, maxHeight: "90vh", overflow: "auto" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>Create Personal Template</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Template Name</label>
                <input value={newTemplate.name} onChange={e => setNewTemplate(n => ({ ...n, name: e.target.value }))} placeholder="e.g. My Cold Email"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Description</label>
                <input value={newTemplate.description} onChange={e => setNewTemplate(n => ({ ...n, description: e.target.value }))} placeholder="Short description"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Subject Line</label>
                <input value={newTemplate.subject_line} onChange={e => setNewTemplate(n => ({ ...n, subject_line: e.target.value }))} placeholder="Email subject"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email Body</label>
                <textarea value={newTemplate.body} onChange={e => setNewTemplate(n => ({ ...n, body: e.target.value }))} rows={8} placeholder="Dear Professor [Last Name],&#10;&#10;..."
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", lineHeight: 1.6 }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: 10, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={saveTemplate} disabled={saving || !newTemplate.name}
                  style={{ flex: 2, padding: 10, background: saving || !newTemplate.name ? "#98bad5" : "#304674", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showFind && <FindResearchersModal onClose={() => setShowFind(false)} />}
    </div>
  )
}

