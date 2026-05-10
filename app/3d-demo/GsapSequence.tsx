"use client";

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Update this to match however many frames you render from Blender!
const FRAME_COUNT = 150; 

export default function GsapSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // --- 1. Preload all JPEG frames into memory ---
    // Make sure you render your Blender animation as a sequence of JPEGs (e.g. 0001.jpg, 0002.jpg)
    // and place them in a folder named /frames inside your public directory.
    const images: HTMLImageElement[] = [];
    
    // Create an object to hold the current frame index for GSAP to animate
    const playhead = { frame: 0 };

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      // Pad the number with zeros (e.g., 0001.jpg, 0002.jpg)
      const num = i.toString().padStart(4, '0');
      img.src = `/frames/${num}.jpg`;
      images.push(img);
    }

    // --- 2. Draw the very first frame once it loads ---
    images[0].onload = () => {
      // Set canvas dimensions to match your render size
      canvas.width = images[0].width || 1920;
      canvas.height = images[0].height || 1080;
      ctx.drawImage(images[0], 0, 0);
    };

    // --- 3. Tie the animation to scroll using GSAP ---
    const renderFrame = () => {
      if (images[playhead.frame] && images[playhead.frame].complete) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the current frame
        ctx.drawImage(images[playhead.frame], 0, 0, canvas.width, canvas.height);
      }
    };

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      // The distance you want the user to scroll to finish the animation
      end: '+=3000', 
      pin: true,
      scrub: 0.5, // 0.5 adds a tiny bit of smoothing to the scroll
      animation: gsap.to(playhead, {
        frame: FRAME_COUNT - 1,
        snap: 'frame', // Snap to exact integers (whole frames)
        ease: 'none', // Critical: no easing, strictly tied to scroll progress
        onUpdate: renderFrame
      })
    });

    return () => {
      // Cleanup GSAP instances when component unmounts
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover', // Ensures the canvas covers the screen perfectly without stretching
        }}
      />

      {/* Put your static InternLink UI overlay here. It will fade in at the end of the scroll! */}
      <div 
        className="ui-layer" 
        style={{ 
          position: 'absolute', 
          zIndex: 10, 
          color: 'white', 
          opacity: 0, // Animate this to 1 when the scroll is finished
          pointerEvents: 'none' // Change to 'auto' when visible
        }}
      >
        <h1 style={{ fontSize: '100px', fontWeight: 900 }}>Internlink</h1>
      </div>
    </div>
  );
}
