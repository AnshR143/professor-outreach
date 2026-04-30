"use client"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type DottedSurfaceProps = Omit<React.ComponentProps<"div">, "ref"> & {
  contained?: boolean // true = absolute inside parent, false = fixed full-screen
}

export function DottedSurface({ className, contained = false, ...props }: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const countRef = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement("canvas")
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;"
    container.appendChild(canvas)
    const ctx = canvas.getContext("2d")!

    const SEPARATION = 44
    const AMOUNTX = 32
    const AMOUNTY = 28

    function resize() {
      canvas.width = container!.offsetWidth
      canvas.height = container!.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    function draw() {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const startX = (W - (AMOUNTX - 1) * SEPARATION) / 2
      const startY = (H - (AMOUNTY - 1) * SEPARATION) / 2

      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const x = startX + ix * SEPARATION
          const wave = Math.sin((ix + countRef.current) * 0.3) * 12 + Math.sin((iy + countRef.current) * 0.5) * 12
          const y = startY + iy * SEPARATION + wave

          // Scale dot size with wave
          const t = (wave + 24) / 48 // 0..1
          const radius = 1.8 + t * 2.4

          // Fade near edges
          const ex = Math.abs(ix / (AMOUNTX - 1) - 0.5) * 2
          const ey = Math.abs(iy / (AMOUNTY - 1) - 0.5) * 2
          const edge = Math.max(ex, ey)
          const alpha = Math.max(0, (0.28 - edge * 0.24) * (0.4 + t * 0.6))

          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(15,23,42,${alpha.toFixed(3)})`
          ctx.fill()
        }
      }

      countRef.current += 0.06
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
      canvas.remove()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none overflow-hidden",
        contained ? "absolute inset-0" : "fixed inset-0 -z-10",
        className
      )}
      {...props}
    />
  )
}
