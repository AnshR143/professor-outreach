"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Environment, RoundedBox, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';

// A simple loading fallback so the page doesn't glitch while the 3D env loads
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-[#304674] font-bold text-sm bg-white/80 px-4 py-2 rounded-full backdrop-blur-md whitespace-nowrap">
        Loading 3D Experience... {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

export function MacbookScene({ isLoggedIn }: { isLoggedIn?: boolean }) {
  return (
    <div className="relative w-full h-screen bg-[#d8e1e8] overflow-hidden">
      <Canvas shadows camera={{ fov: 45 }}>
        <React.Suspense fallback={<Loader />}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow shadow-bias={-0.0001} />
          
          <SceneContent isLoggedIn={isLoggedIn} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}

function SceneContent({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [animationFinished, setAnimationFinished] = useState(false);

  // The 360 spin and zoom on mount
  useFrame((state) => {
    if (animationFinished) return;

    // Animation takes 3.5 seconds
    const duration = 3.5;
    const t = Math.min(state.clock.elapsedTime / duration, 1);
    
    // Smooth easing
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // Orbit from -2PI to 0
    const angle = (ease - 1) * 2 * Math.PI;

    // Distance zooms from 14 down to 3.2
    const distance = 14 - ease * (14 - 3.2);

    // Height drops from 6 down to 2.2
    const height = 6 - ease * (6 - 2.2);

    state.camera.position.set(
      Math.sin(angle) * distance,
      height,
      Math.cos(angle) * distance
    );

    // Always look at the laptop screen
    state.camera.lookAt(0, 1, 0);

    if (t === 1) {
      setAnimationFinished(true);
    }
  });

  return (
    <group>
      {/* Simple Desk Surface */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[10, 10, 0.1, 64]} />
        <meshStandardMaterial color="#c6d3e3" roughness={0.8} />
      </mesh>

      <Macbook isLoggedIn={isLoggedIn} />
    </group>
  );
}

function Macbook({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const lidRef = useRef<THREE.Group>(null);

  // Open the laptop smoothly right after the 360 spin starts
  useFrame((state, delta) => {
    if (lidRef.current) {
      const targetRotation = -105 * (Math.PI / 180);
      if (state.clock.elapsedTime > 0.5) {
        lidRef.current.rotation.x = THREE.MathUtils.damp(lidRef.current.rotation.x, targetRotation, 4, delta);
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Laptop Base */}
      <RoundedBox args={[2.8, 0.1, 2]} radius={0.05} position={[0, 0.05, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Keyboard Area */}
      <RoundedBox args={[2.6, 0.01, 1.2]} radius={0.02} position={[0, 0.1, 0.2]}>
        <meshStandardMaterial color="#1e293b" />
      </RoundedBox>
      
      {/* Trackpad */}
      <RoundedBox args={[0.8, 0.01, 0.5]} radius={0.01} position={[0, 0.1, 1.1]}>
        <meshStandardMaterial color="#334155" />
      </RoundedBox>

      {/* Hinge & Lid */}
      <group
        ref={lidRef}
        position={[0, 0.1, -0.9]} 
        rotation={[0, 0, 0]} // Starts closed
      >
        <RoundedBox args={[2.8, 2, 0.1]} radius={0.05} position={[0, 1, 0]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />

          {/* Screen Content */}
          <Html
            transform
            distanceFactor={1.2}
            position={[0, 1, 0.06]} // Centered on the lid
            rotation={[0, 0, 0]}
            style={{
              width: '1280px',
              height: '800px',
              backgroundColor: '#b2cbde', // Pastel Blue theme
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#304674',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: 'inset 0 0 50px rgba(0,0,0,0.05)',
              border: '24px solid #0f172a', // Macbook bezels
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Nav inside Screen */}
            <div style={{ position: 'absolute', top: 30, width: '90%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
               <div style={{ fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em', color: '#304674', textTransform: 'uppercase' }}>
                 Internlink
               </div>
               <Link href={isLoggedIn ? "/dashboard" : "/signup"} style={{
                 padding: '12px 32px',
                 borderRadius: '100px',
                 border: '4px solid #304674',
                 color: '#304674',
                 fontWeight: 800,
                 fontSize: 18,
                 textTransform: 'uppercase',
                 textDecoration: 'none',
                 transition: 'all 0.2s',
               }}>
                  {isLoggedIn ? "Dashboard" : "Start Now"}
               </Link>
            </div>

            {/* Main Content inside Screen */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, marginTop: '-5%' }}>
              <h1 style={{ 
                fontSize: '180px', 
                fontWeight: 900, 
                margin: '0 0 20px', 
                letterSpacing: '-0.05em', 
                lineHeight: 0.85, 
                color: '#1a1a1a',
                textTransform: 'uppercase',
                transform: 'scaleY(1.15)'
              }}>
                INTERNLINK
              </h1>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#d8e1e8',
                border: '4px solid #1a1a1a',
                borderRadius: '100px',
                padding: '24px 48px',
                boxShadow: '8px 8px 0px #1a1a1a',
                marginTop: '40px'
              }}>
                <span style={{ fontWeight: 800, color: '#1a1a1a', fontSize: '24px', letterSpacing: '-0.02em' }}>
                  The most seamless way to bridge the gap between students and careers!
                </span>
              </div>
            </div>

            {/* Decorative background shapes mimicking the image */}
            <div style={{ position: 'absolute', bottom: '15%', left: '20%', width: '300px', height: '300px', borderRadius: '50%', border: '40px solid #304674', opacity: 0.8, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '250px', height: '250px', borderRadius: '50%', backgroundColor: '#98bad5', border: '8px solid #1a1a1a', opacity: 0.9, pointerEvents: 'none' }} />

          </Html>
        </RoundedBox>
      </group>
    </group>
  );
}
