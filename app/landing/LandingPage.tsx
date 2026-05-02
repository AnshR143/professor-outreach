"use client"
import { motion, useInView } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useRef } from "react"
import Link from "next/link"

interface WordsPullUpProps {
  text: string
  showAsterisk?: boolean
}

const WordsPullUp = ({ text, showAsterisk = false }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const words = text.split(" ")
  return (
    <div ref={ref} style={{ display: "inline-flex", flexWrap: "wrap" }}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1
        return (
          <motion.span key={i}
            initial={{ y: 40, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "inline-block", position: "relative",
              marginRight: isLast ? 0 : "0.25em" }}>
            {word}
            {showAsterisk && isLast && (
              <span style={{ position: "absolute", top: "0.65em",
                right: "-0.3em", fontSize: "0.31em" }}>*</span>
            )}
          </motion.span>
        )
      })}
    </div>
  )
}

const navItems = [
  { label: "Features",    href: "#" },
  { label: "How It Works", href: "#" },
  { label: "Pricing",     href: "#" },
  { label: "Sign In",     href: "/login" },
]

export default function LandingPage() {
  return (
    <div style={{ height: "100vh", width: "100%", padding: 10 }}>
      <div style={{ position: "relative", height: "100%", width: "100%",
        overflow: "hidden", borderRadius: 28 }}>

        {/* Background video */}
        <video autoPlay loop muted playsInline
          style={{ position: "absolute", inset: 0, width: "100%",
            height: "100%", objectFit: "cover" }}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4" />

        {/* Gradient overlay */}
        <div style={{ pointerEvents: "none", position: "absolute", inset: 0,
          background: "linear-gradient(to bottom,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.05) 40%,rgba(0,0,0,0.65) 100%)" }} />

        {/* Navbar pill */}
        <nav style={{ position: "absolute", top: 0, left: "50%",
          transform: "translateX(-50%)", zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40,
            background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "0 0 20px 20px", padding: "10px 36px" }}>
            {navItems.map(item => (
              <Link key={item.label} href={item.href}
                style={{ color: "rgba(225,224,204,0.75)", fontSize: 13,
                  fontWeight: 500, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#E1E0CC")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(225,224,204,0.75)")}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Hero content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "0 40px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr",
            alignItems: "flex-end", gap: 32 }}>

            {/* Giant word */}
            <h1 style={{ color: "#E1E0CC", fontWeight: 600, lineHeight: 0.85,
              letterSpacing: "-0.06em",
              fontSize: "clamp(72px,19vw,280px)", margin: 0 }}>
              <WordsPullUp text="Reach" showAsterisk />
            </h1>

            {/* Tagline + CTA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20,
              paddingBottom: 40, maxWidth: 380 }}>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ color: "rgba(225,224,204,0.82)", fontSize: 15,
                  lineHeight: 1.4, margin: 0 }}>
                AI-powered professor outreach. Find researchers who match your work,
                generate personalised cold emails, and land the research opportunity
                you deserve.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                <Link href="/signup"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8,
                    background: "#fff", color: "#000", borderRadius: 999,
                    padding: "6px 20px 6px 6px", fontSize: 14, fontWeight: 600,
                    textDecoration: "none", transition: "gap 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.gap = "14px" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.gap = "8px" }}>
                  <span style={{ display: "flex", alignItems: "center",
                    justifyContent: "center", width: 36, height: 36,
                    borderRadius: "50%", background: "#000" }}>
                    <ArrowRight style={{ width: 16, height: 16, color: "#fff" }} />
                  </span>
                  Get started free
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Footnote */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            style={{ color: "rgba(225,224,204,0.38)", fontSize: 11,
              margin: "6px 0 10px" }}>
            * Match scores are calculated from your resume and selected fields.
            No credit card required.
          </motion.p>
        </div>
      </div>
    </div>
  )
}
