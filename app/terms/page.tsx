import React from "react"
import Link from "next/link"

export default function TermsPage() {
  const lastUpdated = "May 7, 2026"

  return (
    <div style={{ background: "#f8f9fb", minHeight: "100vh", color: "#304674", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#304674", fontWeight: 700 }}>
            <img src="/link.png" alt="Logo" style={{ width: 32, height: 32 }} />
            <span>InternLink</span>
          </Link>
          <Link href="/signup" style={{ fontSize: 14, fontWeight: 600, color: "#304674", textDecoration: "none" }}>Back to Sign Up</Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 24px", lineHeight: 1.6 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: "#64748b", marginBottom: 32 }}>Last Updated: {lastUpdated}</p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>1. Acceptance of Terms</h2>
          <p>By accessing or using InternLink ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>2. Description of Service</h2>
          <p>InternLink is an AI-powered outreach platform designed to help students discover and contact professors, researchers, and internship providers. We provide tools for contact discovery, email generation, and outreach management.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>3. User Conduct & Responsibilities</h2>
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>You must provide accurate information when creating an account.</li>
            <li style={{ marginBottom: 8 }}>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li style={{ marginBottom: 8 }}>You agree not to use the Service for any illegal or unauthorized purpose, including spamming or harassment.</li>
            <li style={{ marginBottom: 8 }}>You acknowledge that AI-generated content should be reviewed for accuracy before sending.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>4. Intellectual Property</h2>
          <p>The Service and its original content (excluding user-provided data like resumes), features, and functionality are and will remain the exclusive property of InternLink and its licensors.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>5. Data Privacy & Resumes</h2>
          <p>We take your privacy seriously. Any resume or personal data you upload is used solely to personalize your experience and generate outreach content. We do not sell your personal data to third parties. For more details, please refer to our Privacy Policy.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>6. Limitation of Liability</h2>
          <p>InternLink shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>7. Termination</h2>
          <p>We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users or us.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>8. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. We will notify users of any significant changes by posting the new terms on this page.</p>
        </section>

        <section style={{ marginBottom: 48, padding: "24px", background: "#fff", border: "2px solid #304674", borderRadius: 12, boxShadow: "4px 4px 0px #304674" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at support@internlink.ai</p>
        </section>
      </main>

      <footer style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 14 }}>
        &copy; 2026 InternLink. All rights reserved.
      </footer>
    </div>
  )
}
