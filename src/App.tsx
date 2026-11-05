import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cities, type City } from "./data/cities";
import { ScaleProvider } from "./components/Stage";
import { useKeyboardAdapter } from "./input/gestureBus";
import StartScreen from "./screens/StartScreen";
import GalleryScreen from "./screens/GalleryScreen";
import DeparturesScreen from "./screens/DeparturesScreen";
import DuelScreen from "./screens/DuelScreen";
import BoardingScreen from "./screens/BoardingScreen";
import { useHandGestures } from "./gestures/useHandGestures";
import { isMuted, setMuted as setSoundMuted } from "./audio/sound";

type ScreenName = "start" | "gallery" | "departures" | "duel" | "boarding";

const byGalleryOrder = (ids: string[]) => cities.filter((c) => ids.includes(c.id));

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("start");
  const [mouseMode, setMouseMode] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [centre, setCentre] = useState(0);
  const [pickIds, setPickIds] = useState<string[]>([]);
  const [winner, setWinner] = useState<City | null>(null);
  const [showAllPicks, setShowAllPicks] = useState(false);
  const [muted, setMuted] = useState(isMuted);
  const [live, setLive] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  // The bell + announcement play once per game; returning from "See all picks" must not replay them.
  const boardingAnnounced = useRef(false);

  const picks = useMemo(() => byGalleryOrder(pickIds), [pickIds]);
  const announce = useCallback((msg: string) => {
    setLive("");
    requestAnimationFrame(() => setLive(msg));
  }, []);

  // Stop camera tracks on unmount.
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  useKeyboardAdapter(
    screen === "start" ? "off" : screen === "duel" ? "duel" : screen === "boarding" && !showAllPicks ? "off" : "browse",
  );

  // Gestures feed the bus on gallery / departures / duel (incl. the read-only board); ignored on start and boarding.
  useHandGestures(stream, screen === "gallery" || screen === "departures" || screen === "duel" || (screen === "boarding" && showAllPicks));

  const go = useCallback((s: ScreenName) => {
    setShowAllPicks(false);
    setScreen(s);
  }, []);

  const togglePick = (id: string) => setPickIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const toDuelOrBoarding = () => {
    if (picks.length === 1) {
      setWinner(picks[0]);
      go("boarding");
    } else if (picks.length >= 2) go("duel");
  };

  const startOver = () => {
    boardingAnnounced.current = false;
    setPickIds([]);
    setWinner(null);
    setCentre(0);
    go("gallery");
  };

  useEffect(() => {
    const names: Record<ScreenName, string> = { start: "Start", gallery: "Gallery", departures: "Departures board", duel: "Boarding duel", boarding: "Now boarding" };
    announce(names[screen]);
  }, [screen, announce]);

  let view: React.ReactNode;
  switch (screen) {
    case "start":
      view = (
        <StartScreen
          onCamera={(s) => {
            streamRef.current = s;
            setStream(s);
            setMouseMode(false);
            go("gallery");
          }}
          onMouse={() => {
            setMouseMode(true);
            go("gallery");
          }}
        />
      );
      break;
    case "gallery":
      view = (
        <GalleryScreen
          centre={centre}
          setCentre={setCentre}
          picks={pickIds}
          togglePick={togglePick}
          mouseMode={mouseMode}
          stream={stream}
          muted={muted}
          onToggleMute={() => {
            setSoundMuted(!muted);
            setMuted(!muted);
          }}
          onDepartures={() => go("departures")}
          announce={announce}
        />
      );
      break;
    case "departures":
      view = <DeparturesScreen picks={picks} mouseMode={mouseMode} stream={stream} onStartDuel={toDuelOrBoarding} onBack={() => go("gallery")} announce={announce} />;
      break;
    case "duel":
      view = (
        <DuelScreen
          key={pickIds.join()}
          picks={picks}
          mouseMode={mouseMode}
          stream={stream}
          onWinner={(c) => {
            setWinner(c);
            go("boarding");
          }}
          announce={announce}
        />
      );
      break;
    case "boarding": {
      const w = winner ?? cities[0];
      view = showAllPicks ? (
        <DeparturesScreen
          key="readonly"
          picks={picks.length ? picks : [w]}
          mouseMode={mouseMode}
          stream={stream}
          readOnlyWinnerId={w.id}
          onStartDuel={() => {}}
          onBack={() => setShowAllPicks(false)}
          announce={announce}
        />
      ) : (
        <BoardingScreen
          city={w}
          playAnnouncement={!boardingAnnounced.current}
          onStartOver={startOver}
          onSeeAll={() => {
            boardingAnnounced.current = true;
            setShowAllPicks(true);
          }}
          announce={announce}
        />
      );
      break;
    }
  }

  return (
    <ScaleProvider>
      <main className="h-full w-full" key={screen}>
        {view}
      </main>
      <div aria-live="polite" role="status" className="sr-only">
        {live}
      </div>
    </ScaleProvider>
  );
}
