import { useEffect, useRef, useState } from "react";
import { cities, type City } from "../data/cities";
import { CITY_COUNT, CHIP_FLASH_MS, FLIP_MS } from "../config";
import { CityCardBack, CityCardFront } from "../components/CityCard";
import GestureHintChip from "../components/GestureHintChip";
import CameraWindow from "../components/CameraWindow";
import { Screen } from "../components/Stage";
import { gestureBus, useGestureEvents, type GestureEvent } from "../input/gestureBus";
import { useHandState } from "../gestures/handStore";
import { getBlurredPhoto } from "../lib/blurredPhoto";
import { FIRST_VISIT_FADE_MS } from "../gestures/constants";
import { playFlip, playHeart } from "../audio/sound";

export const END_SLIDE = CITY_COUNT; // centre index 0–15 = cities, 16 = end slide

type Props = {
  centre: number;
  setCentre: (n: number) => void;
  picks: string[];
  togglePick: (id: string) => void;
  mouseMode: boolean;
  stream: MediaStream | null;
  muted: boolean;
  onToggleMute: () => void;
  onDepartures: () => void;
  announce: (msg: string) => void;
};

// Slot geometry from frame 02 (centres on the 1440 × 900 canvas)
const SLOTS: Record<number, { x: number; y: number; s: number; r: number; o: number }> = {
  [-3]: { x: 40, y: 410, s: 0.4, r: -10, o: 0 },
  [-2]: { x: 223.7, y: 402.3, s: 0.5, r: -8, o: 0.45 },
  [-1]: { x: 430, y: 395.9, s: 0.66, r: -5, o: 0.8 },
  [0]: { x: 720, y: 400, s: 0.82, r: 0, o: 1 },
  [1]: { x: 1008.9, y: 422.3, s: 0.66, r: 5, o: 0.8 },
  [2]: { x: 1214, y: 434.2, s: 0.5, r: 8, o: 0.45 },
  [3]: { x: 1400, y: 440, s: 0.4, r: 10, o: 0 },
};

/** Offset of city i (0-based) from the centre; end slide sits between 16 and 01. */
function offsetOf(i: number, centre: number) {
  const pos = centre === END_SLIDE ? CITY_COUNT - 0.5 : centre;
  let raw = i - pos;
  raw = ((raw + CITY_COUNT / 2) % CITY_COUNT + CITY_COUNT) % CITY_COUNT - CITY_COUNT / 2;
  return raw > 0 ? Math.ceil(raw) : Math.floor(raw);
}

type ChipKey = "browse" | "select" | "flip" | "flipBack";

export default function GalleryScreen(p: Props) {
  const { centre, picks, mouseMode } = p;
  const [flipped, setFlipped] = useState(false);
  const [flash, setFlash] = useState<ChipKey | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const navTimer = useRef<number | undefined>(undefined);
  const { holdKind, everDetected } = useHandState();
  const centreCity: City | null = centre === END_SLIDE ? null : cities[centre];

  // Background crossfade: keep the previous photo underneath the new one.
  const [bgs, setBgs] = useState<string[]>([]);
  const wantedBg = useRef("");
  useEffect(() => {
    // On the end slide the previous photo stays; if nothing was shown yet, start from the last city.
    const photo = centreCity?.photo ?? (wantedBg.current ? null : cities[CITY_COUNT - 1].photo);
    if (!photo) return;
    wantedBg.current = photo;
    void getBlurredPhoto(photo).then((url) => {
      if (wantedBg.current !== photo) return;
      setBgs((prev) => (prev[prev.length - 1] === url ? prev : [...prev.slice(-1), url]));
    });
  }, [centreCity]);

  useEffect(() => () => {
    window.clearTimeout(flashTimer.current);
    window.clearTimeout(navTimer.current);
  }, []);

  const flashChip = (k: ChipKey) => {
    setFlash(k);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), CHIP_FLASH_MS);
  };

  const step = (dir: 1 | -1) => {
    const go = () => {
      const n = (centre + dir + CITY_COUNT + 1) % (CITY_COUNT + 1);
      p.setCentre(n);
      p.announce(n === END_SLIDE ? "Ready? Hold palm to see your departures" : `${cities[n].name}, ${cities[n].country}. ${n + 1} of ${CITY_COUNT}`);
    };
    if (flipped) {
      setFlipped(false);
      playFlip();
      window.clearTimeout(navTimer.current);
      navTimer.current = window.setTimeout(go, FLIP_MS);
    } else go();
  };

  useGestureEvents((e: GestureEvent) => {
    switch (e.type) {
      case "next":
      case "prev":
        flashChip("browse");
        step(e.type === "next" ? 1 : -1);
        break;
      case "select":
        if (!centreCity) return;
        flashChip("select");
        playHeart();
        p.togglePick(centreCity.id);
        p.announce(`${centreCity.name} ${picks.includes(centreCity.id) ? "removed" : "selected"}`);
        break;
      case "palmHold":
        flashChip("flip");
        if (!centreCity) p.onDepartures();
        else if (!flipped) {
          setFlipped(true);
          playFlip();
          p.announce(`${centreCity.name} card flipped`);
        }
        break;
      case "fistHold":
        flashChip("flipBack");
        if (flipped) {
          setFlipped(false);
          playFlip();
          p.announce("Card flipped back");
        }
        break;
    }
  });

  const chips: { key: ChipKey; label: string; action: string }[] = mouseMode
    ? [
        { key: "browse", label: "← / →", action: "browse" },
        { key: "select", label: "Space", action: "select" },
        { key: "flip", label: "Enter", action: "flip" },
        { key: "flipBack", label: "Esc", action: "flip back" },
      ]
    : [
        { key: "browse", label: "Swipe", action: "browse" },
        { key: "select", label: "Pinch", action: "select" },
        { key: "flip", label: "Hold palm", action: "flip" },
        { key: "flipBack", label: "Hold fist", action: "flip back" },
      ];

  const background = (
    <>
      <div className="absolute inset-0 bg-[#121212]" />
      {bgs.map((src, i) => (
        <img key={src + i} src={src} alt="" className={`absolute inset-[-60px] size-[calc(100%+120px)] max-w-none object-cover ${i === bgs.length - 1 && bgs.length > 1 ? "anim-fade-in" : ""}`} />
      ))}
      <div className="absolute inset-0 bg-[rgba(27,26,24,0.4)]" />
    </>
  );

  const cardWrap = (d: number, children: React.ReactNode, key: string, interactive: boolean, label: string) => {
    const s = SLOTS[Math.max(-3, Math.min(3, d))];
    const isCentre = d === 0;
    return (
      <div
        key={key}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : -1}
        aria-label={interactive ? label : undefined}
        aria-hidden={!interactive}
        onClick={(ev) => {
          ev.stopPropagation();
          if (!interactive) return;
          if (d < 0) gestureBus.emit({ type: "prev" });
          else if (d > 0) gestureBus.emit({ type: "next" });
          else gestureBus.emit({ type: "palmHold", side: "right" });
        }}
        className={`carousel-slot absolute left-0 top-0 h-[714px] w-[458px] rounded-[36px] transition-[transform,opacity] duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)] ${
          interactive ? "cursor-pointer" : "pointer-events-none"
        } ${isCentre ? "drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)]" : ""}`}
        style={{
          transform: `translate(${s.x - 229}px, ${s.y - 357}px) rotate(${s.r}deg) scale(${s.s})`,
          opacity: s.o,
          zIndex: 10 - Math.abs(d),
        }}
      >
        {children}
      </div>
    );
  };

  return (
    <Screen background={background} onBackgroundClick={() => gestureBus.emit({ type: "fistHold" })}>
      {/* Carousel */}
      {cities.map((c, i) => {
        const d = offsetOf(i, centre);
        const visible = Math.abs(d) <= 2;
        const isCentre = d === 0;
        const selected = picks.includes(c.id);
        const heart = selected ? "on" : isCentre ? "off" : "hidden";
        const front = <CityCardFront city={c} heart={heart} onHeart={() => gestureBus.emit({ type: "select" })} />;
        const content = isCentre ? (
          <div className="flip-scene size-full">
            <div className={`flip-inner relative size-full ${flipped ? "is-flipped" : ""}`}>
              <div className="flip-face absolute inset-0">{front}</div>
              <div className="flip-face flip-back absolute inset-0">
                <CityCardBack city={c} />
              </div>
            </div>
          </div>
        ) : (
          <div className={heart === "on" ? "[&_button]:pointer-events-none" : ""}>{front}</div>
        );
        const label = isCentre ? `${c.name} — ${flipped ? "showing details" : "flip for details"}` : `Go to ${c.name}`;
        return cardWrap(d, content, c.id, visible, label);
      })}

      {/* End slide */}
      {(() => {
        const atEnd = centre === END_SLIDE;
        const d = atEnd ? 0 : centre === 0 ? 1 : centre === CITY_COUNT - 1 ? -1 : 3;
        return cardWrap(
          atEnd ? 0 : d * 3,
          <div className="flex size-full flex-col items-center justify-center gap-[28px] rounded-[36px] bg-paper p-[48px] text-center text-ink">
            <p className="font-bebas text-[96px] leading-[0.9]">Ready?</p>
            <p className="font-caveat text-[34px] leading-[1.15] text-ultramarine">Hold palm to see your departures</p>
          </div>,
          "end",
          atEnd,
          "Ready? Hold palm to see your departures",
        );
      })()}

      {/* Top bar */}
      <p className="absolute left-[48px] top-[34px] font-bebas text-[34px] leading-none text-paper">WHERE NEXT?</p>
      {centre !== END_SLIDE && (
        <div className="glass absolute left-1/2 top-[36px] -translate-x-1/2 rounded-full px-[16px] py-[8px] font-mono text-[14px] font-bold text-paper" aria-hidden>
          {String(centre + 1).padStart(2, "0")} / {CITY_COUNT}
        </div>
      )}
      <div className="absolute right-[48px] top-[32px] flex items-center gap-[12px]" onClick={(e) => e.stopPropagation()}>
        <div className="glass flex items-center gap-[8px] rounded-full px-[16px] py-[8px]">
          <img src="/assets/880ab.svg" alt="" className="size-[16px]" />
          <span className="font-inter text-[14px] font-medium text-paper">{picks.length} selected</span>
        </div>
        <button
          type="button"
          onClick={p.onToggleMute}
          aria-pressed={p.muted}
          aria-label={p.muted ? "Unmute sound" : "Mute sound"}
          className={`glass relative rounded-full p-[9px] transition-opacity ${p.muted ? "opacity-50" : ""}`}
        >
          <img src="/assets/f5e6a.svg" alt="" className="block size-[18px]" />
          {p.muted && (
            <svg viewBox="0 0 18 18" fill="none" className="pointer-events-none absolute left-[9px] top-[9px] size-[18px]" aria-hidden>
              <path d="M2.5 2.5L15.5 15.5" stroke="#121212" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M2.5 2.5L15.5 15.5" stroke="#F6F2E9" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Hint chips */}
      <div className="absolute left-1/2 top-[820px] flex -translate-x-1/2 gap-[10px]" aria-hidden>
        {chips.map((c) => (
          <GestureHintChip
            key={c.key}
            label={c.label}
            action={c.action}
            state={flash === c.key ? "recognised" : "default"}
            holding={(c.key === "flip" && holdKind === "palm") || (c.key === "flipBack" && holdKind === "fist")}
          />
        ))}
      </div>

      {!mouseMode && (
        <div className="absolute left-[1152px] top-[664px]" onClick={(e) => e.stopPropagation()}>
          <CameraWindow stream={p.stream} />
        </div>
      )}

      {/* First visit (camera mode only): fades out once a hand is detected */}
      {!mouseMode && (
        <div
          aria-hidden={everDetected}
          style={{ transitionDuration: `${FIRST_VISIT_FADE_MS}ms` }}
          className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[rgba(27,26,24,0.55)] transition-opacity ${
            everDetected ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="font-bebas text-[72px] leading-none text-paper">Raise your hand to start</p>
        </div>
      )}
    </Screen>
  );
}
