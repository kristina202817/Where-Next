import { useEffect, useRef } from "react";
import { HAND_CONNECTIONS } from "../gestures/constants";
import { handLive, useHandState } from "../gestures/handStore";

const W = 240;
const H = 170;

// Camera window: live mirrored feed with the hand skeleton, LIVE badge, status line.
export default function CameraWindow({ stream }: { stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { handPresent, gesture, status } = useHandState();
  const starting = status === "loading";

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream;
    if (stream) v.play().catch(() => {});
  }, [stream]);

  // Skeleton overlay, drawn per frame from refs (object-cover mapping, mirrored).
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let drawnSeq = -1;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (handLive.seq === drawnSeq) return; // the latest result is already on the canvas
      drawnSeq = handLive.seq;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const lm = handLive.frame.landmarks;
      if (!lm || !video.videoWidth) return;
      const s = Math.max(W / video.videoWidth, H / video.videoHeight);
      const dw = video.videoWidth * s;
      const dh = video.videoHeight * s;
      const ox = (W - dw) / 2;
      const oy = (H - dh) / 2;
      const px = (i: number) => [ox + (1 - lm[i].x) * dw, oy + lm[i].y * dh] as const;
      ctx.strokeStyle = "rgba(246,242,233,0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const [a, b] of HAND_CONNECTIONS) {
        const [ax, ay] = px(a);
        const [bx, by] = px(b);
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
      ctx.fillStyle = "#3d35f2";
      for (let i = 0; i < lm.length; i++) {
        const [x, y] = px(i);
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col items-start gap-[10px]">
      <div className="relative h-[170px] w-[240px] overflow-hidden rounded-[16px] border border-[rgba(246,242,233,0.2)] bg-[#2b2b2e]">
        <video ref={videoRef} muted playsInline className="absolute inset-0 size-full -scale-x-100 object-cover" aria-label="Your camera, mirrored" />
        <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />
        <div className="absolute left-[9px] top-[9px] flex items-center gap-[6px] rounded-full bg-[rgba(18,18,18,0.6)] px-[8px] py-[4px]">
          <img src="/assets/eaff4.svg" alt="" className="size-[6px]" />
          <span className="font-inter text-[10px] font-medium tracking-[1px] text-paper">LIVE</span>
        </div>
      </div>
      <div className="flex items-center gap-[8px]">
        {handPresent && !starting ? <img src="/assets/bee29.svg" alt="" className="size-[8px]" /> : <span className="size-[8px] rounded-full bg-[rgba(246,242,233,0.4)]" />}
        <span className="font-inter text-[13px] font-medium text-[rgba(246,242,233,0.9)]">
          {starting ? "Starting hand tracking…" : handPresent ? `Hand detected${gesture ? ` · ${gesture}` : ""}` : "Show your hand"}
        </span>
      </div>
    </div>
  );
}
