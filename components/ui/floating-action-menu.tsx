"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface FABAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  color?: string
}

interface FloatingActionMenuProps {
  actions: FABAction[]
  mainIcon?: React.ReactNode
  position?: { bottom: number | string; right: number | string }
}

export default function FloatingActionMenu({
  actions,
  mainIcon,
  position = { bottom: 32, right: 32 },
}: FloatingActionMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        position: "fixed",
        bottom: position.bottom,
        right: position.right,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column-reverse",
        alignItems: "flex-end",
        gap: 12,
      }}
    >
      {/* Sub-actions */}
      <AnimatePresence>
        {open && actions.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.85 }}
            transition={{ duration: 0.18, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            {/* Label */}
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: i * 0.06 + 0.04 }}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#f8fafc",
                background: "rgba(15,23,42,0.82)",
                backdropFilter: "blur(8px)",
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              {action.label}
            </motion.span>

            {/* Action button */}
            <button
              onClick={() => { action.onClick(); setOpen(false) }}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.2)",
                background: action.color
                  ? `linear-gradient(135deg, ${action.color}cc, ${action.color}ee)`
                  : "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))",
                backdropFilter: "blur(12px) saturate(180%)",
                WebkitBackdropFilter: "blur(12px) saturate(180%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
                transition: "transform 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              {action.icon}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.25)",
          background: "linear-gradient(135deg, rgba(48, 70, 116,0.92) 0%, rgba(234,88,12,0.95) 100%)",
          backdropFilter: "blur(12px) saturate(200%)",
          WebkitBackdropFilter: "blur(12px) saturate(200%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 6px 24px rgba(48, 70, 116,0.45), inset 0 1px 0 rgba(255,255,255,0.3)",
          outline: "none",
          position: "relative",
          overflow: "hidden",
        }}
        whileHover={{ scale: 1.08, boxShadow: "0 8px 28px rgba(48, 70, 116,0.55), inset 0 1px 0 rgba(255,255,255,0.3)" }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Sheen */}
        <span style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)",
          borderRadius: "50% 50% 0 0",
          pointerEvents: "none",
        }} />
        {mainIcon ?? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        )}
      </motion.button>
    </div>
  )
}
