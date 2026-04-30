import { cn } from "@/lib/utils"

interface Loader9Props {
  className?: string
  color?: string
  size?: "sm" | "md" | "lg"
}

const SIZE = {
  sm: { box: 20, gap: 4 },
  md: { box: 28, gap: 5 },
  lg: { box: 36, gap: 6 },
}

export function Loader9({ className, color = "#f97316", size = "md" }: Loader9Props) {
  const { box, gap } = SIZE[size]
  const half = box / 2
  const totalW = box * 4 + gap * 3

  // Derive face colors from base color
  const darkFace = color  // right face (medium)
  const lightFace = color  // left face

  return (
    <div
      className={cn("loader-9-root", className)}
      style={{ position: "relative", width: totalW, height: box * 1.6, display: "inline-block" }}
    >
      <style>{`
        @keyframes loader9-from-left {
          0%   { z-index: 20; opacity: 0; translate: -${half}px -${Math.round(half * 0.3)}px; }
          20%  { z-index: 10; opacity: 1; translate: 0px 0px; }
          40%  { z-index: 9;  translate: 0px ${Math.round(box * 0.14)}px; }
          60%  { z-index: 8;  translate: 0px ${Math.round(box * 0.28)}px; }
          80%  { z-index: 7;  opacity: 1; translate: 0px ${Math.round(box * 0.43)}px; }
          100% { z-index: 5;  translate: 0px ${Math.round(box * 1.1)}px; opacity: 0; }
        }
        @keyframes loader9-from-right {
          0%   { z-index: 20; opacity: 0; translate: ${half}px -${Math.round(half * 0.3)}px; }
          20%  { z-index: 10; opacity: 1; translate: 0px 0px; }
          40%  { z-index: 9;  translate: 0px ${Math.round(box * 0.14)}px; }
          60%  { z-index: 8;  translate: 0px ${Math.round(box * 0.28)}px; }
          80%  { z-index: 7;  opacity: 1; translate: 0px ${Math.round(box * 0.43)}px; }
          100% { z-index: 5;  translate: 0px ${Math.round(box * 1.1)}px; opacity: 0; }
        }
        .loader9-box {
          position: absolute;
          width: ${box}px;
          height: ${box}px;
          top: ${Math.round(box * 0.2)}px;
          opacity: 0;
        }
        .loader9-box-1 { left: 0px; animation: loader9-from-left  2s ease infinite 0s; }
        .loader9-box-2 { left: ${box + gap}px; animation: loader9-from-right 2s ease infinite 0.5s; }
        .loader9-box-3 { left: ${(box + gap) * 2}px; animation: loader9-from-left  2s ease infinite 1s; }
        .loader9-box-4 { left: ${(box + gap) * 3}px; animation: loader9-from-right 2s ease infinite 1.5s; }
        .loader9-left {
          position: absolute;
          bottom: 0;
          left: 0;
          width: ${half}px;
          height: ${box}px;
          background: ${lightFace};
          opacity: 0.6;
          transform: skewY(30deg);
          transform-origin: bottom left;
        }
        .loader9-right {
          position: absolute;
          bottom: 0;
          right: 0;
          width: ${half}px;
          height: ${box}px;
          background: ${darkFace};
          opacity: 0.85;
          transform: skewY(-30deg);
          transform-origin: bottom right;
        }
        .loader9-top {
          position: absolute;
          top: 0;
          left: 0;
          width: ${box}px;
          height: ${half}px;
          background: white;
          opacity: 0.95;
          transform: rotate(-30deg) skewX(-30deg) scaleY(0.6) translate(${Math.round(half * 0.6)}px, -${Math.round(half * 0.4)}px);
        }
      `}</style>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`loader9-box loader9-box-${i}`}>
          <div className="loader9-left" />
          <div className="loader9-right" />
          <div className="loader9-top" />
        </div>
      ))}
    </div>
  )
}
