import { useEffect } from "react";
import { setHandState } from "./handStore";
import { acquireTracking, releaseTracking, setTrackingEnabled } from "./handRuntime";

/**
 * Runs MediaPipe on the camera stream and feeds the gesture bus, via an app-wide singleton.
 * `enabled` false (start / boarding screens) keeps tracking but emits nothing.
 */
export function useHandGestures(stream: MediaStream | null, enabled: boolean) {
  useEffect(() => {
    if (!stream) return;
    acquireTracking(stream);
    return releaseTracking;
  }, [stream]);

  // Drop any in-progress hold when gestures get disabled.
  useEffect(() => {
    setTrackingEnabled(enabled);
    if (!enabled) setHandState({ holdKind: null, holdSide: null });
  }, [enabled]);
}
