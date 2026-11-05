export const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
export const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export const PINCH_ON = 0.25;
export const PINCH_OFF = 0.4;
export const PINCH_COOLDOWN_MS = 1000;
/** Middle/ring/pinky must stay extended: avg dist(tip, 0) / dist(0, 9) above this. */
export const OTHERS_MIN_EXTENSION = 1.2;
/** Pinch conditions must hold continuously this long before it fires. */
export const PINCH_HOLD_MS = 100;

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

// ── Gesture → bus detection (Guidelines §7) ──
/** Camera request for the recognizer. */
export const CAMERA_IDEAL_WIDTH = 960;
export const CAMERA_IDEAL_HEIGHT = 540;
/** Swipe: hand centre (mean x of 21 landmarks, mirrored) must travel this many palm lengths d(0,9)… */
export const SWIPE_MIN_PALMS = 0.8;
/** …within this window… */
export const SWIPE_WINDOW_MS = 500;
/** …with a peak centre speed of at least this many palm lengths per second. */
export const SWIPE_MIN_SPEED = 2.0;
/** Palm / fist holds may start only after the hand has been continuously present this long. */
export const HAND_SETTLE_MS = 500;
/** Fade-out of the first-visit "Raise your hand to start" layer; holds also wait for it. */
export const FIRST_VISIT_FADE_MS = 500;
/** Palm hold: hand centre speed (palm lengths / s) must stay below this; brief spikes up to HOLD_BREAK_MS are tolerated. */
export const STILL_SPEED_PALMS = 1.0;
export const PALM_HOLD_MS = 700;
export const FIST_HOLD_MS = 500;
/** A hold survives gesture dropouts — and, for a palm, fast movement — up to this long. */
export const HOLD_BREAK_MS = 150;
/** No new event of any kind for this long after one fires. */
export const GLOBAL_COOLDOWN_MS = 600;
/** Hand presence turns false only after this long without detection. */
export const HAND_LOST_MS = 500;

// ── Swipe re-arm (return-stroke rejection) ──
/** After a swipe fires, swipes in the opposite direction are ignored for this long. */
export const SWIPE_RETURN_LOCK_MS = 700;
/** After a swipe, the next swipe in any direction needs the hand centre below STILL_SPEED_PALMS for this long. */
export const SWIPE_REARM_MS = 120;

// ── Hold poses from hand geometry ──
/** Palm: others extension and index tip extension dist(8,0)/dist(0,9) at or above this. */
export const PALM_MIN_EXTENSION = 1.4;
/** Fist: others extension at or below this. */
export const FIST_MAX_EXTENSION = 1.0;

// ── Recognizer startup / loop ──
/** GPU delegate init longer than this falls back to CPU (once). */
export const GPU_INIT_TIMEOUT_MS = 8000;
/** Recognizer ready but no result at all for this long while the video plays → dispose and recreate (once). */
export const WATCHDOG_MS = 5000;
/** Rolling window of recognition times; above SLOW → process every 2nd frame, below FAST → every frame again. */
export const RECOGNITION_AVG_FRAMES = 30;
export const RECOGNITION_SLOW_MS = 40;
export const RECOGNITION_FAST_MS = 30;
/** If requestVideoFrameCallback does not fire for this long (e.g. detached video), poll once instead. */
export const VIDEO_FRAME_FALLBACK_MS = 200;

/** Recognition runs at most this many times per second, independent of the display frame rate. */
export const INFERENCE_MAX_HZ = 30;
