"use client"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, Search, Check } from "lucide-react"

interface MajorSearchProps {
  selectedMajors: string[]
  onChange: (majors: string[]) => void
}

export default function MajorSearch({ selectedMajors, onChange }: MajorSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      const { data } = await supabase
        .from("majors")
        .select("id, name")
        .ilike("name", `%${query}%`)
        .limit(10)
      
      setResults(data || [])
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function addMajor(major: string) {
    if (!selectedMajors.includes(major)) {
      onChange([...selectedMajors, major])
    }
    setQuery("")
    setIsOpen(false)
  }

  function removeMajor(major: string) {
    onChange(selectedMajors.filter(m => m !== major))
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
        Interested Majors / Fields of Study
      </label>
      
      {/* Selected Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {selectedMajors.map(m => (
          <div key={m} style={{ 
            display: "inline-flex", alignItems: "center", gap: 6, 
            background: "#eff6ff", color: "#3b82f6", padding: "4px 10px", 
            borderRadius: 16, fontSize: 13, fontWeight: 500, border: "1px solid #dbeafe" 
          }}>
            {m}
            <button onClick={() => removeMajor(m)} style={{ 
              background: "none", border: "none", cursor: "pointer", 
              padding: 0, display: "flex", color: "#93c5fd" 
            }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div style={{ position: "relative" }}>
        <input 
          type="text" 
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for majors (e.g. Art, Computer Science...)"
          style={{ 
            width: "100%", padding: "10px 12px 10px 36px", border: "1px solid #e2e8f0", 
            borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#f8f9fb", outline: "none" 
          }}
        />
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div style={{ 
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, 
          marginTop: 4, background: "#fff", border: "1px solid #e2e8f0", 
          borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", maxHeight: 240, overflowY: "auto" 
        }}>
          {loading ? (
            <div style={{ padding: 12, fontSize: 13, color: "#64748b", textAlign: "center" }}>Searching...</div>
          ) : results.length > 0 ? (
            results.map(r => (
              <button 
                key={r.id}
                onClick={() => addMajor(r.name)}
                style={{ 
                  width: "100%", padding: "10px 12px", textAlign: "left", 
                  background: selectedMajors.includes(r.name) ? "#f8fafc" : "transparent", 
                  border: "none", cursor: "pointer", display: "flex", 
                  alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9"
                }}
              >
                <span style={{ fontSize: 14, color: "#1e293b" }}>{r.name}</span>
                {selectedMajors.includes(r.name) && <Check size={14} color="#10b981" />}
              </button>
            ))
          ) : (
            <div style={{ padding: 12, fontSize: 13, color: "#64748b", textAlign: "center" }}>
              No majors found. Try a different term.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
