import React from 'react';
import GsapSequence from './GsapSequence';

// --- Main Container ---
export default function InternlinkScrollytelling() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden' }}>
      <GsapSequence />
    </div>
  );
}

// --- The 3D Scene ---
function ScrollytellingScene() {
  const scroll = useScroll();
  const screenCenterRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!screenCenterRef.current) return;

    const offset = scroll.offset; // Ranges from 0 to 1

    // Dynamically track the screen's actual world position and rotation
    const screenWorldPos = new THREE.Vector3();
    const screenWorldQuat = new THREE.Quaternion();
    screenCenterRef.current.getWorldPosition(screenWorldPos);
    screenCenterRef.current.getWorldQuaternion(screenWorldQuat);

    // --- Phase 1: The Pan (0 to 0.5) ---
    if (offset <= 0.5) {
      // Normalize offset for this phase (0 to 1)
      const t = offset * 2; 
      // Smooth easing (easeInOutCubic)
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Target position: perfectly in front of the screen (3.5 units away along its local Z axis)
      const frontPos = screenWorldPos.clone().add(
        new THREE.Vector3(0, 0, 3.5).applyQuaternion(screenWorldQuat)
      );

      // Interpolate Position
      state.camera.position.lerpVectors(INITIAL_POS, frontPos, eased);

      // Interpolate Rotation (Slerp)
      const startQuat = new THREE.Quaternion().setFromEuler(INITIAL_ROT);
      state.camera.quaternion.slerpQuaternions(startQuat, screenWorldQuat, eased);

    } 
    // --- Phase 2: The Portal Zoom (0.5 to 1.0) ---
    else {
      // Normalize offset for this phase (0 to 1)
      const t = (offset - 0.5) * 2;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const startPos = screenWorldPos.clone().add(
        new THREE.Vector3(0, 0, 3.5).applyQuaternion(screenWorldQuat)
      );
      
      // Target position: zoom extremely close to the screen (0.04 units away)
      const endPos = screenWorldPos.clone().add(
        new THREE.Vector3(0, 0, 0.04).applyQuaternion(screenWorldQuat)
      );

      state.camera.position.lerpVectors(startPos, endPos, eased);
      state.camera.quaternion.copy(screenWorldQuat);
    }
  });

  return (
    <group>
      {/* We use Suspense because useGLTF loads external models */}
      <React.Suspense fallback={<FallbackDesk />}>
        <CustomBlenderKitDesk />
      </React.Suspense>
      
      {/* A static Desktop Monitor holding the InternLink UI */}
      <DesktopMonitor screenCenterRef={screenCenterRef} />
    </group>
  );
}

// --- Custom Desk Model (Ready for your BlenderKit asset) ---
import { useGLTF } from '@react-three/drei';

function CustomBlenderKitDesk() {
  // NOTE: Once you download your BlenderKit desk and export it as "desk.glb" to your /public folder,
  // simply uncomment the line below and delete the FallbackDesk return!
  
  // const { scene } = useGLTF('/desk.glb');
  // return <primitive object={scene} position={[0, -0.1, 0]} />;

  return <FallbackDesk />;
}

// --- Static Desktop Monitor ---
function DesktopMonitor({ screenCenterRef }: { screenCenterRef: React.RefObject<THREE.Group> }) {
  return (
    <group position={[0, 0.8, -0.5]} rotation={[-0.05, 0, 0]}>
      {/* Monitor Stand */}
      <RoundedBox args={[0.6, 0.05, 0.5]} radius={0.02} position={[0, -0.75, -0.2]} castShadow receiveShadow>
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.8, 0.05]} radius={0.02} position={[0, -0.4, -0.2]} castShadow>
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Monitor Screen Frame */}
      <RoundedBox args={[3.2, 2.0, 0.1]} radius={0.05} castShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        
        {/* Reference point perfectly centered on the actual screen plane */}
        <group ref={screenCenterRef} position={[0, 0, 0.06]} />

        {/* InternLink HTML Screen Component */}
        <Html
          transform
          distanceFactor={1.2}
          position={[0, 0, 0.06]}
          rotation={[0, 0, 0]}
          style={{
            width: '1280px',
            height: '800px',
            backgroundColor: '#e0f2fe',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#0f172a',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.1)',
            border: '14px solid #0f172a', // Monitor bezels
            boxSizing: 'border-box'
          }}
        >
          {/* Nav */}
          <div style={{ position: 'absolute', top: 30, width: '90%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ fontWeight: 800, fontSize: 24 }}>Internlink</div>
             <div style={{ display: 'flex', gap: 20, fontSize: 18, fontWeight: 500 }}>
                <span>Jobs</span>
                <span>Candidates</span>
                <span>About</span>
             </div>
          </div>

          <h1 style={{ fontSize: '110px', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>
            Internlink
          </h1>
          <p style={{ fontSize: '38px', fontWeight: 500, marginTop: '30px', maxWidth: '800px', textAlign: 'center', lineHeight: 1.4, color: '#334155' }}>
            The most seamless way to bridge the gap between students and careers.
          </p>
          <button style={{ 
            marginTop: '60px', padding: '24px 56px', backgroundColor: '#3b82f6', 
            color: 'white', fontSize: '26px', fontWeight: 700, 
            border: 'none', borderRadius: '100px', cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)'
          }}>
            Discover Opportunities
          </button>
        </Html>
      </RoundedBox>
    </group>
  );
}

// --- Fallback Desk Environment ---
function FallbackDesk() {
  return (
    <group>
      {/* Round Table Placeholder */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[5, 5, 0.1, 64]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.7} />
      </mesh>

      {/* Decorative Candles */}
      <group position={[-1.8, 0, -1]}>
        {/* Candle 1 */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 32]} />
          <meshStandardMaterial color="#bfdbfe" />
        </mesh>
        {/* Flame */}
        <mesh position={[0, 0.8, 0]}>
          <coneGeometry args={[0.02, 0.06, 8]} />
          <meshStandardMaterial color="#fcd34d" emissive="#fcd34d" emissiveIntensity={2} />
        </mesh>

        {/* Candle 2 */}
        <mesh position={[0.4, 0.3, 0.2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.6, 32]} />
          <meshStandardMaterial color="#bfdbfe" />
        </mesh>
        {/* Flame */}
        <mesh position={[0.4, 0.6, 0.2]}>
          <coneGeometry args={[0.02, 0.06, 8]} />
          <meshStandardMaterial color="#fcd34d" emissive="#fcd34d" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
}
