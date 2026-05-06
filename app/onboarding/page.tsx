"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { RESEARCH_FIELDS, ACADEMIC_LEVELS } from "@/lib/utils"
import MajorSearch from "@/components/onboarding/MajorSearch"
import ResumeUpload from "@/components/onboarding/ResumeUpload"
import { motion, AnimatePresence } from "framer-motion"

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
    firstName: "",
    lastName: "",
    birthday: "",
    academicLevel: "",
    institution: "",
    majors: [] as string[],
    interests: [] as string[],
    goals: [] as string[],
    resumeUrl: "",
    resumeText: "",
  })

  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      
      // Pre-fill name from auth metadata if available
      if (user.user_metadata?.name) {
        const parts = user.user_metadata.name.split(" ")
        setForm(f => ({
          ...f,
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || ""
        }))
      }
    }
    checkAuth()
  }, [])

  function toggleItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  }

  async function handleFinish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push("/login")
      return
    }

    // Use upsert so it works even if the profile row was never created
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      first_name: form.firstName,
      last_name: form.lastName,
      name: `${form.firstName} ${form.lastName}`.trim() || user.email || "User",
      email: user.email || "",
      birthday: form.birthday || null,
      academic_level: form.academicLevel,
      institution: form.institution,
      majors: form.majors,
      interests: form.interests,
      goals: form.goals,
      resume_url: form.resumeUrl || null,
      resume_text: form.resumeText || null,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })

    if (error) {
      console.error("Onboarding upsert error:", error)
      alert("Failed to save your profile: " + error.message + "\nPlease try again.")
      setLoading(false)
      return
    }

    // Hard redirect — forces a full server-side reload so dashboard sees onboarding_complete: true
    window.location.href = "/dashboard"
  }

  const btnStyle = (active: boolean) => ({
    padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1.5px solid",
    borderColor: active ? "#304674" : "#e2e8f0",
    background: active ? "#d8e1e8" : "#fff",
    color: active ? "#304674" : "#64748b",
    transition: "all 0.15s",
  })

  const labelStyle = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }
  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#f8f9fb", outline: "none" }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "48px", width: "100%", maxWidth: 640, boxShadow: "0 20px 50px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #304674, #2563eb)", color: "#fff", marginBottom: 16 }}>
            <span style={{ fontWeight: 800, fontSize: 20 }}>O</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Welcome to OutreachAI</h1>
          <p style={{ color: "#64748b", fontSize: 15 }}>Let's set up your researcher profile.</p>
        </div>

        {/* Progress Bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{ flex: 1, height: 6, borderRadius: 3, background: s <= step ? "#304674" : "#e2e8f0", transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 24px" }}>Basic Information</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle as any}>First Name</label>
                  <input type="text" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle as any}>Last Name</label>
                  <input type="text" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Doe" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle as any}>Birthday</label>
                <input type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} style={inputStyle} />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle as any}>Academic Level</label>
                <select value={form.academicLevel} onChange={e => setForm(f => ({ ...f, academicLevel: e.target.value }))} style={inputStyle}>
                  <option value="">Select your level...</option>
                  {ACADEMIC_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setStep(2)}
                  style={{ width: "100%", padding: 14, background: "#304674", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  Continue →
                </button>
              </div>
              <button onClick={() => setStep(2)} style={{ width: "100%", marginTop: 12, background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                Skip for now
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 24px" }}>Education</h2>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle as any}>Current Institution / School</label>
                <input type="text" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="e.g. Stanford University" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 28 }}>
                <MajorSearch 
                  selectedMajors={form.majors} 
                  onChange={majors => setForm(f => ({ ...f, majors }))} 
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: 14, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Back</button>
                <button onClick={() => setStep(3)}
                  style={{ flex: 2, padding: 14, background: "#304674", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  Continue
                </button>
              </div>
              <button onClick={() => setStep(3)} style={{ width: "100%", marginTop: 16, background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", textDecoration: "underline", textAlign: "center" }}>
                Skip for now
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 24px" }}>Resume & Goals</h2>

              <ResumeUpload onUpload={(url, text) => {
                setForm(f => ({ ...f, resumeUrl: url, resumeText: text }))
              }} />

              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle as any}>What are your outreach goals?</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {GOALS.map(g => (
                    <button key={g} onClick={() => setForm(fm => ({ ...fm, goals: toggleItem(fm.goals, g) }))} style={btnStyle(form.goals.includes(g))}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: 14, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Back</button>
                <button onClick={() => setStep(4)}
                  style={{ flex: 2, padding: 14, background: "#304674", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  Almost There
                </button>
              </div>
              <button onClick={() => setStep(4)} style={{ width: "100%", marginTop: 16, background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", textDecoration: "underline", textAlign: "center" }}>
                Skip for now
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", color: "#22c55e", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>Ready to launch?</h2>
                <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
                  We've customized your experience based on your background in <strong>{form.majors[0]}</strong>. 
                  You're all set to start finding researchers.
                </p>

                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setStep(3)} style={{ flex: 1, padding: 14, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Review</button>
                  <button onClick={handleFinish} disabled={loading}
                    style={{ flex: 2, padding: 14, background: "#304674", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(48, 70, 116,0.3)" }}>
                    {loading ? "Finalizing..." : "Enter Dashboard →"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
