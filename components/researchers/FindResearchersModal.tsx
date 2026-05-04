"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader9 } from "@/components/ui/loader-9"

interface Props {
  onClose: () => void
  initialKeyword?: string
}

export default function FindResearchersModal({ onClose, initialKeyword = "" }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<"config" | "loading" | "done">("config")
  const [form, setForm] = useState({
    universityText: "",   // free-text, comma-separated, fuzzy-matched on the server
    keyword: initialKeyword, // comma-separated keywords/fields
    count: 5,
  })
  const [progress, setProgress] = useState({ found: 0, total: 0, current: "" })
  const [suggestion, setSuggestion] = useState("")
  const [error, setError] = useState("")

  async function handleFind() {
    if (!form.keyword.trim() && !form.universityText.trim()) {
      setError("Enter at least one keyword or university to search.")
      return
    }
    setError("")
    setStep("loading")
    setSuggestion("")
    setProgress({ found: 0, total: form.count, current: "Analyzing your profile..." })

    // Parse comma-separated values into arrays for the API
    const universities = form.universityText
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)

    const keywordList = form.keyword
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)

    try {
      const res = await fetch("/api/professors/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: keywordList,   // treated as field/topic terms with fuzzy matching
          universities,
          keyword: form.keyword, // also sent as raw string for global search
          count: form.count,
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("No response stream")

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "))
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === "progress") setProgress(data)
            if (data.type === "done") {
              if (data.suggestion) setSuggestion(data.suggestion)
              setStep("done")
              router.refresh()
            }
            if (data.type === "error") { setError(data.message); setStep("config") }
          } catch {}
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to find researchers")
      setStep("config")
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    border: "1px solid #e2e8f0", borderRadius: 10,
    fontSize: 13, color: "#0f172a", outline: "none",
    background: "#f8f9fb", boxSizing: "border-box",
    transition: "border-color 0.15s",
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
        maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Find Researchers</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
              Match scores are calculated from your resume
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {step === "config" && (
            <div>
              {error && (
                <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8,
                  padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              {/* Keywords / Fields */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Keywords or research fields
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}> — separate multiple with commas</span>
                </label>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5 }}>
                  Spelling and capitalisation don't matter — "machien lerning, NLP" works fine.
                </p>
                <input
                  value={form.keyword}
                  onChange={e => setForm(fm => ({ ...fm, keyword: e.target.value }))}
                  placeholder="e.g. machine learning, computer vision, NLP"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              {/* University */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  University
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}> — optional, leave blank to search all</span>
                </label>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5 }}>
                  Type one or more universities separated by commas. Fuzzy-matched, so "stanfrod" and "carnegie melon" will still work.
                </p>
                <input
                  value={form.universityText}
                  onChange={e => setForm(fm => ({ ...fm, universityText: e.target.value }))}
                  placeholder="e.g. Stanford, MIT, Carnegie Mellon"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              {/* Count */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                  How many? <span style={{ color: "#3b82f6", fontWeight: 700 }}>{form.count}</span>
                </label>
                <input type="range" min={1} max={5} step={1} value={form.count}
                  onChange={e => setForm(fm => ({ ...fm, count: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#3b82f6" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  <span>1</span><span>5 (max)</span>
                </div>
              </div>

              <button onClick={handleFind}
                style={{ width: "100%", padding: "12px", background: "#3b82f6", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {form.keyword.trim()
                  ? `Search "${form.keyword.split(",")[0].trim()}${form.keyword.includes(",") ? "…" : ""}" — Find ${form.count} Researchers`
                  : `Find ${form.count} Researchers`}
              </button>
            </div>
          )}

          {/* Loading */}
          {step === "loading" && (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <Loader9 color="#3b82f6" size="lg" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: "0 0 8px" }}>Matching Researchers...</h3>
              <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>{progress.current || "Comparing fields and resume keywords..."}</p>
              <div style={{ background: "#f1f5f9", borderRadius: 20, height: 6, overflow: "hidden", maxWidth: 300, margin: "0 auto" }}>
                <div style={{ height: "100%", background: "#3b82f6", borderRadius: 20,
                  width: `${progress.total ? Math.max(8, (progress.found / progress.total) * 100) : 8}%`,
                  transition: "width 0.4s ease" }} />
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 10 }}>{progress.found} / {progress.total || form.count} added</p>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4",
                border: "2px solid #bbf7d0", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
                {progress.found === 0
                  ? "Search Complete"
                  : `${progress.found} Researcher${progress.found !== 1 ? "s" : ""} Added`}
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 8px" }}>
                {progress.found === 0
                  ? (suggestion || "All matching professors are already in your list, or none were found. Try different keywords or clear university filters.")
                  : `${progress.found} new researcher${progress.found !== 1 ? "s" : ""} matched and added — ranked by field + resume fit.`}
              </p>
              {progress.found > 0 && (
                <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 24px" }}>
                  Match scores reflect how closely each professor&apos;s work aligns with your keywords and resume.
                </p>
              )}
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={onClose}
                  style={{ padding: "10px 24px", background: "#3b82f6", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  View Researchers
                </button>
                <button onClick={() => { setStep("config"); setProgress({ found: 0, total: 0, current: "" }) }}
                  style={{ padding: "10px 24px", background: "#f1f5f9", color: "#475569",
                    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Search Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
