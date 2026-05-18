import type { Metadata } from "next"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "InternLink | Find Professors. Send Perfect Emails.",
  description: "AI-powered professor outreach and research connection platform",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/myfaviconlogo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/myfaviconlogo.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

