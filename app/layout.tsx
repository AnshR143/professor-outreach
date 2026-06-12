import type { Metadata } from "next"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  metadataBase: new URL("https://internlink.net"),
  title: "InternLink | Find Professors. Send Perfect Emails.",
  description: "AI-powered professor outreach and research connection platform",
  openGraph: {
    title: "InternLink | Find Professors. Send Perfect Emails.",
    description: "AI-powered professor outreach and internship discovery for students. Find contacts, generate tailored cold emails, and track replies.",
    url: "https://internlink.net",
    siteName: "InternLink",
    images: [{ url: "/link.png", width: 512, height: 512, alt: "InternLink logo" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "InternLink | Find Professors. Send Perfect Emails.",
    description: "AI-powered professor outreach and internship discovery for students.",
    images: ["/link.png"],
  },
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
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

