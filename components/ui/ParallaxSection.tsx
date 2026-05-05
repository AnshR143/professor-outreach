"use client"
import { useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

/* ─────────────────────────────────────────────────────────────
   Parallax Section
   ─ A tall sticky-scroll container with 5 depth layers
   ─ Mirrors the Chain Zoku approach from the tutorial:
       Layer 1: sky / video bg   → slowest (moves down slightly)
       Layer 2: drifting clouds  → slow
       Layer 3: glow orbs        → medium
       Layer 4: headline text    → medium-fast, fades out
       Layer 5: wolf / foreground→ fastest (shoots up)
───────────────────────────────────────────────────────────── */
export function ParallaxSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Track scroll progress through the tall container
  // offset: ["start start", "end end"] means:
  //   0 = top of container hits top of viewport
  //   1 = bottom of container hits bottom of viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Smooth spring for all transforms — removes jitter
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.4 })

  // Layer 1 — background (slowest: 15% travel)
  const bgY = useTransform(smooth, [0, 1], ["0%", "15%"])

  // Layer 2 — cloud overlay (slow: 25%)
  const cloudY = useTransform(smooth, [0, 1], ["0%", "25%"])

  // Layer 3 — glow orbs (medium: 40%)
  const orbY = useTransform(smooth, [0, 1], ["0%", "40%"])

  // Layer 4 — headline text (medium-fast: -50%, floats upward)
  const textY = useTransform(smooth, [0, 1], ["0%", "-55%"])
  const textOpacity = useTransform(smooth, [0, 0.55], [1, 0])
  const textScale = useTransform(smooth, [0, 0.55], [1, 0.88])

  // Layer 5 — wolf foreground (fastest: -90%, shoots up)
  const wolfY = useTransform(smooth, [0, 1], ["0%", "-90%"])
  const wolfScale = useTransform(smooth, [0, 1], [1, 1.06])

  return (
    /* Tall container — scroll through this to drive the parallax */
    <div ref={containerRef} style={{ height: "280vh", position: "relative" }}>

      {/* Sticky viewport — stays pinned at top while container scrolls */}
      <div style={{
        position: "sticky", top: 0,
        height: "100vh", overflow: "hidden",
        background: "#0a0f1e",
      }}>

        {/* ── LAYER 1: Sky / video background (slowest) ── */}
        <motion.div style={{
          position: "absolute", inset: 0, y: bgY, zIndex: 0,
        }}>
          <video
            autoPlay muted loop playsInline
            style={{ width: "100%", height: "110%", objectFit: "cover", objectPosition: "center bottom" }}
            src="/hero-bg.mp4"
          />
          {/* Darken bottom so text pops */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(10,15,30,0.25) 0%, rgba(10,15,30,0.1) 40%, rgba(10,15,30,0.55) 100%)",
          }} />
        </motion.div>

        {/* ── LAYER 2: Drifting cloud blobs (slow) ── */}
        <motion.div style={{
          position: "absolute", inset: 0, y: cloudY, zIndex: 1,
          pointerEvents: "none",
        }}>
          {/* Cloud blobs drift horizontally via animate (loop) */}
          <motion.div
            animate={{ x: [0, -120, 0] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", top: "8%", left: "-5%", width: "55%", height: "30%",
              borderRadius: "50%", filter: "blur(70px)",
              background: "radial-gradient(ellipse,rgba(186,230,253,0.28) 0%,transparent 70%)" }}
          />
          <motion.div
            animate={{ x: [0, 100, 0] }}
            transition={{ duration: 36, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            style={{ position: "absolute", top: "18%", right: "-8%", width: "50%", height: "28%",
              borderRadius: "50%", filter: "blur(80px)",
              background: "radial-gradient(ellipse,rgba(219,241,255,0.22) 0%,transparent 70%)" }}
          />
          <motion.div
            animate={{ x: [0, -60, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 8 }}
            style={{ position: "absolute", top: "38%", left: "20%", width: "40%", height: "20%",
              borderRadius: "50%", filter: "blur(60px)",
              background: "radial-gradient(ellipse,rgba(148,197,255,0.18) 0%,transparent 70%)" }}
          />
        </motion.div>

        {/* ── LAYER 3: Glow orbs — ambient depth (medium) ── */}
        <motion.div style={{
          position: "absolute", inset: 0, y: orbY, zIndex: 2,
          pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute", top: "20%", left: "10%", width: 420, height: 420,
            borderRadius: "50%", filter: "blur(100px)",
            background: "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)",
          }} />
          <div style={{
            position: "absolute", bottom: "15%", right: "8%", width: 380, height: 380,
            borderRadius: "50%", filter: "blur(110px)",
            background: "radial-gradient(circle,rgba(79,70,229,0.22) 0%,transparent 70%)",
          }} />
          <div style={{
            position: "absolute", top: "55%", left: "38%", width: 300, height: 300,
            borderRadius: "50%", filter: "blur(90px)",
            background: "radial-gradient(circle,rgba(99,179,237,0.14) 0%,transparent 70%)",
          }} />
        </motion.div>

        {/* ── LAYER 4: Headline text (medium-fast, fades as you scroll) ── */}
        <motion.div style={{
          position: "absolute", top: "22%", left: 0, right: 0,
          display: "flex", flexDirection: "column", alignItems: "center",
          y: textY, opacity: textOpacity, scale: textScale,
          zIndex: 3, pointerEvents: "none",
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(186,230,253,0.7)", marginBottom: 20,
          }}>
            AI-Powered Cold Outreach
          </span>
          <h2 style={{
            fontSize: "clamp(52px, 9vw, 110px)",
            fontWeight: 900, color: "#f0f6ff",
            letterSpacing: "-0.04em", lineHeight: 0.92,
            textAlign: "center", margin: 0,
            textShadow: "0 2px 40px rgba(59,130,246,0.3)",
          }}>
            Reach<br />
            <span style={{
              background: "linear-gradient(135deg, #93c5fd 0%, #818cf8 50%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              further.
            </span>
          </h2>
          <p style={{
            marginTop: 28, fontSize: "clamp(15px,1.5vw,20px)",
            color: "rgba(226,232,240,0.72)", fontWeight: 400,
            maxWidth: 460, textAlign: "center", lineHeight: 1.55,
          }}>
            From first contact to first reply — automated, personalized, and precise.
          </p>
        </motion.div>

        {/* ── LAYER 5: Wolf — foreground (fastest, shoots upward) ── */}
        <motion.div style={{
          position: "absolute", bottom: "-12%", left: "50%",
          transform: "translateX(-50%)",
          y: wolfY, scale: wolfScale,
          zIndex: 4, width: "min(500px, 80vw)",
          pointerEvents: "none",
        }}>
          <img
            src="/husky.png.png"
            alt="OutreachAI Guide"
            style={{
              width: "100%", height: "auto",
              mixBlendMode: "multiply",
              filter: "contrast(1.05) saturate(1.02)",
            }}
          />

          {/* Whiteboard overlay — CTA inside the board area */}
          <div style={{
            position: "absolute", top: "54%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "82%", textAlign: "center",
            pointerEvents: "auto",
          }}>
            <h3 style={{
              fontSize: "clamp(12px, 1.8vw, 20px)", fontWeight: 900,
              color: "#0f172a", marginBottom: 2, lineHeight: 1.1,
            }}>
              Stop guessing.
            </h3>
            <h3 style={{
              fontSize: "clamp(12px, 1.8vw, 20px)", fontWeight: 900,
              color: "#3b82f6", marginBottom: 12, lineHeight: 1.1,
            }}>
              Start connecting.
            </h3>
            <p style={{
              fontSize: "clamp(8px, 0.9vw, 11px)", color: "#475569",
              lineHeight: 1.4, marginBottom: 16,
              maxWidth: "92%", marginInline: "auto",
              fontWeight: 500
            }}>
              Join thousands of students landing high-impact positions using <span style={{ color: "#3b82f6" }}>AI-powered</span> precision matching.
            </p>
            <Link href="/signup" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "linear-gradient(to right,#3b82f6,#4f46e5)",
              color: "#fff", padding: "8px 16px", borderRadius: 8,
              fontSize: "clamp(8px, 0.8vw, 11px)", fontWeight: 800,
              textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.03em",
              boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
            }}>
              Create Your Account
              <ArrowRight size={12} />
            </Link>
          </div>
        </motion.div>

        {/* Ground fog at very bottom — ties foreground to scene */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
          background: "linear-gradient(to top, rgba(186,230,253,0.45) 0%, transparent 100%)",
          zIndex: 5, pointerEvents: "none",
        }} />

      </div>
    </div>
  )
}
