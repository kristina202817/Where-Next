import { useSyncExternalStore } from "react";

// The only module that plays audio (Guidelines §8). Screens and the gesture handlers call it.
export const SFX_VOLUME = 0.5;
export const BELL_VOLUME = 0.7;
export const FLAP_VOLUME = 0.25;
export const FLAP_MIN_GAP_MS = 12;
export const SPEECH_RATE = 0.95;
/** Decode audio after the recognizer is ready, or after this long at the latest. */
export const AUDIO_PRELOAD_FALLBACK_MS = 5000;

const FILES = {
  heart: "https://res.cloudinary.com/cxqpf75x/video/upload/v1791227701/345906__satanicupsman__polaroid-taking-picture.wav",
  flip: "https://res.cloudinary.com/cxqpf75x/video/upload/v1791227701/makigai_maimai-paper-245786.mp3",
  bell: "https://res.cloudinary.com/cxqpf75x/video/upload/v1791227701/airport-bell.mp3",
} as const;
type SoundName = keyof typeof FILES;

let ctx: AudioContext | null = null;
let muted = false;
const buffers: Partial<Record<SoundName, AudioBuffer>> = {};
const loading: Partial<Record<SoundName, Promise<AudioBuffer | null>>> = {};
let noise: AudioBuffer | null = null;
let lastFlapAt = -Infinity;

// Boarding announcement state
let boardingToken = 0;
let bellSource: AudioBufferSourceNode | null = null;
let utterance: SpeechSynthesisUtterance | null = null;
let speaking = false;
const speakingListeners = new Set<() => void>();

const setSpeaking = (v: boolean) => {
  if (speaking === v) return;
  speaking = v;
  speakingListeners.forEach((l) => l());
};

/** True only while the announcement voice is speaking. */
export function useAnnouncementSpeaking() {
  return useSyncExternalStore(
    (l) => {
      speakingListeners.add(l);
      return () => void speakingListeners.delete(l);
    },
    () => speaking,
  );
}

function load(name: SoundName): Promise<AudioBuffer | null> {
  loading[name] ??= (async () => {
    try {
      const res = await fetch(FILES[name]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await ctx!.decodeAudioData(await res.arrayBuffer());
      buffers[name] = buf;
      return buf;
    } catch (err) {
      console.error(`[sound] could not load "${name}", continuing without it`, err);
      return null;
    }
  })();
  return loading[name]!;
}

/** Fetch and decode every file (idempotent). Called when hand tracking is ready, or by the fallback timer. */
export function preload() {
  if (!ctx) return;
  (Object.keys(FILES) as SoundName[]).forEach((n) => void load(n));
}

/** Call from the first click on the Start screen: creates / resumes the context; decoding is deferred unless preloadNow. */
export function unlock(opts: { preloadNow?: boolean } = {}) {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const len = Math.floor(ctx.sampleRate * 0.5);
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      if (!opts.preloadNow) window.setTimeout(preload, AUDIO_PRELOAD_FALLBACK_MS);
    }
    if (opts.preloadNow) preload();
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    // Speech voices load lazily in some browsers; touching them now starts that.
    window.speechSynthesis?.getVoices();
  } catch (err) {
    console.error("[sound] audio unavailable", err);
  }
}

function playBuffer(buf: AudioBuffer, volume: number, onEnded?: () => void) {
  const src = ctx!.createBufferSource();
  const gain = ctx!.createGain();
  src.buffer = buf;
  gain.gain.value = volume;
  src.connect(gain).connect(ctx!.destination);
  if (onEnded) src.onended = onEnded;
  src.start();
  return src;
}

function sfx(name: "heart" | "flip") {
  const buf = buffers[name];
  if (!ctx || muted || !buf) return;
  playBuffer(buf, SFX_VOLUME);
}

export const playHeart = () => sfx("heart");
export const playFlip = () => sfx("flip");

/** One split-flap tile click: a 15–25 ms band-pass noise burst, throttled to a rattle. */
export function playFlapClick() {
  if (!ctx || !noise || muted) return;
  const now = performance.now();
  if (now - lastFlapAt < FLAP_MIN_GAP_MS) return;
  lastFlapAt = now;
  const t = ctx.currentTime;
  const dur = 0.015 + Math.random() * 0.01;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = noise;
  filter.type = "bandpass";
  filter.frequency.value = 1800 * (0.8 + Math.random() * 0.9);
  filter.Q.value = 5 + Math.random() * 4;
  const peak = FLAP_VOLUME * (0.6 + Math.random() * 0.4);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t, Math.random() * 0.4, dur + 0.01);
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const norm = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-").toLowerCase();
  return voices.find((v) => norm(v) === "en-gb") ?? voices.find((v) => norm(v).startsWith("en")) ?? null;
}

function speak(text: string, token: number) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const go = () => {
    if (token !== boardingToken || muted) return;
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else u.lang = "en-GB";
    u.rate = SPEECH_RATE;
    u.onstart = () => {
      if (token === boardingToken && !muted) setSpeaking(true);
    };
    const done = () => {
      if (utterance === u) {
        utterance = null;
        setSpeaking(false);
      }
    };
    u.onend = done;
    u.onerror = done;
    utterance = u; // keep a reference so it is not garbage-collected mid-speech
    synth.speak(u);
  };
  if (synth.getVoices().length) return go();
  let fired = false;
  const once = () => {
    if (fired) return;
    fired = true;
    synth.removeEventListener("voiceschanged", once);
    go();
  };
  synth.addEventListener("voiceschanged", once);
  window.setTimeout(once, 1000); // some browsers never report voices; speak with the default
}

/** Bell, then the spoken line. Call once per arrival on the boarding screen. */
export async function playBoarding(city: string) {
  const token = ++boardingToken;
  if (!ctx || muted) return;
  const text = `Attention please. Passengers travelling to ${city}, your flight is now boarding. Have a wonderful trip.`;
  const buf = await load("bell");
  if (token !== boardingToken || muted) return;
  if (!buf) return speak(text, token);
  const src = playBuffer(buf, BELL_VOLUME, () => {
    if (bellSource === src) bellSource = null;
    if (token === boardingToken) speak(text, token);
  });
  bellSource = src;
}

/** Cancels the bell and speech immediately (leaving the screen, muting). */
export function stopBoarding() {
  boardingToken++;
  if (bellSource) {
    const s = bellSource;
    bellSource = null;
    s.onended = null;
    try {
      s.stop();
    } catch {
      /* already stopped */
    }
  }
  utterance = null;
  window.speechSynthesis?.cancel();
  setSpeaking(false);
}

export const isMuted = () => muted;

export function setMuted(next: boolean) {
  muted = next;
  if (next) stopBoarding();
}
