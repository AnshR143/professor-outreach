import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "InternLink — AI-Powered Research & Internship Outreach for Students",
  description: "InternLink helps high school and college students discover professors, find internships, and send AI-personalized cold emails. Smart matching, automated follow-ups, and real contact discovery.",
  keywords: ["internship finder", "professor outreach", "cold email AI", "research internship", "student outreach platform", "find professor email", "internship discovery"],
  authors: [{ name: "InternLink" }],
  openGraph: {
    title: "InternLink — Land Research Positions & Internships with AI",
    description: "The intelligent outreach platform for students. Discover contacts, generate tailored emails, and track your pipeline from first message to first reply.",
    type: "website",
    siteName: "InternLink",
  },
  twitter: {
    card: "summary_large_image",
    title: "InternLink — AI Outreach for Students",
    description: "Smart professor & internship discovery. AI-generated cold emails. Automated follow-ups.",
  },
  robots: "index, follow",
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
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  )
}
