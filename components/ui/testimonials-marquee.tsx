"use client"
import { useRef, useEffect } from "react"
import { motion } from "framer-motion"

const ENDORSERS = [
  { name: "Agastya Turaga",       text: "Landed a research position at my dream lab in under two weeks. The personalised emails actually got replies." },
  { name: "Shloka Shah",          text: "I had zero research experience and still got three professors to respond. This made the whole process feel manageable." },
  { name: "Ira Shetty",           text: "The match scores helped me stop guessing and start targeting. Got a reply from MIT within a few days." },
  { name: "Armaan Zirvi",         text: "Sent 20 personalised emails in an hour. Would have taken me an entire week to write those manually." },
  { name: "Maria Thoompunkal",    text: "Finally got into a lab after months of silence elsewhere. The emails actually sounded like me." },
  { name: "Johann Burke",         text: "Used it for internship outreach at finance firms and got two interviews from cold emails alone." },
  { name: "Stephen Korrapolu",    text: "The resume parser knew exactly what to highlight for each professor. Saved me hours of customisation." },
  { name: "Rishab Ghosh",         text: "I was sceptical about automated emails but mine got a response from a well-known research group. Completely sold." },
  { name: "Atharv Jaju",          text: "Match scores removed all the guesswork. I knew exactly which contacts were actually worth pursuing." },
  { name: "Jenna Panson",         text: "Got my first paid research position this summer. This genuinely changed where my applications went." },
  { name: "Snigdha Venkat",       text: "The follow-up feature kept conversations alive. One follow-up turned into a full research offer." },
  { name: "Kelly Hon",            text: "Found niche professors nobody else was contacting. First email, first response, first internship." },
  { name: "Ishan Seeri",          text: "The best student tool I have used in college. It beats cold LinkedIn messages by a wide margin." },
  { name: "Ishan Bendre",         text: "Generated 15 tailored emails in one sitting. The level of personalisation would have taken me hours solo." },
  { name: "Vaishali Rajeshkumar", text: "Found researchers I did not even know existed. Opened up an entirely new network for me." },
  { name: "Sai Gudur",            text: "My response rate went from near zero to over 30 percent. The subject lines alone make a difference." },
  { name: "Davida Cumbo",         text: "Sent emails to 12 professors on a Friday. By Monday I had four replies. It genuinely works." },
  { name: "Anna Killeen",         text: "The platform understood my niche field and surfaced contacts I never would have discovered on my own." },
  { name: "Josh Bloom",           text: "Set up in ten minutes and had a full outreach list ready the same afternoon. Wish I had found it sooner." },
]

// ── Cute animal SVG buddies ───────────────────────────────────────────────────
const ANIMALS = [
  // 0 Pink Bear
  <svg key="bear" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#FFD6E0"/>
    <circle cx="8"  cy="10" r="6"   fill="#FFB3C6"/>
    <circle cx="32" cy="10" r="6"   fill="#FFB3C6"/>
    <circle cx="8"  cy="10" r="3.5" fill="#FF8FAB"/>
    <circle cx="32" cy="10" r="3.5" fill="#FF8FAB"/>
    <circle cx="20" cy="22" r="15" fill="#FFD6E0"/>
    <ellipse cx="12" cy="27" rx="3.5" ry="2" fill="#FF8FAB" opacity="0.45"/>
    <ellipse cx="28" cy="27" rx="3.5" ry="2" fill="#FF8FAB" opacity="0.45"/>
    <circle cx="15" cy="21" r="3"   fill="#2d1b4e"/>
    <circle cx="25" cy="21" r="3"   fill="#2d1b4e"/>
    <circle cx="16.2" cy="19.8" r="1" fill="white"/>
    <circle cx="26.2" cy="19.8" r="1" fill="white"/>
    <ellipse cx="20" cy="28" rx="5" ry="3.5" fill="#FFB3C6"/>
    <ellipse cx="20" cy="27" rx="1.5" ry="1" fill="#2d1b4e"/>
  </svg>,

  // 1 Mint Frog
  <svg key="frog" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#B5EAD7"/>
    <circle cx="12" cy="12" r="6" fill="#B5EAD7"/>
    <circle cx="28" cy="12" r="6" fill="#B5EAD7"/>
    <circle cx="20" cy="23" r="15" fill="#B5EAD7"/>
    <circle cx="12" cy="12" r="4.5" fill="#2d3e2f"/>
    <circle cx="28" cy="12" r="4.5" fill="#2d3e2f"/>
    <circle cx="13.2" cy="10.8" r="1.4" fill="white"/>
    <circle cx="29.2" cy="10.8" r="1.4" fill="white"/>
    <ellipse cx="11" cy="25" rx="3" ry="1.8" fill="#FF9999" opacity="0.4"/>
    <ellipse cx="29" cy="25" rx="3" ry="1.8" fill="#FF9999" opacity="0.4"/>
    <path d="M14 28 Q20 33 26 28" stroke="#2d3e2f" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
  </svg>,

  // 2 Lavender Bunny
  <svg key="bunny" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#E8D5F5"/>
    <ellipse cx="12" cy="8"  rx="4.5" ry="9" fill="#E8D5F5"/>
    <ellipse cx="28" cy="8"  rx="4.5" ry="9" fill="#E8D5F5"/>
    <ellipse cx="12" cy="8"  rx="2.5" ry="6" fill="#D4A8F0"/>
    <ellipse cx="28" cy="8"  rx="2.5" ry="6" fill="#D4A8F0"/>
    <circle cx="20" cy="24" r="15" fill="#E8D5F5"/>
    <ellipse cx="13" cy="28" rx="3" ry="1.8" fill="#D4A8F0" opacity="0.5"/>
    <ellipse cx="27" cy="28" rx="3" ry="1.8" fill="#D4A8F0" opacity="0.5"/>
    <circle cx="15.5" cy="22" r="2.8" fill="#3b1f5e"/>
    <circle cx="24.5" cy="22" r="2.8" fill="#3b1f5e"/>
    <circle cx="16.5" cy="21" r="0.9" fill="white"/>
    <circle cx="25.5" cy="21" r="0.9" fill="white"/>
    <ellipse cx="20" cy="27.5" rx="2" ry="1.3" fill="#D4A8F0"/>
  </svg>,

  // 3 Yellow Chick
  <svg key="chick" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#FFF3B0"/>
    <ellipse cx="20" cy="7" rx="5" ry="4" fill="#FFE066"/>
    <circle cx="17" cy="6" r="3"   fill="#FFE066"/>
    <circle cx="23" cy="6" r="3"   fill="#FFE066"/>
    <circle cx="20" cy="23" r="15" fill="#FFF3B0"/>
    <ellipse cx="12" cy="27" rx="3.5" ry="2" fill="#FFB347" opacity="0.4"/>
    <ellipse cx="28" cy="27" rx="3.5" ry="2" fill="#FFB347" opacity="0.4"/>
    <circle cx="15.5" cy="22" r="2.8" fill="#1a1a2e"/>
    <circle cx="24.5" cy="22" r="2.8" fill="#1a1a2e"/>
    <circle cx="16.4" cy="21.1" r="0.9" fill="white"/>
    <circle cx="25.4" cy="21.1" r="0.9" fill="white"/>
    <path d="M17.5 27.5 L20 30.5 L22.5 27.5 Z" fill="#FFB347"/>
  </svg>,

  // 4 Peach Cat
  <svg key="cat" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#FFDAB9"/>
    <polygon points="9,14 5,4 15,8"  fill="#FFDAB9"/>
    <polygon points="31,14 35,4 25,8" fill="#FFDAB9"/>
    <polygon points="10,13 7,6 15,9"  fill="#FFB6C1"/>
    <polygon points="30,13 33,6 25,9" fill="#FFB6C1"/>
    <circle cx="20" cy="23" r="15" fill="#FFDAB9"/>
    <ellipse cx="12" cy="27" rx="3" ry="1.8" fill="#FFB6C1" opacity="0.55"/>
    <ellipse cx="28" cy="27" rx="3" ry="1.8" fill="#FFB6C1" opacity="0.55"/>
    <ellipse cx="15.5" cy="22" rx="2.5" ry="3" fill="#2d1b4e"/>
    <ellipse cx="24.5" cy="22" rx="2.5" ry="3" fill="#2d1b4e"/>
    <circle cx="16.3" cy="20.8" r="0.9" fill="white"/>
    <circle cx="25.3" cy="20.8" r="0.9" fill="white"/>
    <polygon points="20,27 18.5,29 21.5,29" fill="#FF8FAB"/>
    <circle cx="11" cy="28" r="1" fill="#d4a0a0" opacity="0.5"/>
    <circle cx="29" cy="28" r="1" fill="#d4a0a0" opacity="0.5"/>
  </svg>,

  // 5 Blue Dog
  <svg key="dog" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#C9E8FF"/>
    <ellipse cx="8"  cy="20" rx="6" ry="10" fill="#A8D4F5"/>
    <ellipse cx="32" cy="20" rx="6" ry="10" fill="#A8D4F5"/>
    <circle cx="20" cy="22" r="15" fill="#C9E8FF"/>
    <ellipse cx="20" cy="29" rx="6.5" ry="4.5" fill="#A8D4F5"/>
    <ellipse cx="12" cy="27" rx="3" ry="1.8" fill="#88BBEE" opacity="0.4"/>
    <ellipse cx="28" cy="27" rx="3" ry="1.8" fill="#88BBEE" opacity="0.4"/>
    <circle cx="15.5" cy="22" r="2.8" fill="#1a2e4a"/>
    <circle cx="24.5" cy="22" r="2.8" fill="#1a2e4a"/>
    <circle cx="16.4" cy="21" r="0.9" fill="white"/>
    <circle cx="25.4" cy="21" r="0.9" fill="white"/>
    <ellipse cx="20" cy="27.5" rx="2.5" ry="1.8" fill="#1a2e4a"/>
  </svg>,

  // 6 Orange Fox
  <svg key="fox" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#FFD4A8"/>
    <polygon points="10,16 4,2 18,10"  fill="#FF8C42"/>
    <polygon points="30,16 36,2 22,10" fill="#FF8C42"/>
    <polygon points="11,15 7,5 17,10"  fill="#FFF3B0"/>
    <polygon points="29,15 33,5 23,10" fill="#FFF3B0"/>
    <circle cx="20" cy="23" r="15" fill="#FFD4A8"/>
    <ellipse cx="20" cy="29" rx="7" ry="5" fill="#FFF8EE"/>
    <ellipse cx="11.5" cy="26" rx="3" ry="1.8" fill="#FF8C42" opacity="0.35"/>
    <ellipse cx="28.5" cy="26" rx="3" ry="1.8" fill="#FF8C42" opacity="0.35"/>
    <ellipse cx="15.5" cy="21" rx="2.5" ry="3" fill="#2d1b00"/>
    <ellipse cx="24.5" cy="21" rx="2.5" ry="3" fill="#2d1b00"/>
    <circle cx="16.3" cy="19.8" r="0.9" fill="white"/>
    <circle cx="25.3" cy="19.8" r="0.9" fill="white"/>
    <ellipse cx="20" cy="27.5" rx="1.8" ry="1.2" fill="#2d1b00"/>
  </svg>,

  // 7 Grey Koala
  <svg key="koala" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#D4D4D4"/>
    <circle cx="8"  cy="11" r="9"   fill="#C0C0C0"/>
    <circle cx="32" cy="11" r="9"   fill="#C0C0C0"/>
    <circle cx="8"  cy="11" r="5.5" fill="#E8E8E8"/>
    <circle cx="32" cy="11" r="5.5" fill="#E8E8E8"/>
    <circle cx="20" cy="24" r="15" fill="#D4D4D4"/>
    <ellipse cx="12" cy="29" rx="3" ry="1.8" fill="#BB99CC" opacity="0.4"/>
    <ellipse cx="28" cy="29" rx="3" ry="1.8" fill="#BB99CC" opacity="0.4"/>
    <circle cx="15.5" cy="23" r="2.8" fill="#1a1a2e"/>
    <circle cx="24.5" cy="23" r="2.8" fill="#1a1a2e"/>
    <circle cx="16.4" cy="22" r="0.9" fill="white"/>
    <circle cx="25.4" cy="22" r="0.9" fill="white"/>
    <ellipse cx="20" cy="29" rx="3.5" ry="2.5" fill="#555"/>
    <ellipse cx="19.5" cy="28.2" rx="1" ry="0.6" fill="rgba(255,255,255,0.3)"/>
  </svg>,
]

const ANIMAL_COLORS = [
  "#FF8FAB", "#6DC98A", "#C084E8", "#F5C518",
  "#FFB6C1", "#72B8F0", "#FF8C42", "#9E9E9E",
]

function Squiggle({ color }: { color: string }) {
  return (
    <svg width="100%" height="10" viewBox="0 0 240 10" preserveAspectRatio="none" style={{ display: "block", margin: "12px 0" }}>
      <path d="M0 5 Q15 0 30 5 Q45 10 60 5 Q75 0 90 5 Q105 10 120 5 Q135 0 150 5 Q165 10 180 5 Q195 0 210 5 Q225 10 240 5"
        stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.75" />
    </svg>
  )
}

function AnimalAvatar({ index, size = 38 }: { index: number; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1.5px solid rgba(48,70,116,0.12)", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: size, height: size }}>{ANIMALS[index % ANIMALS.length]}</div>
    </div>
  )
}

const row1 = ENDORSERS.slice(0, 7)
const row2 = ENDORSERS.slice(7, 13)
const row3 = ENDORSERS.slice(13, 19)

// ── RAF-based marquee row — each row independently pauses on hover ─────────────
function MarqueeRow({ items, startIndex, direction = "left", duration = 36 }: {
  items: typeof ENDORSERS
  startIndex: number
  direction?: "left" | "right"
  duration?: number
}) {
  const doubled = [...items, ...items]
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef   = useRef<number | null>(null)
  const speedRef = useRef(1)          // 1 = full speed, 0 = stopped
  const hoveredRef = useRef(false)
  const rafRef   = useRef<number>()

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let singleWidth = 0
    let pps = 0          // pixels per second
    let lastTime = performance.now()

    function tick(now: number) {
      // Measure on first frame so layout is complete
      if (singleWidth === 0) {
        singleWidth = track.scrollWidth / 2
        pps = singleWidth / duration
        // Right-direction starts mid-scroll so it appears to move toward 0
        if (posRef.current === null) {
          posRef.current = direction === "right" ? -singleWidth : 0
        }
      }

      const dt = Math.min((now - lastTime) / 1000, 0.05) // cap at 50ms to avoid jumps
      lastTime = now

      // Exponential lerp: speed smoothly decelerates to 0 on hover, accelerates back on leave
      const target = hoveredRef.current ? 0 : 1
      speedRef.current += (target - speedRef.current) * (1 - Math.exp(-dt * 3.5))

      const delta = pps * dt * speedRef.current

      if (direction === "left") {
        posRef.current! -= delta
        if (posRef.current! <= -singleWidth) posRef.current! += singleWidth
      } else {
        posRef.current! += delta
        if (posRef.current! >= 0) posRef.current! -= singleWidth
      }

      track.style.transform = `translateX(${posRef.current}px) translateZ(0)`
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [direction, duration])

  return (
    <div
      style={{ overflow: "hidden", width: "100%", contain: "layout style paint" }}
      onMouseEnter={() => { hoveredRef.current = true }}
      onMouseLeave={() => { hoveredRef.current = false }}
    >
      <div
        ref={trackRef}
        style={{ display: "flex", gap: 16, width: "max-content", willChange: "transform" }}
      >
        {doubled.map((e, i) => {
          const animalIdx = (startIndex + (i % items.length)) % ANIMALS.length
          return (
            <div key={i} style={{ flexShrink: 0, width: 272, background: "#ffffff", border: "1px solid rgba(48,70,116,0.13)", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 6px rgba(48,70,116,0.07)" }}>
              <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.65, margin: 0, fontWeight: 400 }}>{e.text}</p>
              <Squiggle color={ANIMAL_COLORS[animalIdx % ANIMAL_COLORS.length]} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AnimalAvatar index={animalIdx} size={38} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.25 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4, marginTop: 1 }}>InternLink User</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TestimonialsMarquee() {
  return (
    <section style={{ background: "linear-gradient(180deg, #d0dae7 0%, #c6d3e3 100%)", padding: "80px 0 88px", borderTop: "1px solid #b2cbde", overflow: "hidden" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        style={{ textAlign: "center", marginBottom: 48, padding: "0 24px" }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#304674", margin: "0 0 12px" }}>
          Student voices
        </p>
        <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.4rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em", margin: "0 0 12px", lineHeight: 1.15 }}>
          Trusted by students across the country
        </h2>
        <p style={{ fontSize: 15, color: "#475569", maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
          From research labs to company internships, hear from students who used InternLink.
        </p>
      </motion.div>

      <div style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)", maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)", display: "flex", flexDirection: "column", gap: 14 }}>
        <MarqueeRow items={row1} startIndex={0}  direction="left"  duration={40} />
        <MarqueeRow items={row2} startIndex={7}  direction="right" duration={32} />
        <MarqueeRow items={row3} startIndex={13} direction="left"  duration={36} />
      </div>
    </section>
  )
}
