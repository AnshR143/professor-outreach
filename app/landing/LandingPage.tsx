"use client"
import { motion, useInView, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight, Brain, Mail, BarChart3, Zap, Shield, CheckCircle,
         Hexagon, Triangle, Command, Ghost, Gem, Cpu, ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Lenis from "@studio-freight/lenis"
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight"

/* ─────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Brain,       title: "AI Match Scoring",     desc: "Your resume and fields are cross-referenced against thousands of professors to surface the best fits." },
  { icon: Mail,        title: "Cold Email Generator",  desc: "Groq-powered emails tailored to each professor's research papers, tone, and your academic background." },
  { icon: BarChart3,   title: "Outreach Analytics",   desc: "Track response rates, email statuses, and follow-up timing across your entire researcher pipeline." },
  { icon: Zap,         title: "Instant Discovery",    desc: "A curated database of 500+ professors across top universities, filtered by field and institution." },
  { icon: Shield,      title: "Resume Parsing",       desc: "Upload your PDF resume once. Every match and email automatically leverages your extracted keywords." },
  { icon: CheckCircle, title: "Follow-up Engine",     desc: "Generate perfectly-timed follow-up emails that reference your original message without being pushy." },
]

const HOW_STEPS = [
  { step: "01", title: "Upload your resume",        desc: "Paste or upload your CV. Our parser extracts keywords, skills, and research areas automatically." },
  { step: "02", title: "Set your fields & filters", desc: "Pick research areas and optionally filter by university tier or name. Match scores update live." },
  { step: "03", title: "Generate & send emails",    desc: "Click Generate — your Groq AI key crafts a tailored cold email. Open Gmail pre-filled and hit send." },
]

const PRICING = [
  { plan: "Free", price: "$0", desc: "Everything you need to start reaching professors.", features: ["Unlimited researchers", "AI email generation", "Resume parsing", "Match scoring", "Follow-up engine"], cta: "Get started", href: "/signup", primary: true },
  { plan: "Pro (coming soon)", price: "$12/mo", desc: "Advanced analytics and bulk outreach for serious applicants.", features: ["Everything in Free", "Bulk email campaigns", "Advanced analytics", "Priority support", "Custom templates"], cta: null, href: "#", primary: false },
]

const UNIS = ["MIT", "Stanford", "Harvard", "Oxford", "Cambridge", "ETH Zurich", "Berkeley", "Princeton", "Caltech", "UChicago", "Columbia", "Yale"]

/* ─────────────────────────────────────────────────────────────
   BlurWords
───────────────────────────────────────────────────────────── */
function BlurWords({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25em", justifyContent: "center" }}>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(10px)", opacity: 0, y: 10 }}
          whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          style={{ display: "inline-block" }}>
          {word}
        </motion.span>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   CAROUSEL SLIDES
═══════════════════════════════════════════════════════════ */
function FeaturesSlide() {
  return (
    <div style={{ padding: "40px 40px 32px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
        background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: 999, padding: "5px 14px", marginBottom: 16 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.1em" }}>Why OutreachAI</span>
      </div>
      <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 800, color: "#0f172a",
        margin: "0 0 8px", lineHeight: 1.2, letterSpacing: "-0.03em" }}>
        Every tool you need to land{" "}
        <span style={{ background: "linear-gradient(to right,#2563eb,#4f46e5)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          research opportunities
        </span>
      </h2>
      <p style={{ fontSize: 14, color: "#334155", margin: "0 0 24px", lineHeight: 1.6, maxWidth: 520 }}>
        Built for undergrads, Masters, and PhD students who want a systematic, AI-powered approach to cold outreach.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {FEATURES.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "rgba(255,255,255,0.85)", border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: 16, padding: "18px 18px", backdropFilter: "blur(10px)",
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
    <div style={{ padding: "40px 40px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
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
            professor reply
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
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          borderRadius: 24,
          background: "linear-gradient(135deg,rgba(59,130,246,0.08) 0%,rgba(79,70,229,0.12) 100%)",
          border: "1px solid rgba(59,130,246,0.18)", padding: 28,
          display: "flex", flexDirection: "column", gap: 16, backdropFilter: "blur(10px)",
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
    <div style={{ padding: "40px 40px 36px" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, maxWidth: 700, margin: "0 auto" }}>
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
  { id: "features", label: "Features",     content: <FeaturesSlide /> },
  { id: "how",      label: "How It Works", content: <HowItWorksSlide /> },
  { id: "pricing",  label: "Pricing",      content: <PricingSlide /> },
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

  useEffect(() => {
    const timer = setInterval(handleNext, 7000)
    return () => clearInterval(timer)
  }, [handleNext])

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

      {/* Tab pills */}
      <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 8, marginBottom: 32 }}>
        {SLIDES.map((slide, i) => (
          <button key={slide.id} onClick={() => setCurrent(i)} style={{
            border: i === current ? "none" : "1px solid rgba(59,130,246,0.2)",
            cursor: "pointer", padding: "7px 18px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.04em",
            background: i === current ? "linear-gradient(to right,#3b82f6,#4f46e5)" : "rgba(255,255,255,0.7)",
            color: i === current ? "#fff" : "#64748b",
            transition: "all 0.3s ease", backdropFilter: "blur(8px)",
            boxShadow: i === current ? "0 4px 16px rgba(59,130,246,0.3)" : "none",
          }}>
            {slide.label}
          </button>
        ))}
      </div>

      {/* 3D Carousel track */}
      <div style={{
        position: "relative", width: "100%", height: "480px",
        display: "flex", alignItems: "center", justifyContent: "center",
        perspective: "1200px", zIndex: 10,
      }}>
        {SLIDES.map((slide, index) => {
          let offset = index - current
          if (offset > Math.floor(total / 2)) offset -= total
          if (offset < -Math.floor(total / 2)) offset += total
          const isCenter   = offset === 0
          const isAdjacent = Math.abs(offset) === 1
          return (
            <div key={slide.id} style={{
              position: "absolute",
              width: "min(860px, 88vw)", height: "460px",
              overflow: "hidden", borderRadius: 28,
              background: "rgba(255,255,255,0.88)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(59,130,246,0.14)",
              boxShadow: isCenter
                ? "0 32px 80px rgba(59,130,246,0.18), 0 8px 32px rgba(0,0,0,0.1)"
                : "0 8px 32px rgba(0,0,0,0.08)",
              transform: `
                translateX(${offset * 88}%)
                rotateY(${offset * -14}deg)
                scale(${isCenter ? 1 : isAdjacent ? 0.82 : 0.68})
              `,
              transformOrigin: "center center",
              opacity: isCenter ? 1 : isAdjacent ? 0.38 : 0,
              filter: isCenter ? "blur(0px)" : isAdjacent ? "blur(5px)" : "blur(10px)",
              transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease, filter 0.5s ease, box-shadow 0.4s ease",
              zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
              visibility: Math.abs(offset) > 1 ? "hidden" : "visible",
              pointerEvents: isCenter ? "auto" : "none",
            }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${slide.id}-${current}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ height: "100%", overflowY: "auto" }}>
                  {slide.content}
                </motion.div>
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Prev arrow */}
      <button onClick={handlePrev} style={{
        position: "absolute", left: "max(20px, 3vw)", top: "50%", transform: "translateY(-50%)",
        zIndex: 20, width: 44, height: 44, borderRadius: "50%",
        background: "rgba(255,255,255,0.88)", border: "1px solid rgba(59,130,246,0.18)",
        backdropFilter: "blur(12px)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)", transition: "transform 0.15s, box-shadow 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) scale(1.1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(59,130,246,0.2)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)" }}>
        <ChevronLeft style={{ width: 20, height: 20, color: "#2563eb" }} />
      </button>

      {/* Next arrow */}
      <button onClick={handleNext} style={{
        position: "absolute", right: "max(20px, 3vw)", top: "50%", transform: "translateY(-50%)",
        zIndex: 20, width: 44, height: 44, borderRadius: "50%",
        background: "rgba(255,255,255,0.88)", border: "1px solid rgba(59,130,246,0.18)",
        backdropFilter: "blur(12px)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)", transition: "transform 0.15s, box-shadow 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) scale(1.1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(59,130,246,0.2)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)" }}>
        <ChevronRight style={{ width: 20, height: 20, color: "#2563eb" }} />
      </button>

      {/* Dot indicators */}
      <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 8, marginTop: 28 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            border: "none", cursor: "pointer", padding: 0,
            width: i === current ? 24 : 8, height: 8, borderRadius: 999,
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

function FloatingCharacter() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 50 }}
      animate={{ 
        opacity: 1, scale: 1, x: 0,
        y: [0, -15, 0] 
      }}
      transition={{ 
        duration: 4, 
        repeat: Infinity, 
        ease: "easeInOut",
        opacity: { duration: 0.8 },
        scale: { duration: 0.8 },
        x: { duration: 0.8 }
      }}
      style={{ 
        position: "absolute", right: "10%", top: "25%", zIndex: 20,
        width: 400, pointerEvents: "none"
      }}
    >
      <div style={{ position: "relative" }}>
        {/* Husky Image */}
        <img 
          src="/husky.png" 
          alt="Husky Guide" 
          style={{ width: "100%", height: "auto", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))" }} 
        />
        
        {/* Whiteboard Overlay Info */}
        <div style={{ 
          position: "absolute", top: "58%", left: "50%", transform: "translate(-50%, -50%) rotate(-2deg)",
          width: "55%", textAlign: "center", color: "#1e293b", fontFamily: "'Inter', sans-serif"
        }}>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}
          >
            Live Analysis
          </motion.div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#3b82f6", lineHeight: 1.1, marginBottom: 8 }}>
            98% Match
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>
            Stanford University <br /> Computer Science
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] })
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const smoothY1 = useSpring(y1, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return (
    <div ref={containerRef} style={{ background: "#fff", color: "#0f172a", overflow: "hidden" }}>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 35s linear infinite; }
      `}</style>

      {/* ═══════════════════════════════════════
          SECTION 1 — Video Hero with Highlight
      ═══════════════════════════════════════ */}
      <div style={{ height: "100vh", width: "100%", padding: 10 }}>
        <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", borderRadius: 28 }}>

          <video autoPlay loop muted playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4" />

          {/* Floating Character Component */}
          <FloatingCharacter />

          <HeroHighlight
            containerClassName="absolute inset-0 bg-transparent dark:bg-transparent"
            className="w-full h-full flex flex-col items-start justify-end p-12 md:p-20"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ position: "absolute", top: 20, right: 28, zIndex: 50 }}>
              <Link href="/login"
                style={{ display: "inline-flex", alignItems: "center",
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.28)",
                  backdropFilter: "blur(12px)", borderRadius: 999, padding: "8px 22px",
                  fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none" }}>
                Sign In
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
              className="text-left"
            >
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold text-[#E1E0CC] tracking-tighter leading-none mb-6">
                Reach <Highlight className="text-[#E1E0CC] bg-gradient-to-r from-blue-500/20 to-purple-500/20">further.</Highlight>
              </h1>
              <div className="max-w-xl space-y-6">
                <p className="text-base md:text-lg text-[#E1E0CC]/80 leading-relaxed font-medium">
                  The intelligent outreach platform for landing research positions and internships.
                  Precision matching, AI drafts, and automated follow-ups.
                </p>
                <div className="flex justify-start">
                  <Link href="/signup" className="group px-6 py-3 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:bg-neutral-100 transition duration-200 shadow-2xl text-sm">
                    Get started free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </HeroHighlight>
        </div>
      </div>

      {/* University marquee */}
      <motion.div style={{ y: smoothY1 }} className="w-full border-y border-neutral-100 bg-neutral-50/50 py-12 relative z-10">
        <div className="flex overflow-hidden whitespace-nowrap">
          <div className="marquee-track flex items-center gap-16 px-8">
            {[...UNIS, ...UNIS].map((uni, i) => (
              <span key={i} className="text-sm font-bold tracking-widest text-neutral-400 uppercase">
                {uni}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════
          SECTION 2 — 3D Section Carousel
      ═══════════════════════════════════════ */}
      <SectionCarousel />

      {/* ═══════════════════════════════════════
          SECTION 3 — Final CTA (cloud video bg)
      ═══════════════════════════════════════ */}
      <div style={{ position: "relative", overflow: "hidden", padding: "120px 40px 100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <video autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center bottom", zIndex: 0 }}
          src="/hero-bg.mp4" />
        <div style={{ position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(to bottom, rgba(186,230,253,0.55) 0%, rgba(219,241,255,0.45) 40%, rgba(240,249,255,0.6) 100%)" }} />
        <div style={{ position: "relative", zIndex: 10, maxWidth: 800, width: "100%", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/60 border border-white/40 rounded-[3rem] p-12 md:p-24 shadow-2xl backdrop-blur-xl"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-8 tracking-tight leading-tight">
              Stop guessing. <br /> Start <span className="text-indigo-600">connecting.</span>
            </h2>
            <p className="text-lg text-neutral-600 mb-12 max-w-2xl mx-auto font-medium">
              Join thousands of students landing high-impact positions using OutreachAI's precision matching.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-200">
              Create Your Account
              <ArrowRight className="w-6 h-6" />
            </Link>
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
