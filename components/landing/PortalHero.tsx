"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export function PortalHero({ isLoggedIn }: { isLoggedIn?: boolean }) {
  return (
    <div className="relative w-full h-screen bg-[#d1dbe4] flex items-center justify-center overflow-hidden z-20 border-b-[6px] border-black">
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-[#98bad5] rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-[20%] right-[20%] w-[30vw] h-[30vw] bg-[#b2cbde] rounded-full blur-[120px] opacity-40" />
      </div>

      {/* The 360 Spin + Zoom Laptop */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center"
        initial={{ 
          scale: 0.1, 
          rotateY: -1080, 
          y: -100,
          opacity: 0
        }}
        animate={{ 
          scale: 1, 
          rotateY: 0,
          y: 0,
          opacity: 1
        }}
        transition={{
          duration: 5, // Slow, premium spin
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 3D Laptop Container */}
        <div 
          className="relative"
          style={{ 
            width: "min(900px, 85vw)", 
            aspectRatio: "16/9", // Adjusted to fit 16:9 video
            transformStyle: "preserve-3d"
          }}
        >
          {/* FRONT FACE (Screen & UI from the drawing) */}
          <div 
            className="absolute inset-0 bg-[#e2e8f0] rounded-[1.5vw] border-[0.4vw] border-black shadow-[10px_10px_0px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
            style={{ 
              backfaceVisibility: "hidden",
              zIndex: 2 
            }}
          >
            {/* Screen Area */}
            <div 
              className="relative w-full h-full bg-black border-[0.2vw] border-black rounded-[1vw] m-[0.5vw] overflow-hidden"
              style={{ width: 'calc(100% - 1vw)', height: 'calc(100% - 1vw)' }}
            >
              <video
                src="/videos/sky_loop_v2.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scale(1.05)" }}
              />
            </div>
          </div>

          {/* BACK FACE (Lid from the drawing) */}
          <div 
            className="absolute inset-0 bg-[#cbd5e1] rounded-[1.5vw] border-[0.4vw] border-black flex items-center justify-center shadow-2xl"
            style={{ 
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden" 
            }}
          >
            {/* Lid Logo (Smiley) */}
            <div className="w-[16vw] h-[16vw] bg-[#304674] rounded-full border-[0.4vw] border-black shadow-[8px_8px_0px_rgba(0,0,0,0.15)] flex items-center justify-center relative">
              <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] text-white" fill="currentColor">
                <circle cx="35" cy="40" r="8" />
                <circle cx="65" cy="40" r="8" />
                <path d="M 30 65 Q 50 85 70 65" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round" />
              </svg>
              {/* Shine lines */}
              <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-60">
                <div className="w-5 h-1.5 bg-white rounded-full rotate-[30deg]" />
                <div className="w-3 h-1.5 bg-white rounded-full rotate-[30deg]" />
              </div>
            </div>
          </div>
        </div>

        {/* Laptop Base (Keyboard area from the drawing) */}
        <div className="w-[108%] h-[3.5vw] bg-[#e2e8f0] rounded-b-[1.5vw] border-x-[0.4vw] border-b-[0.4vw] border-black relative -mt-[0.2vw] shadow-[10px_10px_0px_rgba(0,0,0,0.1)] flex flex-col items-center z-30">
          <div className="w-full h-[1.5vw] border-b-[0.25vw] border-black/40 flex justify-center items-center px-[4%] gap-[0.5%] pt-[0.5vw]">
             {Array.from({length: 12}).map((_, i) => (
               <div key={i} className="flex-1 h-[0.5vw] bg-black/20 rounded-sm border border-black/10" />
             ))}
          </div>
          <div className="w-[20%] h-[1.2vw] bg-[#cbd5e1] border-x-[0.25vw] border-b-[0.25vw] border-black rounded-b-[0.8vw]" />
        </div>
      </motion.div>
    </div>
  );
}
