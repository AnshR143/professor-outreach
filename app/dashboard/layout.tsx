"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { href: "/dashboard/researchers", label: "Researchers", icon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { href: "/dashboard/internships", label: "Internships", badge: "beta", icon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="14" rx="2" ry="2"/><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  )},
{ href: "/dashboard/history", label: "History", icon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )},
  { href: "/dashboard/statistics", label: "Statistics", icon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  )},
  { href: "/dashboard/templates", label: "Templates", icon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  )},
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <>
      <style>{`
        .sidebar {
          width: 56px;
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          background: #304674;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px 0;
          flex-shrink: 0;
          z-index: 50;
        }
        .sidebar.sidebar-expanded {
          width: 200px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 40px;
          padding: 0;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.15s, color 0.15s, padding 0.25s cubic-bezier(0.4, 0, 0.2, 1), justify-content 0.25s;
          white-space: nowrap;
          gap: 10px;
          box-sizing: border-box;
        }
        .sidebar-expanded .nav-item {
          justify-content: flex-start;
          padding-left: 10px;
        }
        .nav-label {
          opacity: 0;
          max-width: 0;
          overflow: hidden;
          transition: opacity 0.2s ease, max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 13px;
          font-weight: 500;
        }
        .sidebar-expanded .nav-label {
          opacity: 1;
          max-width: 140px;
        }
        .nav-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-area {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 8px;
          margin-bottom: 16px;
          width: 100%;
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          transition: justify-content 0.25s, padding 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-expanded .logo-area {
          justify-content: flex-start;
          padding-left: 18px;
        }
        .logo-text {
          opacity: 0;
          max-width: 0;
          overflow: hidden;
          transition: opacity 0.2s ease, max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 14px;
          font-weight: 700;
          color: #f8fafc;
        }
        .sidebar-expanded .logo-text {
          opacity: 1;
          max-width: 140px;
        }
      `}</style>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* Sidebar */}
        <aside
          className={`sidebar${expanded ? " sidebar-expanded" : ""}`}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
        >
          {/* Logo — clicks back to landing page */}
          <Link href="/" className="logo-area">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#304674", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6z"/></svg>
            </div>
            <span className="logo-text">OutreachAI</span>
          </Link>

          {/* Nav */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, width: "100%", padding: "0 8px" }}>
            {NAV.map(({ href, label, icon: Icon, badge }: { href: string; label: string; icon: () => JSX.Element; badge?: string }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  title={expanded ? undefined : label}
                  className="nav-item"
                  style={{
                    color: active ? "#fff" : "#c6d3e3",
                    background: active ? "rgba(255,255,255,0.16)" : "transparent",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"
                      ;(e.currentTarget as HTMLElement).style.color = "#fff"
                    }
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLElement).style.background = active ? "rgba(255,255,255,0.16)" : "transparent"
                    ;(e.currentTarget as HTMLElement).style.color = active ? "#fff" : "#c6d3e3"
                  }}
                >
                  <span className="nav-icon"><Icon /></span>
                  <span className="nav-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {label}
                    {badge && <span style={{ fontSize: 9, fontWeight: 500, color: "#64748b", letterSpacing: 0.2 }}>{badge}</span>}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px", width: "100%" }}>
            <Link
              href="/settings"
              title={expanded ? undefined : "Settings"}
              className="nav-item"
              style={{
                color: pathname === "/settings" ? "#fff" : "#c6d3e3",
                background: pathname === "/settings" ? "rgba(255,255,255,0.16)" : "transparent",
              }}
            >
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><circle cx="12" cy="12" r="10"/></svg>
              </span>
              <span className="nav-label">Settings</span>
            </Link>
            <button
              onClick={handleSignOut}
              title={expanded ? undefined : "Sign out"}
              className="nav-item"
              style={{ color: "#c6d3e3", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </span>
              <span className="nav-label">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: "auto", background: "#f8f9fb" }}>
          {children}
        </main>
      </div>
    </>
  )
}
