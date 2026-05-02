"use client"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import {
  Search, Mail, BarChart3, BookOpen, Star, ArrowRight,
  Check, Zap, Brain, GraduationCap, FileText, TrendingUp,
  Sparkles, Users, ChevronRight, Shield, Clock, Target,
} from "lucide-react"

/* ─── fade-in-up helper ─── */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        transition: "all 0.3s ease",
        background: scrolled ? "rgba(11,11,15,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>OutreachAI</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 36 }} className="hidden-mobile">
          {["Features", "How it works", "Pricing"].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, "-")}`}
              style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >{link}</a>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/login" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Sign in</Link>
          <Link href="/signup" style={{
            background: "linear-gradient(135deg,#7C3AED,#3B82F6)",
            color: "#fff", fontSize: 14, fontWeight: 600,
            padding: "9px 20px", borderRadius: 10, textDecoration: "none",
            boxShadow: "0 0 20px rgba(124,58,237,0.4)",
            transition: "opacity 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >Get started free</Link>
        </div>
      </div>
    </nav>
  )
}

/* ─── Hero Visual: animated professor card mockup ─── */
function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "relative", width: "100%", maxWidth: 480 }}
    >
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 380, height: 380, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Main card: professor match */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20,
          padding: "24px 28px", marginBottom: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 2 }}>Dr. Sarah Chen</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>MIT · Computer Science</div>
          </div>
          <div style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 8, padding: "4px 10px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA" }}>94% match</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["Machine Learning", "NLP", "AI Safety"].map(tag => (
            <span key={tag} style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 9px" }}>{tag}</span>
          ))}
        </div>
      </motion.div>

      {/* Email generation card */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{
          background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
          padding: "20px 24px", marginBottom: 14,
          boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={12} color="#60A5FA" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI-Generated Email</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, marginBottom: 10 }}>
          "Dear Dr. Chen, I'm a CS junior at Stanford deeply interested in your work on interpretable ML systems. My experience building..."
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Personalized from your resume</span>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{ display: "flex", gap: 12 }}
      >
        {[
          { label: "Professors found", value: "12", color: "#A78BFA" },
          { label: "Emails sent", value: "8", color: "#60A5FA" },
          { label: "Replies", value: "3", color: "#34D399" },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{stat.label}</div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}

/* ─── Features ─── */
const features = [
  { icon: <Brain size={22} />, title: "AI Professor Matching", desc: "Upload your resume and interests. Our AI scans 600+ professors and ranks them by research overlap and fit.", color: "#7C3AED" },
  { icon: <Mail size={22} />, title: "AI Email Generator", desc: "Generate personalized outreach emails tailored to each professor's papers and your background — in seconds.", color: "#3B82F6" },
  { icon: <BookOpen size={22} />, title: "Real Paper Data", desc: "Pulls actual publications from Semantic Scholar so your emails reference real, recent work the professor cares about.", color: "#EC4899" },
  { icon: <BarChart3 size={22} />, title: "Analytics Dashboard", desc: "Visual funnel tracking — see exactly how many professors you've found, emailed, and heard back from.", color: "#F59E0B" },
  { icon: <FileText size={22} />, title: "Proven Templates", desc: "Choose from 10+ templates: PhD inquiries, coffee chats, research internship requests, and more.", color: "#10B981" },
  { icon: <TrendingUp size={22} />, title: "Status Tracking", desc: "Kanban-style board to organize every professor by stage: Found → Emailed → Awaiting → Accepted.", color: "#6366F1" },
]

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "120px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <FadeUp className="text-center" style={{ marginBottom: 64 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 100, padding: "6px 16px", marginBottom: 20 }}>
            <Zap size={13} color="#A78BFA" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#A78BFA" }}>Everything you need</span>
          </div>
          <h2 style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
            Built for serious<br />
            <span style={{ background: "linear-gradient(90deg,#A78BFA,#60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>research seekers</span>
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto" }}>
            Every feature is designed to get you from zero to a professor reply as fast as possible.
          </p>
        </FadeUp>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.07}>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
                  padding: "28px 28px", height: "100%",
                  transition: "all 0.3s ease", cursor: "default",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.transform = "translateY(-4px)"
                  el.style.borderColor = `${f.color}40`
                  el.style.boxShadow = `0 20px 40px rgba(0,0,0,0.3), 0 0 40px ${f.color}15`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.transform = "translateY(0)"
                  el.style.borderColor = "rgba(255,255,255,0.08)"
                  el.style.boxShadow = "none"
                }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 14, background: `${f.color}20`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, marginBottom: 18 }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 10 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How it works ─── */
const steps = [
  { num: "01", icon: <FileText size={28} />, title: "Upload your resume", desc: "Drop in your resume and tell us your research interests. We extract your background to personalize everything.", color: "#7C3AED" },
  { num: "02", icon: <Search size={28} />, title: "Discover matched professors", desc: "Pick your fields and universities. Our AI scores and ranks professors against your specific profile.", color: "#3B82F6" },
  { num: "03", icon: <Mail size={28} />, title: "Send and track emails", desc: "Generate personalized emails with one click, send them, and track every response in your dashboard.", color: "#EC4899" },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ padding: "80px 24px 120px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <FadeUp style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 100, padding: "6px 16px", marginBottom: 20 }}>
            <Target size={13} color="#60A5FA" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#60A5FA" }}>Simple process</span>
          </div>
          <h2 style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
            From zero to inbox<br />
            <span style={{ background: "linear-gradient(90deg,#60A5FA,#34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>in three steps</span>
          </h2>
        </FadeUp>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24, position: "relative" }}>
          {steps.map((step, i) => (
            <FadeUp key={step.num} delay={i * 0.12}>
              <div style={{
                background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24,
                padding: "36px 32px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 18, background: `${step.color}18`, border: `1px solid ${step.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: step.color }}>
                    {step.icon}
                  </div>
                  <span style={{ fontSize: 40, fontWeight: 900, color: "rgba(255,255,255,0.06)", lineHeight: 1 }}>{step.num}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 12 }}>{step.title}</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{step.desc}</div>
                {i < steps.length - 1 && (
                  <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6, color: step.color, fontSize: 13, fontWeight: 600 }}>
                    <span>Then</span>
                    <ChevronRight size={14} />
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Testimonials ─── */
const testimonials = [
  { name: "Aisha Patel", role: "CS Junior · UCLA", quote: "I got 4 professor replies in my first week. The AI emails were so well-tailored that two professors asked to set up calls immediately.", stars: 5 },
  { name: "Marcus Johnson", role: "Biology Senior · UMich", quote: "Finally a tool that actually understands research outreach. It found professors I never would have found manually and wrote emails better than I could.", stars: 5 },
  { name: "Yuki Tanaka", role: "Grad Applicant · Carnegie Mellon", quote: "The template library alone is worth it. I used the PhD inquiry template and got into my first-choice lab. Couldn't recommend this more.", stars: 5 },
]

function TestimonialsSection() {
  return (
    <section id="testimonials" style={{ padding: "80px 24px 120px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <FadeUp style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
            Students are getting<br />
            <span style={{ background: "linear-gradient(90deg,#F59E0B,#EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>real results</span>
          </h2>
        </FadeUp>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {testimonials.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.1}>
              <div style={{
                background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
                padding: "28px 28px", height: "100%",
              }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 18 }}>
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} size={15} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 24 }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t.name[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ─── */
function PricingSection() {
  return (
    <section id="pricing" style={{ padding: "80px 24px 120px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <FadeUp style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 100, padding: "6px 16px", marginBottom: 20 }}>
            <Shield size={13} color="#34D399" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#34D399" }}>Simple pricing</span>
          </div>
          <h2 style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
            Start free.<br />
            <span style={{ background: "linear-gradient(90deg,#34D399,#60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Scale when ready.</span>
          </h2>
        </FadeUp>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
          {/* Free tier */}
          <FadeUp delay={0.05}>
            <div style={{
              background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "36px 32px",
            }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 6 }}>Free</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Everything you need to get started</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 32 }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: "#fff" }}>$0</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>/month</span>
              </div>
              {["Up to 5 professors per search", "AI email generation", "10+ email templates", "Analytics dashboard", "Resume-based matching"].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={11} color="#A78BFA" />
                  </div>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{item}</span>
                </div>
              ))}
              <Link href="/signup" style={{
                display: "block", marginTop: 32, textAlign: "center",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff", fontWeight: 600, fontSize: 15,
                padding: "14px", borderRadius: 12, textDecoration: "none",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)" }}
              >
                Get started free
              </Link>
            </div>
          </FadeUp>

          {/* Pro tier */}
          <FadeUp delay={0.12}>
            <div style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.1))",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(124,58,237,0.4)", borderRadius: 24, padding: "36px 32px",
              position: "relative", overflow: "hidden",
              boxShadow: "0 0 60px rgba(124,58,237,0.2)",
            }}>
              <div style={{ position: "absolute", top: 20, right: 20, background: "linear-gradient(135deg,#7C3AED,#3B82F6)", borderRadius: 100, padding: "4px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>COMING SOON</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 6 }}>Pro</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>For power users serious about research</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 32 }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: "#fff" }}>$12</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>/month</span>
              </div>
              {["Unlimited professor searches", "Priority AI generation", "Advanced analytics & Sankey flow", "Follow-up email automation", "Semantic Scholar paper data", "Everything in Free"].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={11} color="#A78BFA" />
                  </div>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{item}</span>
                </div>
              ))}
              <button disabled style={{
                display: "block", width: "100%", marginTop: 32, textAlign: "center",
                background: "linear-gradient(135deg,#7C3AED,#3B82F6)",
                color: "#fff", fontWeight: 600, fontSize: 15,
                padding: "14px", borderRadius: 12, border: "none", cursor: "not-allowed",
                opacity: 0.6,
              }}>
                Coming soon
              </button>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

/* ─── Final CTA ─── */
function CTASection() {
  return (
    <section style={{ padding: "60px 24px 120px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <FadeUp>
          <div style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.15), rgba(236,72,153,0.1))",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(124,58,237,0.3)", borderRadius: 32,
            padding: "72px 48px", textAlign: "center",
            boxShadow: "0 0 80px rgba(124,58,237,0.15)",
            position: "relative", overflow: "hidden",
          }}>
            {/* bg glow */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 200, background: "radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ position: "relative" }}>
              <h2 style={{ fontSize: 52, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 20 }}>
                Ready to land your<br />
                <span style={{ background: "linear-gradient(90deg,#A78BFA,#60A5FA,#F472B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>dream research position?</span>
              </h2>
              <p style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", marginBottom: 40, maxWidth: 420, margin: "0 auto 40px" }}>
                Join students who are sending smarter emails and getting more replies.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/signup" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "linear-gradient(135deg,#7C3AED,#3B82F6)",
                  color: "#fff", fontWeight: 700, fontSize: 16,
                  padding: "14px 32px", borderRadius: 14, textDecoration: "none",
                  boxShadow: "0 0 32px rgba(124,58,237,0.5)",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 0 48px rgba(124,58,237,0.6)" }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(124,58,237,0.5)" }}
                >
                  Start for free <ArrowRight size={18} />
                </Link>
                <Link href="/login" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff", fontWeight: 600, fontSize: 16,
                  padding: "14px 28px", borderRadius: 14, textDecoration: "none",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.13)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)" }}
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>OutreachAI</span>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {["Features", "How it works", "Pricing"].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, "-")}`}
              style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >{link}</a>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>© 2025 OutreachAI. All rights reserved.</div>
      </div>
    </footer>
  )
}

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  return (
    <div style={{ background: "#0B0B0F", minHeight: "100vh", color: "#fff", fontFamily: "-apple-system, 'Inter', BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "100px 24px 60px", position: "relative", overflow: "hidden" }}>
        {/* background blobs */}
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 80, flexWrap: "wrap" }}>
          {/* Left */}
          <div style={{ flex: "1 1 480px", minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 100, padding: "6px 16px", marginBottom: 28 }}
            >
              <Sparkles size={13} color="#A78BFA" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#A78BFA" }}>AI-powered research outreach</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.04em", marginBottom: 24 }}
            >
              Find the right<br />
              <span style={{ background: "linear-gradient(90deg,#A78BFA 0%,#60A5FA 50%,#F472B6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>professors.</span><br />
              Send the perfect<br />email.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 480, marginBottom: 40 }}
            >
              OutreachAI matches you with research professors using your resume and interests, then generates personalized emails that actually get replies.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}
            >
              <Link href="/signup" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "linear-gradient(135deg,#7C3AED,#3B82F6)",
                color: "#fff", fontWeight: 700, fontSize: 16,
                padding: "15px 32px", borderRadius: 14, textDecoration: "none",
                boxShadow: "0 0 36px rgba(124,58,237,0.45)",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 0 52px rgba(124,58,237,0.6)" }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 36px rgba(124,58,237,0.45)" }}
              >
                Start for free <ArrowRight size={18} />
              </Link>
              <Link href="/login" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)",
                color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 15,
                padding: "15px 28px", borderRadius: 14, textDecoration: "none",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)" }}
              >
                Sign in
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 36 }}
            >
              <div style={{ display: "flex" }}>
                {["A", "M", "Y", "K"].map((l, i) => (
                  <div key={l} style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${i * 60 + 240},60%,55%)`, border: "2px solid #0B0B0F", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: i > 0 ? -8 : 0, fontSize: 11, fontWeight: 700, color: "#fff" }}>{l}</div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                <span style={{ color: "#A78BFA", fontWeight: 600 }}>600+</span> professors matched this week
              </div>
            </motion.div>
          </div>

          {/* Right: visual */}
          <div style={{ flex: "1 1 380px", display: "flex", justifyContent: "center" }}>
            <HeroVisual />
          </div>
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  )
}
