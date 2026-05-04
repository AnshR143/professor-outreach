"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Profile } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"
import { ACADEMIC_LEVELS } from "@/lib/utils"

interface Props { profile: Profile | null; hasApiKey: boolean }

export default function SettingsClient({ profile: initial, hasApiKey: initialHasKey }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  // AI API key
  const [apiKey, setApiKey] = useState("")
  const [hasKey, setHasKey] = useState(initialHasKey)
  const [savingKey, setSavingKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)
  const [clearingKey, setClearingKey] = useState(false)


  const [form, setForm] = useState({
    name: initial?.name || "",
    institution: initial?.institution || "",
    academic_level: initial?.academic_level || "",
  })

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { error } = await supabase.from("profiles").upsert(
      { user_id: user.id, ...form, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
    router.refresh()
  }

  async function saveApiKey() {
    if (!apiKey.trim()) return
    setSavingKey(true)
    try {
      const res = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey.trim() }),
      })
      if (res.ok) {
        setHasKey(true)
        setApiKey("")
        setKeySaved(true)
        setTimeout(() => setKeySaved(false), 3000)
      }
    } catch {}
    setSavingKey(false)
  }

  async function clearApiKey() {
    setClearingKey(true)
    try {
      const res = await fetch("/api/settings/api-key", { method: "DELETE" })
      if (res.ok) { setHasKey(false); setApiKey("") }
    } catch {}
    setClearingKey(false)
  }


  async function handleReset() {
    if (!confirm("This will permanently delete all your researchers, emails, and activities. Are you sure?")) return
    setResetting(true)
    try {
      const res = await fetch("/api/admin/reset-data", { method: "POST" })
      if (res.ok) {
        setResetDone(true)
        setTimeout(() => setResetDone(false), 4000)
        router.refresh()
      }
    } catch {}
    setResetting(false)
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadStatus({ ok: false, msg: "Please upload a PDF file." })
      return
    }
    setUploading(true)
    setUploadStatus(null)
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/resume/parse", { method: "POST", body: fd })
      const data = await res.json()
      if (data.text) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from("profiles").upsert(
            { user_id: user.id, resume_text: data.text, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          )
        }
        setUploadStatus({ ok: true, msg: "Resume parsed — " + data.text.length + " characters extracted across " + data.pages + " page" + (data.pages !== 1 ? "s" : "") + ". AI will use this to personalize your emails." })
      } else {
        setUploadStatus({ ok: false, msg: data.error || "Failed to parse resume." })
      }
    } catch {
      setUploadStatus({ ok: false, msg: "Network error. Please try again." })
    }
    setUploading(false)
    e.target.value = ""
  }

  async function handleDeleteAccount() {
    if (!confirm("CRITICAL: This will permanently delete your account and all your data. This cannot be undone. Are you sure?")) return
    if (!confirm("Final check: Are you absolutely sure?")) return
    
    try {
      const res = await fetch("/api/settings/delete-account", { method: "DELETE" })
      if (res.ok) {
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
      } else {
        const data = await res.json()
        alert("Error deleting account: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      alert("Network error while deleting account.")
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <aside style={{ width: 56, background: "#1e293b", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", flexShrink: 0 }}>
        <Link href="/dashboard" style={{ marginBottom: 20, display: "block" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6z"/></svg>
          </div>
        </Link>
        <Link href="/dashboard" title="Dashboard" style={{ padding: "10px 0", color: "#94a3b8", display: "block" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </Link>
      </aside>

      <main style={{ flex: 1, overflowY: "auto", background: "#f8f9fb" }}>
        <div style={{ padding: "24px 32px", maxWidth: 800 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Settings</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 28px" }}>Manage your profile, API keys, and preferences</p>

          {saved && (
            <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", color: "#15803d", fontSize: 14, marginBottom: 20 }}>
              Settings saved successfully
            </div>
          )}

          <Section title="Profile Information">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Full Name">
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", outline: "none", background: "#f8f9fb", boxSizing: "border-box" }} />
              </Field>
              <Field label="Institution">
                <input type="text" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="Your school/university"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", outline: "none", background: "#f8f9fb", boxSizing: "border-box" }} />
              </Field>
              <Field label="Academic Level" full>
                <select value={form.academic_level} onChange={e => setForm(f => ({ ...f, academic_level: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#f8f9fb" }}>
                  <option value="">Select level...</option>
                  {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Resume / CV">
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#1d4ed8", marginBottom: 16 }}>
              Your resume powers everything — it personalizes cold emails with your actual experience and skills, and is used to calculate how well you match each professor&apos;s research areas.
            </div>
            <div style={{ border: "2px dashed #e2e8f0", borderRadius: 10, padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Upload your resume</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>PDF only. Used to personalize your cold emails.</div>
              {initial?.resume_text && !uploadStatus && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#15803d", marginBottom: 12 }}>
                  Resume on file — {initial.resume_text.length} characters parsed
                </div>
              )}
              {uploadStatus && (
                <div style={{ background: uploadStatus.ok ? "#f0fdf4" : "#fee2e2", border: "1px solid " + (uploadStatus.ok ? "#bbf7d0" : "#fecaca"), borderRadius: 6, padding: "8px 12px", fontSize: 12, color: uploadStatus.ok ? "#15803d" : "#dc2626", marginBottom: 12 }}>
                  {uploadStatus.msg}
                </div>
              )}
              <label style={{ display: "inline-block", padding: "10px 20px", background: uploading ? "#bfdbfe" : "#3b82f6", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer" }}>
                {uploading ? "Parsing PDF..." : "Choose PDF File"}
                <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={uploading} style={{ display: "none" }} />
              </label>
            </div>
          </Section>

          <Section title="AI API Key">
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#0369a1", marginBottom: 16 }}>
              <strong>Used to generate personalized emails.</strong> Accepts any key — Groq, Gemini, or OpenAI compatible. Stored securely server-side, never sent to your browser.
            </div>

            {hasKey && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>AI key is set and active</span>
                </div>
                <button onClick={clearApiKey} disabled={clearingKey}
                  style={{ padding: "5px 10px", background: "transparent", color: "#94a3b8", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 400, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>
                  {clearingKey ? "Clearing..." : "Remove Key"}
                </button>
              </div>
            )}

            {keySaved && (
              <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#15803d", marginBottom: 12 }}>
                AI key saved securely.
              </div>
            )}

            <Field label={hasKey ? "Replace with a new key" : "Paste your API key"}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="gsk_... or AIza... or sk-... (Groq, Gemini, OpenAI)"
                  autoComplete="new-password"
                  style={{ flex: 1, padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", outline: "none", background: "#f8f9fb" }}
                />
                <button onClick={saveApiKey} disabled={savingKey || !apiKey.trim()}
                  style={{ padding: "10px 20px", background: savingKey || !apiKey.trim() ? "#e2e8f0" : "#3b82f6", color: savingKey || !apiKey.trim() ? "#94a3b8" : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: savingKey || !apiKey.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                  {savingKey ? "Saving..." : "Save Key"}
                </button>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                Free options:{" "}
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener" style={{ color: "#3b82f6" }}>Groq</a>
                {" (fastest) or "}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style={{ color: "#3b82f6" }}>Gemini</a>
                {" — both free tiers available."}
              </div>
            </Field>
          </Section>


          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={save} disabled={saving}
              style={{ padding: "12px 32px", background: saving ? "#bfdbfe" : "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : "Save Profile"}
            </button>

            <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              {resetDone && (
                <div style={{ fontSize: 13, color: "#15803d", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 6, padding: "6px 12px" }}>
                  All data reset successfully
                </div>
              )}
              <button onClick={handleReset} disabled={resetting}
                style={{ padding: "8px 16px", background: "transparent", color: resetting ? "#94a3b8" : "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 400, cursor: resetting ? "not-allowed" : "pointer" }}>
                {resetting ? "Resetting..." : "Reset All Data"}
              </button>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Deletes all researchers, emails &amp; activities</div>
            </div>
          </div>

          <div style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid #fee2e2" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#991b1b", margin: "0 0 8px" }}>Danger Zone</h3>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>Once you delete your account, there is no going back. All your data will be permanently removed.</p>
            
            <button 
              onClick={handleDeleteAccount}
              style={{ 
                padding: "10px 20px", background: "#fee2e2", color: "#991b1b", 
                border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, 
                fontWeight: 600, cursor: "pointer", transition: "all 0.2s" 
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2" }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fee2e2" }}
            >
              Delete My Account
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", margin: "0 0 16px" }}>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: "1 / -1" } : {}}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
