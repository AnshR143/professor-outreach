"use client"
import { useEffect, useRef } from "react"

interface InfiniteGridProps {
  color?: string
  bgColor?: string
  fadeColor?: string
  lineWidth?: number
  cellSize?: number
  className?: string
  style?: React.CSSProperties
}

export default function InfiniteGrid({
  color = "rgba(249,115,22,0.18)",
  bgColor = "#0f172a",
  fadeColor = "#0f172a",
  lineWidth = 1,
  cellSize = 60,
  className,
  style,
}: InfiniteGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const offsetRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function draw() {
      if (!canvas || !ctx) return
      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      // Background
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, W, H)

      const horizon = H * 0.42
      const vp = { x: W / 2, y: horizon }

      // Perspective grid params
      const depth = 1.6
      const numLines = 28

      offsetRef.current = (offsetRef.current + 0.4) % cellSize

      // Vertical lines (perspective converge to vanishing point)
      for (let i = -numLines; i <= numLines; i++) {
        const xBase = W / 2 + i * cellSize
        ctx.beginPath()
        ctx.moveTo(vp.x + (xBase - vp.x) * 0.01, horizon)
        ctx.lineTo(xBase, H)
        const alpha = Math.max(0, 1 - Math.abs(i) / numLines)
        ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${alpha * 0.5})`)
        ctx.lineWidth = lineWidth
        ctx.stroke()
      }

      // Horizontal lines (recede into distance with perspective)
      const numH = 20
      for (let j = 0; j <= numH; j++) {
        const t = j / numH
        // Perspective: lines bunch up near horizon
        const perspT = Math.pow(t, depth)
        const y = horizon + perspT * (H - horizon) + (offsetRef.current * perspT)
        if (y > H) continue

        // Width at this y level
        const widthAtY = (y - horizon) / (H - horizon)
        const xLeft = W / 2 - widthAtY * W * 0.85
        const xRight = W / 2 + widthAtY * W * 0.85

        ctx.beginPath()
        ctx.moveTo(xLeft, y)
        ctx.lineTo(xRight, y)
        const alpha = Math.pow(t, 0.5) * 0.55
        ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${alpha})`)
        ctx.lineWidth = lineWidth
        ctx.stroke()
      }

      // Fade gradient — fade top and sides
      const gradTop = ctx.createLinearGradient(0, 0, 0, horizon + H * 0.12)
      gradTop.addColorStop(0, fadeColor)
      gradTop.addColorStop(1, "transparent")
      ctx.fillStyle = gradTop
      ctx.fillRect(0, 0, W, horizon + H * 0.12)

      // Fade bottom
      const gradBot = ctx.createLinearGradient(0, H * 0.78, 0, H)
      gradBot.addColorStop(0, "transparent")
      gradBot.addColorStop(1, fadeColor)
      ctx.fillStyle = gradBot
      ctx.fillRect(0, H * 0.78, W, H)

      // Fade sides
      const gradLeft = ctx.createLinearGradient(0, 0, W * 0.2, 0)
      gradLeft.addColorStop(0, fadeColor)
      gradLeft.addColorStop(1, "transparent")
      ctx.fillStyle = gradLeft
      ctx.fillRect(0, horizon, W * 0.2, H)

      const gradRight = ctx.createLinearGradient(W, 0, W * 0.8, 0)
      gradRight.addColorStop(0, fadeColor)
      gradRight.addColorStop(1, "transparent")
      ctx.fillStyle = gradRight
      ctx.fillRect(W * 0.8, horizon, W * 0.2, H)

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [bgColor, color, fadeColor, lineWidth, cellSize])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  )
}
