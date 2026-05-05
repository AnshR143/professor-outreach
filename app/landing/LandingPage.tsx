"use client"
import { motion, useInView, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Lenis from "@studio-freight/lenis"
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight"

const FEATURES = [
  { title: "Match Scoring",     desc: "Your resume is cross-referenced against professors and company contacts to surface the highest-fit targets automatically." },
  { title: "Draft Generation",  desc: "Personalized outreach drafts are created for every target, incorporating their research interests and your background." },
  { title: "Institutional Discovery", desc: "Browse a global database of researchers and internships across 500+ top-tier universities and companies." },
  { title: "Automated Tracking", desc: "Manage your outreach pipeline with intelligent follow-up reminders and response tracking." },
]

const UNIS = ["MIT", "Stanford", "Harvard", "Oxford", "Cambridge", "ETH Zurich", "Berkeley", "Princeton", "Caltech", "UChicago", "Columbia", "Yale"]

function Nav() {
  const [isScrolled, setIsScrolled] = useState(false)
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav style={{ 
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: isScrolled ? "12px 40px" : "24px 40px",
      transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      background: isScrolled ? "rgba(255, 255, 255, 0.8)" : "transparent",
      backdropFilter: isScrolled ? "blur(12px)" : "none",
      borderBottom: isScrolled ? "1px solid rgba(59, 130, 246, 0.1)" : "none"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowRight style={{ width: 16, height: 16, color: "#fff" }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>OutreachAI</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 14, fontWeight: 600, color: "#475569", textDecoration: "none" }}>Login</Link>
          <Link href="/signup" style={{ 
            fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none", 
            background: "#3b82f6", padding: "10px 24px", borderRadius: 12, boxShadow: "0 4px 14px 0 rgba(59, 130, 246, 0.39)"
          }}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}

function SectionCarousel() {
  const [current, setCurrent] = useState(0)
  const total = FEATURES.length

  const handleNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total)
  }, [total])

  const handlePrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total)
  }, [total])

  return (
    <div style={{ position: "relative", width: "100%", height: 600, display: "flex", justifyContent: "center", alignItems: "center", perspective: "1000px" }}>
      {FEATURES.map((f, i) => {
        const offset = (i - current + total) % total
        const isCenter = offset === 0
        const isNext = offset === 1 || (offset === -total + 1)
        const isPrev = offset === total - 1 || (offset === -1)
        
        let zIndex = 0
        let x = 0
        let rotateY = 0
        let scale = 0.8
        let opacity = 0
        
        if (isCenter) {
          zIndex = 30; x = 0; rotateY = 0; scale = 1; opacity = 1
        } else if (isNext) {
          zIndex = 20; x = 120; rotateY = -15; scale = 0.9; opacity = 0.4
        } else if (isPrev) {
          zIndex = 20; x = -120; rotateY = 15; scale = 0.9; opacity = 0.4
        }

        return (
          <motion.div
            key={i}
            animate={{ x, rotateY, scale, opacity, zIndex }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ 
              position: "absolute", width: "min(500px, 85vw)", padding: "40px",
              background: "#fff", borderRadius: 32, border: "1px solid rgba(59, 130, 246, 0.12)",
              boxShadow: "0 25px 60px rgba(59, 130, 246, 0.1)", textAlign: "center",
              cursor: "pointer", backfaceVisibility: "hidden"
            }}
            onClick={() => { if (!isCenter) setCurrent(i) }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>{f.title}</h3>
            <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
          </motion.div>
        )
      })}
      
      <div style={{ position: "absolute", bottom: 20, display: "flex", gap: 16, zIndex: 40 }}>
        <button onClick={handlePrev} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <ChevronLeft style={{ width: 20, height: 20, color: "#64748b" }} />
        </button>
        <button onClick={handleNext} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <ChevronRight style={{ width: 20, height: 20, color: "#64748b" }} />
        </button>
      </div>
    </div>
  )
}

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

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] })
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -400])
  const scale = useTransform(scrollYProgress, [0.8, 1], [1, 0.9])
  
  const smoothY1 = useSpring(y1, { stiffness: 100, damping: 30 })
  const smoothY2 = useSpring(y2, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return (
    <div ref={containerRef} style={{ background: "#fff", color: "#0f172a", overflow: "hidden" }}>
      <Nav />

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
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .marquee-track { animation: marquee 35s linear infinite; }
        `}</style>
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

      {/* Feature Carousel */}
      <div className="py-32 px-4 bg-white relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">Capabilities</span>
          <h2 className="text-4xl md:text-6xl font-black text-neutral-900 mt-4 tracking-tight">
            Designed for impact.
          </h2>
        </div>
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
