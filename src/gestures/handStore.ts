import { useSyncExternalStore } from "react";
import type { Side } from "../input/gestureBus";
import { emptyFrame, type HandFrame } from "./handTracking";
import type { GestureLabel, HoldKind } from "./gestureEngine";

/** React-visible state: changes only on presence / recognised gesture / hold start-stop. */
export type HandUiState = {
  status: "off" | "loading" | "ready" | "error";
  handPresent: boolean;
  everDetected: boolean;
  gesture: GestureLabel | null;
  holdKind: HoldKind | null;
  holdSide: Side | null;
};

let state: HandUiState = { status: "off", handPresent: false, everDetected: false, gesture: null, holdKind: null, holdSide: null };
const listeners = new Set<() => void>();

/** Per-frame values (never trigger renders). */
export const handLive = {
  frame: emptyFrame() as HandFrame,
  /** Increments with every new recognition result. */
  seq: 0,
  holdProgress: 0,
};

export function setHandState(patch: Partial<HandUiState>) {
  let changed = false;
  for (const k in patch) {
    const key = k as keyof HandUiState;
    if (state[key] !== patch[key]) changed = true;
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useHandState() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    () => state,
  );
}
