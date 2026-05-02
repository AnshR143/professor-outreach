"use client"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Brain, Mail, BarChart3, Zap, Shield, CheckCircle,
         Hexagon, Triangle, Command, Ghost, Gem, Cpu } from "lucide-react"
import { useRef, useEffect } from "react"
import Link from "next/link"
import Lenis from "@studio-freight/lenis"

/* ─── Words pull-up animation ─── */
const WordsPullUp = ({ text }: { text: string }) => {
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
            style={{ display: "inline-block", position: "relative", marginRight: isLast ? 0 : "0.25em" }}>
            {word}
          </motion.span>
        )
      })}
    </div>
  )
}

/* ─── Feature card data ─── */
const FEATURES = [
  { icon: Brain,     title: "AI Match Scoring",    desc: "Your resume and selected fields are cross-referenced against thousands of professors to surface the best fits." },
  { icon: Mail,      title: "Cold Email Generator", desc: "Groq-powered emails tailored to each professor's research papers, tone, and your academic background." },
  { icon: BarChart3, title: "Outreach Analytics",  desc: "Track response rates, email statuses, and follow-up timing across your entire researcher pipeline." },
  { icon: Zap,       title: "Instant Discovery",   desc: "A curated database of 500+ professors across top universities, filtered by field and institution." },
  { icon: Shield,    title: "Resume Parsing",       desc: "Upload your PDF resume once. Every match and email automatically leverages your extracted keywords." },
  { icon: CheckCircle, title: "Follow-up Engine",  desc: "Generate perfectly-timed follow-up emails that reference your original message without being pushy." },
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
  { label: "Features",    href: "#features" },
  { label: "How It Works", href: "#how" },
  { label: "Pricing",     href: "#pricing" },
  { label: "Sign In",     href: "/login" },
]

/* ═══════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════ */
export default function LandingPage() {
  
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ─── CSS Animations ─── */}
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .marquee-track { animation: marquee 35s linear infinite; }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        .ani-1 { animation: fadeSlideIn 0.8s ease-out 0.1s both; }
        .ani-2 { animation: fadeSlideIn 0.8s ease-out 0.25s both; }
        .ani-3 { animation: fadeSlideIn 0.8s ease-out 0.4s both; }
        .ani-4 { animation: fadeSlideIn 0.8s ease-out 0.55s both; }
        .ani-5 { animation: fadeSlideIn 0.8s ease-out 0.7s both; }
      `}</style>

      {/* ═══════════════════════════════════════════
          SECTION 1 — Video Hero
          ═══════════════════════════════════════════ */}
      <div style={{ height: "100vh", width: "100%", padding: 10 }}>
        <div style={{ position: "relative", height: "100%", width: "100%",
          overflow: "hidden", borderRadius: 28 }}>

          <video autoPlay loop muted playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4" />

          <div style={{ pointerEvents: "none", position: "absolute", inset: 0,
            background: "linear-gradient(to bottom,rgba(0,0,0,0.4) 0%,rgba(0,0,0,0.0) 35%,rgba(0,0,0,0.7) 100%)" }} />

          {/* Navbar */}
          <nav style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
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

          {/* Hero bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 40px 8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "flex-end", gap: 32 }}>
              <h1 style={{ color: "#E1E0CC", fontWeight: 600, lineHeight: 0.85,
                letterSpacing: "-0.06em", fontSize: "clamp(72px,19vw,280px)", margin: 0 }}>
                <WordsPullUp text="Reach" />
              </h1>
              <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40, maxWidth: 380 }}>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ color: "rgba(225,224,204,0.82)", fontSize: 15, lineHeight: 1.4, margin: 0 }}>
                  AI-powered professor outreach. Find researchers who match your work,
                  generate personalised cold emails, and land the research opportunity you deserve.
                </motion.p>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                  <Link href="/signup"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8,
                      background: "#fff", color: "#000", borderRadius: 999,
                      padding: "6px 20px 6px 6px", fontSize: 14, fontWeight: 600,
                      textDecoration: "none", transition: "gap 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.gap = "14px" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.gap = "8px" }}>
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

      {/* ═══════════════════════════════════════════
          SECTION 2 — Features (Video background)
          ═══════════════════════════════════════════ */}
      <div id="features" style={{ position: "relative", minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "100px 40px", overflow: "hidden" }}>

        {/* Video background */}
        <video
          autoPlay muted loop playsInline
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center bottom",
          }}
          src="/hero-bg.mp4"
        />

        {/* Blue gradient overlay — fully opaque at top (hides any artifact), rich blue tint throughout */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, #0a1628 0%, rgba(10,22,60,0.82) 18%, rgba(15,30,80,0.72) 45%, rgba(10,22,60,0.82) 80%, #0a1628 100%)",
          zIndex: 1,
        }} />
        {/* Extra blue shimmer layer */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(37,99,235,0.18) 0%, transparent 70%)",
          zIndex: 2,
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 10, maxWidth: 1100, width: "100%" }}>

          {/* Section heading */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="ani-1" style={{ display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(59,130,246,0.18)", border: "1px solid rgba(99,179,237,0.35)",
              borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa",
                boxShadow: "0 0 10px #60a5fa" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#93c5fd",
                textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Why OutreachAI
              </span>
            </div>
            <h2 className="ani-2" style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 800,
              color: "#f0f9ff", margin: "0 0 16px", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Every tool you need to land<br />
              <span style={{ background: "linear-gradient(to right,#60a5fa,#a78bfa)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                research opportunities
              </span>
            </h2>
            <p className="ani-3" style={{ fontSize: 17, color: "#bae6fd", maxWidth: 560,
              margin: "0 auto", lineHeight: 1.6 }}>
              Built for undergrads, Masters, and PhD students who want a systematic,
              AI-powered approach to cold outreach.
            </p>
          </div>

          {/* Feature grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className="ani-3"
                style={{
                  background: "rgba(15,30,80,0.55)",
                  border: "1px solid rgba(96,165,250,0.22)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
                  borderRadius: 20,
                  padding: "28px 28px",
                  backdropFilter: "blur(18px)",
                  transition: "border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s",
                  animationDelay: `${0.1 + i * 0.08}s`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(96,165,250,0.55)"
                  ;(e.currentTarget as HTMLDivElement).style.background = "rgba(15,30,80,0.75)"
                  ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(96,165,250,0.22)"
                  ;(e.currentTarget as HTMLDivElement).style.background = "rgba(15,30,80,0.55)"
                  ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)"
                }}>
                <div style={{ width: 46, height: 46, borderRadius: 13,
                  background: "linear-gradient(135deg,rgba(37,99,235,0.35),rgba(79,70,229,0.35))",
                  border: "1px solid rgba(96,165,250,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16 }}>
                  <f.icon style={{ width: 22, height: 22, color: "#60a5fa" }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f9ff", margin: "0 0 8px" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: "#93c5fd", lineHeight: 1.6, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 3 — How It Works + Trust (White bg)
          ═══════════════════════════════════════════ */}
      <div id="how" style={{ background: "#ffffff", padding: "80px 40px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "start" }}>

            {/* Left: How it works */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: 999, padding: "6px 14px", marginBottom: 24 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb",
                  textTransform: "uppercase", letterSpacing: "0.1em" }}>How It Works</span>
              </div>
              <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800,
                color: "#0f172a", margin: "0 0 48px", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                From zero to<br />
                <span style={{ background: "linear-gradient(to right,#2563eb,#4f46e5)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  professor reply
                </span>
              </h2>

              {[
                { step: "01", title: "Upload your resume", desc: "Paste or upload your CV. Our parser extracts keywords, skills, and research keywords automatically." },
                { step: "02", title: "Set your fields & filters", desc: "Pick your research areas and optionally filter by university tier or name. Match scores update in real time." },
                { step: "03", title: "Generate & send emails", desc: "Click Generate — your Groq AI key crafts a tailored cold email. Open Gmail pre-filled and hit send." },
              ].map((s, i) => (
                <div key={s.step} style={{ display: "flex", gap: 20, marginBottom: i < 2 ? 36 : 0 }}>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14,
                      background: "linear-gradient(135deg,rgba(59,130,246,0.1),rgba(129,140,248,0.1))",
                      border: "1px solid rgba(59,130,246,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#2563eb",
                        fontVariantNumeric: "tabular-nums" }}>{s.step}</span>
                    </div>
                    {i < 2 && (
                      <div style={{ width: 2, height: 36, background: "linear-gradient(to bottom,rgba(59,130,246,0.2),transparent)",
                        margin: "8px 0" }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 10 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{s.title}</h3>
                    <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Stats card + university marquee */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>

              {/* Stats card */}
              <div style={{ position: "relative", overflow: "hidden", borderRadius: 24,
                border: "1px solid rgba(59,130,246,0.15)",
                background: "rgba(255,255,255,1)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
                padding: 32, backdropFilter: "blur(12px)" }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160,
                  borderRadius: "50%", background: "rgba(59,130,246,0.05)", filter: "blur(40px)",
                  pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16,
                      background: "linear-gradient(135deg,#3b82f6,#4f46e5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}>
                      <BarChart3 style={{ width: 24, height: 24, color: "#fff" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>500+</div>
                      <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>Curated Professors</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: "#475569" }}>Match Accuracy</span>
                      <span style={{ color: "#0f172a", fontWeight: 600 }}>94%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: "rgba(59,130,246,0.1)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "94%", borderRadius: 999,
                        background: "linear-gradient(to right,#3b82f6,#818cf8)" }} />
                    </div>
                  </div>

                  <div style={{ height: 1, background: "rgba(59,130,246,0.1)", margin: "0 0 24px" }} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr", gap: 0 }}>
                    {[{ v: "2 min", l: "Setup" }, { v: "3", l: "Steps" }, { v: "100%", l: "Free" }].map((s, i) => (
                      <div key={s.l} style={{ display: "contents" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{s.v}</div>
                          <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase",
                            letterSpacing: "0.08em", marginTop: 2 }}>{s.l}</div>
                        </div>
                        {i < 2 && <div style={{ background: "rgba(59,130,246,0.15)" }} />}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                      border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.05)",
                      borderRadius: 999, padding: "5px 12px" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e",
                        boxShadow: "0 0 6px #22c55e", flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#475569",
                        textTransform: "uppercase", letterSpacing: "0.1em" }}>ACTIVE</span>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                      border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.05)",
                      borderRadius: 999, padding: "5px 12px" }}>
                      <span style={{ fontSize: 13 }}>✨</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#475569",
                        textTransform: "uppercase", letterSpacing: "0.1em" }}>AI-POWERED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* University marquee card */}
              <div style={{ borderRadius: 24, border: "1px solid rgba(59,130,246,0.15)",
                background: "rgba(255,255,255,1)", overflow: "hidden",
                boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
                padding: "24px 0 20px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: 13, color: "#475569", fontWeight: 500,
                  padding: "0 28px", marginBottom: 16 }}>Researchers from top institutions</p>
                <div style={{ position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { const t = (e.currentTarget.querySelector(".marquee-track") as HTMLElement); if(t) t.style.animationPlayState="paused" }}
                  onMouseLeave={e => { const t = (e.currentTarget.querySelector(".marquee-track") as HTMLElement); if(t) t.style.animationPlayState="running" }}>
                  <div style={{ maskImage: "linear-gradient(to right,transparent,black 15%,black 85%,transparent)",
                    WebkitMaskImage: "linear-gradient(to right,transparent,black 15%,black 85%,transparent)" }}>
                    <div className="marquee-track" style={{ display: "flex", gap: 28, whiteSpace: "nowrap", padding: "0 14px" }}>
                      {[...UNIS, ...UNIS].map((u, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8,
                          opacity: 0.7, transition: "opacity 0.2s", cursor: "default" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.7"}>
                          <u.icon style={{ width: 18, height: 18, color: "#3b82f6" }} />
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{u.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 4 — Pricing teaser
          ═══════════════════════════════════════════ */}
      <div id="pricing" style={{ background: "#ffffff", padding: "80px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {[
            { plan: "Free", price: "$0", desc: "Everything you need to start reaching professors.", features: ["Unlimited researchers", "AI email generation", "Resume parsing", "Match scoring", "Follow-up engine"], cta: "Get started", href: "/signup", primary: true },
            { plan: "Pro (coming soon)", price: "$12/mo", desc: "Advanced analytics and bulk outreach for serious applicants.", features: ["Everything in Free", "Bulk email campaigns", "Advanced analytics", "Priority support", "Custom templates"], cta: null, href: "#", primary: false },
          ].map(p => (
            <div key={p.plan} style={{
              borderRadius: 24, padding: 32,
              background: p.primary ? "linear-gradient(135deg,rgba(59,130,246,0.15),rgba(129,140,248,0.12))" : "rgba(255,255,255,1)",
              border: p.primary ? "1px solid rgba(59,130,246,0.35)" : "1px solid rgba(59,130,246,0.15)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
              backdropFilter: "blur(12px)",
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
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity="0.85"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity="1"}>
                  {p.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 5 — Final CTA
          ═══════════════════════════════════════════ */}
      <div style={{ background: "#ffffff", padding: "0 40px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ borderRadius: 28, padding: "72px 48px", textAlign: "center",
            background: "linear-gradient(135deg,rgba(59,130,246,0.1) 0%,rgba(79,70,229,0.1) 100%)",
            border: "1px solid rgba(59,130,246,0.2)", backdropFilter: "blur(12px)" }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 800,
              color: "#0f172a", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Ready to land your<br />
              <span style={{ background: "linear-gradient(to right,#2563eb,#4f46e5)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                research position?
              </span>
            </h2>
            <p style={{ fontSize: 16, color: "#475569", maxWidth: 480,
              margin: "0 auto 36px", lineHeight: 1.6 }}>
              Join students who are already reaching professors at MIT, Stanford, Harvard,
              and beyond — with zero cold-email experience required.
            </p>
            <Link href="/signup"
              style={{ display: "inline-flex", alignItems: "center", gap: 10,
                background: "linear-gradient(to right,#3b82f6,#4f46e5)",
                color: "#fff", borderRadius: 12, padding: "14px 32px",
                fontSize: 16, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 8px 32px rgba(59,130,246,0.3)", transition: "transform 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform="scale(1.03)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform="scale(1)"}>
              Get started for free
              <ArrowRight style={{ width: 18, height: 18 }} />
            </Link>
          </div>
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
            <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none",
              transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color="#0f172a"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color="#64748b"}>
              {l}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
