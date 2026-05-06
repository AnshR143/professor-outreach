"use client"
import { useRef, useState } from "react"

interface LiquidGlassButtonProps {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  href?: string
  disabled?: boolean
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  style?: React.CSSProperties
  className?: string
  type?: "button" | "submit" | "reset"
  title?: string
}

const SIZE_STYLES = {
  sm: { padding: "6px 14px", fontSize: 12, borderRadius: 8 },
  md: { padding: "9px 20px", fontSize: 13, borderRadius: 10 },
  lg: { padding: "12px 28px", fontSize: 14, borderRadius: 12 },
}

const VARIANT_BASE = {
  primary: {
    background: "rgba(48, 70, 116, 0.9)",
    border: "1px solid rgba(255,255,255,0.25)",
    color: "#fff",
    boxShadow: "0 2px 16px rgba(48, 70, 116,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
  },
  secondary: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#f8fafc",
    boxShadow: "0 2px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)",
  },
  ghost: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#94a3b8",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
  },
}

export default function LiquidGlassButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  size = "md",
  style,
  className,
  type = "button",
  title,
}: LiquidGlassButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null)
  const [hovered, setHovered] = useState(false)

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() })
      setTimeout(() => setRipple(null), 600)
    }
    onClick?.(e)
  }

  const base = VARIANT_BASE[variant]
  const sz = SIZE_STYLES[size]

  return (
    <button
      ref={btnRef}
      type={type}
      title={title}
      disabled={disabled}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        backdropFilter: "blur(12px) saturate(180%)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
        transform: hovered && !disabled ? "translateY(-1px)" : "translateY(0)",
        opacity: disabled ? 0.5 : 1,
        userSelect: "none",
        ...base,
        ...sz,
        ...style,
      }}
    >
      {/* Glass sheen overlay */}
      <span style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "50%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.0) 100%)",
        borderRadius: "inherit",
        pointerEvents: "none",
      }} />

      {/* Ripple */}
      {ripple && (
        <span
          key={ripple.id}
          style={{
            position: "absolute",
            left: ripple.x - 4,
            top: ripple.y - 4,
            width: 8,
            height: 8,
            background: "rgba(255,255,255,0.5)",
            borderRadius: "50%",
            transform: "scale(1)",
            animation: "lg-ripple 0.6s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      )}

      <style>{`
        @keyframes lg-ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(30); opacity: 0; }
        }
      `}</style>

      {children}
    </button>
  )
}
