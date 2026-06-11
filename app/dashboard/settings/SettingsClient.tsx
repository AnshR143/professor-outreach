"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
    } catch {
      alert("Network error while deleting account.")
    }
  }

  return (
    <div>
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Settings</h1>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 800 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Settings</h2>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 28px" }}>Manage your profile and preferences</p>

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
          <div style={{ background: "#d8e1e8", border: "1px solid #98bad5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#304674", marginBottom: 16 }}>
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
            <label style={{ display: "inline-block", padding: "10px 20px", background: uploading ? "#98bad5" : "#304674", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer" }}>
              {uploading ? "Parsing PDF..." : "Choose PDF File"}
              <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={uploading} style={{ display: "none" }} />
            </label>
          </div>
        </Section>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={save} disabled={saving}
            style={{ padding: "12px 32px", background: saving ? "#98bad5" : "#304674", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
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

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 4px" }}>Delete account</h3>
          <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 14px" }}>This permanently removes your account and all associated data. This action cannot be undone.</p>
          <button
            onClick={handleDeleteAccount}
            style={{ padding: "7px 14px", background: "transparent", color: "#dc2626", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0" }}
          >
            Delete account
          </button>
        </div>
      </div>
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
