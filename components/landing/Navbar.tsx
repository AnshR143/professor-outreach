"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) setIsAuthenticated(true)
    }
    checkAuth()

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { label: "Partnerships", href: "/partners", color: "#e0f2fe", text: "#0369a1" }, // Sky Blue
    { label: "Contact", href: "/contact", color: "#f0f9ff", text: "#075985" },      // Light Sky
    { label: "Privacy", href: "/privacy", color: "#eef2ff", text: "#3730a3" },      // Indigo/Powder
    { label: "Terms", href: "/terms", color: "#f1f5f9", text: "#334155" },          // Slate/Steel
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      style={{
        position: "fixed",
        top: 24,
        right: "5%",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "8px 16px",
        borderRadius: "24px",
        background: isScrolled ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "2.5px solid #304674",
        boxShadow: isScrolled ? "0 12px 40px rgba(0,0,0,0.15)" : "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Desktop Links */}
      <div className="hidden md:flex" style={{ alignItems: "center", gap: 10 }}>
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            style={{
              background: link.color,
              color: link.text,
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 800,
              padding: "7px 16px",
              borderRadius: "14px",
              border: "2.5px solid #304674",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              boxShadow: "4px 4px 0px #304674",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)"
              e.currentTarget.style.boxShadow = "7px 7px 0px #304674"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "4px 4px 0px #304674"
            }}
          >
            {link.label}
          </Link>
        ))}

        <Link
          href={isAuthenticated ? "/dashboard" : "/signup"}
          style={{
            padding: "9px 24px",
            borderRadius: "14px",
            background: "#304674",
            color: "#fff",
            fontWeight: 900,
            fontSize: 13,
            textDecoration: "none",
            border: "2.5px solid #0f172a",
            boxShadow: "5px 5px 0px #0f172a",
            transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
            marginLeft: 6,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"
            e.currentTarget.style.boxShadow = "7px 7px 0px #0f172a"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)"
            e.currentTarget.style.boxShadow = "5px 5px 0px #0f172a"
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translate(3px, 3px)"
            e.currentTarget.style.boxShadow = "1px 1px 0px #0f172a"
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"
            e.currentTarget.style.boxShadow = "7px 7px 0px #0f172a"
          }}
        >
          {isAuthenticated ? "Dashboard" : "Sign up"}
        </Link>
      </div>

      {/* Mobile Toggle */}
      <button 
        className="md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{ background: "none", border: "none", color: "#304674", cursor: "pointer", padding: 4 }}
      >
        {isMobileMenuOpen ? <X size={28} strokeWidth={3} /> : <Menu size={28} strokeWidth={3} />}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              width: "220px",
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px)",
              marginTop: 14,
              borderRadius: "20px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              border: "2.5px solid #304674",
              zIndex: 999,
              boxShadow: "8px 8px 0px #304674",
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ 
                  background: link.color,
                  color: link.text,
                  padding: "12px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 800,
                  textAlign: "center",
                  border: "2px solid #304674",
                  boxShadow: "4px 4px 0px #304674",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={isAuthenticated ? "/dashboard" : "/signup"}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#304674",
                color: "#fff",
                fontWeight: 900,
                textAlign: "center",
                textDecoration: "none",
                fontSize: 14,
                border: "2.5px solid #0f172a",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {isAuthenticated ? "Dashboard" : "Sign up"}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
