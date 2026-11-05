import { useEffect, useRef, useState } from "react";
import type { City } from "../data/cities";
import { BYE_MS, FLY_AWAY_MS } from "../config";
import { CityCardFront } from "../components/CityCard";
import { Screen } from "../components/Stage";
import CameraWindow from "../components/CameraWindow";
import { useGestureEvents, gestureBus, type Side } from "../input/gestureBus";
import { DuelBackground } from "./DeparturesScreen";
import { useHandState } from "../gestures/handStore";
import { Ring } from "../components/GestureHintChip";

type Props = {
  picks: City[];
  mouseMode: boolean;
  stream: MediaStream | null;
  onWinner: (c: City) => void;
  announce: (msg: string) => void;
};

type Bracket = { round: number; entrants: City[]; winners: City[]; pos: number };

const CARD_SCALE = 0.72;
const CENTRES = { left: 500, right: 940, solo: 720 };

export default function DuelScreen({ picks, mouseMode, stream, onWinner, announce }: Props) {
  const [b, setB] = useState<Bracket>({ round: 1, entrants: picks, winners: [], pos: 0 });
  const [resolving, setResolving] = useState<Side | null>(null);
  const [hover, setHover] = useState<Side | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const { holdKind, holdSide } = useHandState();
  const palmSide: Side | null = holdKind === "palm" ? holdSide : null;

  const isBye = b.pos === b.entrants.length - 1;
  const left = b.entrants[b.pos];
  const right = isBye ? undefined : b.entrants[b.pos + 1];
  const matches = Math.floor(b.entrants.length / 2);
  const matchNo = Math.floor(b.pos / 2) + 1;

  const advance = (winner: City, step: number) => {
    const winners = [...b.winners, winner];
    const pos = b.pos + step;
    if (pos < b.entrants.length) setB({ ...b, winners, pos });
    else if (winners.length === 1) onWinner(winners[0]);
    else setB({ round: b.round + 1, entrants: winners, winners: [], pos: 0 });
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Announce each match / bye; byes move on automatically.
  useEffect(() => {
    if (isBye) {
      announce(`${left.name}: no opponent, moves on`);
      timer.current = window.setTimeout(() => advance(left, 1), BYE_MS);
      return () => window.clearTimeout(timer.current);
    }
    announce(`Round ${b.round}, match ${matchNo} of ${matches}: ${left.name} or ${right!.name}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b]);

  useGestureEvents((e) => {
    if (e.type !== "palmHold" || isBye || resolving) return;
    const winner = e.side === "left" ? left : right!;
    setResolving(e.side);
    announce(`${winner.name} wins`);
    timer.current = window.setTimeout(() => {
      setResolving(null);
      advance(winner, 2);
    }, FLY_AWAY_MS);
  });

  const card = (c: City, side: Side | "solo") => {
    const glowing = side !== "solo" && (resolving ? resolving === side : (palmSide ?? hover) === side);
    const losing = side !== "solo" && resolving !== null && resolving !== side;
    const winning = side !== "solo" && resolving === side;
    return (
      <div
        key={`${b.round}-${b.pos}-${c.id}`}
        className="absolute top-[230px] origin-top-left"
        style={{ left: CENTRES[side] - (458 * CARD_SCALE) / 2, transform: `scale(${CARD_SCALE})` }}
      >
        <div className="anim-slide-in">
        <div
          role={side === "solo" ? undefined : "button"}
          tabIndex={side === "solo" ? undefined : 0}
          aria-label={side === "solo" ? undefined : `Fly to ${c.name}`}
          onMouseEnter={() => side !== "solo" && setHover(side)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => side !== "solo" && setHover(side)}
          onBlur={() => setHover(null)}
          onClick={() => side !== "solo" && gestureBus.emit({ type: "palmHold", side })}
          className={`rounded-[36px] transition-[filter,opacity] duration-200 ${side === "solo" ? "" : "cursor-pointer"} ${
            glowing ? "drop-shadow-[0_0_24px_rgba(61,53,242,0.9)]" : `drop-shadow-[0_20px_25px_rgba(0,0,0,0.35)] ${side === "solo" ? "" : "opacity-85"}`
          } ${losing ? "anim-fly" : ""} ${winning ? "anim-winner" : ""}`}
        >
          <CityCardFront city={c} />
        </div>
        </div>
      </div>
    );
  };

  return (
    <Screen background={<DuelBackground />}>
      <div className="absolute left-1/2 top-[90px] flex -translate-x-1/2 flex-col items-center gap-[6px] whitespace-nowrap text-paper">
        <p className="font-inter text-[13px] font-medium tracking-[1.95px] text-[rgba(246,242,233,0.7)]">
          {isBye ? `ROUND ${b.round}` : `ROUND ${b.round} · MATCH ${matchNo} OF ${matches}`}
        </p>
        <h2 className="font-bebas text-[52px] leading-[1.2]">WHICH ONE WOULD YOU RATHER FLY TO?</h2>
      </div>

      {isBye ? (
        card(left, "solo")
      ) : (
        <>
          {card(left, "left")}
          {card(right!, "right")}
          <div className="glass absolute left-[678px] top-[445px] flex size-[84px] items-center justify-center rounded-full font-bebas text-[40px] text-paper">VS</div>
        </>
      )}

      <div className="glass absolute left-1/2 top-[820px] flex -translate-x-1/2 items-center gap-[8px] whitespace-nowrap rounded-full px-[18px] py-[10px] font-inter text-[14px]">
        {isBye ? (
          <span className="font-medium tracking-[1.4px] text-paper">NO OPPONENT · MOVES ON</span>
        ) : (
          <p className="flex items-center gap-[8px]">
            {palmSide && <Ring live />}
            <span className="font-medium text-paper">{mouseMode ? "← / →" : "Hold palm"}</span>
            <span className="text-[rgba(246,242,233,0.7)]"> on the side you’d rather fly to</span>
          </p>
        )}
      </div>
      {!mouseMode && (
        <div className="absolute left-[1152px] top-[664px]" onClick={(e) => e.stopPropagation()}>
          <CameraWindow stream={stream} />
        </div>
      )}
    </Screen>
  );
}
