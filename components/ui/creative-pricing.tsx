"use client"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, Globe, BookOpen, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface PartnerTier {
    name: string;
    icon: React.ReactNode;
    description: string;
    features: string[];
    logoUrl: string;
    link: string;
    color: string;
}

function CreativePartnerships({
    tag = "Institutional Partners",
    title = "Collaborating for Global Impact",
    description = "Bridging the gap between academia and professional publishing.",
    tiers,
}: {
    tag?: string;
    title?: string;
    description?: string;
    tiers: PartnerTier[];
}) {
    return (
        <div className="w-full max-w-[1600px] mx-auto px-6 relative">
            {/* Header */}
            <div className="text-center space-y-6 mb-20">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    className="text-xl text-[#98bad5] font-bold tracking-tight rotate-[-1deg]">
                    {tag}
                </motion.div>
                <div className="relative">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-white rotate-[-1deg] tracking-tighter">
                        {title}
                    </motion.h2>
                    <div
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-3 bg-[#98bad5]/20 
                        rotate-[-1deg] rounded-full blur-sm"
                    />
                </div>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl md:text-2xl text-white/80 rotate-[-1deg] max-w-3xl mx-auto">
                    {description}
                </motion.p>
            </div>

            {/* Grid for Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 justify-center items-stretch max-w-7xl mx-auto">
                {tiers.map((tier, index) => (
                    <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            "relative group w-full",
                            "transition-all duration-300",
                            index % 3 === 0 ? "rotate-[-1deg]" : index % 3 === 1 ? "rotate-[1deg]" : "rotate-[-0.5deg]"
                        )}
                    >
                        {/* The Box */}
                        <div
                            className={cn(
                                "absolute inset-0 bg-white/95 backdrop-blur-xl",
                                "border-4 border-[#304674]",
                                "rounded-3xl shadow-[10px_10px_0px_0px] shadow-[#304674]",
                                "transition-all duration-300",
                                "group-hover:shadow-[16px_16px_0px_0px]",
                                "group-hover:translate-x-[-6px]",
                                "group-hover:translate-y-[-6px]"
                            )}
                        />

                        <div className="relative p-8 flex flex-col gap-6">
                            {/* Logo / Icon Area */}
                            <div className="flex items-center gap-6">
                                <div
                                    className={cn(
                                        "w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0",
                                        "border-4 border-[#304674] shadow-[4px_4px_0px_0px] shadow-[#304674]",
                                        "flex items-center justify-center bg-white"
                                    )}
                                >
                                    <img src={tier.logoUrl} alt={tier.name} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="text-2xl font-black text-[#304674] tracking-tight">
                                    {tier.name}
                                </h3>
                            </div>

                            <div className="flex-1">
                                <p className="text-md text-[#304674]/80 font-semibold leading-relaxed mb-6 min-h-[60px]">
                                    {tier.description}
                                </p>

                                <div className="space-y-3 mb-8">
                                    {tier.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-center gap-3"
                                        >
                                            <div
                                                className="w-5 h-5 rounded-full border-2 border-[#304674] 
                                                flex items-center justify-center bg-[#98bad5]"
                                            >
                                                <Check className="w-3 h-3 text-[#304674]" />
                                            </div>
                                            <span className="text-sm font-bold text-[#304674]">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    asChild
                                    className={cn(
                                        "h-12 px-6 text-md font-black relative w-full",
                                        "border-4 border-[#304674] rounded-xl bg-[#98bad5]",
                                        "text-[#304674] transition-all duration-300",
                                        "shadow-[6px_6px_0px_0px] shadow-[#304674]",
                                        "hover:shadow-[8px_8px_0px_0px] hover:bg-[#b2cbde]",
                                        "hover:translate-x-[-2px] hover:translate-y-[-2px]",
                                    )}
                                >
                                    <a href={tier.link} target="_blank" rel="noopener noreferrer">Visit Publication</a>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export { CreativePartnerships }
