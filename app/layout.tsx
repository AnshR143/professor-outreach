import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "OutreachAI | Find Professors. Send Perfect Emails.",
  description: "AI-powered professor outreach and research connection platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  )
}
