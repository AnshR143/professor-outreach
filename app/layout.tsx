import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Professor Outreach | Research Connection Platform",
  description: "AI-powered professor outreach and research connection platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  )
}
