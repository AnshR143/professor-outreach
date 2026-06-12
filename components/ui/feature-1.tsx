"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Feature1Props {
  title: React.ReactNode;
  description?: React.ReactNode;
  youtubeId: string;
  buttonPrimary: { label: string; href: string };
  buttonSecondary: { label: string; href: string };
}

export const Feature1 = ({
  title = "The intelligent outreach platform.",
  description = "",
  youtubeId = "RxeBAETeMZw",
  buttonPrimary = { label: "Get started free", href: "/signup" },
  buttonSecondary = { label: "See how it works", href: "#carousel" },
}: Feature1Props) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isHoveringSign, setIsHoveringSign] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasLoaded(true), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #304674 0%, #98bad5 60%, #d8e1e8 100%)",
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        className="container mx-auto px-6 py-16 md:py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10"
        style={{ maxWidth: 1400 }}
      >
        {/* LEFT: text */}
        <motion.div
          className="landing-hero-text"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo — "Intern" + wobbling "Link" sign with mascot sitting on top */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, marginTop: -40, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="hero-logo-size" style={{ fontSize: "clamp(4rem, 7vw, 6.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em" }}>
                Intern
              </span>
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: isHoveringSign ? 0 : (hasLoaded ? -6 : 0) }}
                transition={{ type: "spring", stiffness: 250, damping: 8, mass: 1.2 }}
                onMouseEnter={() => setIsHoveringSign(true)}
                onMouseLeave={() => setIsHoveringSign(false)}
                style={{
                  background: "#304674", padding: "4px 20px", marginLeft: 12,
                  borderRadius: 20, border: "4px solid black",
                  boxShadow: "6px 6px 0px black",
                  display: "inline-block",
                  position: "relative",
                  transformOrigin: "top right",
                }}
              >
                {/* Mascot sitting on the sign */}
                <motion.img
                  src="/mascot-face.png"
                  alt="Mascot"
                  className="mascot-img"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: "absolute",
                    bottom: "92%",
                    left: "5%",
                    width: "95%",
                    zIndex: 10,
                    pointerEvents: "none",
                    filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.2))",
                  }}
                />
                <span className="hero-logo-size" style={{ fontSize: "clamp(4rem, 7vw, 6.5rem)", fontWeight: 900, color: "#98bad5", letterSpacing: "-0.04em" }}>
                  Link
                </span>
              </motion.div>
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "clamp(1.3rem, 2.5vw, 2rem)",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
              marginBottom: 20,
              maxWidth: 500,
            }}
          >
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p
              style={{
                fontSize: "clamp(1rem, 1.4vw, 1.1rem)",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.65,
                marginBottom: 36,
                maxWidth: 440,
              }}
            >
              {description}
            </p>
          )}

          {/* CTAs — primary (signup) + secondary (scroll to demo) */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href={buttonPrimary.href}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "13px 32px", borderRadius: 14,
                background: "#304674", color: "#fff", fontWeight: 800, fontSize: 15,
                border: "2.5px solid #0f172a",
                boxShadow: "4px 4px 0px #0f172a",
                textDecoration: "none",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translate(-2px,-2px)"
                e.currentTarget.style.boxShadow = "6px 6px 0px #0f172a"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none"
                e.currentTarget.style.boxShadow = "4px 4px 0px #0f172a"
              }}
            >
              {buttonPrimary.label}
            </Link>
            <Link
              href={buttonSecondary.href}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "13px 32px", borderRadius: 14,
                background: "#fff", color: "#304674", fontWeight: 800, fontSize: 15,
                border: "2.5px solid #304674",
                boxShadow: "4px 4px 0px #304674",
                textDecoration: "none",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translate(-2px,-2px)"
                e.currentTarget.style.boxShadow = "6px 6px 0px #304674"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none"
                e.currentTarget.style.boxShadow = "4px 4px 0px #304674"
              }}
            >
              {buttonSecondary.label}
            </Link>
          </div>
        </motion.div>

        {/* RIGHT: comic browser + video */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative" }}
        >
          {/* Hard shadow */}
          <div style={{ position: "absolute", top: 10, left: 10, right: -10, bottom: -10, background: "#304674", borderRadius: 20, zIndex: 0 }} />

          {/* Browser frame */}
          <div
            style={{
              position: "relative", zIndex: 1,
              border: "3px solid #304674", borderRadius: 20,
              overflow: "hidden", background: "#0a0f1e",
              transform: "translateZ(0)", willChange: "transform",
            }}
          >
            {/* Chrome bar */}
            <div style={{ background: "#e2e8f0", borderBottom: "2.5px solid #304674", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56", border: "1.5px solid #304674", display: "inline-block" }} />
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e", border: "1.5px solid #304674", display: "inline-block" }} />
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f", border: "1.5px solid #304674", display: "inline-block" }} />
              <div style={{ flex: 1, marginLeft: 10, background: "#fff", border: "1.5px solid #304674", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#304674", fontWeight: 600 }}>
                internlink.net
              </div>
            </div>

            {/* YouTube Video */}
            {isPlaying ? (
              <div style={{ position: "relative", aspectRatio: "16/9" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=0&rel=0&modestbranding=1`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%", border: "none",
                  }}
                />
              </div>
            ) : (
              <div
                role="button"
                aria-label="Play intro video"
                tabIndex={0}
                style={{ position: "relative", cursor: "pointer", aspectRatio: "16/9", background: "#0a0f1e" }}
                onClick={() => setIsPlaying(true)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIsPlaying(true) }}
              >
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                  alt="Watch intro video"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                  }}
                />
                <div style={{
                  position: "absolute", inset: 0, zIndex: 3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.25)",
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "rgba(255,255,255,0.9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#304674">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
