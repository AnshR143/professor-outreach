"use client"
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight"
import { createClient } from "@/lib/supabase/client"

/* ─── Palette ────────────────────────────────────────────────
   #98bad5  medium blue-gray   → primary accent
   #b2cbde  light steel blue   → secondary / hover
   #c6d3e3  soft blue-gray     → light backgrounds
   #d8e1e8  very light         → lightest bg / pill bg
   #304674  dark navy          → borders, shadows, dark text
──────────────────────────────────────────────────────────── */

const FEATURES = [
  { title: "Smart Contact Matching",         desc: "Your resume is cross-referenced against professors and company contacts to surface the highest-fit targets automatically." },
  { title: "Personalized Email Drafts",      desc: "AI crafts tailored cold emails based on each recipient's work, interests, and your background  no generic templates." },
  { title: "Outreach Analytics",             desc: "Track open rates, reply statuses, and follow-up timing across your entire cold outreach pipeline in one place." },
  { title: "Contact Discovery",              desc: "Find researchers, professors, and internship contacts across academia and industry, all filtered by field and location." },
  { title: "Resume-Powered Personalization", desc: "Upload your CV once. Every email draft automatically pulls your skills, projects, and experience to match each contact." },
  { title: "Follow-up Engine",               desc: "Generate perfectly-timed follow-up emails that reference your original message and keep conversations moving forward." },
]

const HOW_STEPS = [
  { step: "01", title: "Upload your resume",     desc: "Paste or upload your CV. The parser extracts keywords, skills, and experience automatically." },
  { step: "02", title: "Find your targets",      desc: "Search for professors, researchers, or company contacts by field, location, or institution. Match scores update live." },
  { step: "03", title: "Generate & send emails", desc: "Click Generate  AI crafts a tailored cold email for each contact. Open Gmail pre-filled and hit send." },
]

const PRICING = [
  { plan: "Free", price: "$0", desc: "Everything you need to start your cold outreach.", features: ["Unlimited contacts", "AI email generation", "Resume parsing", "Match scoring", "Follow-up engine"], cta: "Get started", href: "/signup", primary: true },
  { plan: "Pro (coming soon)", price: "$12/mo", desc: "Advanced analytics and bulk outreach for serious applicants.", features: ["Everything in Free", "Bulk email campaigns", "Advanced analytics", "Priority support", "Custom templates"], cta: null, href: "#", primary: false },
]

const UNIS = ["MIT", "Stanford", "Harvard", "Oxford", "Cambridge", "ETH Zurich", "Berkeley", "Princeton", "Caltech", "UChicago", "Columbia", "Yale"]

/* ═══════════════════════════════════════════════════════════
   CAROUSEL SLIDES
═══════════════════════════════════════════════════════════ */
function FeaturesSlide() {
  return (
    <div style={{ padding: "18px 24px 16px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
        background: "#d8e1e8", border: "2px solid #304674", borderRadius: 999,
        padding: "3px 12px", marginBottom: 10, boxShadow: "2px 2px 0px #304674" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#304674", textTransform: "uppercase", letterSpacing: "0.1em" }}>Why InternLink</span>
      </div>
      <h2 style={{ fontSize: "clamp(16px,2.2vw,26px)", fontWeight: 800, color: "#304674",
        margin: "0 0 4px", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
        Everything you need for cold outreach{" "}
        <span style={{ color: "#98bad5" }}>
          that actually works
        </span>
      </h2>
      <p style={{ fontSize: 11, color: "#4a5568", margin: "0 0 14px", lineHeight: 1.5, maxWidth: 520 }}>
        Built for students and early-career professionals who want a systematic, AI-powered approach to reaching the right people.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {FEATURES.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "#fff", borderRadius: 12, padding: "10px 12px",
              border: "1px solid #c6d3e3",
            }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: "#304674", margin: "0 0 3px" }}>{f.title}</h3>
            <p style={{ fontSize: 10, color: "#4a5568", lineHeight: 1.45, margin: 0 }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function HowItWorksSlide() {
  return (
    <div style={{ padding: "18px 24px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "center" }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
          background: "#d8e1e8", border: "2px solid #304674", borderRadius: 999,
          padding: "3px 12px", marginBottom: 10, boxShadow: "2px 2px 0px #304674" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#304674", textTransform: "uppercase", letterSpacing: "0.1em" }}>Process</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,2.4vw,28px)", fontWeight: 800,
          color: "#304674", margin: "0 0 14px", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
          From zero to{" "}
          <span style={{ color: "#98bad5" }}>
            first reply
          </span>
        </h2>
        {HOW_STEPS.map((s, i) => (
          <motion.div key={s.step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", gap: 10, marginBottom: i < 2 ? 12 : 0 }}>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10,
                background: "#d8e1e8", border: "2px solid #304674",
                boxShadow: "2px 2px 0px #304674",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#304674" }}>{s.step}</span>
              </div>
              {i < 2 && <div style={{ width: 2, flex: 1, minHeight: 12, background: "#304674", opacity: 0.25 }} />}
            </div>
            <div style={{ paddingTop: 6 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "#304674", margin: "0 0 2px" }}>{s.title}</h3>
              <p style={{ fontSize: 11, color: "#4a5568", lineHeight: 1.45, margin: 0 }}>{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          borderRadius: 16, background: "#c6d3e3",
          border: "2px solid #304674", padding: 14,
          display: "flex", flexDirection: "column", gap: 10,
          boxShadow: "4px 4px 0px #304674",
        }}>
        {[
          { label: "Contacts discovered", value: "18 matches found",      dot: "#98bad5" },
          { label: "Email drafted",       value: "Personalised in 2s",    dot: "#304674" },
          { label: "Outreach status",     value: "4 replied · 3 pending", dot: "#10b981" },
        ].map((item) => (
          <div key={item.label} style={{ background: "#fff", borderRadius: 10, padding: "9px 13px",
            border: "2px solid #304674", boxShadow: "2px 2px 0px #304674" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.dot,
                border: "1.5px solid #304674", flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#304674", margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function PricingSlide() {
  return (
    <div style={{ padding: "18px 24px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
          background: "#d8e1e8", border: "2px solid #304674", borderRadius: 999,
          padding: "3px 12px", marginBottom: 8, boxShadow: "2px 2px 0px #304674" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#304674", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pricing</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,2.4vw,28px)", fontWeight: 800, color: "#304674",
          margin: "0 0 3px", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
          Simple, transparent{" "}
          <span style={{ color: "#98bad5" }}>pricing</span>
        </h2>
        <p style={{ fontSize: 12, color: "#4a5568", margin: 0 }}>Start free. No credit card required.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, maxWidth: 580, margin: "0 auto" }}>
        {PRICING.map((p, i) => (
          <motion.div key={p.plan}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: 16, padding: "14px 16px",
              background: p.primary ? "#d8e1e8" : "#fff",
              border: "2.5px solid #304674",
              boxShadow: p.primary ? "4px 4px 0px #304674" : "3px 3px 0px #304674",
            }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#304674",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{p.plan}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#304674", marginBottom: 3 }}>{p.price}</div>
            <p style={{ fontSize: 10.5, color: "#4a5568", lineHeight: 1.4, margin: "0 0 8px" }}>{p.desc}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px", display: "flex", flexDirection: "column", gap: 5 }}>
              {p.features.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "#4a5568" }}>
                  <CheckCircle style={{ width: 12, height: 12, color: "#98bad5", flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            {p.cta && (
              <Link href={p.href} style={{
                display: "block", textAlign: "center", padding: "7px 14px", borderRadius: 8,
                fontSize: 12, fontWeight: 800, textDecoration: "none",
                background: p.primary ? "linear-gradient(to right,#98bad5,#304674)" : "#fff",
                color: p.primary ? "#fff" : "#304674",
                border: "2px solid #304674",
                boxShadow: "2px 2px 0px #304674",
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

  const handleNext = useCallback(() => { setCurrent(prev => (prev + 1) % total) }, [total])
  const handlePrev = useCallback(() => { setCurrent(prev => (prev - 1 + total) % total) }, [total])

  return (
    <div id="carousel" style={{
      position: "relative", minHeight: "100vh", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "60px 0 60px",
      background: "linear-gradient(180deg, #d8e1e8 0%, #c6d3e3 60%, #d8e1e8 100%)",
    }}>
      {/* Ambient glow blobs */}
      <div style={{ pointerEvents: "none", position: "absolute", inset: 0, zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(152,186,213,0.35) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(48,70,116,0.18) 0%,transparent 70%)" }} />
      </div>

      {/* Tab pills */}
      <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 10, marginBottom: 32 }}>
        {SLIDES.map((slide, i) => (
          <button key={slide.id} onClick={() => setCurrent(i)} style={{
            border: "2.5px solid #304674",
            cursor: "pointer", padding: "7px 20px", borderRadius: 999, fontSize: 12, fontWeight: 800,
            letterSpacing: "0.04em",
            background: i === current ? "linear-gradient(to right,#98bad5,#304674)" : "#fff",
            color: i === current ? "#fff" : "#304674",
            transition: "all 0.25s ease",
            boxShadow: i === current ? "3px 3px 0px #304674" : "2px 2px 0px #304674",
            transform: i === current ? "translate(-1px,-1px)" : "none",
          }}>
            {slide.label}
          </button>
        ))}
      </div>

      {/* 3D Carousel track */}
      <div className="landing-carousel-track" style={{
        position: "relative", width: "100%", height: "470px",
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
            <div key={slide.id} className="landing-carousel-card" style={{
              position: "absolute",
              width: "min(690px, 72vw)", height: "448px",
              overflow: "hidden", borderRadius: 24,
              background: "#ffffff",
              border: "2.5px solid #304674",
              boxShadow: isCenter
                ? "4px 4px 0px #304674, 0 16px 48px rgba(48,70,116,0.18)"
                : "2px 2px 0px #304674",
              transform: `
                translateX(${offset * 88}%)
                rotateY(${offset * -14}deg)
                scale(${isCenter ? 1 : isAdjacent ? 0.82 : 0.68})
              `,
              transformOrigin: "center center",
              opacity: isCenter ? 1 : isAdjacent ? 0.38 : 0,
              filter: isCenter ? "blur(0px)" : isAdjacent ? "blur(6px)" : "blur(12px)",
              transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease, filter 0.5s ease, box-shadow 0.4s ease",
              zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
              visibility: Math.abs(offset) > 1 ? "hidden" : "visible",
              pointerEvents: isCenter ? "auto" : "none",
              willChange: "transform, filter, opacity",
            }}>
              <AnimatePresence mode="wait">
                {isCenter ? (
                  <motion.div
                    key={`${slide.id}-center`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="landing-carousel-card-inner"
                    style={{ height: "100%", overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
                    {slide.content}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`${slide.id}-side`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ height: "100%", overflow: "hidden", pointerEvents: "none" }}>
                    {/* Render content but disable interactivity and keep it faded/blurred */}
                    {slide.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Prev arrow */}
      <button onClick={handlePrev} style={{
        position: "absolute", left: "max(20px, 3vw)", top: "50%", transform: "translateY(-50%)",
        zIndex: 20, width: 44, height: 44, borderRadius: "50%",
        background: "#fff", border: "2.5px solid #304674", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "3px 3px 0px #304674", transition: "box-shadow 0.15s, transform 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "1px 1px 0px #304674"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) translate(2px,2px)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0px #304674"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%)" }}>
        <ChevronLeft style={{ width: 20, height: 20, color: "#304674" }} />
      </button>

      {/* Next arrow */}
      <button onClick={handleNext} style={{
        position: "absolute", right: "max(20px, 3vw)", top: "50%", transform: "translateY(-50%)",
        zIndex: 20, width: 44, height: 44, borderRadius: "50%",
        background: "#fff", border: "2.5px solid #304674", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "3px 3px 0px #304674", transition: "box-shadow 0.15s, transform 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "1px 1px 0px #304674"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) translate(2px,2px)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0px #304674"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%)" }}>
        <ChevronRight style={{ width: 20, height: 20, color: "#304674" }} />
      </button>

      {/* Dot indicators */}
      <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 8, marginTop: 28 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            border: "2px solid #304674", cursor: "pointer", padding: 0,
            width: i === current ? 28 : 10, height: 10, borderRadius: 999,
            background: i === current ? "linear-gradient(to right,#98bad5,#304674)" : "#fff",
            boxShadow: "2px 2px 0px #304674",
            transition: "all 0.3s ease",
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] })
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const smoothY1 = useSpring(y1, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
  }, [])

  return (
    <div ref={containerRef} style={{ background: "#fff", color: "#304674", overflow: "hidden" }}>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 35s linear infinite; }
        @media (min-width: 2000px) {
          .landing-hero-text h1 { font-size: 4.5rem !important; }
          .landing-hero-text p { font-size: 1.25rem !important; }
        }
      `}</style>

      {/* SECTION 1  Video Hero */}
      <div style={{ height: "100vh", width: "100%", padding: 10 }}>
        <div style={{
          position: "relative", height: "100%", width: "100%", overflow: "hidden", borderRadius: 28,
          // Fallback gradient  visible underneath the video so when iOS blocks
          // autoplay or shows the "tap to play" overlay, the section still
          // looks designed instead of black + ▶ icon.
          background: "linear-gradient(135deg, #1a2e52 0%, #304674 45%, #98bad5 100%)",
        }}>
          <video
            autoPlay loop muted playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            {...({ "webkit-playsinline": "true", "x5-playsinline": "true" } as Record<string, string>)}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
              // Block taps so iOS can't surface its native controls.
              pointerEvents: "none",
            }}
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4" />

          <HeroHighlight
            containerClassName="absolute inset-0 bg-transparent dark:bg-transparent"
            className="w-full h-full flex flex-col items-start justify-end p-12 md:p-20"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ position: "absolute", top: 20, right: 28, zIndex: 50 }}>
              <Link href={isLoggedIn ? "/dashboard" : "/signup"}
                style={{ display: "inline-flex", alignItems: "center",
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.28)",
                  backdropFilter: "blur(12px)", borderRadius: 999, padding: "8px 22px",
                  fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none" }}>
                {isLoggedIn ? "Dashboard" : "Sign Up"}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
              className="text-left"
            >
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-[#E1E0CC] tracking-tighter leading-none mb-4 flex items-center gap-3">
                <img src="/link.png" alt="Logo" style={{ height: "1em", width: "auto" }} />
                <span>Intern<Highlight className="text-[#1a2e52]">Link</Highlight></span>
              </h1>
              <div className="max-w-lg space-y-4">
                <p className="text-sm md:text-base text-[#E1E0CC]/80 leading-relaxed font-medium">
                  The intelligent outreach platform for landing research positions and internships.
                  Precision matching, AI drafts, and automated follow-ups.
                </p>
                <div className="flex justify-start">
                  <Link href="/signup" className="group px-6 py-3 bg-white text-black rounded-full font-bold flex items-center gap-2 text-sm"
                    style={{ border: "2.5px solid #304674", boxShadow: "3px 3px 0px #304674", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
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
      <div className="w-full border-y border-neutral-100 bg-neutral-50/50 py-12 relative z-10">
        <div className="flex overflow-hidden whitespace-nowrap">
          <div className="marquee-track flex items-center gap-16 px-8">
            {[...UNIS, ...UNIS].map((uni, i) => (
              <span key={i} className="text-sm font-bold tracking-widest text-neutral-400 uppercase">
                {uni}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2  3D Carousel */}
      <SectionCarousel />

      {/* SECTION 3  CTA with Wolf */}
      <div className="landing-cta-section" style={{
        position: "relative", overflow: "hidden",
        // Layered gradient mimics the video's cloudy navy look so when the
        // bg video fails to autoplay (common on iOS Low Power Mode), the
        // section still looks designed instead of plain black with a ▶.
        background: "radial-gradient(ellipse at 25% 40%, rgba(48,70,116,0.55) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(152,186,213,0.32) 0%, transparent 60%), #0a0f1e",
        padding: "80px 40px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "6vw",
        flexWrap: "wrap",
      }}>
        <video
          autoPlay muted loop playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          {...({ "webkit-playsinline": "true" } as Record<string, string>)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            opacity: 0.68, zIndex: 0,
            pointerEvents: "none",
          }}
          src="/hero-bg.mp4"
        />

        {/* Wolf with whiteboard */}
        <motion.div
          className="landing-wolf"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "min(322px, 29vw)", position: "relative", flexShrink: 0, zIndex: 1 }}
        >
          <img src="/husky.png.png" alt="InternLink Guide" style={{ width: "100%", height: "auto", display: "block" }} />
          <div className="landing-wolf-text" style={{
            position: "absolute", top: "62%", left: "50%", transform: "translate(-50%, -50%)",
            width: "68%", textAlign: "center", pointerEvents: "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            <p style={{ fontSize: "clamp(10px, 1.4vw, 17px)", fontWeight: 900, color: "#304674", lineHeight: 1.1, margin: 0 }}>Stop guessing.</p>
            <p style={{ fontSize: "clamp(10px, 1.4vw, 17px)", fontWeight: 900, color: "#304674", lineHeight: 1.1, margin: 0 }}>Start connecting.</p>
            <p style={{ fontSize: "clamp(7.5px, 0.85vw, 11px)", color: "#4a5568", lineHeight: 1.35, margin: "2px 0 0", maxWidth: "90%", fontWeight: 600 }}>
              AI-powered matching for high-impact positions.
            </p>
          </div>
        </motion.div>

        {/* Headline text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: 1, minWidth: 280, maxWidth: 540, zIndex: 1 }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(178,203,222,0.9)", marginBottom: 16, display: "block" }}>
            AI-Powered Cold Outreach
          </span>
          <p style={{ fontSize: "clamp(16px,1.4vw,22px)", color: "rgba(216,225,232,0.92)", fontWeight: 500, maxWidth: 460, lineHeight: 1.5, margin: "0 0 28px" }}>
            From first contact to first reply  automated, personalized, and precise.
          </p>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(to right,#98bad5,#304674)", color: "#fff",
            padding: "13px 28px", borderRadius: 12, fontSize: 15, fontWeight: 800,
            textDecoration: "none",
            border: "2.5px solid #304674", boxShadow: "4px 4px 0px #304674",
          }}>
            Get started free <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <div style={{ background: "#d8e1e8", borderTop: "2px solid #b2cbde",
        padding: "28px 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/link.png" alt="Logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#304674" }}>InternLink</span>
        </div>
        <p style={{ fontSize: 13, color: "#4a5568", margin: 0 }}>
          Built for students. Powered by AI. © 2025 InternLink.
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: "#4a5568", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "#304674"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "#4a5568"}>
              {l}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
