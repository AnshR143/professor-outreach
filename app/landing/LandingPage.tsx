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
      background: isScrolled ? "rgba(253, 252, 251, 0.9)" : "transparent",
      backdropFilter: isScrolled ? "blur(12px)" : "none",
      borderBottom: isScrolled ? "1px solid rgba(28, 28, 28, 0.05)" : "none"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1400, margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 700, color: "#1C1C1C", textDecoration: "none", fontFamily: "'Instrument Serif', serif", letterSpacing: "-0.02em" }}>
          OutreachAI
        </Link>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1C", textDecoration: "none", opacity: 0.7 }}>Login</Link>
          <Link href="/signup" style={{ 
            fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: "none", 
            background: "#1C1C1C", padding: "8px 20px", borderRadius: 4, transition: "opacity 0.2s"
          }} onMouseEnter={e => e.currentTarget.style.opacity = "0.9"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
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
      background: "#FDFCFB", color: "#1C1C1C", minHeight: "100vh", 
      fontFamily: "'Plus Jakarta Sans', sans-serif" 
    }}>
      <Nav />

      {/* Hero Section */}
      <section style={{ 
        height: "100vh", position: "relative", display: "flex", alignItems: "flex-end", 
        padding: "0 80px 100px", overflow: "hidden" 
      }}>
        {/* Background Video (Restored) */}
        <video autoPlay loop muted playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4" />
        
        {/* Editorial Gradient Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(253, 252, 251, 0.9) 0%, rgba(253, 252, 251, 0.4) 40%, transparent 100%)", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 1000 }}>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
              fontSize: "clamp(48px, 10vw, 160px)", lineHeight: 0.9, 
              fontFamily: "'Instrument Serif', serif", margin: "0 0 24px", letterSpacing: "-0.04em" 
            }}>
            Reach <span style={{ fontStyle: "italic", color: "#D97706" }}>further.</span>
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
                fontSize: 15, fontWeight: 700, color: "#1C1C1C", textDecoration: "none",
                padding: "16px 32px", border: "1px solid #1C1C1C", borderRadius: 4,
                transition: "all 0.3s ease"
              }} onMouseEnter={e => { e.currentTarget.style.background = "#1C1C1C"; e.currentTarget.style.color = "#fff" }} 
                 onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1C1C1C" }}>
                Begin Discovery <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee (Editorial style) */}
      <section style={{ padding: "60px 0", borderBottom: "1px solid rgba(28, 28, 28, 0.05)" }}>
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

      {/* Features Section (Non-grid, editorial) */}
      <section style={{ padding: "160px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 120 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#D97706", marginBottom: 16, display: "block" }}>Platform</span>
            <h2 style={{ fontSize: 64, fontFamily: "'Instrument Serif', serif", lineHeight: 1, letterSpacing: "-0.03em", margin: "0 0 32px" }}>
              High-fidelity <br /> connections at <br /> scale.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.6, maxWidth: 400 }}>
              We've automated the friction out of professional discovery. No more manual searching or generic templating. Just precision.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 60, paddingTop: 40 }}>
            {FEATURES.map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                style={{ borderBottom: "1px solid rgba(28, 28, 28, 0.08)", paddingBottom: 32 }}>
                <h3 style={{ fontSize: 24, fontFamily: "'Instrument Serif', serif", margin: "0 0 12px" }}>{f.title}</h3>
                <p style={{ fontSize: 15, opacity: 0.6, margin: 0, maxWidth: 450 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Narrative Section with Custom Image */}
      <section style={{ padding: "80px", background: "#1C1C1C", color: "#FDFCFB" }}>
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
              fontSize: 14, fontWeight: 700, color: "#FDFCFB", textDecoration: "none", 
              borderBottom: "2px solid #D97706", paddingBottom: 4 
            }}>
              Join the cohort
            </Link>
          </div>
        </div>
      </section>

      {/* Cloud Final Section (Restored & Styled) */}
      <section style={{ position: "relative", height: "80vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <video autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
          src="/hero-bg.mp4" />
        
        <div style={{ position: "absolute", inset: 0, background: "rgba(253, 252, 251, 0.7)", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 600 }}>
          <h2 style={{ fontSize: 64, fontFamily: "'Instrument Serif', serif", margin: "0 0 32px", letterSpacing: "-0.03em" }}>
            The future of <br /> outreach is personal.
          </h2>
          <Link href="/signup" style={{ 
            display: "inline-flex", background: "#1C1C1C", color: "#FDFCFB", 
            padding: "20px 48px", borderRadius: 4, fontWeight: 700, textDecoration: "none",
            transition: "transform 0.2s"
          }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            Start for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "80px", borderTop: "1px solid rgba(28, 28, 28, 0.05)" }}>
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
                    <a key={i} href="#" style={{ fontSize: 13, color: "#1C1C1C", textDecoration: "none", opacity: 0.6 }}>Link {i}</a>
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
