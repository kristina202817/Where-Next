import { useEffect, useMemo, useState } from "react";
import { gateOf, toFlapText, type City } from "../data/cities";
import { BOARD_PAGE_MS, BOARD_ROWS_PER_PAGE, FLAP_TOTAL_MS, FLAP_TOTAL_MS_REDUCED, NO_FLIGHTS_MS } from "../config";
import FlapTile from "../components/FlapTile";
import { Screen } from "../components/Stage";
import CameraWindow from "../components/CameraWindow";
import { gestureBus, useGestureEvents } from "../input/gestureBus";
import { usePrefersReducedMotion } from "../usePrefersReducedMotion";

const NAME_TILES = 12;

type Props = {
  picks: City[];
  mouseMode: boolean;
  stream: MediaStream | null;
  /** Read-only board reached from boarding: winner BOARDING, others DEPARTED. */
  readOnlyWinnerId?: string;
  onStartDuel: () => void;
  onBack: () => void;
  announce: (msg: string) => void;
};

export function DuelBackground() {
  return (
    <>
      <div className="absolute inset-[-40px] bg-gradient-to-b from-[#f59e5c] via-[#8c5240] via-55% to-[#1f1a1a]" />
      <div className="absolute inset-0 bg-[rgba(27,26,24,0.5)]" />
      <img src="/assets/opt/a65e0.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-20" />
    </>
  );
}

export default function DeparturesScreen({ picks, mouseMode, stream, readOnlyWinnerId, onStartDuel, onBack, announce }: Props) {
  const readOnly = readOnlyWinnerId !== undefined;
  const reduced = usePrefersReducedMotion();
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(picks.length / BOARD_ROWS_PER_PAGE));
  const empty = picks.length === 0;

  useEffect(() => {
    announce(empty ? "No flights selected" : `Departures board. ${picks.length} ${picks.length === 1 ? "flight" : "flights"}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pages < 2) return;
    const t = window.setInterval(() => setPage((n) => (n + 1) % pages), BOARD_PAGE_MS);
    return () => window.clearInterval(t);
  }, [pages]);

  useEffect(() => {
    if (!empty || readOnly) return;
    const t = window.setTimeout(onBack, NO_FLIGHTS_MS);
    return () => window.clearTimeout(t);
  }, [empty, readOnly, onBack]);

  useGestureEvents((e) => {
    if (e.type === "fistHold") onBack();
    else if (e.type === "palmHold" && !readOnly && !empty) onStartDuel();
  });

  const rows = useMemo(() => picks.slice(page * BOARD_ROWS_PER_PAGE, (page + 1) * BOARD_ROWS_PER_PAGE), [picks, page]);
  const total = reduced ? FLAP_TOTAL_MS_REDUCED : FLAP_TOTAL_MS;
  const tilesPerRow = NAME_TILES + 2;
  const tileDuration = total * 0.5;
  const delayOf = (row: number, col: number) => ((row * tilesPerRow + col) / (BOARD_ROWS_PER_PAGE * tilesPerRow)) * (total - tileDuration);

  const flapRow = (text: string, width: number, row: number, colOffset: number) => {
    const chars = toFlapText(text).slice(0, width).padEnd(width, " ").split("");
    return (
      <div className="flex gap-[4px]">
        {chars.map((ch, i) => (
          <FlapTile key={i} char={ch} delay={delayOf(row, colOffset + i)} duration={tileDuration} runKey={page} />
        ))}
      </div>
    );
  };

  const status = (c: City) => {
    if (!readOnly) return { text: "SELECTED", cls: "bg-ultramarine" };
    return c.id === readOnlyWinnerId ? { text: "BOARDING", cls: "bg-ultramarine" } : { text: "DEPARTED", cls: "bg-[rgba(246,242,233,0.12)]" };
  };

  return (
    <Screen background={<DuelBackground />} onBackgroundClick={() => gestureBus.emit({ type: "fistHold" })}>
      <div
        className={`absolute left-[328px] top-1/2 flex -translate-y-1/2 flex-col items-start gap-[20px] rounded-[24px] bg-[#121212] px-[44px] py-[40px] text-paper ${
          !readOnly && !empty ? "cursor-pointer" : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (!readOnly && !empty) gestureBus.emit({ type: "palmHold", side: "right" });
        }}
      >
        <div className="flex items-end">
          <h2 className="font-bebas text-[64px] leading-[1.2]">DEPARTURES</h2>
          <div className="h-px w-[200px]" />
          <p className="pb-[14px] font-inter text-[13px] font-medium tracking-[1.56px] text-[rgba(246,242,233,0.55)]">TERMINAL 1 · WHERE NEXT?</p>
        </div>
        <div className="flex gap-[40px] font-inter text-[12px] font-medium tracking-[1.44px] text-[rgba(246,242,233,0.5)]">
          <p className="w-[428px]">DESTINATION</p>
          <p className="w-[68px]">GATE</p>
          <p className="w-[120px]">STATUS</p>
        </div>
        <div className="h-px w-full bg-[rgba(246,242,233,0.1)]" />

        {empty ? (
          <div className="flex flex-col gap-[20px]">
            {flapRow("NO FLIGHTS", NAME_TILES, 0, 0)}
            <p className="font-inter text-[14px] text-[rgba(246,242,233,0.6)]">No flights selected</p>
          </div>
        ) : (
          rows.map((c, r) => {
            const st = status(c);
            return (
              <div key={`${page}-${c.id}`} className="flex flex-col gap-[20px] self-stretch">
                <div className="flex items-center gap-[40px]">
                  {flapRow(c.name, NAME_TILES, r, 0)}
                  {flapRow(gateOf(c), 2, r, NAME_TILES)}
                  <span className={`rounded-full px-[14px] py-[7px] font-inter text-[13px] font-medium tracking-[1.3px] ${st.cls}`}>{st.text}</span>
                </div>
                <div className="h-px w-full bg-[rgba(246,242,233,0.1)]" />
              </div>
            );
          })
        )}

        <div className="flex w-full items-center justify-between">
          {readOnly ? (
            <button
              type="button"
              autoFocus
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className="font-inter text-[14px] text-[rgba(246,242,233,0.6)] underline hover:text-paper"
            >
              ← Back to boarding pass
            </button>
          ) : (
            !empty && (
              <p className="font-inter text-[14px] text-[rgba(246,242,233,0.6)]">
                {mouseMode ? "Press Enter to start the boarding round" : "Hold palm to start the boarding round"}
              </p>
            )
          )}
          {pages > 1 && (
            <p className="font-mono text-[12px] font-bold text-[rgba(246,242,233,0.4)]">
              {page + 1} / {pages}
            </p>
          )}
        </div>
      </div>
      {!mouseMode && (
        <div className="absolute left-[1152px] top-[664px]" onClick={(e) => e.stopPropagation()}>
          <CameraWindow stream={stream} />
        </div>
      )}
    </Screen>
  );
}
