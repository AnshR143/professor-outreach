"use client"
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight, CheckCircle, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { useRef, useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import Lenis from "lenis"
import { Feature1 } from "@/components/ui/feature-1"
import { Navbar } from "@/components/landing/Navbar"
import { TestimonialsMarquee } from "@/components/ui/testimonials-marquee"

function FloatingStar({ top, left, size = 40, delay = 0, rotation = 0, speed = 1, spin = true, parallax }: {
  top: string, left: string, size?: number, delay?: number, rotation?: number, speed?: number, spin?: boolean, parallax?: any
}) {
  return (
    <motion.div className="floating-star-wrapper" style={{ position: "absolute", top, left, width: size, height: size, zIndex: 300, pointerEvents: "none", y: parallax }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.7, 1, 0.7],
          y: [0, -18, 0],
          rotate: spin ? [rotation, rotation + 360] : rotation,
        }}
        transition={{
          duration: (10 + Math.random() * 5) / speed,
          repeat: Infinity,
          delay,
          ease: "easeInOut"
        }}
        style={{ width: "100%", height: "100%", willChange: "transform" }}
      >
        <img src="/star.png.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </motion.div>
    </motion.div>
  )
}

const FEATURES = [
  { title: "Smart Contact Matching",         desc: "Your resume is cross-referenced against professors and company contacts to surface the highest-fit targets automatically." },
  { title: "Personalized Email Drafts",      desc: "AI crafts tailored cold emails based on each recipient's work, interests, and your background – no generic templates." },
  { title: "Outreach Analytics",             desc: "Track open rates, reply statuses, and follow-up timing across your entire cold outreach pipeline in one place." },
  { title: "Contact Discovery",              desc: "Find researchers, professors, and internship contacts across academia and industry, all filtered by field and location." },
  { title: "Resume-Powered Personalization", desc: "Upload your CV once. Every email draft automatically pulls your skills, projects, and experience to match each contact." },
  { title: "Follow-up Engine",               desc: "Generate perfectly-timed follow-up emails that reference your original message and keep conversations moving forward." },
]
const HOW_STEPS = [
  { step: "01", title: "Upload your resume",     desc: "Paste or upload your CV. The parser extracts keywords, skills, and experience automatically." },
  { step: "02", title: "Find your targets",      desc: "Search for professors, researchers, or company contacts by field, location, or institution. Match scores update live." },
  { step: "03", title: "Generate & send emails", desc: "Click Generate – AI crafts a tailored cold email for each contact. Open Gmail pre-filled and hit send." },
]
const PRICING = [
  { plan: "Free", price: "$0", desc: "Everything you need to start your cold outreach.", features: ["Unlimited contacts", "AI email generation", "Resume parsing", "Match scoring", "Follow-up engine"], cta: "Get started", href: "/signup", primary: true },
  { plan: "Pro (coming soon)", price: "$12/mo", desc: "Advanced analytics and bulk outreach for serious applicants.", features: ["Everything in Free", "Bulk email campaigns", "Advanced analytics", "Priority support", "Custom templates"], cta: null, href: "#", primary: false },
]
const UNIS = ["MIT", "Stanford", "Harvard", "Oxford", "Cambridge", "ETH Zurich", "Berkeley", "Princeton", "Caltech", "UChicago", "Columbia", "Yale"]

function UniversityMarquee() {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef   = useRef(0)
  const speedRef = useRef(1)
  const hoveredRef = useRef(false)
  const rafRef   = useRef<number>()

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let singleWidth = 0
    let pps = 0
    let lastTime = performance.now()

    function tick(now: number) {
      if (singleWidth === 0) {
        singleWidth = track.scrollWidth / 2
        pps = singleWidth / 35
      }
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      const target = hoveredRef.current ? 0 : 1
      speedRef.current += (target - speedRef.current) * (1 - Math.exp(-dt * 3.5))
      posRef.current -= pps * dt * speedRef.current
      if (posRef.current <= -singleWidth) posRef.current += singleWidth
      track.style.transform = `translateX(${posRef.current}px) translateZ(0)`
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <div
      className="py-12 relative"
      style={{ background: "#d8e1e8" }}
      onMouseEnter={() => { hoveredRef.current = true }}
      onMouseLeave={() => { hoveredRef.current = false }}
    >
      <div className="flex overflow-hidden whitespace-nowrap">
        <div ref={trackRef} className="flex items-center gap-16 px-8" style={{ willChange: "transform" }}>
          {[...UNIS, ...UNIS].map((uni, i) => (
            <div key={i} className="flex items-center gap-16">
              <span className="text-sm font-bold tracking-widest text-black uppercase">{uni}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ title, desc, index }: { title: string, desc: string, index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => setIsOpen(!isOpen)}
      style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", border: isOpen ? "2.5px solid #304674" : "1.5px solid #c6d3e3", cursor: "pointer", transition: "all 0.3s ease", boxShadow: isOpen ? "4px 4px 0px #304674" : "none", transform: isOpen ? "translate(-2px, -2px)" : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 12, fontWeight: 800, color: "#304674", margin: 0 }}>{title}</h3>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} style={{ color: "#98bad5" }}><ChevronDown size={14} /></motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.p initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: "auto", opacity: 1, marginTop: 8 }} exit={{ height: 0, opacity: 0, marginTop: 0 }}
            style={{ fontSize: 11, color: "#4a5568", lineHeight: 1.5, margin: 0, overflow: "hidden" }}>{desc}</motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function FeaturesSlide() {
  return (
    <div style={{ padding: "18px 24px 16px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#d8e1e8", border: "2px solid #304674", borderRadius: 999, padding: "3px 12px", marginBottom: 10, boxShadow: "2px 2px 0px #304674" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#304674", textTransform: "uppercase", letterSpacing: "0.1em" }}>Why InternLink</span>
      </div>
      <h2 style={{ fontSize: "clamp(16px,2.2vw,26px)", fontWeight: 800, color: "#304674", margin: "0 0 4px", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
        Everything you need for cold outreach{" "}<span style={{ color: "#98bad5" }}>that actually works</span>
      </h2>
      <p style={{ fontSize: 11, color: "#4a5568", margin: "0 0 14px", lineHeight: 1.5, maxWidth: 520 }}>Built for students and early-career professionals. Click a feature to learn more.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {FEATURES.map((f, i) => <FeatureItem key={f.title} title={f.title} desc={f.desc} index={i} />)}
      </div>
    </div>
  )
}

function HowItWorksSlide() {
  const STATS = [
    { label: "Contacts discovered", value: "18 matches found",      dot: "#98bad5" },
    { label: "Email drafted",       value: "Personalised in 2s",    dot: "#304674" },
    { label: "Outreach status",     value: "4 replied · 3 pending", dot: "#10b981" },
  ]
  return (
    <div style={{ padding: "20px 24px 18px", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#d8e1e8", border: "2px solid #304674", borderRadius: 999, padding: "3px 12px", marginBottom: 10, boxShadow: "2px 2px 0px #304674" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#304674", textTransform: "uppercase", letterSpacing: "0.1em" }}>Process</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,2.2vw,26px)", fontWeight: 800, color: "#304674", margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
          From zero to{" "}<span style={{ color: "#98bad5" }}>first reply</span>
        </h2>
      </div>

      {/* Steps + Stats — same grid row, stretch to equal height */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1, alignItems: "stretch", minHeight: 0 }}>

        {/* Left: steps fill the column height evenly */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {HOW_STEPS.map((s, i) => (
            <motion.div key={s.step} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.08 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", alignItems: "center", gap: 14, background: "#f8f9fb", borderRadius: 12, padding: "14px 16px", border: "2px solid #c6d3e3", boxShadow: "3px 3px 0px #c6d3e3" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#d8e1e8", border: "2px solid #304674", boxShadow: "3px 3px 0px #304674", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#304674" }}>{s.step}</span>
              </div>
              <h3 style={{ fontSize: "clamp(12px, 1.3vw, 16px)", fontWeight: 800, color: "#304674", margin: 0, lineHeight: 1.2 }}>{s.title}</h3>
            </motion.div>
          ))}
        </div>

        {/* Right: stats panel — same height as steps column */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ borderRadius: 16, background: "#c6d3e3", border: "2px solid #304674", padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "4px 4px 0px #304674" }}>
          {STATS.map((item) => (
            <div key={item.label} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: "2px solid #304674", boxShadow: "2px 2px 0px #304674" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, border: "1.5px solid #304674", flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#304674", margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function PricingSlide() {
  return (
    <div style={{ padding: "18px 24px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#d8e1e8", border: "2px solid #304674", borderRadius: 999, padding: "3px 12px", marginBottom: 8, boxShadow: "2px 2px 0px #304674" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#304674", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pricing</span>
        </div>
        <h2 style={{ fontSize: "clamp(18px,2.4vw,28px)", fontWeight: 800, color: "#304674", margin: "0 0 3px", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
          Simple, transparent{" "}<span style={{ color: "#98bad5" }}>pricing</span>
        </h2>
        <p style={{ fontSize: 12, color: "#4a5568", margin: 0 }}>Start free. No credit card required.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[580px] mx-auto">
        {PRICING.map((p, i) => (
          <motion.div key={p.plan} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ borderRadius: 16, padding: "14px 16px", background: p.primary ? "#d8e1e8" : "#fff", border: "2.5px solid #304674", boxShadow: p.primary ? "4px 4px 0px #304674" : "3px 3px 0px #304674" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#304674", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{p.plan}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#304674", marginBottom: 3 }}>{p.price}</div>
            <p style={{ fontSize: 10.5, color: "#4a5568", lineHeight: 1.4, margin: "0 0 8px" }}>{p.desc}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px", display: "flex", flexDirection: "column", gap: 5 }}>
              {p.features.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "#4a5568" }}>
                  <CheckCircle style={{ width: 12, height: 12, color: "#98bad5", flexShrink: 0 }} />{f}
                </li>
              ))}
            </ul>
            {p.cta && (
              <Link href={p.href} style={{ display: "block", textAlign: "center", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, textDecoration: "none", background: p.primary ? "linear-gradient(to right,#98bad5,#304674)" : "#fff", color: p.primary ? "#fff" : "#304674", border: "2px solid #304674", boxShadow: "2px 2px 0px #304674" }}>
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
  { id: "features", label: "Features",     content: <FeaturesSlide /> },
  { id: "how",      label: "How It Works", content: <HowItWorksSlide /> },
  { id: "pricing",  label: "Pricing",      content: <PricingSlide /> },
]

function SectionCarousel({ ySlow, yReverse, isMobile }: { ySlow: any, yReverse: any, isMobile: boolean }) {
  const [current, setCurrent] = useState(0)
  const total = SLIDES.length
  const handleNext = useCallback(() => { setCurrent(prev => (prev + 1) % total) }, [total])
  const handlePrev = useCallback(() => { setCurrent(prev => (prev - 1 + total) % total) }, [total])
  return (
    <div id="carousel" className="py-12 md:py-20 lg:py-24 flex flex-col items-center justify-center relative min-h-[100vh]" style={{ background: "linear-gradient(180deg, #d8e1e8 0%, #c6d3e3 60%, #d8e1e8 100%)" }}>
      {/* Internal carousel clouds — stay within section */}
      <div style={{ pointerEvents: "none", position: "absolute", inset: 0, zIndex: 25, overflow: "visible" }}>
        <motion.img src="/cloud-4.png" animate={{ x: [0, 20, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="hidden sm:block absolute top-[-18%] left-[2%] w-[500px] opacity-50 pointer-events-none"
          style={{ willChange: "transform", y: ySlow }} />
        <motion.img src="/cloud-2.png" animate={{ x: [0, -25, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="hidden sm:block absolute bottom-[30%] right-[2%] w-[520px] opacity-65 pointer-events-none scale-x-[-1]"
          style={{ willChange: "transform", y: yReverse }} />
        <div style={{ position: "absolute", top: "0%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(152,186,213,0.35) 0%,transparent 70%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 10, marginBottom: 32 }}>
        {SLIDES.map((slide, i) => (
          <button key={slide.id} onClick={() => setCurrent(i)} style={{ border: "2.5px solid #304674", cursor: "pointer", padding: "7px 20px", borderRadius: 999, fontSize: 12, fontWeight: 800, letterSpacing: "0.04em", background: i === current ? "linear-gradient(to right,#98bad5,#304674)" : "#fff", color: i === current ? "#fff" : "#304674", transition: "all 0.25s ease", boxShadow: i === current ? "3px 3px 0px #304674" : "2px 2px 0px #304674", transform: i === current ? "translate(-1px,-1px)" : "none" }}>
            {slide.label}
          </button>
        ))}
      </div>
      <div className="landing-carousel-track relative w-full h-[400px] md:h-[470px] flex items-center justify-center z-10" style={{ perspective: isMobile ? undefined : "1200px" }}>
        {SLIDES.map((slide, index) => {
          let offset = index - current
          if (offset > Math.floor(total / 2)) offset -= total
          if (offset < -Math.floor(total / 2)) offset += total
          const isCenter   = offset === 0
          const isAdjacent = Math.abs(offset) === 1
          return (
            <div key={slide.id} className="landing-carousel-card" style={{
              position: "absolute", width: "min(690px, 90vw)", height: "448px",
              overflow: "hidden", borderRadius: 24, background: "#ffffff", border: "2.5px solid #304674",
              boxShadow: isCenter ? "4px 4px 0px #304674, 0 16px 48px rgba(48,70,116,0.18)" : "2px 2px 0px #304674",
              transform: isMobile
                ? `translateX(${offset * 100}%)`
                : `translateX(${offset * 88}%) rotateY(${offset * -14}deg) scale(${isCenter ? 1 : isAdjacent ? 0.82 : 0.68})`,
              transformOrigin: "center center",
              opacity: isCenter ? 1 : isMobile ? 0 : isAdjacent ? 0.38 : 0,
              filter: "none",
              transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease, box-shadow 0.4s ease",
              zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
              visibility: Math.abs(offset) > 1 ? "hidden" : "visible",
              pointerEvents: isCenter ? "auto" : "none",
              willChange: "transform, filter, opacity",
            }}>
              <AnimatePresence mode="wait">
                {isCenter ? (
                  <motion.div key={`${slide.id}-center`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="landing-carousel-card-inner" style={{ height: "100%", overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
                    {slide.content}
                  </motion.div>
                ) : (
                  <motion.div key={`${slide.id}-side`} initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    style={{ height: "100%", overflow: "hidden", pointerEvents: "none" }}>
                    {slide.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
      <button onClick={handlePrev} style={{ position: "absolute", left: "max(20px, 3vw)", top: "50%", transform: "translateY(-50%)", zIndex: 20, width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "2.5px solid #304674", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0px #304674", transition: "box-shadow 0.15s, transform 0.15s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "1px 1px 0px #304674"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) translate(2px,2px)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0px #304674"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%)" }}>
        <ChevronLeft style={{ width: 20, height: 20, color: "#304674" }} />
      </button>
      <button onClick={handleNext} style={{ position: "absolute", right: "max(20px, 3vw)", top: "50%", transform: "translateY(-50%)", zIndex: 20, width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "2.5px solid #304674", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0px #304674", transition: "box-shadow 0.15s, transform 0.15s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "1px 1px 0px #304674"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%) translate(2px,2px)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0px #304674"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-50%)" }}>
        <ChevronRight style={{ width: 20, height: 20, color: "#304674" }} />
      </button>
      <div style={{ position: "relative", zIndex: 20, display: "flex", gap: 8, marginTop: 28 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{ border: "2px solid #304674", cursor: "pointer", padding: 0, width: i === current ? 28 : 10, height: 10, borderRadius: 999, background: i === current ? "linear-gradient(to right,#98bad5,#304674)" : "#fff", boxShadow: "2px 2px 0px #304674", transition: "all 0.3s ease" }} />
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const ctaVideoRef = useRef<HTMLVideoElement>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] })
  const scrollYSpring = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  const ySlow    = useTransform(scrollYSpring, [0, 1], [0, 200])
  const yMed     = useTransform(scrollYSpring, [0, 1], [0, -400])
  const yFast    = useTransform(scrollYSpring, [0, 1], [0, -700])
  const yReverse = useTransform(scrollYSpring, [0, 1], [0, 350])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => { setIsLoggedIn(!!data.session) })
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), orientation: "vertical", gestureOrientation: "vertical", smoothWheel: true, smoothTouch: false })
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => { lenis.destroy(); window.removeEventListener('resize', checkMobile) }
  }, [])

  useEffect(() => {
    const vid = ctaVideoRef.current
    if (!vid) return
    let isVisible = false
    let scrollTimer: ReturnType<typeof setTimeout>
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        if (!isVisible) vid.pause()
      },
      { threshold: 0.1 }
    )
    observer.observe(vid)
    const onScroll = () => {
      vid.pause()
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => { if (isVisible) vid.play() }, 200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll); clearTimeout(scrollTimer) }
  }, [])

  return (
    <div ref={containerRef} style={{ background: "#fff", color: "#304674", overflowX: "hidden", position: "relative" }}>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 35s linear infinite; }
        @media (min-width: 2000px) {
          .landing-hero-text h1 { font-size: 6.5rem !important; }
          .landing-hero-text p { font-size: 1.8rem !important; }
          .container { max-width: 2200px !important; }
        }
        @media (max-width: 767px) {
          /* Stars: hide on mobile — too large, overlap content */
          .floating-star-wrapper { display: none !important; }
          /* Hero logo: shrink so "InternLink" fits on 390px screen */
          .hero-logo-size { font-size: 2.6rem !important; }
          /* Mascot: hide on mobile to avoid overflow-hidden clipping */
          .mascot-img { display: none !important; }
          /* Carousel: full-width flat slide, no 3D bleed */
          .landing-carousel-track { height: 520px !important; }
          .landing-carousel-card { width: 92vw !important; }
          .landing-carousel-card-inner { -webkit-overflow-scrolling: touch; }
          /* CTA section */
          .landing-cta-section { padding: 56px 20px !important; }
          /* Footer */
          .landing-footer { padding: 20px 20px !important; }
          /* Carousel nav arrows: reposition for narrow screens */
          .landing-hero-text { text-align: center; display: flex; flex-direction: column; align-items: center; }
          .landing-hero-text h1 { margin: 0 auto 24px !important; }
          .landing-hero-text p { margin: 0 auto 32px !important; }
          /* Wolf CTA: stack vertically */
          .landing-wolf { width: min(320px, 80vw) !important; margin: 0 auto !important; }
          .landing-wolf-text { top: 58% !important; width: 60% !important; }
          /* PixVerse watermark: hide bg video on mobile, gradient bg is enough */
          .cta-bg-video { display: none !important; }
          /* Wolf clear-box fix: remove drop-shadow on mobile (GPU compositing artifact) */
          .wolf-shadow-wrap { filter: none !important; }
          /* CTA section: remove overflow:hidden on mobile since video is hidden */
          .landing-cta-section { overflow: visible !important; }
        }
      `}</style>

      {/* ── GLOBAL CLOUD LAYER ─────────────────────────────────────────
           Sits above every section background. pointer-events: none.
           zIndex 150 = above all section content (z≤50), below stars (z=200).
      ─────────────────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 150, pointerEvents: "none", overflow: "visible" }}>
        {/* Cloud between See how it works and Marquee — right side */}
        <motion.img src="/cloud-3.png"
          className="hidden md:block absolute w-[300px] opacity-60"
          style={{ top: "60vh", right: "5%", willChange: "transform", y: yMed }}
          animate={{ x: [0, -10, 0] }} transition={{ duration: 12, repeat: Infinity }} />

        {/* Above marquee — right side */}
        <motion.img src="/cloud-4.png"
          className="hidden md:block absolute w-[420px] opacity-75"
          style={{ top: "calc(100vh - 160px)", right: "-20px", willChange: "transform", zIndex: 160, y: yFast }}
          animate={{ x: [0, -18, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />


        {/* Cloud at the bottom — brought up (offset increased to account for testimonials section) */}
        <motion.img src="/cloud-1.png"
          className="hidden md:block absolute w-[550px] opacity-60"
          style={{ bottom: "1080px", right: "-2%", willChange: "transform", y: yReverse }}
          animate={{ x: [0, 15, 0] }} transition={{ duration: 14, repeat: Infinity }} />
      </div>

      {/* ── GLOBAL STAR LAYER ──────────────────────────────────────────
           zIndex 200 = on top of everything including clouds.
      ─────────────────────────────────────────────────────────────── */}
      {/* Section 2 stars */}
      <FloatingStar top="calc(100vh + 60px)" left="22%" size={140} delay={0.4} rotation={20}  speed={0.45} spin={false} parallax={ySlow} />
      <FloatingStar top="calc(100vh + 350px)" left="68%" size={160} delay={2.2} rotation={-35} speed={0.35} spin={false} parallax={yReverse} />
      {/* Section 3 stars */}
      <FloatingStar top="calc(200vh + 500px)" left="5%"  size={130} delay={0}   rotation={10}  speed={0.5}  spin={true}  parallax={ySlow} />
      <FloatingStar top="calc(200vh + 140px)" left="68%" size={180} delay={0.8} rotation={30}  speed={0.4}  spin={true}  parallax={yReverse} />

      <Navbar />

      {/* SECTION 1 — Hero */}
      <Feature1
        title="Our mission is to put opportunity within reach of every student."
        description=""
        youtubeId="RxeBAETeMZw"
        buttonPrimary={{ label: "Get started free", href: "/signup" }}
        buttonSecondary={{ label: "See how it works", href: "#carousel" }}
      />

      {/* University marquee */}
      <UniversityMarquee />

      {/* SECTION 2 — 3D Carousel */}
      <SectionCarousel ySlow={ySlow} yReverse={yReverse} isMobile={isMobile} />

      {/* SECTION 3 — CTA with Wolf */}
      <div className="landing-cta-section" style={{
        position: "relative", overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 50%, rgba(48,70,116,0.6) 0%, transparent 70%), #0a0f1e",
        padding: "120px 40px", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <video ref={ctaVideoRef} muted loop playsInline preload="auto"
          className="cta-bg-video"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.7, zIndex: 0, pointerEvents: "none" }}
          src="/videos/2ndvideo.mp4" />
        
        {/* Cloud to the left of the wolf */}
        <motion.img src="/cloud-3.png"
          className="hidden lg:block absolute left-[-2%] top-[15%] w-[480px] opacity-70"
          style={{ willChange: "transform", zIndex: 210 }}
          animate={{ x: [0, 15, 0] }} transition={{ duration: 14, repeat: Infinity }} />

        <motion.div className="landing-wolf" animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "min(500px, 60vw)", position: "relative", flexShrink: 0, zIndex: 1, margin: "0 auto", willChange: "transform" }}>
          {/* Wrapper div holds the shadow so filter is NOT on the animated element — prevents GPU compositing box artifact */}
          <div className="wolf-shadow-wrap" style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.4))" }}>
            <img src="/husky.png.png" alt="InternLink Guide" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
          <div className="landing-wolf-text" style={{ position: "absolute", top: "62%", left: "50%", transform: "translate(-50%, -50%)", width: "65%", textAlign: "center", pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize: "clamp(14px, 2.2vw, 26px)", fontWeight: 900, color: "#304674", lineHeight: 1.1, margin: 0, letterSpacing: "-0.03em" }}>Ready to start?</p>
            <Link href="/signup" style={{
              display: "inline-block", marginTop: 8, background: "linear-gradient(135deg, #304674 0%, #4b6a9b 100%)", color: "#fff",
              padding: "10px 24px", borderRadius: 14, fontSize: "clamp(11px, 1.4vw, 17px)", fontWeight: 800,
              textDecoration: "none", border: "2.5px solid #304674", boxShadow: "0 10px 20px -5px rgba(48,70,116,0.4), 4px 4px 0px #304674"
            }}>
              Get started free
            </Link>
            <p style={{ fontSize: "clamp(8px, 1vw, 12px)", color: "#4a5568", lineHeight: 1.35, margin: "4px 0 0", maxWidth: "85%", fontWeight: 700, opacity: 0.8 }}>Join 500+ students landing positions.</p>
          </div>
        </motion.div>
      </div>

      {/* SECTION 4 — Student Endorsements */}
      <TestimonialsMarquee />

      {/* Footer */}
      <div className="landing-footer" style={{ background: "#d8e1e8", borderTop: "2px solid #b2cbde", padding: "28px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/link.png" alt="Logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#304674" }}>InternLink</span>
        </div>
        <p style={{ fontSize: 13, color: "#4a5568", margin: 0 }}>Built for students. Powered by AI. © 2026 InternLink.</p>
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/privacy" style={{ fontSize: 13, color: "#4a5568", textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ fontSize: 13, color: "#4a5568", textDecoration: "none" }}>Terms</Link>
        </div>
      </div>
    </div>
  )
}
