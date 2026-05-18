"use client"
import { motion } from "framer-motion"
import Link from "next/link"

export function WolfCTA() {
  return (
    <div className="landing-cta-section" style={{
      position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse at 25% 40%, rgba(48,70,116,0.65) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(152,186,213,0.4) 0%, transparent 60%), #0a0f1e",
      padding: "100px 40px",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          width: "100%", height: "100%", objectFit: "cover",
          opacity: 0.6, zIndex: 0,
          pointerEvents: "none",
          transform: "scale(1.12)", // Pushes watermark out of frame
          transformOrigin: "center bottom", // Keeps focus on the main scene
        }}
        src="/videos/PixVerse_V6_Image_Text_720P_A_hyperrealistic_w.mp4"
      />

      {/* Atmospheric Clouds in CTA */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <motion.img 
          src="/cloud-1.png" 
          animate={{ x: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[450px] opacity-40 blur-[2px]"
        />
        <motion.img 
          src="/cloud-3.png" 
          animate={{ x: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-5%] w-[500px] opacity-30 blur-[3px]"
        />
      </div>

      {/* Ambient glow behind wolf */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(152,186,213,0.25) 0%, transparent 70%)",
        zIndex: 0, pointerEvents: "none"
      }} />

      <motion.div
        className="landing-wolf"
        animate={{ 
          y: [0, -25, 0],
          opacity: 1,
          scale: 1
        }}
        transition={{ 
          y: { 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          },
          opacity: { duration: 1.2 },
          scale: { duration: 1.2 }
        }}
        style={{ width: "min(520px, 65vw)", position: "relative", zIndex: 1 }}
      >
        <img src="/husky.png.png" alt="InternLink Guide" style={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.3))" }} />
        
        {/* Whiteboard content */}
        <div className="landing-wolf-text" style={{
          position: "absolute", top: "62%", left: "50%", transform: "translate(-50%, -50%)",
          width: "65%", textAlign: "center", pointerEvents: "auto",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <p style={{ fontSize: "clamp(14px, 2.2vw, 26px)", fontWeight: 900, color: "#304674", lineHeight: 1.1, margin: 0, letterSpacing: "-0.03em" }}>
            Ready to start?
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/signup" style={{
              display: "inline-block", marginTop: 8,
              background: "linear-gradient(135deg, #304674 0%, #4b6a9b 100%)", 
              color: "#fff",
              padding: "10px 24px", borderRadius: 14, 
              fontSize: "clamp(11px, 1.4vw, 17px)", fontWeight: 800,
              textDecoration: "none", border: "2.5px solid #304674", 
              boxShadow: "0 10px 20px -5px rgba(48,70,116,0.4), 4px 4px 0px #304674",
              transition: "box-shadow 0.2s"
            }}>
              Get started free
            </Link>
          </motion.div>
          <p style={{ fontSize: "clamp(8px, 1vw, 12px)", color: "#4a5568", lineHeight: 1.35, margin: "4px 0 0", maxWidth: "85%", fontWeight: 700, opacity: 0.8 }}>
            Join 500+ students landing positions.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
