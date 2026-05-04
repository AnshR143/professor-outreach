"use client"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Brain, Mail, BarChart3, Zap, Shield, CheckCircle,
         Hexagon, Triangle, Command, Ghost, Gem, Cpu } from "lucide-react"
import { useRef, useEffect } from "react"
import Link from "next/link"
import Lenis from "@studio-freight/lenis"

/* ─────────────────────────────────────────────────────────────
   BlurWords — scroll-triggered word-by-word blur animation
   (same effect as the CircularTestimonials component, but
    fires once when the element scrolls into view)
───────────────────────────────────────────────────────────── */
interface BlurWordsProps {
  text: string
  style?: React.CSSProperties
  delay?: number          // base delay before first word (seconds)
  wordDelay?: number      // stagger between words (seconds)
  duration?: number       // per-word duration
  className?: string
}

function BlurWords({
  text,
  style = {},
  delay = 0,
  wordDelay = 0.03,
  duration = 0.28,
}: BlurWordsProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  const words = text.split(" ")

  return (
    <span ref={ref} style={{ display: "inline", ...style }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(12px)", opacity: 0, y: 8 }}
          animate={isInView
            ? { filter: "blur(0px)", opacity: 1, y: 0 }
            : { filter: "blur(12px)", opacity: 0, y: 8 }
          }
          transition={{
            duration,
            ease: "easeOut",
            delay: delay + i * wordDelay,
          }}
          style={{ display: "inline-block", marginRight: i < words.length - 1 ? "0.28em" : 0 }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

/* ─── Feature card data ─── */
const FEATURES = [
  { icon: Brain,      title: "AI Match Scoring",    desc: "Your resume and selected fields are cross-referenced against thousands of professors to surface the best fits." },
  { icon: Mail,       title: "Cold Email Generator", desc: "Groq-powered emails tailored to each professor's research papers, tone, and your academic background." },
  { icon: BarChart3,  title: "Outreach Analytics",  desc: "Track response rates, email statuses, and follow-up timing across your entire researcher pipeline." },
  { icon: Zap,        title: "Instant Discovery",   desc: "A curated database of 500+ professors across top universities, filtered by field and institution." },
  { icon: Shield,     title: "Resume Parsing",      desc: "Upload your PDF resume once. Every match and email automatically leverages your extracted keywords." },
  { icon: CheckCircle,title: "Follow-up Engine",    desc: "Generate perfectly-timed follow-up emails that reference your original message without being pushy." },
]

/* ─── University marquee ─── */
const UNIS = [
  { name: "MIT",          icon: Hexagon },
  { name: "Stanford",     icon: Triangle },
  { name: "Harvard",      icon: Command },
  { name: "Carnegie Mellon", icon: Ghost },
  { name: "Berkeley",     icon: Gem },
  { name: "Princeton",    icon: Cpu },
  { name: "Yale",         icon: Hexagon },
  { name: "Cornell",      icon: Triangle },
  { name: "Columbia",     icon: Command },
  { name: "Caltech",      icon: Ghost },
]

const navItems = [
  { label: "Features",     href: "#features" },
  { label: "How It Works", href: "#how" },
  { label: "Pricing",      href: "#pricing" },
  { label: "Sign In",      href: "/login" },
]

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return (
    <div style={{ overflowX: "hidden" }}>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .marquee-track { animation: marquee 35s linear infinite; }
      `}</style>

      {/* ═══════════════════════════════════════
          SECTION 1 — Video Hero
      ═══════════════════════════════════════ */}
      <div style={{ height: "100vh", width: "100%", padding: 10 }}>
        <div style={{ position: "relative", height: "100%", width: "100%",
          overflow: "hidden", borderRadius: 28 }}>

          <video autoPlay loop muted playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4" />

          <div style={{ pointerEvents: "none", position: "absolute", inset: 0,
            background: "linear-gradient(to bottom,rgba(0,0,0,0.18) 0%,rgba(0,0,0,0.0) 30%,rgba(0,0,0,0.42) 100%)" }} />

          {/* Navbar */}
          <motion.nav
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 40,
              background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "0 0 20px 20px", padding: "10px 36px" }}>
              {navItems.map((item, i) => (
                <motion.div key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}>
                  <Link href={item.href}
                    style={{ color: "rgba(225,224,204,0.75)", fontSize: 13,
                      fontWeight: 500, textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#E1E0CC")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(225,224,204,0.75)")}>
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.nav>

          {/* Hero bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 40px 8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "flex-end", gap: 32 }}>
              {/* Giant heading — BlurWords on load (no scroll needed, it's above fold) */}
              <h1 style={{ color: "#E1E0CC", fontWeight: 600, lineHeight: 0.85,
                letterSpacing: "-0.06em", fontSize: "clamp(72px,19vw,280px)", margin: 0 }}>
                <BlurWords text="Reach" delay={0.3} wordDelay={0.06} duration={0.6} />
              </h1>

              <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40, maxWidth: 380 }}>
                {/* Tagline — staggered blur after heading */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1, delay: 0.6 }}
                  style={{ color: "rgba(225,224,204,0.82)", fontSize: 15, lineHeight: 1.4, margin: 0 }}>
                  <BlurWords
                    text="AI-powered professor outreach. Find researchers who match your work, generate personalised cold emails, and land the research opportunity you deserve."
                    delay={0.7}
                    wordDelay={0.022}
                    duration={0.25}
                  />
                </motion.p>

                {/* CTA */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}>
                  <Link href="/signup"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8,
                      background: "#fff", color: "#000", borderRadius: 999,
                      padding: "6px 20px 6px 6px", fontSize: 14, fontWeight: 600,
                      textDecoration: "none", transition: "gap 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.gap = "14px")}
                    onMouseLeave={e => (e.currentTarget.style.gap = "8px")}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center",
                      width: 36, height: 36, borderRadius: "50%", background: "#000" }}>
                      <ArrowRight style={{ width: 16, height: 16, color: "#fff" }} />
                    </span>
                    Get started free
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 2 — Features
      ═══════════════════════════════════════ */}
      <div id="features" style={{ position: "relative", minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "100px 40px", overflow: "hidden" }}>

        <video autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center bottom" }}
          src="/hero-bg.mp4" />

        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(186,230,253,0.45) 0%, rgba(219,241,255,0.32) 30%, rgba(240,249,255,0.38) 65%, rgba(255,255,255,0.92) 100%)",
          zIndex: 1,
        }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 1100, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)",
                borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6",
                boxShadow: "0 0 8px #3b82f6" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1e40af",
                textTransform: "uppercase", letterSpacing: "0.1em" }}>Why OutreachAI</span>
            </motion.div>

            {/* Heading — blur words on scroll */}
            <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 800,
              color: "#0f172a", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.03em" }}>
              <BlurWords
                text="Every tool you need to land"
                delay={0} wordDelay={0.04} duration={0.3}
              />
              <br />
              <span style={{ background: "linear-gradient(to right,#2563eb,#4f46e5)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                display: "inline-block" }}>
                <BlurWords
                  text="research opportunities"
                  delay={0.4} wordDelay={0.05} duration={0.32}
                />
              </span>
            </h2>

            {/* Subheading — blur words, slightly delayed */}
            <p style={{ fontSize: 17, color: "#334155", maxWidth: 560,
              margin: "0 auto", lineHeight: 1.6 }}>
              <BlurWords
                text="Built for undergrads, Masters, and PhD students who want a systematic, AI-powered approach to cold outreach."
                delay={0.55} wordDelay={0.022} duration={0.24}
              />
            </p>
          </div>

          {/* Feature grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.55, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: "rgba(255,255,255,0.75)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  borderRadius: 20, padding: "28px 28px",
                  backdropFilter: "blur(14px)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(59,130,246,0.35)"
                  ;(e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.95)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(59,130,246,0.15)"
                  ;(e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.75)"
                }}>
                <div style={{ width: 44, height: 44, borderRadius: 12,
                  background: "linear-gradient(135deg,rgba(59,130,246,0.1),rgba(129,140,248,0.1))",
                  border: "1px solid rgba(59,130,246,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <f.icon style={{ width: 22, height: 22, color: "#2563eb" }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── University marquee ─── */}
      <div style={{ width: "100%", borderTop: "1px solid #e8edf2", borderBottom: "1px solid #e8edf2", background: "#f9fafb", overflow: "hidden", padding: "18px 0" }}>
        <div style={{ position: "relative", overflow: "hidden" }}>
          <div className="marquee-track" style={{ display: "flex", gap: 0, whiteSpace: "nowrap" }}>
            {[...UNIS, ...UNIS, ...UNIS, ...UNIS].map((u, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#a0aec0", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0 28px" }}>{u.name}</span>
                <span style={{ color: "#c8d0da", fontSize: 10 }}>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 3 — How It Works
      ═══════════════════════════════════════ */}
      <div id="how" style={{ background: "#ffffff", padding: "80px 40px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 60, alignItems: "start", maxWidth: 680 }}>
            <div style={{ minWidth: 0 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: 999, padding: "6px 14px", marginBottom: 24 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb",
                  textTransform: "uppercase", letterSpacing: "0.1em" }}>How It Works</span>
              </motion.div>

              {/* Section heading — blur on scroll */}
              <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800,
                color: "#0f172a", margin: "0 0 48px", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                <BlurWords text="From zero to" delay={0} wordDelay={0.06} duration={0.32} />
                <br />
                <span style={{ background: "linear-gradient(to right,#2563eb,#4f46e5)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  display: "inline-block" }}>
                  <BlurWords text="professor reply" delay={0.25} wordDelay={0.07} duration={0.34} />
                </span>
              </h2>

              {[
                { step: "01", title: "Upload your resume",    desc: "Paste or upload your CV. Our parser extracts keywords, skills, and research keywords automatically." },
                { step: "02", title: "Set your fields & filters", desc: "Pick your research areas and optionally filter by university tier or name. Match scores update in real time." },
                { step: "03", title: "Generate & send emails", desc: "Click Generate — your Groq AI key crafts a tailored cold email. Open Gmail pre-filled and hit send." },
              ].map((s, i) => (
                <motion.div key={s.step}
                  initial={{ opacity: 0, x: -28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: "flex", gap: 20, marginBottom: i < 2 ? 36 : 0 }}>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14,
                      background: "linear-gradient(135deg,rgba(59,130,246,0.1),rgba(129,140,248,0.1))",
                      border: "1px solid rgba(59,130,246,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#2563eb",
                        fontVariantNumeric: "tabular-nums" }}>{s.step}</span>
                    </div>
                    {i < 2 && (
                      <div style={{ width: 2, height: 36,
                        background: "linear-gradient(to bottom,rgba(59,130,246,0.2),transparent)",
                        margin: "8px 0" }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 10 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                      <BlurWords text={s.title} delay={0.25 + i * 0.15} wordDelay={0.05} duration={0.26} />
                    </h3>
                    <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                      <BlurWords text={s.desc} delay={0.35 + i * 0.15} wordDelay={0.018} duration={0.22} />
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 4 — Pricing
      ═══════════════════════════════════════ */}
      <div id="pricing" style={{ background: "#ffffff", padding: "80px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {[
            { plan: "Free", price: "$0", desc: "Everything you need to start reaching professors.", features: ["Unlimited researchers", "AI email generation", "Resume parsing", "Match scoring", "Follow-up engine"], cta: "Get started", href: "/signup", primary: true },
            { plan: "Pro (coming soon)", price: "$12/mo", desc: "Advanced analytics and bulk outreach for serious applicants.", features: ["Everything in Free", "Bulk email campaigns", "Advanced analytics", "Priority support", "Custom templates"], cta: null, href: "#", primary: false },
          ].map((p, i) => (
            <motion.div key={p.plan}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                borderRadius: 24, padding: 32,
                background: p.primary ? "linear-gradient(135deg,rgba(59,130,246,0.15),rgba(129,140,248,0.12))" : "rgba(255,255,255,1)",
                border: p.primary ? "1px solid rgba(59,130,246,0.35)" : "1px solid rgba(59,130,246,0.15)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
              }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.primary ? "#2563eb" : "#64748b",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{p.plan}</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>{p.price}</div>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.5, margin: "0 0 24px" }}>{p.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#475569" }}>
                    <CheckCircle style={{ width: 16, height: 16, color: "#3b82f6", flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              {p.cta && (
                <Link href={p.href} style={{
                  display: "block", textAlign: "center", padding: "12px 24px", borderRadius: 10,
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                  background: p.primary ? "linear-gradient(to right,#3b82f6,#4f46e5)" : "rgba(255,255,255,0.06)",
                  color: p.primary ? "#fff" : "#94a3b8",
                  border: p.primary ? "none" : "1px solid rgba(59,130,246,0.2)",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "1"}>
                  {p.cta}
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 5 — Final CTA
      ═══════════════════════════════════════ */}
      <div style={{ background: "#ffffff", padding: "0 40px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 44 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ borderRadius: 28, padding: "72px 48px", textAlign: "center",
              background: "linear-gradient(135deg,rgba(59,130,246,0.1) 0%,rgba(79,70,229,0.1) 100%)",
              border: "1px solid rgba(59,130,246,0.2)", backdropFilter: "blur(12px)" }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 800,
              color: "#0f172a", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              <BlurWords text="Ready to land your" delay={0} wordDelay={0.05} duration={0.3} />
              <br />
              <span style={{ background: "linear-gradient(to right,#2563eb,#4f46e5)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                display: "inline-block" }}>
                <BlurWords text="research position?" delay={0.28} wordDelay={0.06} duration={0.32} />
              </span>
            </h2>
            <p style={{ fontSize: 16, color: "#475569", maxWidth: 480,
              margin: "0 auto 36px", lineHeight: 1.6 }}>
              <BlurWords
                text="Join students who are already reaching professors at MIT, Stanford, Harvard, and beyond — with zero cold-email experience required."
                delay={0.5} wordDelay={0.02} duration={0.22}
              />
            </p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.9 }}>
              <Link href="/signup"
                style={{ display: "inline-flex", alignItems: "center", gap: 10,
                  background: "linear-gradient(to right,#3b82f6,#4f46e5)",
                  color: "#fff", borderRadius: 12, padding: "14px 32px",
                  fontSize: 16, fontWeight: 700, textDecoration: "none",
                  boxShadow: "0 8px 32px rgba(59,130,246,0.3)", transition: "transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.03)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"}>
                Get started for free
                <ArrowRight style={{ width: 18, height: 18 }} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#f8fafc", borderTop: "1px solid rgba(59,130,246,0.1)",
        padding: "28px 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg,#3b82f6,#4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowRight style={{ width: 14, height: 14, color: "#fff" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>OutreachAI</span>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Built for students. Powered by AI. © 2025 OutreachAI.
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "#0f172a"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "#64748b"}>
              {l}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
