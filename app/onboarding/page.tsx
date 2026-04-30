"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { RESEARCH_FIELDS, ACADEMIC_LEVELS, TOP_UNIVERSITIES } from "@/lib/utils"

const GOALS = [
  "Research internship (unpaid)",
  "Paid research assistant position",
  "PhD program admission",
  "Master's program admission",
  "Coffee chat / mentorship",
  "Co-authorship / collaboration",
  "Career advice",
  "General networking",
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    academicLevel: "",
    institution: "",
    interests: [] as string[],
    goals: [] as string[],
  })

  function toggleItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  }

  async function handleFinish() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("profiles").update({
      academic_level: form.academicLevel,
      institution: form.institution,
      interests: form.interests,
      goals: form.goals,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id)

    router.push("/dashboard")
    router.refresh()
  }

  const btnStyle = (active: boolean) => ({
    padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1.5px solid",
    borderColor: active ? "#f97316" : "#e2e8f0",
    background: active ? "#fff7ed" : "#fff",
    color: active ? "#f97316" : "#64748b",
    transition: "all 0.15s",
  })

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 48px", width: "100%", maxWidth: 580, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "#f97316" : "#e2e8f0", transition: "background 0.3s" }} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>Tell us about yourself</h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 28px" }}>This helps us find the best professor matches for you.</p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Academic Level</label>
              <select value={form.academicLevel} onChange={e => setForm(f => ({ ...f, academicLevel: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#f8f9fb", outline: "none" }}>
                <option value="">Select your level...</option>
                {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Institution / School</label>
              <input type="text" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                placeholder="e.g. South Brunswick High School"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#f8f9fb", outline: "none" }} />
            </div>

            <button onClick={() => setStep(2)} disabled={!form.academicLevel || !form.institution}
              style={{ width: "100%", padding: 11, background: !form.academicLevel || !form.institution ? "#fed7aa" : "#f97316", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: !form.academicLevel || !form.institution ? "not-allowed" : "pointer" }}>
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>Research Interests</h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px" }}>Select all fields that interest you (pick at least 1).</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28, maxHeight: 260, overflowY: "auto" }}>
              {RESEARCH_FIELDS.map(f => (
                <button key={f} onClick={() => setForm(fm => ({ ...fm, interests: toggleItem(fm.interests, f) }))} style={btnStyle(form.interests.includes(f))}>
                  {f}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: 11, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Back</button>
              <button onClick={() => setStep(3)} disabled={form.interests.length === 0}
                style={{ flex: 2, padding: 11, background: form.interests.length === 0 ? "#fed7aa" : "#f97316", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: form.interests.length === 0 ? "not-allowed" : "pointer" }}>
                Continue → ({form.interests.length} selected)
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>What are your goals?</h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px" }}>Select everything you're hoping to achieve.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {GOALS.map(g => (
                <button key={g} onClick={() => setForm(fm => ({ ...fm, goals: toggleItem(fm.goals, g) }))} style={btnStyle(form.goals.includes(g))}>
                  {g}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: 11, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Back</button>
              <button onClick={handleFinish} disabled={loading || form.goals.length === 0}
                style={{ flex: 2, padding: 11, background: loading || form.goals.length === 0 ? "#fed7aa" : "#f97316", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading || form.goals.length === 0 ? "not-allowed" : "pointer" }}>
                {loading ? "Setting up your profile..." : " Get Started"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
