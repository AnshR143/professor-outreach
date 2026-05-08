"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function PrivacyPage() {
  const lastUpdated = "May 7, 2026";
  const [referrer, setReferrer] = useState<string | null>(null);

  useEffect(() => {
    // Only access document.referrer on client side
    setReferrer(document.referrer);
  }, []);

  const isFromSignup = referrer?.includes("/signup");

  return (
    <div style={{ background: "#f8f9fb", minHeight: "100vh", color: "#304674", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#304674", fontWeight: 700 }}>
            <img src="/link.png" alt="Logo" style={{ width: 32, height: 32 }} />
            <span>InternLink</span>
          </Link>
          <Link href={isFromSignup ? "/signup" : "/"} style={{ fontSize: 14, fontWeight: 600, color: "#304674", textDecoration: "none" }}>
            {isFromSignup ? "Back to Sign Up" : "Back to Home"}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 24px", lineHeight: 1.6 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: "#64748b", marginBottom: 32 }}>Last Updated: {lastUpdated}</p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, upload a resume, or use our outreach tools. This may include your name, email address, educational background, and skills.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Provide, maintain, and improve our Service.</li>
            <li>Personalize your experience (e.g., tailoring email drafts based on your resume).</li>
            <li>Communicate with you about the Service.</li>
            <li>Monitor and analyze usage trends.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>3. Data Storage & Security</h2>
          <p>We use industry-standard security measures to protect your data. Your information is stored securely via Supabase, and sensitive content like resumes is processed only for Service functionality.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>4. Sharing of Information</h2>
          <p>We do not sell your personal information to third parties. We may share information only to comply with legal obligations or protect our rights.</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>5. Your Choices</h2>
          <p>You can update or delete your account information at any time through the Settings page. You can also contact us to request data deletion.</p>
        </section>

        <section style={{ marginBottom: 48, padding: "24px", background: "#fff", border: "2px solid #304674", borderRadius: 12, boxShadow: "4px 4px 0px #304674" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Questions?</h2>
          <p>If you have any questions about our Privacy Policy, please reach out to us at privacy@internlink.ai</p>
        </section>
      </main>

      <footer style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 14 }}>
        &copy; 2026 InternLink. All rights reserved.
      </footer>
    </div>
  );
}
