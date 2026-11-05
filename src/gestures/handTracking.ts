import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import { MODEL_URL, OTHERS_MIN_EXTENSION, GPU_INIT_TIMEOUT_MS, PINCH_COOLDOWN_MS, PINCH_HOLD_MS, PINCH_OFF, PINCH_ON, WASM_URL } from "./constants";

export type HandFrame = {
  handPresent: boolean;
  landmarks: NormalizedLandmark[] | null;
  pinchRatio: number | null;
  pinchPalmPx: number | null; // d(0,9) in video pixels
  extension: { middle: number; ring: number; pinky: number; avg: number } | null;
  indexExtension: number | null; // dist(8,0) / dist(0,9)
  pinching: boolean;
  pinchCount: number;
  wristX: number | null; // mirrored, 0..1 left→right on screen
};

export const emptyFrame = (): HandFrame => ({
  handPresent: false, landmarks: null, pinchRatio: null, pinchPalmPx: null,
  extension: null, indexExtension: null, pinching: false, pinchCount: 0, wristX: null,
});

export function destroyRecognizer(r: HandLandmarker) {
  try {
    r.close();
  } catch {
    /* already closed */
  }
}

/** GPU first; if it throws or takes longer than GPU_INIT_TIMEOUT_MS, fall back to CPU once. */
export async function createRecognizer(): Promise<HandLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const make = (delegate: "GPU" | "CPU") =>
    HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: "VIDEO",
      numHands: 1,
    });
  const gpu = make("GPU");
  let timer: number | undefined;
  let timedOut = false;
  try {
    return await Promise.race([
      gpu,
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => {
          timedOut = true;
          reject(new Error("GPU init timed out"));
        }, GPU_INIT_TIMEOUT_MS);
      }),
    ]);
  } catch {
    if (timedOut) gpu.then(destroyRecognizer, () => {}); // never keep a second instance
    return make("CPU");
  } finally {
    window.clearTimeout(timer);
  }
}

// Hand landmark indices (MediaPipe hand model)
export const LM_WRIST = 0;
export const LM_THUMB_TIP = 4;
export const LM_INDEX_TIP = 8;
export const LM_MIDDLE_MCP = 9;

/** 2D distance in video pixel space, so the frame's aspect ratio doesn't distort it. */
const distPx = (a: NormalizedLandmark, b: NormalizedLandmark, w: number, h: number) =>
  Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);

/** Pinch measurement from normalized image landmarks (result.landmarks[0]). */
export function measurePinch(lm: NormalizedLandmark[], w: number, h: number) {
  const tip = distPx(lm[LM_THUMB_TIP], lm[LM_INDEX_TIP], w, h);
  const palm = distPx(lm[LM_WRIST], lm[LM_MIDDLE_MCP], w, h);
  return { tip, palm, ratio: palm > 0 ? tip / palm : null };
}

export const LM_MIDDLE_TIP = 12;
export const LM_RING_TIP = 16;
export const LM_PINKY_TIP = 20;

/** Extension of middle/ring/pinky: dist(tip, wrist) / dist(wrist, middle MCP), in pixel space. */
export function measureOthersExtension(lm: NormalizedLandmark[], w: number, h: number) {
  const palm = distPx(lm[LM_WRIST], lm[LM_MIDDLE_MCP], w, h);
  if (palm <= 0) return null;
  const ext = (tip: number) => distPx(lm[tip], lm[LM_WRIST], w, h) / palm;
  const middle = ext(LM_MIDDLE_TIP), ring = ext(LM_RING_TIP), pinky = ext(LM_PINKY_TIP);
  return { middle, ring, pinky, avg: (middle + ring + pinky) / 3 };
}

/** Index finger extension: dist(index tip, wrist) / dist(wrist, middle MCP), in pixel space. */
export function measureIndexExtension(lm: NormalizedLandmark[], w: number, h: number) {
  const palm = distPx(lm[LM_WRIST], lm[LM_MIDDLE_MCP], w, h);
  return palm > 0 ? distPx(lm[LM_INDEX_TIP], lm[LM_WRIST], w, h) / palm : null;
}

/** Stateful per-frame processor: pinch hysteresis and counter. */
export class HandTracker {
  frame: HandFrame = emptyFrame();
  private lastPinchStart = -Infinity;
  /** Ratio is below PINCH_ON and hasn't yet released past PINCH_OFF. */
  private inCandidate = false;
  /** Current candidate was already rejected; wait for release before trying again. */
  private candidateRejected = false;
  private holdStart = 0;

  constructor(private recognizer: HandLandmarker) {}

  process(video: HTMLVideoElement, ts: number): HandFrame {
    const res = this.recognizer.detectForVideo(video, ts);
    const f = this.frame;

    const lm = res.landmarks?.[0];
    if (!lm) {
      Object.assign(f, { handPresent: false, landmarks: null,
        pinchRatio: null, pinchPalmPx: null, extension: null, indexExtension: null, pinching: false, wristX: null });
      this.inCandidate = false;
      return f;
    }
    f.handPresent = true;
    f.landmarks = lm;

    // Normalized image landmarks, scaled by the video's real pixel size.
    const pinch = measurePinch(lm, video.videoWidth || 640, video.videoHeight || 480);
    f.pinchPalmPx = pinch.palm;
    f.pinchRatio = pinch.ratio;

    f.extension = measureOthersExtension(lm, video.videoWidth || 640, video.videoHeight || 480);
    f.indexExtension = measureIndexExtension(lm, video.videoWidth || 640, video.videoHeight || 480);
    this.updatePinch(ts);

    f.wristX = 1 - lm[0].x;
    return f;
  }

  private updatePinch(ts: number) {
    const f = this.frame;
    const ratio = f.pinchRatio;

    if (f.pinching) {
      if (ratio === null || ratio > PINCH_OFF) {
        f.pinching = false;
        this.inCandidate = false;
      }
      return;
    }

    // Candidate ends once the ratio releases past PINCH_OFF (or the hand is lost).
    if (ratio === null || ratio > PINCH_OFF) {
      this.inCandidate = false;
      return;
    }

    if (ratio < PINCH_ON && !this.inCandidate) {
      this.inCandidate = true;
      this.candidateRejected = false;
      this.holdStart = ts;
    }
    if (!this.inCandidate || this.candidateRejected) return;

    // Ratio bounced back above PINCH_ON before the hold completed.
    if (ratio >= PINCH_ON) {
      this.candidateRejected = true;
      return;
    }
    if (!f.extension || f.extension.avg <= OTHERS_MIN_EXTENSION) {
      this.candidateRejected = true;
      return;
    }

    if (ts - this.holdStart >= PINCH_HOLD_MS) {
      f.pinching = true;
      if (ts - this.lastPinchStart >= PINCH_COOLDOWN_MS) {
        f.pinchCount += 1;
        this.lastPinchStart = ts;
      }
    }
  }

  close() {
    destroyRecognizer(this.recognizer);
  }
}
