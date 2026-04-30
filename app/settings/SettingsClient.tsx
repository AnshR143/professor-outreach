"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Profile } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"
import { ACADEMIC_LEVELS } from "@/lib/utils"

interface Props { profile: Profile | null }

export default function SettingsClient({ profile: initial }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name || "",
    institution: initial?.institution || "",
    academic_level: initial?.academic_level || "",
    interests: initial?.interests || [] as string[],
    goals: initial?.goals || [] as string[],
    groq_api_key: initial?.groq_api_key || "",
    gemini_api_key: initial?.gemini_api_key || "",
  })

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error } = await supabase.from("profiles").upsert(
      { user_id: user.id, ...form, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
    router.refresh()
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
        setUploadStatus({ ok: true, msg: `Resume parsed — ${data.text.length} characters extracted across ${data.pages} page${data.pages !== 1 ? "s" : ""}. AI will use this to personalize your emails.` })
      } else {
        setUploadStatus({ ok: false, msg: data.error || "Failed to parse resume." })
      }
    } catch {
      setUploadStatus({ ok: false, msg: "Network error. Please try again." })
    }
    setUploading(false)
    e.target.value = ""
  }

  const inp = (value: string, onChange: (v: string) => void, placeholder?: string, type = "text") => (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", outline: "none", background: "#f8f9fb" }}
    />
  )

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <aside style={{ width: 56, background: "#1e293b", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", flexShrink: 0 }}>
        <Link href="/dashboard" style={{ marginBottom: 20, display: "block" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
              <Field label="Full Name">{inp(form.name, v => setForm(f => ({ ...f, name: v })), "Your name")}</Field>
              <Field label="Institution">{inp(form.institution, v => setForm(f => ({ ...f, institution: v })), "Your school/university")}</Field>
              <Field label="Academic Level" full>
                <select
                  value={form.academic_level}
                  onChange={e => setForm(f => ({ ...f, academic_level: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#f8f9fb" }}
                >
                  <option value="">Select level...</option>
                  {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Resume / CV">
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e", marginBottom: 16 }}>
              Your resume powers everything — it personalizes cold emails with your actual experience and skills, and is used to calculate how well you match each professor's research areas.
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
                <div style={{ background: uploadStatus.ok ? "#f0fdf4" : "#fee2e2", border: `1px solid ${uploadStatus.ok ? "#bbf7d0" : "#fecaca"}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, color: uploadStatus.ok ? "#15803d" : "#dc2626", marginBottom: 12 }}>
                  {uploadStatus.msg}
                </div>
              )}

              <label style={{ display: "inline-block", padding: "10px 20px", background: uploading ? "#fed7aa" : "#f97316", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer" }}>
                {uploading ? "Parsing PDF..." : "Choose PDF File"}
                <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={uploading} style={{ display: "none" }} />
              </label>
            </div>
          </Section>

          <Section title="AI API Keys">
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e", marginBottom: 16 }}>
              API keys are stored in your profile and only used server-side for AI features. They are never sent to the browser.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Groq API Key (Primary — fast and free)">
                {inp(form.groq_api_key, v => setForm(f => ({ ...f, groq_api_key: v })), "gsk_...", "password")}
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Get your key at{" "}
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener" style={{ color: "#f97316" }}>console.groq.com/keys</a> (free)
                </div>
              </Field>
              <Field label="Gemini API Key (Fallback when Groq is unavailable)">
                {inp(form.gemini_api_key, v => setForm(f => ({ ...f, gemini_api_key: v })), "AIza...", "password")}
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Get your key at{" "}
                  <a href="https://aistudio.google.com" target="_blank" rel="noopener" style={{ color: "#f97316" }}>aistudio.google.com</a>
                </div>
              </Field>
            </div>
          </Section>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ padding: "12px 32px", background: saving ? "#fed7aa" : "#f97316", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : "Save All Settings"}
            </button>

            <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              {resetDone && (
                <div style={{ fontSize: 13, color: "#15803d", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 6, padding: "6px 12px" }}>
                  All data reset successfully
                </div>
              )}
              <button
                onClick={handleReset}
                disabled={resetting}
                style={{ padding: "10px 20px", background: resetting ? "#fecaca" : "#fee2e2", color: resetting ? "#9f1239" : "#dc2626", border: "1.5px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: resetting ? "not-allowed" : "pointer" }}
              >
                {resetting ? "Resetting..." : "🗑 Reset All Data"}
              </button>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Deletes all researchers, emails &amp; activities</div>
            </div>
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
