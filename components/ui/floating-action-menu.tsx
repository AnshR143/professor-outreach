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

// Per-action height (44px button) + gap (12px) = 56px per slot
const ACTION_SLOT = 56
// Gap between FAB top and first action bottom
const FAB_GAP = 68 // 56px FAB + 12px gap

export default function FloatingActionMenu({
  actions,
  mainIcon,
  position = { bottom: 32, right: 32 },
}: FloatingActionMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    // Anchor div — only as tall as the FAB, actions float above it absolutely
    <div style={{ position: "fixed", bottom: position.bottom, right: position.right, zIndex: 9999, width: 56, height: 56 }}>

      {/* Sub-actions — absolutely positioned so FAB never shifts */}
      <AnimatePresence>
        {open && actions.map((action, i) => (
          <motion.div
            key={i}
            custom={i}
            initial={{ opacity: 0, y: 10, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, delay: i * 0.055, ease: [0.4, 0, 0.2, 1] } }}
            exit={{ opacity: 0, y: 8, scale: 0.9, transition: { duration: 0.13, delay: (actions.length - 1 - i) * 0.04, ease: [0.4, 0, 1, 1] } }}
            style={{
              position: "absolute",
              bottom: FAB_GAP + i * ACTION_SLOT,
              right: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
              // Prevent action row from affecting FAB layout
              pointerEvents: open ? "auto" : "none",
            }}
          >
            {/* Label chip */}
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.15, delay: i * 0.055 + 0.05 } }}
              exit={{ opacity: 0, x: 6, transition: { duration: 0.1 } }}
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

      {/* Main FAB — stationary, only icon inside animates */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.25)",
          background: "linear-gradient(135deg, #304674 0%, #98bad5 100%)",
          backdropFilter: "blur(12px) saturate(200%)",
          WebkitBackdropFilter: "blur(12px) saturate(200%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 6px 24px rgba(48,70,116,0.45), inset 0 1px 0 rgba(255,255,255,0.3)",
          outline: "none",
          overflow: "visible",
          // Sheen via pseudo-element equivalent — applied as child so it never rotates with the icon
        }}
        whileHover={{ scale: 1.08, boxShadow: "0 8px 28px rgba(48,70,116,0.55), inset 0 1px 0 rgba(255,255,255,0.3)" }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Static sheen — stays upright because it's not animated */}
        <span style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)",
          borderRadius: "28px 28px 0 0",
          pointerEvents: "none",
        }} />

        {/* Icon swap with AnimatePresence so only icon rotates, never the button */}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg
              key="close"
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ position: "relative", zIndex: 1 }}
            >
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </motion.svg>
          ) : (
            <motion.svg
              key="open"
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ position: "relative", zIndex: 1 }}
            >
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
