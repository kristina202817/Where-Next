import type { GestureEvent, Side } from "../input/gestureBus";
import type { HandFrame } from "./handTracking";
import {
  FIST_HOLD_MS, GLOBAL_COOLDOWN_MS, HAND_LOST_MS, HOLD_BREAK_MS, PALM_HOLD_MS, PINCH_OFF,
  FIRST_VISIT_FADE_MS, HAND_SETTLE_MS, STILL_SPEED_PALMS, SWIPE_MIN_PALMS, SWIPE_MIN_SPEED, SWIPE_WINDOW_MS,
  FIST_MAX_EXTENSION, PALM_MIN_EXTENSION, SWIPE_REARM_MS, SWIPE_RETURN_LOCK_MS,
} from "./constants";

export type HoldKind = "palm" | "fist";
export type GestureLabel = "Swipe" | "Pinch" | "Palm" | "Fist";

export type EngineOutput = {
  events: GestureEvent[];
  handPresent: boolean;
  /** Set when a gesture was recognised this frame (hold start or fire). */
  recognised: GestureLabel | null;
};

/**
 * Turns per-frame HandFrames into bus events: pinch → select, swipe → next/prev,
 * palm hold → palmHold{side}, fist hold → fistHold. Pure logic, no React.
 */
export class GestureEngine {
  hold: { kind: HoldKind; side: Side; start: number; lastOk: number; lastStill: number } | null = null;
  holdProgress = 0;
  /** After a hold fires, wait until its gesture is released before arming again. */
  private latched: HoldKind | null = null;
  private cooldownUntil = 0;
  private lastPinchCount = -1;
  private lastSeen = -Infinity;
  private prevCentre: { t: number; x: number; palm: number } | null = null;
  /** Hand centre x in video pixels (mirrored) and palm length d(0,9) in pixels. */
  private history: { t: number; x: number; palm: number }[] = [];

  /** Return-stroke lock: direction and time of the last fired swipe, and whether the hand has paused since. */
  private lastSwipeDir: "prev" | "next" | null = null;
  private lastSwipeAt = -Infinity;
  private armed = true;
  private slowSince: number | null = null;

  /** Hold settle gate: holds may start only once ts ≥ holdsFrom. */
  private presentSince: number | null = null;
  private everPresent = false;
  private holdsFrom = Infinity;

  reset() {
    this.hold = null;
    this.holdProgress = 0;
    this.history = [];
    this.latched = null;
    this.lastSwipeDir = null;
    this.armed = true;
    this.slowSince = null;
  }

  update(f: HandFrame, ts: number, enabled: boolean, videoW: number): EngineOutput {
    const out: EngineOutput = { events: [], handPresent: false, recognised: null };
    if (f.handPresent) this.lastSeen = ts;
    out.handPresent = ts - this.lastSeen < HAND_LOST_MS;

    // Settle: re-applied every time the hand reappears after being lost.
    if (!out.handPresent) {
      this.presentSince = null;
      this.holdsFrom = Infinity;
    } else if (this.presentSince === null) {
      this.presentSince = ts;
      // First appearance also waits for the "Raise your hand to start" layer to fade.
      this.holdsFrom = ts + (this.everPresent ? HAND_SETTLE_MS : Math.max(HAND_SETTLE_MS, FIRST_VISIT_FADE_MS));
      this.everPresent = true;
    }

    // Pinch count is owned by HandTracker; sync it even when disabled so stale pinches never fire.
    const pinchFired = this.lastPinchCount >= 0 && f.pinchCount > this.lastPinchCount;
    this.lastPinchCount = f.pinchCount;

    if (!f.handPresent || f.wristX === null) {
      this.prevCentre = null;
      this.slowSince = null;
      if (!out.handPresent) this.armed = true;
      this.breakHold(ts);
      if (!out.handPresent) this.latched = null;
      return out;
    }
    if (!enabled) {
      this.reset();
      return out;
    }

    // Hand centre: mean x of all landmarks (mirrored), in video pixels; speeds are in palm lengths d(0,9) per second.
    const lm = f.landmarks;
    const palm = f.pinchPalmPx;
    const centre = lm && palm && palm > 0 && videoW ? { t: ts, x: (1 - lm.reduce((a, p) => a + p.x, 0) / lm.length) * videoW, palm } : null;
    const prev = this.prevCentre;
    const centreSpeed = centre && prev && ts > prev.t ? Math.abs(centre.x - prev.x) / ((centre.palm + prev.palm) / 2) / ((ts - prev.t) / 1000) : 0;
    this.prevCentre = centre;
    const still = centreSpeed < STILL_SPEED_PALMS;
    // Re-arm: the centre must stay below STILL_SPEED_PALMS for SWIPE_REARM_MS; continuous motion never does.
    if (still) {
      this.slowSince ??= ts;
      if (ts - this.slowSince >= SWIPE_REARM_MS) this.armed = true;
    } else {
      this.slowSince = null;
    }
    const cooling = ts < this.cooldownUntil;
    const fire = (e: GestureEvent, label: GestureLabel) => {
      out.events.push(e);
      out.recognised = label;
      this.cooldownUntil = ts + GLOBAL_COOLDOWN_MS;
      this.history = [];
    };

    // ── Pinch → select
    if (pinchFired && !cooling) {
      this.hold = null;
      this.holdProgress = 0;
      fire({ type: "select" }, "Pinch");
      return out;
    }

    // ── Holds
    const palmPose =
      (f.extension?.avg ?? 0) >= PALM_MIN_EXTENSION &&
      (f.indexExtension ?? 0) >= PALM_MIN_EXTENSION &&
      f.pinchRatio !== null && f.pinchRatio > PINCH_OFF;
    const fistPose = f.extension !== null && f.extension.avg <= FIST_MAX_EXTENSION;
    const palmOk = palmPose;
    const fistOk = fistPose;
    const side: Side = f.wristX < 0.5 ? "left" : "right";
    if (this.latched === "palm" && !palmOk) this.latched = null;
    if (this.latched === "fist" && !fistOk) this.latched = null;

    if (this.hold) {
      const h = this.hold;
      const ok = h.kind === "palm" ? palmOk : fistOk;
      if (still) h.lastStill = ts;
      if (h.kind === "palm" && palmOk && side !== h.side) {
        // Switching sides restarts below.
        this.hold = null;
      } else if (h.kind === "palm" && ts - h.lastStill > HOLD_BREAK_MS) {
        // Moving cancels only when sustained; single fast frames are jitter.
        this.cancelHold();
      } else if (ok) {
        h.lastOk = ts;
      } else if (ts - h.lastOk > HOLD_BREAK_MS) {
        this.cancelHold();
      }
    }
    if (!this.hold && !cooling && ts >= this.holdsFrom) {
      if (palmOk && still && this.latched !== "palm") {
        this.hold = { kind: "palm", side, start: ts, lastOk: ts, lastStill: ts };
        out.recognised = "Palm";
      } else if (fistOk && this.latched !== "fist") {
        this.hold = { kind: "fist", side, start: ts, lastOk: ts, lastStill: ts };
        out.recognised = "Fist";
      }
    }
    if (this.hold) {
      const dur = this.hold.kind === "palm" ? PALM_HOLD_MS : FIST_HOLD_MS;
      this.holdProgress = Math.min(1, (ts - this.hold.start) / dur);
      if (this.holdProgress >= 1) {
        const h = this.hold;
        this.hold = null;
        this.holdProgress = 0;
        this.latched = h.kind;
        if (h.kind === "palm") fire({ type: "palmHold", side: h.side }, "Palm");
        else fire({ type: "fistHold" }, "Fist");
        return out;
      }
    } else {
      this.holdProgress = 0;
    }

    // ── Swipe: hand centre (mean x of all landmarks, mirrored), measured in palm lengths over the last SWIPE_WINDOW_MS.
    if (!centre) return out;
    this.history.push(centre);
    while (this.history.length && ts - this.history[0].t > SWIPE_WINDOW_MS) this.history.shift();
    let iMin = 0;
    let iMax = 0;
    let peakSpeed = 0;
    this.history.forEach((p, i) => {
      if (p.x < this.history[iMin].x) iMin = i;
      if (p.x > this.history[iMax].x) iMax = i;
      if (i > 0) {
        const q = this.history[i - 1];
        const dt = (p.t - q.t) / 1000;
        if (dt > 0) peakSpeed = Math.max(peakSpeed, Math.abs(p.x - q.x) / ((p.palm + q.palm) / 2) / dt);
      }
    });
    const disp = (this.history[iMax].x - this.history[iMin].x) / centre.palm;

    // Min before max → hand moved to the user's right → prev; otherwise → next.
    const dir: "prev" | "next" = this.history[iMin].t < this.history[iMax].t ? "prev" : "next";

    if (disp >= SWIPE_MIN_PALMS && peakSpeed >= SWIPE_MIN_SPEED) {
      // Only a palm/fist hold whose ring is actually filling blocks a swipe: a moving open palm is not a hold.
      const holdFilling = !!this.hold && this.holdProgress > 0 && (this.hold.kind === "fist" || still);
      const pinchActive = f.pinchRatio !== null && f.pinchRatio < PINCH_OFF;
      const returning = this.lastSwipeDir !== null && dir !== this.lastSwipeDir && ts - this.lastSwipeAt < SWIPE_RETURN_LOCK_MS;
      const blocked = returning || pinchActive || holdFilling || cooling || !this.armed;
      if (!blocked) {
        this.hold = null;
        this.holdProgress = 0;
        fire({ type: dir }, "Swipe");
        this.lastSwipeDir = dir;
        this.lastSwipeAt = ts;
        this.armed = false;
        this.slowSince = null;
      }
    }
    return out;
  }

  private breakHold(ts: number) {
    if (this.hold && ts - this.hold.lastOk > HOLD_BREAK_MS) {
      this.cancelHold();
      this.holdProgress = 0;
    }
  }

  private cancelHold() {
    this.hold = null;
  }
}
