"use client"
import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, FileText, Check, X, AlertCircle } from "lucide-react"

interface ResumeUploadProps {
  onUpload: (url: string, text: string) => void
}

export default function ResumeUpload({ onUpload }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.type.includes("pdf") && !selected.type.includes("word")) {
      alert("Please upload a PDF or Word document.")
      return
    }

    setFile(selected)
    await uploadFile(selected)
  }

  async function uploadFile(selected: File) {
    setUploading(true)
    setStatus("idle")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user")

      const fileExt = selected.name.split('.').pop()
      const filePath = `${user.id}/resume_${Date.now()}.${fileExt}`

      const { error: uploadError, data } = await supabase.storage
        .from('resumes')
        .upload(filePath, selected)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath)

      // PARSING: Call our internal parsing API to extract text
      const fd = new FormData()
      fd.append("file", selected)
      
      const parseRes = await fetch("/api/resume/parse", { method: "POST", body: fd })
      const parseData = await parseRes.json()

      if (parseData.text) {
        onUpload(publicUrl, parseData.text)
        setStatus("success")
      } else {
        throw new Error(parseData.error || "Failed to parse resume text")
      }
    } catch (error: any) {
      console.error("Upload/Parse error:", error)
      setStatus("error")
      alert(error.message || "Failed to process resume. Please ensure it is a PDF and not a scanned image.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
        Upload Resume / CV (PDF)
      </label>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        style={{ 
          border: "2px dashed #e2e8f0", borderRadius: 12, padding: "24px 16px", 
          textAlign: "center", cursor: "pointer", transition: "all 0.2s",
          background: status === "success" ? "#f0fdf4" : "#f8fafc",
          borderColor: status === "success" ? "#86efac" : status === "error" ? "#fecaca" : "#e2e8f0"
        }}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept=".pdf,.doc,.docx" />
        
        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div className="animate-spin" style={{ width: 24, height: 24, border: "3px solid #f3f3f3", borderTop: "3px solid #304674", borderRadius: "50%" }} />
            <span style={{ fontSize: 13, color: "#64748b" }}>Uploading...</span>
          </div>
        ) : status === "success" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>Resume Uploaded!</span>
            <span style={{ fontSize: 12, color: "#15803d" }}>{file?.name}</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Upload size={28} color="#94a3b8" />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>Click to upload or drag and drop</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>PDF, DOC up to 5MB</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
