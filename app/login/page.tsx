"use client"
import React, { useRef, useEffect, useState } from "react"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const DotMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const routes = [
    { start: { x: 100, y: 150, delay: 0 }, end: { x: 200, y: 80 }, color: "#2563eb" },
    { start: { x: 200, y: 80,  delay: 2 }, end: { x: 260, y: 120 }, color: "#2563eb" },
    { start: { x: 50,  y: 50,  delay: 1 }, end: { x: 150, y: 180 }, color: "#2563eb" },
    { start: { x: 280, y: 60,  delay: 0.5 }, end: { x: 180, y: 180 }, color: "#2563eb" },
  ]
  const generateDots = (width: number, height: number) => {
    const dots: { x: number; y: number; opacity: number }[] = []
    for (let x = 0; x < width; x += 12) {
      for (let y = 0; y < height; y += 12) {
        const hit =
          (x < width*0.25 && x > width*0.05 && y < height*0.4  && y > height*0.1) ||
          (x < width*0.25 && x > width*0.15 && y < height*0.8  && y > height*0.4) ||
          (x < width*0.45 && x > width*0.3  && y < height*0.35 && y > height*0.15) ||
          (x < width*0.5  && x > width*0.35 && y < height*0.65 && y > height*0.35) ||
          (x < width*0.7  && x > width*0.45 && y < height*0.5  && y > height*0.1) ||
          (x < width*0.8  && x > width*0.65 && y < height*0.8  && y > height*0.6)
        if (hit && Math.random() > 0.3) dots.push({ x, y, opacity: Math.random() * 0.5 + 0.2 })
      }
    }
    return dots
  }
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
      canvas.width = width
      canvas.height = height
    })
    observer.observe(canvas.parentElement as Element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dots = generateDots(dimensions.width, dimensions.height)
    let animId: number
    let startTime = Date.now()
    function draw() {
      ctx!.clearRect(0, 0, dimensions.width, dimensions.height)
      dots.forEach(d => {
        ctx!.beginPath(); ctx!.arc(d.x, d.y, 1, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(37,99,235,${d.opacity})`; ctx!.fill()
      })
      const t = (Date.now() - startTime) / 1000
      routes.forEach(route => {
        const elapsed = t - route.start.delay
        if (elapsed <= 0) return
        const progress = Math.min(elapsed / 3, 1)
        const x = route.start.x + (route.end.x - route.start.x) * progress
        const y = route.start.y + (route.end.y - route.start.y) * progress
        ctx!.beginPath(); ctx!.moveTo(route.start.x, route.start.y); ctx!.lineTo(x, y)
        ctx!.strokeStyle = route.color; ctx!.lineWidth = 1.5; ctx!.stroke()
        ctx!.beginPath(); ctx!.arc(route.start.x, route.start.y, 3, 0, Math.PI*2)
        ctx!.fillStyle = route.color; ctx!.fill()
        ctx!.beginPath(); ctx!.arc(x, y, 3, 0, Math.PI*2)
        ctx!.fillStyle = "#3b82f6"; ctx!.fill()
        ctx!.beginPath(); ctx!.arc(x, y, 6, 0, Math.PI*2)
        ctx!.fillStyle = "rgba(59,130,246,0.35)"; ctx!.fill()
      })
      if (t > 15) startTime = Date.now()
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [dimensions])
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hovered, setHovered] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    // Pre-fill email from signup flow (stored in sessionStorage)
    try {
      const pending = sessionStorage.getItem("pendingEmail")
      if (pending) {
        setEmail(pending)
        sessionStorage.removeItem("pendingEmail")
      }
    } catch { /* sessionStorage unavailable */ }
    // Show verified banner if redirected from auth callback or verification link
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("verified") === "1") setVerified(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#f8fafc",
    outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
  }

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center",
      justifyContent: "center", background: "linear-gradient(135deg,#eff6ff 0%,#e0e7ff 100%)", padding: 16 }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 880, borderRadius: 20, display: "flex",
          background: "#fff", boxShadow: "0 24px 80px rgba(37,99,235,0.12),0 4px 16px rgba(0,0,0,0.06)",
          overflow: "hidden" }}>

        {/* Left map panel — hidden on mobile */}
        <div className="md-panel" style={{ display: "none", width: "50%", minHeight: 600,
          position: "relative", overflow: "hidden", borderRight: "1px solid #e0e7ff" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#eff6ff,#dbeafe)" }}>
            <DotMap />
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: 32, zIndex: 10 }}>
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ width: 52, height: 52, borderRadius: "50%",
                background: "linear-gradient(135deg,#3b82f6,#4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(59,130,246,0.35)", marginBottom: 20 }}>
              <ArrowRight style={{ width: 22, height: 22, color: "#fff" }} />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ fontSize: 28, fontWeight: 800, margin: "0 0 10px", textAlign: "center",
                background: "linear-gradient(to right,#2563eb,#4f46e5)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              OutreachAI
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              style={{ fontSize: 13, color: "#475569", textAlign: "center",
                maxWidth: 240, lineHeight: 1.5, margin: 0 }}>
              Sign in to find researchers who match your work and send AI-crafted outreach emails.
            </motion.p>
          </div>
        </div>

        {/* Right form */}
        <div style={{ flex: 1, padding: "44px 40px", display: "flex",
          flexDirection: "column", justifyContent: "center", background: "#fff" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}>

            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg,#3b82f6,#4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowRight style={{ width: 18, height: 18, color: "#fff" }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>OutreachAI</span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 28px" }}>
              Sign in to your account
            </p>

            {verified && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8,
                padding: "10px 14px", color: "#16a34a", fontSize: 13, marginBottom: 20 }}>
                ✓ Email verified! Sign in to continue.
              </div>
            )}

            {error && (
              <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8,
                padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600,
                  color: "#374151", marginBottom: 6 }}>
                  Email <span style={{ color: "#3b82f6" }}>*</span>
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu" autoComplete="email" required
                  style={inp}
                  onFocus={e => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600,
                  color: "#374151", marginBottom: 6 }}>
                  Password <span style={{ color: "#3b82f6" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password" required
                    style={{ ...inp, paddingRight: 40 }}
                    onFocus={e => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ position: "absolute", right: 10, top: "50%",
                      transform: "translateY(-50%)", background: "none", border: "none",
                      cursor: "pointer", color: "#94a3b8", padding: 4 }}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
                style={{ position: "relative", overflow: "hidden", width: "100%",
                  padding: "11px 20px", background: "linear-gradient(to right,#3b82f6,#4f46e5)",
                  color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: hovered ? "0 8px 24px rgba(59,130,246,0.35)" : "0 2px 8px rgba(59,130,246,0.2)",
                  transition: "box-shadow 0.2s" }}>
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight size={16} />}
                {hovered && !loading && (
                  <motion.span initial={{ left: "-100%" }} animate={{ left: "100%" }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                    style={{ position: "absolute", top: 0, bottom: 0, width: 80,
                      background: "linear-gradient(to right,transparent,rgba(255,255,255,0.25),transparent)",
                      filter: "blur(6px)" }} />
                )}
              </motion.button>

              <div style={{ textAlign: "center" }}>
                <a href="#" style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none" }}>
                  Forgot password?
                </a>
              </div>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>new here?</span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            <Link href="/signup"
              style={{ display: "block", textAlign: "center", padding: "10px",
                border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: "#374151", textDecoration: "none", background: "#f8fafc",
                transition: "border-color 0.15s,background 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#3b82f6";
                (e.currentTarget as HTMLAnchorElement).style.background="#eff6ff" }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#e2e8f0";
                (e.currentTarget as HTMLAnchorElement).style.background="#f8fafc" }}>
              Create an account
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <style>{`@media(min-width:768px){.md-panel{display:block!important}}`}</style>
    </div>
  )
}
ink href="/signup"
              style={{ display: "block", textAlign: "center", padding: "10px",
                border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: "#374151", textDecoration: "none", background: "#f8fafc",
                transition: "border-color 0.15s,background 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#3b82f6";
                (e.currentTarget as HTMLAnchorElement).style.background="#eff6ff" }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#e2e8f0";
                (e.currentTarget as HTMLAnchorElement).style.background="#f8fafc" }}>
              Create an account
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <style>{`@media(min-width:768px){.md-panel{display:block!important}}`}</style>
    </div>
  )
}
