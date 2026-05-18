"use client"

import { Contact2 } from "@/components/ui/contact-2"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ContactPage() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Simple Header */}
      <div style={{ padding: "20px 40px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#304674", fontWeight: 700 }}>
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <img src="/link.png" alt="Logo" style={{ width: 72, height: 72, objectFit: "contain" }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: "#304674" }}>InternLink</span>
        </div>
      </div>

      <div style={{ padding: "60px 20px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", marginBottom: 60 }}>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#304674", letterSpacing: "-0.04em", marginBottom: 16 }}>
            Get in touch
          </h1>
          <p style={{ fontSize: "clamp(1rem, 1.2vw, 1.25rem)", color: "#4a5568", lineHeight: 1.6, maxWidth: 600, margin: "0 auto" }}>
            Whether you're a student seeking research or a university looking to partner, we're here to help.
          </p>
        </div>
      </div>


      
      <div style={{ paddingBottom: 80 }}>
        <Contact2 title="Direct Support" description="Our team is usually able to respond within 24 hours." />
      </div>

      {/* Footer minimal */}
      <div style={{ background: "#f8f9fb", borderTop: "1px solid #e2e8f0", padding: "40px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          Built for students, by students. © 2026 InternLink.
        </p>
      </div>
    </div>
  )
}
