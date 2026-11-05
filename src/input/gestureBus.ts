import { useEffect, useRef } from "react";

// Single input bus (Guidelines §6). Keyboard, mouse — and later gestures — emit here;
// screens subscribe and never read raw input themselves.
export type Side = "left" | "right";
export type GestureEvent =
  | { type: "next" }
  | { type: "prev" }
  | { type: "select" }
  | { type: "palmHold"; side: Side }
  | { type: "fistHold" };

type Listener = (e: GestureEvent) => void;
const listeners = new Set<Listener>();

export const gestureBus = {
  emit(e: GestureEvent) {
    listeners.forEach((l) => l(e));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};

/** Subscribe with an always-fresh handler. */
export function useGestureEvents(handler: Listener, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    return gestureBus.subscribe((e) => ref.current(e));
  }, [enabled]);
}

/**
 * Keyboard adapter. Matches KeyboardEvent.code on window.
 * In the duel, ← / → choose a side (palmHold) instead of browsing.
 */
export function useKeyboardAdapter(mode: "browse" | "duel" | "off") {
  useEffect(() => {
    if (mode === "off") return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.repeat || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const target = ev.target as HTMLElement | null;
      const onButton = target?.tagName === "BUTTON";
      let e: GestureEvent | null = null;
      switch (ev.code) {
        case "ArrowRight":
          e = mode === "duel" ? { type: "palmHold", side: "right" } : { type: "next" };
          break;
        case "ArrowLeft":
          e = mode === "duel" ? { type: "palmHold", side: "left" } : { type: "prev" };
          break;
        case "Space":
          if (onButton) return; // let focused buttons activate natively
          e = { type: "select" };
          break;
        case "Enter":
        case "NumpadEnter":
          if (onButton || mode === "duel") return;
          e = { type: "palmHold", side: "right" };
          break;
        case "Escape":
          e = { type: "fistHold" };
          break;
      }
      if (e) {
        ev.preventDefault();
        gestureBus.emit(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);
}
