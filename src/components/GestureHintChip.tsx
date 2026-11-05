import { useEffect, useRef } from "react";
import { handLive } from "../gestures/handStore";

type Props = {
  label: string;
  action: string;
  state?: "default" | "recognised";
  progress?: number; // 0–1, hold-progress ring
  /** Show a ring driven live by the current hand hold (per-frame, no re-renders). */
  holding?: boolean;
};

const R = 7;
const C = 2 * Math.PI * R;

export function Ring({ progress, live }: { progress?: number; live?: boolean }) {
  const arc = useRef<SVGCircleElement>(null);
  useEffect(() => {
    if (!live) return;
    let raf = 0;
    const tick = () => {
      arc.current?.setAttribute("stroke-dashoffset", String(C * (1 - handLive.holdProgress)));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [live]);
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="-rotate-90" aria-hidden>
      <circle cx="9" cy="9" r={R} fill="none" stroke="rgba(246,242,233,0.25)" strokeWidth="2" />
      <circle ref={arc} cx="9" cy="9" r={R} fill="none" stroke="#f6f2e9" strokeWidth="2" strokeDasharray={C} strokeDashoffset={C * (1 - (progress ?? 0))} strokeLinecap="round" />
    </svg>
  );
}

// GestureHintChip — default / recognised / hold-progress
export default function GestureHintChip({ label, action, state = "default", progress, holding }: Props) {
  const recognised = state === "recognised";
  return (
    <div
      className={`flex items-center gap-[8px] rounded-full px-[16px] py-[10px] font-inter text-[14px] whitespace-nowrap transition-colors duration-200 ${
        recognised ? "bg-ultramarine" : "glass"
      }`}
    >
      {(holding || progress !== undefined) && <Ring progress={progress} live={holding} />}
      <p>
        <span className="font-medium text-paper">{label}</span>
        <span className={recognised ? "text-paper" : "text-[rgba(246,242,233,0.7)]"}>{` — ${action}`}</span>
      </p>
    </div>
  );
}
