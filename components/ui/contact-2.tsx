"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { FloatingPaths } from "@/components/ui/background-paths";

import { motion } from "framer-motion";

interface Contact2Props {
  title?: string;
  description?: string;
}

export const Contact2 = ({
  title = "Get in Touch",
  description = "Have questions about professor outreach or internships? We're here to help you land your next position.",
}: Contact2Props) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      firstName: formData.get("firstname"),
      lastName: formData.get("lastname"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", msg: "Message sent successfully!" });
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus({ type: "error", msg: data.error || "Failed to send message." });
      }
    } catch (err) {
      setStatus({ type: "error", msg: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-12 bg-white relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
        
        {/* Variety of clouds around the form */}
        <motion.img 
          src="/cloud-1.png" 
          animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: "10%", left: "-10%", width: 380, opacity: 0.5, pointerEvents: "none", filter: "blur(1px)" }}
        />
        <motion.img 
          src="/cloud-3.png" 
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", bottom: "5%", right: "-12%", width: 420, opacity: 0.45, pointerEvents: "none", filter: "blur(2px)" }}
        />
        <motion.img 
          src="/cloud-2.png" 
          animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: "35%", right: "-5%", width: 280, opacity: 0.4, pointerEvents: "none" }}
        />
        <motion.img 
          src="/cloud-4.png" 
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 13, repeat: Infinity }}
          style={{ position: "absolute", bottom: "25%", left: "5%", width: 240, opacity: 0.35, pointerEvents: "none" }}
        />
        <motion.img 
          src="/cloud-1.png" 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{ position: "absolute", top: "60%", right: "12%", width: 180, opacity: 0.3, pointerEvents: "none", transform: "scaleX(-1)" }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto flex flex-col items-center gap-4">
          <div className="text-center">
            <h2 className="mb-0.5 text-2xl font-bold tracking-tight text-[#304674]">
              {title}
            </h2>
            <p className="text-muted-foreground text-[10px] max-w-xs mx-auto">{description}</p>
          </div>

          <form 
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-2.5 rounded-xl border border-[#e2e8f0] p-4 bg-[#f8f9fb] shadow-sm"
          >
            <div className="flex gap-3">
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="firstname" className="text-[10px] font-bold text-[#304674]">First Name</Label>
                <Input type="text" id="firstname" name="firstname" placeholder="First Name" required className="bg-white h-8 text-[11px] px-2" />
              </div>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="lastname" className="text-[10px] font-bold text-[#304674]">Last Name</Label>
                <Input type="text" id="lastname" name="lastname" placeholder="Last Name" required className="bg-white h-8 text-[11px] px-2" />
              </div>
            </div>
            <div className="grid w-full items-center gap-1">
              <Label htmlFor="email" className="text-[10px] font-bold text-[#304674]">Email</Label>
              <Input type="email" id="email" name="email" placeholder="Email" required className="bg-white h-8 text-[11px] px-2" />
            </div>
            <div className="grid w-full items-center gap-1">
              <Label htmlFor="subject" className="text-[10px] font-bold text-[#304674]">Subject</Label>
              <Input type="text" id="subject" name="subject" placeholder="Subject" required className="bg-white h-8 text-[11px] px-2" />
            </div>
            <div className="grid w-full gap-1">
              <Label htmlFor="message" className="text-[10px] font-bold text-[#304674]">Message</Label>
              <Textarea placeholder="Type your message here." id="message" name="message" required className="bg-white min-h-[60px] text-[11px] px-2 py-1.5" />
            </div>

            {status && (
              <div className={`p-2 rounded-md text-[10px] font-bold ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {status.msg}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#304674] hover:bg-[#1a2e52] text-white font-bold h-8 text-xs transition-all active:scale-95"
            >
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};
