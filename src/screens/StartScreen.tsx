import { useState } from "react";
import { Screen } from "../components/Stage";
import { unlock } from "../audio/sound";
import { CAMERA_IDEAL_HEIGHT, CAMERA_IDEAL_WIDTH } from "../gestures/constants";

type Props = {
  onCamera: (stream: MediaStream) => void;
  onMouse: () => void;
};

export default function StartScreen({ onCamera, onMouse }: Props) {
  const [phase, setPhase] = useState<"idle" | "loading" | "denied">("idle");

  const requestCamera = async () => {
    unlock();
    setPhase("loading");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: CAMERA_IDEAL_WIDTH }, height: { ideal: CAMERA_IDEAL_HEIGHT } },
        audio: false,
      });
      onCamera(stream);
    } catch (e) {
      console.error("Camera access failed", e);
      setPhase("denied");
    }
  };

  const background = (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-[#f59e5c] via-[#8c5240] via-55% to-[#1f1a1a]" />
      <img src="/assets/opt/491f7.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(27,26,24,0.88)] via-[rgba(27,26,24,0.45)] via-55% to-[rgba(27,26,24,0)]" />
    </>
  );

  return (
    <Screen background={background}>
      <div className="absolute left-[120px] top-[200px] flex flex-col items-start gap-[24px] text-paper">
        <p className="font-inter text-[14px] font-medium tracking-[2.1px] text-[rgba(246,242,233,0.7)]">TERMINAL 1 · DEPARTURES</p>
        <h1 className="font-bebas text-[148px] leading-[0.9]">WHERE NEXT?</h1>

        {phase === "denied" ? (
          <>
            <p className="w-[520px] font-inter text-[20px] leading-[1.45] opacity-85">
              We couldn’t get access to a camera. It may be blocked in your browser settings, or no camera is connected. You can still pick your trip with mouse and keyboard.
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => {
                unlock({ preloadNow: true });
                onMouse();
              }}
              className="flex items-center gap-[10px] rounded-[14px] bg-ultramarine px-[32px] py-[18px] font-inter text-[18px] font-medium text-paper transition-transform active:scale-[0.98]"
            >
              Continue with mouse
            </button>
            <button type="button" onClick={requestCamera} className="font-inter text-[15px] font-medium underline opacity-90">
              Try the camera again
            </button>
          </>
        ) : (
          <>
            <p className="w-[520px] font-inter text-[20px] leading-[1.45] opacity-85">
              Browse 16 cities with your hand. Pick the ones you love. We’ll find your next trip.
            </p>
            <button
              type="button"
              onClick={requestCamera}
              disabled={phase === "loading"}
              aria-busy={phase === "loading"}
              className="flex items-center gap-[10px] rounded-[14px] bg-ultramarine px-[32px] py-[18px] font-inter text-[18px] font-medium text-paper transition-transform active:scale-[0.98] disabled:cursor-wait"
            >
              {phase === "loading" ? (
                <span className="size-[22px] rounded-full border-2 border-[rgba(246,242,233,0.3)] border-t-paper [animation:spin_800ms_linear_infinite]" aria-hidden />
              ) : (
                <img src="/assets/c6d27.svg" alt="" className="size-[22px]" />
              )}
              {phase === "loading" ? "Waiting for camera…" : "Allow camera"}
            </button>
            <div className="flex items-start gap-[10px]">
              <img src="/assets/d29b7.svg" alt="" className="size-[16px]" />
              <p className="w-[440px] font-inter text-[14px] leading-[1.5] opacity-70">
                Your camera is used only to recognise hand gestures. Nothing is recorded, saved or sent anywhere.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                unlock({ preloadNow: true });
                onMouse();
              }}
              className="font-inter text-[15px] font-medium underline opacity-90"
            >
              No camera? Use mouse instead
            </button>
          </>
        )}
      </div>
    </Screen>
  );
}
