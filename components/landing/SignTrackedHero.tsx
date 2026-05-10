"use client"
/**
 * SignTrackedHero
 * ----------------
 * Plays the InternLink intro video and "glues" the InternLink wordmark
 * (with the comic-style box around "Link") onto the wooden sign in the video.
 *
 * Approach
 *   1. /public/sign_track.json holds per-frame { cx, cy, w, h, angle } in
 *      normalized (0-1) coordinates - produced by track_sign.py using OpenCV
 *      sign-color segmentation.
 *   2. On every animation frame we read video.currentTime, look up the
 *      matching track entry, and drive an absolutely-positioned overlay div
 *      with translate + rotate. Since the lookup happens every animation
 *      frame, the wordmark stays welded to the sign regardless of how the
 *      video is scaled/letterboxed by object-fit: cover.
 *   3. We measure the rendered video element ourselves (using its intrinsic
 *      aspect ratio and the container size) so the math works for any
 *      viewport - same trick CSS uses internally.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

type Frame = { cx: number; cy: number; w: number; h: number; angle: number }
type Track = { fps: number; width: number; height: number; frames: Frame[] }

interface Props {
  isLoggedIn: boolean
}

export default function SignTrackedHero({ isLoggedIn }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<Track | null>(null)
  const rafRef = useRef<number | null>(null)
  const [trackLoaded, setTrackLoaded] = useState(false)

  // Load track JSON once
  useEffect(() => {
    let cancelled = false
    fetch("/sign_track.json")
      .then((r) => r.json())
      .then((data: Track) => {
        if (cancelled) return
        trackRef.current = data
        setTrackLoaded(true)
      })
      .catch((err) => {
        console.warn("[SignTrackedHero] failed to load track:", err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Animation loop driven independently of React state.
  const loop = useCallback(() => {
    const video = videoRef.current
    const overlay = overlayRef.current
    const container = containerRef.current
    const track = trackRef.current
    if (video && overlay && container && track && track.frames.length > 0) {
      const t = video.currentTime
      const idx = Math.min(
        track.frames.length - 1,
        Math.max(0, Math.floor(t * track.fps))
      )
      const f = track.frames[idx]

      // Compute where the video pixels actually land inside the container,
      // because we use object-fit: cover.
      const cw = container.clientWidth
      const ch = container.clientHeight
      const videoAspect = track.width / track.height
      const containerAspect = cw / ch
      let drawW: number, drawH: number, offX: number, offY: number
      if (containerAspect > videoAspect) {
        drawW = cw
        drawH = cw / videoAspect
        offX = 0
        offY = (ch - drawH) / 2
      } else {
        drawH = ch
        drawW = ch * videoAspect
        offX = (cw - drawW) / 2
        offY = 0
      }

      // Center on the detected sign + nudge down 10% of sign height
      // so text sits on the empty lower plank, not the husky's paws.
      const px = offX + f.cx * drawW
      const py = offY + f.cy * drawH + f.h * drawH * 0.10
      // Bbox over-estimates sign width because of husky overlap; 55% fits.
      const wordmarkW = f.w * drawW * 0.55
      const wordmarkH = f.h * drawH * 0.32

      overlay.style.transform = `translate(-50%, -50%) translate(${px}px, ${py}px) rotate(${f.angle}deg)`
      overlay.style.width = `${wordmarkW}px`
      overlay.style.height = `${wordmarkH}px`
      overlay.style.opacity = "1"
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [loop])

  // Try to keep the video playing even if browsers pause on tab focus loss
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const tryPlay = () => v.play().catch(() => {})
    v.addEventListener("loadeddata", tryPlay)
    document.addEventListener("visibilitychange", tryPlay)
    return () => {
      v.removeEventListener("loadeddata", tryPlay)
      document.removeEventListener("visibilitychange", tryPlay)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden z-10"
      style={{ background: "#0c1224" }}
    >
      {/* Background video (Husky Sign-Track Intro) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        src="/intro-hero.mp4"
        style={{ display: "block" }}
      />

      {/* Right-side gradient so the CTA stays readable. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, transparent 40%, rgba(12,18,36,0.55) 70%, rgba(12,18,36,0.85) 100%)",
        }}
      />

      {/* Top-right Dashboard / Sign-up button */}
      <div className="absolute top-6 right-8 z-30">
        <Link
          href={isLoggedIn ? "/dashboard" : "/signup"}
          className="px-6 py-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-sm transition-colors border border-white/10"
        >
          Dashboard
        </Link>
      </div>

      {/* InternLink wordmark - glued to the sign by JS-driven transform.
          Container queries (cqw) scale the font with overlay width. */}
      <div
        ref={overlayRef}
        className="absolute left-0 top-0 z-20 pointer-events-none flex items-center justify-center"
        style={{
          opacity: 0,
          transformOrigin: "center center",
          willChange: "transform",
          transition: "opacity 0.25s",
          containerType: "inline-size",
        }}
      >
        <div
          className="flex items-center"
          style={{
            gap: "5cqw",
            fontSize: "22cqw",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily:
                'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontWeight: 900,
              color: "#304674",
              letterSpacing: "-0.04em",
            }}
          >
            Intern
          </span>
          <span
            style={{
              display: "inline-block",
              background: "#304674",
              color: "#98bad5",
              border: "0.12em solid #0a1530",
              borderRadius: "0.18em",
              boxShadow: "0.10em 0.10em 0 #0a1530",
              padding: "0.04em 0.18em 0.10em",
              transform: "rotate(-3deg)",
              fontFamily:
                'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            Link
          </span>
        </div>
      </div>

      {/* Right-side hero text + CTA */}
      <div className="relative z-20 w-full h-full flex items-center justify-end px-6 md:px-12 lg:px-20">
        <div className="max-w-md text-right md:pr-4 lg:pr-12">
          <p className="text-gray-100 text-base md:text-lg lg:text-xl font-medium leading-snug mb-8 drop-shadow-lg">
            The intelligent outreach platform for landing research positions
            and internships. Precision matching, AI drafts, and automated
            follow-ups.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-3.5 rounded-full font-bold text-base md:text-lg hover:bg-white/90 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:-translate-y-0.5"
          >
            Get started free
            <ArrowRight size={20} strokeWidth={3} />
          </Link>
        </div>
      </div>

      {!trackLoaded && (
        <div className="sr-only">Loading sign track...</div>
      )}
    </div>
  )
}
