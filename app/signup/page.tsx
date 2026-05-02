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
    let t = 0
    function draw() {
      t += 0.002
      ctx!.clearRect(0, 0, dimensions.width, dimensions.height)
      dots.forEach(d => {
        ctx!.beginPath(); ctx!.arc(d.x, d.y, 1, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(37,99,235,${d.opacity * (0.7 + 0.3 * Math.sin(t + d.x * 0.1))})`
        ctx!.fill()
      })
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

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hovered, setHovered] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else if (data.user) {
      await supabase.from("profiles").insert({
        user_id: data.user.id, name, email,
        interests: [], goals: [],
        academic_level: "", institution: "",
        onboarding_complete: false,
      })
      router.push("/onboarding")
      router.refresh()
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#f8fafc",
    outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
  }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#3b82f6" }
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#e2e8f0" }

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center",
      justifyContent: "center", background: "linear-gradient(135deg,#eff6ff 0%,#e0e7ff 100%)", padding: 16 }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 880, borderRadius: 20, display: "flex",
          background: "#fff", boxShadow: "0 24px 80px rgba(37,99,235,0.12),0 4px 16px rgba(0,0,0,0.06)",
          overflow: "hidden" }}>

        {/* Left map panel */}
        <div className="md-panel" style={{ display: "none", width: "50%", minHeight: 640,
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
              Join thousands of students landing research opportunities with AI-powered professor outreach.
            </motion.p>
          </div>
        </div>

        {/* Right form */}
        <div style={{ flex: 1, padding: "40px 40px", display: "flex",
          flexDirection: "column", justifyContent: "center", background: "#fff" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}>

            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg,#3b82f6,#4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowRight style={{ width: 18, height: 18, color: "#fff" }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>OutreachAI</span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
              Create your account
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>
              Start connecting with researchers today
            </p>

            {error && (
              <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8,
                padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 18 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Full Name <span style={{ color: "#3b82f6" }}>*</span>
                </label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your full name" autoComplete="name" required
                  style={inp} onFocus={onFocus} onBlur={onBlur} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Email <span style={{ color: "#3b82f6" }}>*</span>
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu" autoComplete="email" required
                  style={inp} onFocus={onFocus} onBlur={onBlur} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Password <span style={{ color: "#3b82f6" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters" autoComplete="new-password" required
                    style={{ ...inp, paddingRight: 40 }} onFocus={onFocus} onBlur={onBlur} />
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
                style={{ position: "relative", overflow: "hidden", marginTop: 4,
                  width: "100%", padding: "11px 20px",
                  background: "linear-gradient(to right,#3b82f6,#4f46e5)",
                  color: "#fff", border: "none", borderRadius: 8,
                  fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: hovered ? "0 8px 24px rgba(59,130,246,0.35)" : "0 2px 8px rgba(59,130,246,0.2)",
                  transition: "box-shadow 0.2s" }}>
                {loading ? "Creating account..." : "Create account"}
                {!loading && <ArrowRight size={16} />}
                {hovered && !loading && (
                  <motion.span initial={{ left: "-100%" }} animate={{ left: "100%" }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                    style={{ position: "absolute", top: 0, bottom: 0, width: 80,
                      background: "linear-gradient(to right,transparent,rgba(255,255,255,0.25),transparent)",
                      filter: "blur(6px)" }} />
                )}
              </motion.button>

              <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: 0 }}>
                By creating an account you agree to our{" "}
                <a href="#" style={{ color: "#64748b", textDecoration: "underline" }}>Terms of Service</a>.
              </p>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>have an account?</span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            <Link href="/login"
              style={{ display: "block", textAlign: "center", padding: "10px",
                border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14,
                fontWeight: 600, color: "#374151", textDecoration: "none",
                background: "#f8fafc", transition: "border-color 0.15s,background 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#3b82f6";
                (e.currentTarget as HTMLAnchorElement).style.background="#eff6ff" }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#e2e8f0";
                (e.currentTarget as HTMLAnchorElement).style.background="#f8fafc" }}>
              Sign in instead
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <style>{`@media(min-width:768px){.md-panel{display:block!important}}`}</style>
    </div>
  )
}
