import { gestureBus } from "../input/gestureBus";
import { preload } from "../audio/sound";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { createRecognizer, destroyRecognizer, HandTracker } from "./handTracking";
import { GestureEngine } from "./gestureEngine";
import { handLive, setHandState } from "./handStore";
import { INFERENCE_MAX_HZ, RECOGNITION_AVG_FRAMES, RECOGNITION_FAST_MS, RECOGNITION_SLOW_MS, VIDEO_FRAME_FALLBACK_MS, WATCHDOG_MS } from "./constants";

type VideoWithRvfc = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};

/** One recognizer + one tracking loop for the whole app. */
class HandRuntime {
  readonly engine = new GestureEngine();
  private video = document.createElement("video") as VideoWithRvfc;
  private created: HandLandmarker | null = null;
  private tracker: HandTracker | null = null;
  private disposed = false;
  private generation = 0;
  private looping = false;
  private busy = false;
  private frameCb = 0;
  private raf = 0;
  private fallbackTimer = 0;
  private watchdogTimer = 0;
  private lastVideoTime = -1;
  private lastTs = 0;
  private frameNo = 0;
  private durations: number[] = [];
  private inferenceTimes: number[] = [];
  private skipping = false;
  private errorLogged = false;
  private restarts = 0;
  private readyAt = 0;
  private lastResultAt = 0;

  constructor(readonly stream: MediaStream) {
    const v = this.video;
    v.muted = true;
    v.playsInline = true;
    v.srcObject = stream;
    v.addEventListener("loadeddata", this.onVideoReady);
    document.addEventListener("visibilitychange", this.onVisibility);
    v.play().catch(() => {});
    setHandState({ status: "loading" });
    this.startRecognizer();
    this.watchdogTimer = window.setInterval(this.watchdog, 1000);
  }

  enabled = false;

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.generation++;
    this.stopLoop();
    window.clearInterval(this.watchdogTimer);
    this.video.removeEventListener("loadeddata", this.onVideoReady);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.releaseRecognizer();
    this.video.srcObject = null;
    setHandState({ status: "off", handPresent: false, holdKind: null, holdSide: null });
  }

  private releaseRecognizer() {
    if (this.created) destroyRecognizer(this.created);
    this.created = null;
    this.tracker = null;
  }

  private async startRecognizer() {
    const gen = ++this.generation;
    try {
      const created = await createRecognizer();
      if (this.disposed || gen !== this.generation) {
        destroyRecognizer(created);
        return;
      }
      this.created = created;
      this.tracker = new HandTracker(created);
      this.readyAt = this.lastResultAt = performance.now();
      this.lastVideoTime = -1;
      preload(); // audio decoding starts only once the recognizer is up
      if (this.looping) setHandState({ status: "ready" });
      else this.maybeStartLoop();
    } catch (e) {
      console.error("Gesture recognizer failed to load", e);
      if (!this.disposed && gen === this.generation) setHandState({ status: "error" });
    }
  }

  private videoReady() {
    return this.video.readyState >= 2 && this.video.videoWidth > 0;
  }

  private onVideoReady = () => this.maybeStartLoop();

  private maybeStartLoop() {
    if (this.disposed || this.looping || !this.tracker || !this.videoReady()) return;
    this.looping = true;
    setHandState({ status: "ready" });
    this.arm();
  }

  private stopLoop() {
    this.looping = false;
    window.clearTimeout(this.fallbackTimer);
    cancelAnimationFrame(this.raf);
    if (this.frameCb) this.video.cancelVideoFrameCallback?.(this.frameCb);
    this.frameCb = 0;
  }

  /** Schedule the next frame: requestVideoFrameCallback when available (with a polling fallback), else rAF. */
  private arm() {
    if (!this.looping) return;
    const v = this.video;
    if (v.requestVideoFrameCallback) {
      window.clearTimeout(this.fallbackTimer);
      this.frameCb = v.requestVideoFrameCallback(() => {
        window.clearTimeout(this.fallbackTimer);
        this.frameCb = 0;
        this.onFrame();
      });
      this.fallbackTimer = window.setTimeout(() => {
        if (this.frameCb) v.cancelVideoFrameCallback?.(this.frameCb);
        this.frameCb = 0;
        this.onFrame();
      }, VIDEO_FRAME_FALLBACK_MS);
    } else {
      this.raf = requestAnimationFrame(() => this.onFrame());
    }
  }

  private onFrame() {
    if (!this.looping) return;
    try {
      this.processFrame();
    } finally {
      this.arm();
    }
  }

  private processFrame() {
    const tracker = this.tracker;
    const v = this.video;
    if (!tracker || this.busy || document.hidden || !this.videoReady() || v.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = v.currentTime;
    this.frameNo++;
    if (this.skipping && this.frameNo % 2 === 0) return;
    // At most INFERENCE_MAX_HZ results in any rolling second, whatever the display / camera rate.
    const now = performance.now();
    while (this.inferenceTimes.length && now - this.inferenceTimes[0] > 1000) this.inferenceTimes.shift();
    if (this.inferenceTimes.length >= INFERENCE_MAX_HZ) return;
    this.inferenceTimes.push(now);

    this.busy = true;
    const t0 = performance.now();
    const ts = Math.max(t0, this.lastTs + 1); // recognizeForVideo needs strictly increasing timestamps
    this.lastTs = ts;
    try {
      const f = tracker.process(v, ts);
      this.lastResultAt = performance.now();
      this.recordDuration(this.lastResultAt - t0);
      const out = this.engine.update(f, ts, this.enabled, v.videoWidth);
      this.publishFrame(f, out.handPresent, out.recognised);
      out.events.forEach((e) => gestureBus.emit(e));
    } catch (e) {
      if (!this.errorLogged) {
        this.errorLogged = true;
        console.error("Hand recognition error (continuing with the next frame)", e);
      }
    } finally {
      this.busy = false;
    }
  }

  private recordDuration(ms: number) {
    this.durations.push(ms);
    if (this.durations.length > RECOGNITION_AVG_FRAMES) this.durations.shift();
    if (this.durations.length < RECOGNITION_AVG_FRAMES) return;
    const avg = this.durations.reduce((a, b) => a + b, 0) / this.durations.length;
    if (!this.skipping && avg > RECOGNITION_SLOW_MS) this.skipping = true;
    else if (this.skipping && avg < RECOGNITION_FAST_MS) this.skipping = false;
  }

  private publishFrame(f: ReturnType<HandTracker["process"]>, handPresent: boolean, recognised: ReturnType<GestureEngine["update"]>["recognised"]) {
    const e = this.engine;
    handLive.frame = f;
    handLive.seq++;
    handLive.holdProgress = e.holdProgress;
    setHandState({
      handPresent,
      ...(handPresent ? { everDetected: true } : {}),
      ...(recognised ? { gesture: recognised } : {}),
      holdKind: e.hold?.kind ?? null,
      holdSide: e.hold?.side ?? null,
    });
  }

  /** Ready but no result for WATCHDOG_MS while the video plays → recreate the recognizer, once. */
  private watchdog = () => {
    if (this.disposed) return;
    this.maybeStartLoop();
    const v = this.video;
    const playing = !v.paused && !v.ended && this.videoReady() && !document.hidden;
    if (!this.tracker || this.busy || !playing || this.restarts >= 1) return;
    if (performance.now() - Math.max(this.lastResultAt, this.readyAt) < WATCHDOG_MS) return;
    this.restarts++;
    this.releaseRecognizer();
    this.durations = [];
    setHandState({ status: "loading" });
    void this.startRecognizer();
  };

  private onVisibility = () => {
    if (document.hidden) {
      this.engine.reset();
      setHandState({ holdKind: null, holdSide: null });
    }
  };
}

let current: HandRuntime | null = null;
let pendingStop: number | undefined;
let enabledFlag = false;

/** Start (or reuse) the app-wide tracker. Safe to call repeatedly, e.g. from StrictMode double mounts. */
export function acquireTracking(stream: MediaStream) {
  window.clearTimeout(pendingStop);
  if (current && current.stream !== stream) {
    current.dispose();
    current = null;
  }
  current ??= new HandRuntime(stream);
  current.enabled = enabledFlag;
  return current;
}

/** Stops tracking unless acquireTracking is called again right away (StrictMode remount, re-render). */
export function releaseTracking() {
  window.clearTimeout(pendingStop);
  pendingStop = window.setTimeout(() => {
    current?.dispose();
    current = null;
  }, 500);
}

export function setTrackingEnabled(enabled: boolean) {
  enabledFlag = enabled;
  if (current) current.enabled = enabled;
}
