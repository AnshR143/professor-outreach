"use client"
import { motion } from "framer-motion"
import { CreativePartnerships } from "@/components/ui/creative-pricing"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

const PARTNERS = [
    {
        name: "The International Economics Post",
        logoUrl: "/iep-logo.jpg", 
        description: "A student-run publication connecting international schools across the world through opinion-driven writing on Economics, Finance, and Policy.",
        link: "https://www.internationaleconomicspost.com/",
        color: "blue",
        features: [
            "Writers from 6+ countries",
            "Full author-attribution",
            "Economics & Policy focus",
            "Global Student Journal",
        ],
    },
    {
        name: "Sports Trinity",
        logoUrl: "/sports-trinity.png.png", 
        description: "Sports Trinity aims to bridge the economic disparity within sports by channeling sports equipment to youth sport programs in under-resourced communities.",
        link: "https://sportstrinity3.wixsite.com/home",
        color: "green",
        features: [
            "$15,000+ Raised",
            "US Congress Recognition",
            "Helps 200+ kids in Nigeria",
            "International NGO",
        ],
    },
    {
        name: "Behind The Mask",
        logoUrl: "/btm-logo.png.png", 
        description: "Behind The Mask prepares students for future healthcare careers by introducing critical care thinking, patient safety awareness, and real-world clinical career experiences.",
        link: "https://behindthemaskinitiative.org/",
        color: "blue",
        features: [
            "1,000+ Followers",
            "Real-world clinical exposure",
            "Student-led initiative",
            "Career path mapping",
        ],
    },
    {
        name: "See The World Foundation",
        logoUrl: "/stwf-logo.png.png",
        description: "A nonprofit dedicated to providing financial relief for children who cannot afford critical eye procedures and care, removing barriers to life-changing vision care.",
        link: "https://www.seetheworldfoundation.org/",
        color: "purple",
        features: [
            "100+ Volunteers",
            "12 Associations",
            "$3,000 Fundraised",
            "Pediatric Eye Care focus",
        ],
    },
    {
        name: "FinanceMeta",
        logoUrl: "/FinanceMeta.jpg",
        description: "A global financial literacy initiative empowering the next generation of financial thinkers through research, education programs, and student-led initiatives. Started as grassroots outreach in India and now a worldwide network spanning economics, markets, and entrepreneurship.",
        link: "https://finance4all-global-reach.vercel.app/",
        color: "green",
        features: [
            "25,000+ Students Impacted",
            "15+ Countries Reached",
            "50+ Global Members",
            "Jane Street & MIT backed",
        ],
    },
    {
        name: "Advanced Equities",
        logoUrl: "/Advanced.jpg",
        description: "A student-run investment and research organization with $15.5K+ in live capital, developing the next generation of disciplined, research-driven investors. Sector-based coverage teams produce institutional-style equity research, with only the highest-conviction case studies earning portfolio inclusion.",
        link: "https://advancedequities.org/",
        color: "blue",
        features: [
            "$15.5K+ Live Capital",
            "Institutional Equity Research",
            "Sector Coverage Teams",
            "Real Fund Structure",
        ],
    },
    {
        name: "Finctory",
        logoUrl: "/Finctory.png",
        description: "An institutional-grade, no-code algorithmic trading platform. Build, backtest, and deploy powerful quant strategies using an intuitive visual node builder — no programming required. Dismantling the barriers that have historically gatekept algorithmic trading.",
        link: "https://finctory.app/",
        color: "purple",
        features: [
            "No-Code Quant Platform",
            "Visual Node Builder",
            "AI Strategy Synthesis",
            "Python & PineScript Export",
        ],
    },
    {
        name: "PeerPath",
        logoUrl: "/PeerPath.jpg",
        description: "A peer-to-peer tutoring platform built specifically for students navigating IB, MYP and IGCSE curricula. Founded by students who have been through these programmes, PeerPath connects learners with tutors who genuinely understand the pressure, the marking schemes and what it takes to succeed.",
        link: "https://peerpath.lovable.app/",
        color: "blue",
        features: [
            "IB, MYP & IGCSE focused",
            "Students tutoring students",
            "20+ Countries served",
            "Curriculum-specific support",
        ],
    },
    {
        name: "Casharoo",
        logoUrl: "/casharoo-logo.png",
        description: "A student-built platform that gamifies financial literacy for middle and high school students through daily challenges, leaderboards, and rewards covering budgeting, investing, saving, and credit.",
        link: "https://skillnestlearning.com/",
        color: "green",
        features: [
            "600 Avg Daily Users",
            "6,000+ Total Users",
            "8 School Partners",
            "300K Page Views",
        ],
    },
];

function Cloud({ top, left, delay, scale = 1, src }: { top: string, left: string, delay: number, scale?: number, src: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ 
                opacity: [0.3, 0.5, 0.3],
                x: [0, 40, 0],
                y: [0, -15, 0]
            }}
            transition={{ 
                duration: 12, 
                repeat: Infinity, 
                delay,
                ease: "easeInOut"
            }}
            style={{
                position: "absolute",
                top, left,
                width: 350 * scale,
                zIndex: 0,
                pointerEvents: "none",
            }}
        >
            <img 
                src={src} 
                alt="Cloud" 
                style={{ 
                    width: "100%", 
                    height: "auto", 
                    opacity: 0.6,
                    filter: "brightness(1.2) contrast(0.8) blur(2px)",
                }} 
            />
        </motion.div>
    );
}

export default function PartnershipsPage() {
    return (
        <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center py-20"
            style={{ background: "linear-gradient(180deg, #304674 0%, #98bad5 100%)" }}>
            
            {/* Navigation */}
            <div className="absolute top-8 left-8 z-20">
                <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white font-bold transition-colors">
                    <ChevronLeft size={20} />
                    Back to Home Page
                </Link>
            </div>

            {/* Actual Cloud Assets */}
            <Cloud top="5%" left="-5%" src="/cloud-1.png" delay={0} scale={1.2} />
            <Cloud top="55%" left="2%" src="/cloud-2.png" delay={2} scale={0.8} />
            <Cloud top="25%" left="70%" src="/cloud-3.png" delay={5} scale={1.1} />
            <Cloud top="75%" left="55%" src="/cloud-4.png" delay={3} scale={0.9} />

            {/* Partnerships Content */}
            <div className="relative z-10 w-full">
                <CreativePartnerships 
                    tag="Strategic Partnerships"
                    title="Empowering Student Voice"
                    description="We partner with organizations that share our mission of putting professional opportunities within reach."
                    tiers={PARTNERS}
                />
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
        </main>
    );
}
