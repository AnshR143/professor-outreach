"use client"
import { motion, useInView, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Lenis from "@studio-freight/lenis"
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight"

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

/* ─── Feature card data (Icons removed as requested) ─── */
const FEATURES = [
  { title: "AI Match Scoring",     desc: "Your resume is cross-referenced against professors and company contacts to surface the highest-fit targets automatically." },
  { title: "Cold Email Generator",  desc: "AI-crafted emails tailored to each recipient — research papers for professors, role and company context for internships." },
  { title: "Outreach Analytics",   desc: "Track reply rates, email statuses, and follow-up timing across your entire professor and internship pipeline." },
  { title: "Dual Discovery",       desc: "Find professors at 500+ universities and internship contacts at top companies — all from one dashboard." },
  { title: "Resume Parsing",       desc: "Upload your PDF once. Every match, email, and contact suggestion automatically draws on your extracted skills." },
  { title: "Follow-up Engine",     desc: "Generate perfectly-timed follow-up emails that reference your original message — for both research and internship leads." },
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

const UNIS = ["MIT", "Stanford", "Harvard", "Carnegie Mellon", "Berkeley", "Princeton", "Yale", "Cornell", "Columbia", "Caltech"]

/* ═══════════════════════════════════════════════════════════
   CAROUSEL SECTION SLIDES
═══════════════════════════════════════════════════════════ */

function FeaturesSlide() {
  return (
    <div style={{ padding: "28px 32px 20px" }}>
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
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: 16, padding: "18px 18px",
              backdropFilter: "blur(10px)",
            }}>
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
            whileInView={{ opacity: 1, x: 0 }}
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
        whileInView={{ opacity: 1, scale: 1 }}
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
          Simple, transparent pricing
        </h2>
        <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>Start free. No credit card required.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, maxWidth: "100%" }}>
        {PRICING.map((p, i) => (
          <motion.div key={p.plan}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
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
                  <span style={{ color: "#3b82f6" }}>✓</span>
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

const SLIDES = [
  { id: "features",    label: "Features",      content: <FeaturesSlide /> },
  { id: "how",         label: "How It Works",  content: <HowItWorksSlide /> },
  { id: "pricing",     label: "Pricing",       content: <PricingSlide /> },
]

function SectionCarousel() {
  const [current, setCurrent] = useState(0)
  const total = SLIDES.length

  const handleNext = useCallback(() => setCurrent(prev => (prev + 1) % total), [total])
  const handlePrev = useCallback(() => setCurrent(prev => (prev - 1 + total) % total), [total])

  return (
    <div id="carousel" style={{
      position: "relative", minHeight: "100vh", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "60px 0 60px",
      background: "linear-gradient(180deg, #f0f7ff 0%, #eef2ff 60%, #f8faff 100%)",
    }}>
      <div style={{ pointerEvents: "none", position: "absolute", inset: 0, zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(79,70,229,0.14) 0%,transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 8, marginBottom: 32 }}>
        {SLIDES.map((slide, i) => (
          <button key={slide.id} onClick={() => setCurrent(i)} style={{
            border: "none", cursor: "pointer",
            padding: "7px 18px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.04em",
            background: i === current ? "linear-gradient(to right,#3b82f6,#4f46e5)" : "rgba(255,255,255,0.7)",
            color: i === current ? "#fff" : "#64748b",
            border: i === current ? "none" : "1px solid rgba(59,130,246,0.2)",
            transition: "all 0.3s ease",
            backdropFilter: "blur(8px)",
          }}>
            {slide.label}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", width: "100%", height: "620px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
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
                transformPerspective: 1200,
              }}
              animate={{
                x: `${offset * 90}%`,
                rotateY: offset * -12,
                scale: isCenter ? 1 : isAdjacent ? 0.83 : 0.68,
                opacity: isCenter ? 1 : isAdjacent ? 0.36 : 0,
                filter: isCenter ? "blur(0px)" : isAdjacent ? "blur(4px)" : "blur(10px)",
                visibility: isVisible ? "visible" : "hidden",
              }}
              transition={{ type: "spring", stiffness: 160, damping: 28, mass: 1.1 }}
            >
              <AnimatePresence mode="wait">
                <motion.div key={`${slide.id}-${current}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: "easeOut" }} style={{ height: "100%", overflowY: "auto" }}>
                  {slide.content}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      <button onClick={handlePrev} style={{ position: "absolute", left: "max(20px, 3vw)", top: "50%", transform: "translateY(-50%)", zIndex: 20, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.88)", border: "1px solid rgba(59,130,246,0.18)", backdropFilter: "blur(12px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ChevronLeft style={{ width: 20, height: 20, color: "#2563eb" }} />
      </button>

      <button onClick={handleNext} style={{ position: "absolute", right: "max(20px, 3vw)", top: "50%", transform: "translateY(-50%)", zIndex: 20, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.88)", border: "1px solid rgba(59,130,246,0.18)", backdropFilter: "blur(12px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ChevronRight style={{ width: 20, height: 20, color: "#2563eb" }} />
      </button>

      <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 8, marginTop: 28 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{ border: "none", cursor: "pointer", padding: 0, width: i === current ? 24 : 8, height: 8, borderRadius: 999, background: i === current ? "linear-gradient(to right,#3b82f6,#4f46e5)" : "rgba(59,130,246,0.25)", transition: "all 0.35s ease" }} />
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] })
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -400])
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 5])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05])
  
  const smoothY1 = useSpring(y1, { stiffness: 100, damping: 30, restDelta: 0.001 })
  const smoothY2 = useSpring(y2, { stiffness: 100, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return (
    <div ref={containerRef} style={{ overflowX: "hidden", background: "#fff" }}>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .marquee-track { animation: marquee 35s linear infinite; }
      `}</style>

      {/* ═══════════════════════════════════════
          SECTION 1 — Video Hero with Highlight
      ═══════════════════════════════════════ */}
      <div style={{ height: "100vh", width: "100%", padding: 10 }}>
        <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", borderRadius: 28 }}>
          
          {/* Original Video Background */}
          <video autoPlay loop muted playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4" />

          {/* Aceternity HeroHighlight as an overlay for the mouse-tracking dots */}
          <HeroHighlight 
            containerClassName="absolute inset-0 bg-transparent dark:bg-transparent" 
            className="w-full h-full flex flex-col items-start justify-end p-12 md:p-20"
          >
            {/* Original Sign In pill - restored position */}
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

      {/* University marquee with Parallax */}
      <motion.div style={{ y: smoothY1 }} className="w-full border-y border-neutral-100 bg-neutral-50/50 py-12 relative z-10">
        <div className="marquee-track flex gap-0 whitespace-nowrap">
          {[...UNIS, ...UNIS, ...UNIS, ...UNIS].map((u, i) => (
            <div key={i} className="inline-flex items-center">
              <span className="text-xs font-black text-neutral-300 tracking-widest uppercase px-16">{u}</span>
              <span className="text-neutral-200">·</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Parallax Floating Elements */}
      <div className="relative">
        <motion.div style={{ y: smoothY2, rotate }} className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10" />
        <motion.div style={{ y: smoothY1, scale }} className="absolute top-40 -right-20 w-80 h-80 bg-purple-50 rounded-full blur-3xl opacity-50 -z-10" />
        <SectionCarousel />
      </div>

      {/* ═══════════════════════════════════════
          SECTION 5 — Final CTA (with cloud video bg)
      ═══════════════════════════════════════ */}
      <div style={{ position: "relative", overflow: "hidden", padding: "120px 40px 100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Cloud video background */}
        <video autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center bottom", zIndex: 0 }}
          src="/hero-bg.mp4" />
        
        {/* Overlay for readability */}
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

      {/* Simple Footer */}
      <footer className="border-t border-neutral-100 py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-8 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-neutral-900">OutreachAI</span>
        </div>
        <p className="text-sm text-neutral-400">© 2025 OutreachAI. Built for researchers and interns.</p>
        <div className="flex gap-8">
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" className="text-sm text-neutral-400 hover:text-neutral-900 transition">{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
