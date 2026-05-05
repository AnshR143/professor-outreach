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
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  )
}
