import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DESIGN_H, DESIGN_W, MAX_W, MIN_W } from "../config";

function computeScale() {
  const w = Math.min(Math.max(window.innerWidth, MIN_W), MAX_W);
  return Math.min(w / DESIGN_W, window.innerHeight / DESIGN_H);
}

const ScaleContext = createContext(1);
export const useStageScale = () => useContext(ScaleContext);

export function ScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(computeScale);
  useEffect(() => {
    const onResize = () => setScale(computeScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return <ScaleContext.Provider value={scale}>{children}</ScaleContext.Provider>;
}

/**
 * Full-viewport screen: `background` always covers the viewport,
 * `children` live on the 1440 × 900 design canvas, scaled and centred.
 */
export function Screen({ background, children, onBackgroundClick }: { background: ReactNode; children: ReactNode; onBackgroundClick?: () => void }) {
  const scale = useStageScale();
  return (
    <div className="anim-fade-in fixed inset-0 overflow-hidden" onClick={onBackgroundClick}>
      <div className="absolute inset-0">{background}</div>
      <div
        className="absolute left-1/2 top-1/2 h-[900px] w-[1440px]"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
