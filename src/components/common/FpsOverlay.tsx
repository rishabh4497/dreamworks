import { useEffect, useState } from "react";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import type { FpsCounterLocation } from "@/lib/types";

const POSITION_CLASSES: Record<Exclude<FpsCounterLocation, "off">, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
};

export function FpsOverlay() {
  const inGameOverlay = useUiStore((s) => s.settings.inGameOverlay);
  const fpsCounter = useUiStore((s) => s.settings.fpsCounter);
  const fpsHighContrast = useUiStore((s) => s.settings.fpsHighContrast);
  const [fps, setFps] = useState(0);

  const visible = inGameOverlay && fpsCounter !== "off";

  useEffect(() => {
    if (!visible) return;
    let rafId = 0;
    const frames: number[] = [];
    let lastEmit = performance.now();
    let lastFrame = performance.now();

    const tick = (now: number) => {
      const delta = now - lastFrame;
      lastFrame = now;
      frames.push(delta);
      if (frames.length > 30) frames.shift();
      if (now - lastEmit >= 250) {
        const avg = frames.reduce((sum, d) => sum + d, 0) / frames.length;
        setFps(avg > 0 ? Math.round(1000 / avg) : 0);
        lastEmit = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50 rounded-md border border-separator bg-card/85 px-2 py-1 font-mono text-[11px] tabular-nums backdrop-blur",
        POSITION_CLASSES[fpsCounter as Exclude<FpsCounterLocation, "off">],
        fpsHighContrast ? "text-green" : "text-foreground/80",
      )}
      aria-hidden
    >
      {fps} FPS
    </div>
  );
}
