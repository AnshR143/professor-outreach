"use client"
import { motion, useInView, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Lenis from "@studio-freight/lenis"

const FEATURES = [
  { title: "Match Scoring",     desc: "Precision cross-referencing against global professor and corporate contact databases." },
  { title: "Draft Generation",  desc: "Context-aware emails tailored to specific research papers or corporate roles." },
  { title: "Lead Intelligence", desc: "Real-time discovery across 500+ universities and top-tier global companies." },
  { title: "Timeline Engine",   desc: "Algorithmic follow-ups designed to maintain engagement without friction." },
]

const UNIS = ["MIT", "Stanford", "Harvard", "Oxford", "Cambridge", "ETH Zurich", "Berkeley", "Princeton"]

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
      background: isScrolled ? "rgba(240, 249, 255, 0.85)" : "transparent",
      backdropFilter: isScrolled ? "blur(12px)" : "none",
      borderBottom: isScrolled ? "1px solid rgba(2, 132, 199, 0.1)" : "none"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1400, margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 700, color: "#0C4A6E", textDecoration: "none", fontFamily: "'Instrument Serif', serif", letterSpacing: "-0.02em" }}>
          OutreachAI
        </Link>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: "#0C4A6E", textDecoration: "none", opacity: 0.7 }}>Login</Link>
          <Link href="/signup" style={{ 
            fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: "none", 
            background: "#0284C7", padding: "8px 20px", borderRadius: 4, transition: "opacity 0.2s"
          }} onMouseEnter={e => e.currentTarget.style.opacity = "0.9"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}

function FeaturesSlide() {
  return (
    <div style={{ padding: "40px" }}>
      <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#0284C7", marginBottom: 12, display: "block" }}>Innovation</span>
      <h2 style={{ fontSize: 42, fontFamily: "'Instrument Serif', serif", lineHeight: 1.1, color: "#0C4A6E", margin: "0 0 24px" }}>
        Tools for the <br /> <span style={{ fontStyle: "italic" }}>modern researcher.</span>
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
        {FEATURES.map((f, i) => (
          <div key={f.title} style={{ padding: "20px", background: "rgba(2, 132, 199, 0.03)", border: "1px solid rgba(2, 132, 199, 0.1)", borderRadius: 4 }}>
            <h3 style={{ fontSize: 18, fontFamily: "'Instrument Serif', serif", color: "#0C4A6E", margin: "0 0 8px" }}>{f.title}</h3>
            <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function HowItWorksSlide() {
  return (
    <div style={{ padding: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
      <div>
        <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#0284C7", marginBottom: 12, display: "block" }}>Workflow</span>
        <h2 style={{ fontSize: 42, fontFamily: "'Instrument Serif', serif", lineHeight: 1.1, color: "#0C4A6E", margin: "0 0 24px" }}>
          From zero to <br /> <span style={{ fontStyle: "italic" }}>meaningful impact.</span>
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            { step: "01", title: "Intel Ingestion", desc: "Our engine parses your CV to build a semantic profile." },
            { step: "02", title: "Target Mapping", desc: "We map your profile against global institutional databases." },
            { step: "03", title: "Narrative Craft", desc: "AI generates bespoke drafts based on deep context matching." }
          ].map((s) => (
            <div key={s.step} style={{ display: "flex", gap: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0284C7", fontFamily: "'Instrument Serif', serif" }}>{s.step}</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>{s.title}</h3>
                <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "rgba(2, 132, 199, 0.05)", borderRadius: 12, padding: 32, border: "1px solid rgba(2, 132, 199, 0.1)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 60, background: "#fff", borderRadius: 4, display: "flex", alignItems: "center", padding: "0 16px", border: "1px solid rgba(2, 132, 199, 0.08)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0284C7", marginRight: 12 }} />
              <div style={{ height: 8, width: 120, background: "rgba(2, 132, 199, 0.1)", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const SLIDES = [
  { id: "features", label: "Capabilities", content: <FeaturesSlide /> },
  { id: "how", label: "The Process", content: <HowItWorksSlide /> },
]

function SectionCarousel() {
  const [current, setCurrent] = useState(0)
  const total = SLIDES.length
  const handleNext = useCallback(() => setCurrent(prev => (prev + 1) % total), [total])
  const handlePrev = useCallback(() => setCurrent(prev => (prev - 1 + total) % total), [total])

  return (
    <div style={{ 
      padding: "160px 0", background: "rgba(2, 132, 199, 0.02)", 
      display: "flex", flexDirection: "column", alignItems: "center", gap: 60 
    }}>
      <div style={{ display: "flex", gap: 8 }}>
        {SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(i)} style={{
            padding: "8px 24px", borderRadius: 4, fontSize: 12, fontWeight: 700,
            background: i === current ? "#0284C7" : "transparent",
            color: i === current ? "#fff" : "#0C4A6E",
            border: i === current ? "none" : "1px solid rgba(2, 132, 199, 0.2)",
            cursor: "pointer", transition: "all 0.3s"
          }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", width: "100%", height: 600, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {SLIDES.map((slide, index) => {
          let offset = index - current
          const isCenter = offset === 0
          return (
            <motion.div
              key={slide.id}
              style={{
                position: "absolute", width: "min(1000px, 90vw)", height: 500,
                background: "#fff", borderRadius: 8, border: "1px solid rgba(2, 132, 199, 0.1)",
                boxShadow: "0 20px 40px rgba(2, 132, 199, 0.05)",
                display: isCenter ? "block" : "none"
              }}
              animate={{
                x: offset * 100,
                scale: isCenter ? 1 : 0.9,
                opacity: isCenter ? 1 : 0,
              }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {slide.content}
            </motion.div>
          )
        })}
        
        <button onClick={handlePrev} style={{ position: "absolute", left: 40, background: "none", border: "none", cursor: "pointer", color: "#0C4A6E" }}>
          <ChevronLeft size={32} />
        </button>
        <button onClick={handleNext} style={{ position: "absolute", right: 40, background: "none", border: "none", cursor: "pointer", color: "#0C4A6E" }}>
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] })
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -300])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return (
    <div ref={containerRef} style={{ 
      background: "#F0F9FF", color: "#0C4A6E", minHeight: "100vh", 
      fontFamily: "'Plus Jakarta Sans', sans-serif" 
    }}>
      <Nav />

      {/* Hero Section */}
      <section style={{ 
        height: "100vh", position: "relative", display: "flex", alignItems: "flex-end", 
        padding: "0 80px 100px", overflow: "hidden" 
      }}>
        {/* Background Video (Restored - NO OVERLAY) */}
        <video autoPlay loop muted playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4" />
        
        {/* Subtle Bottom-only Gradient for legibility */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, rgba(240, 249, 255, 1) 0%, rgba(240, 249, 255, 0) 100%)", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 1000 }}>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
              fontSize: "clamp(48px, 10vw, 160px)", lineHeight: 0.9, 
              fontFamily: "'Instrument Serif', serif", margin: "0 0 24px", letterSpacing: "-0.04em" 
            }}>
            Reach <span style={{ fontStyle: "italic", color: "#0284C7" }}>further.</span>
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 80, alignItems: "flex-end" }}>
            <p style={{ fontSize: 18, lineHeight: 1.5, margin: 0, opacity: 0.8, maxWidth: 500 }}>
              The intelligence layer for academic and corporate outreach. Precision matching, context-aware drafting, and institutional discovery.
            </p>
            <div>
              <Link href="/signup" style={{ 
                display: "inline-flex", alignItems: "center", gap: 12, 
                fontSize: 15, fontWeight: 700, color: "#0284C7", textDecoration: "none",
                padding: "16px 32px", border: "1px solid #0284C7", borderRadius: 4,
                transition: "all 0.3s ease"
              }} onMouseEnter={e => { e.currentTarget.style.background = "#0284C7"; e.currentTarget.style.color = "#fff" }} 
                 onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#0284C7" }}>
                Begin Discovery <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee (Editorial style) */}
      <section style={{ padding: "60px 0", borderBottom: "1px solid rgba(2, 132, 199, 0.1)" }}>
        <div style={{ overflow: "hidden", display: "flex", gap: 100 }}>
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            style={{ display: "flex", gap: 100, whiteSpace: "nowrap", alignItems: "center" }}>
            {[...UNIS, ...UNIS].map((u, i) => (
              <span key={i} style={{ 
                fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", 
                textTransform: "uppercase", opacity: 0.4 
              }}>{u}</span>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionCarousel />

      {/* Narrative Section with Custom Image */}
      <section style={{ padding: "80px", background: "#0C4A6E", color: "#F0F9FF" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 100, alignItems: "center" }}>
          <div style={{ position: "relative", height: 600, overflow: "hidden", borderRadius: 4 }}>
            <img 
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=2070" 
              alt="Research abstract" 
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} 
            />
          </div>
          <div>
            <h2 style={{ fontSize: 48, fontFamily: "'Instrument Serif', serif", margin: "0 0 24px", lineHeight: 1.1 }}>
              Discovery is not a <br /> numbers game.
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.6, opacity: 0.7, margin: "0 0 40px" }}>
              Our engine understands the nuances of research interests and corporate requirements. We surface the matches that actually matter, then help you craft the narrative that wins.
            </p>
            <Link href="/signup" style={{ 
              fontSize: 14, fontWeight: 700, color: "#F0F9FF", textDecoration: "none", 
              borderBottom: "2px solid #0284C7", paddingBottom: 4 
            }}>
              Join the cohort
            </Link>
          </div>
        </div>
      </section>

      {/* Cloud Final Section (Restored & Styled - More Visible) */}
      <section style={{ position: "relative", height: "80vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <video autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
          src="/hero-bg.mp4" />
        
        {/* Much more transparent overlay to show off the clouds */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(240, 249, 255, 0.45)", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 600 }}>
          <h2 style={{ fontSize: 64, fontFamily: "'Instrument Serif', serif", margin: "0 0 32px", letterSpacing: "-0.03em" }}>
            The future of <br /> outreach is personal.
          </h2>
          <Link href="/signup" style={{ 
            display: "inline-flex", background: "#0C4A6E", color: "#F0F9FF", 
            padding: "20px 48px", borderRadius: 4, fontWeight: 700, textDecoration: "none",
            transition: "transform 0.2s"
          }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            Start for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "80px", borderTop: "1px solid rgba(2, 132, 199, 0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", maxWidth: 1400, margin: "0 auto" }}>
          <div>
            <h3 style={{ fontSize: 24, fontFamily: "'Instrument Serif', serif", margin: "0 0 12px" }}>OutreachAI</h3>
            <p style={{ fontSize: 13, opacity: 0.5 }}>© 2025 OutreachAI. Built for researchers and interns.</p>
          </div>
          <div style={{ display: "flex", gap: 64 }}>
            {["Platform", "Resources", "Legal"].map(col => (
              <div key={col}>
                <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>{col}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3].map(i => (
                    <a key={i} href="#" style={{ fontSize: 13, color: "#0C4A6E", textDecoration: "none", opacity: 0.6 }}>Link {i}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
