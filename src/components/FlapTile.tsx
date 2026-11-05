import { useEffect, useState } from "react";
import { FLAP_CHARSET } from "../data/cities";
import { playFlapClick } from "../audio/sound";

type Props = { char: string; delay: number; duration: number; runKey: number };

// Flap Tile — cycles through random characters, then lands on `char`.
export default function FlapTile({ char, delay, duration, runKey }: Props) {
  const [shown, setShown] = useState(char);
  useEffect(() => {
    if (duration <= 0) {
      setShown(char);
      return;
    }
    let tick: number | undefined;
    const start = window.setTimeout(() => {
      const end = performance.now() + duration;
      tick = window.setInterval(() => {
        if (performance.now() >= end) {
          window.clearInterval(tick);
          setShown(char);
          playFlapClick();
        } else {
          setShown(FLAP_CHARSET[Math.floor(Math.random() * (FLAP_CHARSET.length - 1))]);
          playFlapClick();
        }
      }, 50);
    }, delay);
    setShown(" ");
    return () => {
      window.clearTimeout(start);
      window.clearInterval(tick);
    };
  }, [char, delay, duration, runKey]);

  return (
    <div className="relative flex h-[44px] w-[32px] items-center justify-center overflow-hidden rounded-[4px] bg-[#1e1e1e]">
      <span className="font-mono text-[24px] font-bold leading-none text-paper">{shown}</span>
      <div className="absolute inset-x-0 top-1/2 h-px bg-[rgba(0,0,0,0.7)]" />
    </div>
  );
}
