"use client"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { ArrowRight, Brain, Mail, BarChart3, Zap, Shield, CheckCircle,
         Hexagon, Triangle, Command, Ghost, Gem, Cpu, ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Lenis from "@studio-freight/lenis"

/* ─────────────────────────────────────────────────────────────
   BlurWords — scroll-triggered word-by-word blur animation
───────────────────────────────────────────────────────────── */
interface BlurWordsProps {
  text: string
  style?: React.CSSProperties
  delay?: number
  wordDelay?: number
  duration?: number
  className?: string
}

function BlurWords({ text, style = {}, delay = 0, wordDelay = 0.03, duration = 0.28 }: BlurWordsProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  const words = text.split(" ")
  return (
    <span ref={ref} style={{ display: "inline", ...style }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(12px)", opacity: 0, y: 8 }}
          animate={isInView ? { filter: "blur(0px)", opacity: 1, y: 0 } : { filter: "blur(12px)", opacity: 0, y: 8 }}
          transition={{ duration, ease: "easeOut", delay: delay + i * wordDelay }}
          style={{ display: "inline-block", marginRight: i < words.length - 1 ? "0.28em" : 0 }}
        >{word}</motion.span>
      ))}
    </span>
  )
}

/* ─── Feature card data ─── */
const FEATURES = [
  { icon: Brain,       title: "AI Match Scoring",     desc: "Your resume is cross-referenced against professors and company contacts to surface the highest-fit targets automatically." },
  { icon: Mail,        title: "Cold Email Generator",  desc: "AI-crafted emails tailored to each recipient — research papers for professors, role and company context for internships." },
  { icon: BarChart3,   title: "Outreach Analytics",   desc: "Track reply rates, email statuses, and follow-up timing across your entire professor and internship pipeline." },
  { icon: Zap,         title: "Dual Discovery",       desc: "Find professors at 500+ universities and internship contacts at top companies — all from one dashboard." },
  { icon: Shield,      title: "Resume Parsing",       desc: "Upload your PDF once. Every match, email, and contact suggestion automatically draws on your extracted skills." },
  { icon: CheckCircle, title: "Follow-up Engine",     desc: "Generate perfectly-timed follow-up emails that reference your original message — for both research and internship leads." },
]

const HOW_STEPS = [
  { step: "01", title: "Upload your resume",        desc: "Paste or upload your CV. The parser extracts your skills, keywords, and experience in seconds." },
  { step: "02", title: "Pick your targets",         desc: "Search professors by research field or find internship contacts by company — or do both at once." },
  { step: "03", title: "Generate & send",           desc: "One click produces a tailored cold email. Open Gmail pre-filled or copy the draft and hit send." },
]

const PRICING = [
  { plan: "Free", price: "$0", desc: "Everything you need to start cold outreach — professors and internships.", features: ["Professor discovery", "Internship contacts", "AI email generation", "Resume parsing", "Follow-up engine"], cta: "Get started", href: "/signup", primary: true },
  { plan: "Pro (coming soon)", price: "$12/mo", desc: "Advanced tools for students running high-volume outreach campaigns.", features: ["Everything in Free", "Bulk email campaigns", "Advanced analytics", "Priority support", "Custom templates"], cta: null, href: "#", primary: false },
]

/* ─── University marquee ─── */
const UNIS = [
  { name: "MIT", icon: Hexagon },
  { name: "Stanford", icon: Triangle },
  { name: "Harvard", icon: Command },
  { name: "Carnegie Mellon", icon: Ghost },
  { name: "Berkeley", icon: Gem },
  { name: "Princeton", icon: Cpu },
  { name: "Yale", icon: Hexagon },
  { name: "Cornell", icon: Triangle },
  { name: "Columbia", icon: Command },
  { name: "Caltech", icon: Ghost },
]

// navbar is now just brand + sign-in

/* ═══════════════════════════════════════════════════════════
   CAROUSEL SECTION SLIDES
═══════════════════════════════════════════════════════════ */

function FeaturesSlide() {
  return (
    <div style={{ padding: "28px 32px 20px" }}>
      {/* Label */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
        background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: 999, padding: "5px 14px", marginBottom: 16 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.1em" }}>Why OutreachAI</span>
      </div>

      <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 800, color: "#0f172a",
        margin: "0 0 8px", lineHeight: 1.2, letterSpacing: "-0.03em" }}>
        Every tool you need for{" "}
        <span style={{ background: "linear-gradient(to right,#2563eb,#4f46e5)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          cold outreach success
        </span>
      </h2>
      <p style={{ fontSize: 14, color: "#334155", margin: "0 0 24px", lineHeight: 1.6, maxWidth: 520 }}>
        One platform for professor research outreach and internship cold emails — powered by AI, personalised to each recipient.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {FEATURES.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: 16, padding: "18px 18px",
              backdropFilter: "blur(10px)",
            }}>
            <div style={{ width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,rgba(59,130,246,0.1),rgba(129,140,248,0.1))",
              border: "1px solid rgba(59,130,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <f.icon style={{ width: 18, height: 18, color: "#2563eb" }} />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{f.title}</h3>
            <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function HowItWorksSlide() {
  return (
    <div style={{ padding: "28px 32px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
      {/* Left */}
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 999, padding: "5px 14px", marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.1em" }}>Process</span>
        </div>

        <h2 style={{ fontSize: "clamp(24px,3.5vw,42px)", fontWeight: 800,
          color: "#0f172a", margin: "0 0 32px", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
          From zero to{" "}
          <span style={{ background: "linear-gradient(to right,#2563eb,#4f46e5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            first reply
          </span>
        </h2>

        {HOW_STEPS.map((s, i) => (
          <motion.div key={s.step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", gap: 16, marginBottom: i < 2 ? 28 : 0 }}>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 13,
                background: "linear-gradient(135deg,rgba(59,130,246,0.1),rgba(129,140,248,0.1))",
                border: "1px solid rgba(59,130,246,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#2563eb" }}>{s.step}</span>
              </div>
              {i < 2 && <div style={{ width: 2, height: 28,
                background: "linear-gradient(to bottom,rgba(59,130,246,0.25),transparent)", margin: "6px 0" }} />}
            </div>
            <div style={{ paddingTop: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 5px" }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Right — visual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          borderRadius: 24,
          background: "linear-gradient(135deg,rgba(59,130,246,0.08) 0%,rgba(79,70,229,0.12) 100%)",
          border: "1px solid rgba(59,130,246,0.18)",
          padding: 28,
          display: "flex", flexDirection: "column", gap: 16,
          backdropFilter: "blur(10px)",
        }}>
        {[
          { label: "Researchers found",  value: "12 professors matched", dot: "#3b82f6" },
          { label: "Email generated",    value: "Personalised in 2s",    dot: "#4f46e5" },
          { label: "Outreach status",    value: "3 replied · 2 pending", dot: "#10b981" },
        ].map((item) => (
          <div key={item.label} style={{ background: "rgba(255,255,255,0.72)", borderRadius: 14, padding: "14px 18px",
            border: "1px solid rgba(59,130,246,0.1)", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.dot, boxShadow: `0 0 6px ${item.dot}` }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function PricingSlide() {
  return (
    <div style={{ padding: "28px 32px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 999, padding: "5px 14px", marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pricing</span>
        </div>
        <h2 style={{ fontSize: "clamp(22px,3vw,38px)", fontWeight: 800, color: "#0f172a",
          margin: "0 0 8px", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
          Simple, transparent{" "}
          <span style={{ background: "linear-gradient(to right,#2563eb,#4f46e5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>pricing</span>
        </h2>
        <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>Start free. No credit card required.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, maxWidth: "100%" }}>
        {PRICING.map((p, i) => (
          <motion.div key={p.plan}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: 20, padding: 26,
              background: p.primary
                ? "linear-gradient(135deg,rgba(59,130,246,0.15),rgba(129,140,248,0.12))"
                : "rgba(255,255,255,1)",
              border: p.primary ? "1px solid rgba(59,130,246,0.35)" : "1px solid rgba(59,130,246,0.15)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
            }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: p.primary ? "#2563eb" : "#64748b",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{p.plan}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>{p.price}</div>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: "0 0 18px" }}>{p.desc}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {p.features.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                  <CheckCircle style={{ width: 14, height: 14, color: "#3b82f6", flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            {p.cta && (
              <Link href={p.href} style={{
                display: "block", textAlign: "center", padding: "10px 20px", borderRadius: 10,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                background: p.primary ? "linear-gradient(to right,#3b82f6,#4f46e5)" : "transparent",
                color: p.primary ? "#fff" : "#94a3b8",
                border: p.primary ? "none" : "1px solid rgba(59,130,246,0.2)",
              }}>
                {p.cta}
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION CAROUSEL
═══════════════════════════════════════════════════════════ */
const SLIDES = [
  { id: "features",    label: "Features",      content: <FeaturesSlide /> },
  { id: "how",         label: "How It Works",  content: <HowItWorksSlide /> },
  { id: "pricing",     label: "Pricing",       content: <PricingSlide /> },
]

function SectionCarousel() {
  const [current, setCurrent] = useState(0)
  const total = SLIDES.length

  const handleNext = useCallback(() => {
    setCurrent(prev => (prev + 1) % total)
  }, [total])

  const handlePrev = useCallback(() => {
    setCurrent(prev => (prev - 1 + total) % total)
  }, [total])

  return (
    <div id="carousel" style={{
      position: "relative", minHeight: "100vh", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "60px 0 60px",
      background: "linear-gradient(180deg, #f0f7ff 0%, #eef2ff 60%, #f8faff 100%)",
    }}>
      {/* Ambient glow blobs */}
      <div style={{ pointerEvents: "none", position: "absolute", inset: 0, zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(79,70,229,0.14) 0%,transparent 70%)" }} />
      </div>

      {/* Section label pills */}
      <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 8, marginBottom: 32 }}>
        {SLIDES.map((slide, i) => (
          <button key={slide.id} onClick={() => setCurrent(i)} style={{
            border: "none", cursor: "pointer",
            padding: "7px 18px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.04em",
            background: i === current
              ? "linear-gradient(to right,#3b82f6,#4f46e5)"
              : "rgba(255,255,255,0.7)",
            color: i === current ? "#fff" : "#64748b",
            border: i === current ? "none" : "1px solid rgba(59,130,246,0.2)",
            transition: "all 0.3s ease",
            backdropFilter: "blur(8px)",
            boxShadow: i === current ? "0 4px 16px rgba(59,130,246,0.3)" : "none",
          }}>
            {slide.label}
          </button>
        ))}
      </div>

      {/* Carousel track — per-card perspective so scroll doesn't jitter */}
      <div style={{
        position: "relative", width: "100%", height: "620px",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10,
      }}>
        {SLIDES.map((slide, index) => {
          let offset = index - current
          if (offset > Math.floor(total / 2)) offset -= total
          if (offset < -Math.floor(total / 2)) offset += total

          const isCenter   = offset === 0
          const isAdjacent = Math.abs(offset) === 1
          const isVisible  = Math.abs(offset) <= 1

          return (
            <motion.div
              key={slide.id}
              style={{
                position: "absolute",
                width: "min(900px, 90vw)",
                height: "600px",
                overflow: "hidden",
                borderRadius: 28,
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(59,130,246,0.14)",
                zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
                pointerEvents: isCenter ? "auto" : "none",
                willChange: "transform, opacity",
                // perspective() lives on the card itself — immune to scroll position
                transformPerspective: 1200,
              }}
              animate={{
                x: `${offset * 90}%`,
                rotateY: offset * -12,
                scale: isCenter ? 1 : isAdjacent ? 0.83 : 0.68,
                opacity: isCenter ? 1 : isAdjacent ? 0.36 : 0,
                filter: isCenter ? "blur(0px)" : isAdjacent ? "blur(4px)" : "blur(10px)",
                boxShadow: isCenter
                  ? "0 32px 80px rgba(59,130,246,0.18), 0 8px 32px rgba(0,0,0,0.1)"
                  : "0 8px 32px rgba(0,0,0,0.06)",
                visibility: isVisible ? "visible" : "hidden",
              }}
              transition={{
                type: "spring",
                stiffness: 160,
                damping: 28,
                mass: 1.1,
                opacity:   { duration: 0.45, ease: "easeOut" },
                filter:    { duration: 0.45, ease: "easeOut" },
                boxShadow: { duration: 0.45, ease: "easeOut" },
                visibility:{ duration: 0 },
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${slide.id}-${current}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  style={{ height: "100%", overflowY: "auto" }}
                >
                  {slide.content}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Prev / Next buttons */}
      <button onClick={handlePrev} style={{
        position: "absolute", left: "max(20px, 3vw)", top: "50%", transform: "translateY(-50%)",
        zIndex: 20, width: 44, height: 44, borderRadius: "50%",
        background: "rgba(255,255,255,0.88)", border: "1px solid rgba(59,130,246,0.18)",
        backdropFilter: "blur(12px)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) scale(1.1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(59,130,246,0.2)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)" }}
      >
        <ChevronLeft style={{ width: 20, height: 20, color: "#2563eb" }} />
      </button>

      <button onClick={handleNext} style={{
        position: "absolute", right: "max(20px, 3vw)", top: "50%", transform: "translateY(-50%)",
        zIndex: 20, width: 44, height: 44, borderRadius: "50%",
        background: "rgba(255,255,255,0.88)", border: "1px solid rgba(59,130,246,0.18)",
        backdropFilter: "blur(12px)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) scale(1.1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(59,130,246,0.2)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)" }}
      >
        <ChevronRight style={{ width: 20, height: 20, color: "#2563eb" }} />
      </button>

      {/* Dot indicators */}
      <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 8, marginTop: 28 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            border: "none", cursor: "pointer", padding: 0,
            width: i === current ? 24 : 8,
            height: 8, borderRadius: 999,
            background: i === current
              ? "linear-gradient(to right,#3b82f6,#4f46e5)"
              : "rgba(59,130,246,0.25)",
            transition: "all 0.35s ease",
          }} />
        ))}
      </div>
    </div>
  )
}

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

          {/* Sign In — floating pill top-right, no bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "absolute", top: 20, right: 28, zIndex: 20 }}>
            <Link href="/login"
              style={{ display: "inline-flex", alignItems: "center",
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.28)",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                borderRadius: 999, padding: "8px 22px", fontSize: 13, fontWeight: 600,
                color: "#fff", textDecoration: "none", transition: "background 0.15s, border-color 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.5)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.28)" }}>
              Sign In
            </Link>
          </motion.div>

          {/* Hero bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 40px 8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "flex-end", gap: 32 }}>
              <h1 style={{ color: "#E1E0CC", fontWeight: 600, lineHeight: 0.85,
                letterSpacing: "-0.06em", fontSize: "clamp(72px,19vw,280px)", margin: 0 }}>
                <BlurWords text="Reach" delay={0.3} wordDelay={0.06} duration={0.6} />
              </h1>

              <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40, maxWidth: 380 }}>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1, delay: 0.6 }}
                  style={{ color: "rgba(225,224,204,0.82)", fontSize: 15, lineHeight: 1.4, margin: 0 }}>
                  <BlurWords
                    text="AI-powered cold outreach for research and internships. Find the right professors and companies, generate personalised emails, and land the opportunity you deserve."
                    delay={0.7} wordDelay={0.022} duration={0.25}
                  />
                </motion.p>

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
          SECTION 2/3/4 — 3D Section Carousel
      ═══════════════════════════════════════ */}
      <SectionCarousel />

      {/* ═══════════════════════════════════════
          SECTION 5 — Final CTA (with cloud video bg)
      ═══════════════════════════════════════ */}
      <div style={{ position: "relative", overflow: "hidden", padding: "120px 40px 100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Cloud video background */}
        <video autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center bottom", zIndex: 0 }}
          src="/hero-bg.mp4" />
        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(to bottom, rgba(186,230,253,0.55) 0%, rgba(219,241,255,0.45) 40%, rgba(240,249,255,0.6) 100%)" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 680, width: "100%", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 44 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ borderRadius: 28, padding: "72px 48px", textAlign: "center",
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(59,130,246,0.2)", backdropFilter: "blur(20px)" }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 800,
              color: "#0f172a", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              <BlurWords text="Ready to start your" delay={0} wordDelay={0.05} duration={0.3} />
              <br />
              <span style={{ background: "linear-gradient(to right,#2563eb,#4f46e5)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                display: "inline-block" }}>
                <BlurWords text="cold outreach?" delay={0.28} wordDelay={0.06} duration={0.32} />
              </span>
            </h2>
            <p style={{ fontSize: 16, color: "#475569", maxWidth: 480,
              margin: "0 auto 36px", lineHeight: 1.6 }}>
              <BlurWords
                text="Join students already landing research positions and internships at top universities and companies — with zero cold-email experience required."
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
