import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { pushReplayFrame, trackPageView, trackPerf } from "@/lib/telemetry";

/**
 * Mount once in `AppLayout` — fires `page_view` to the telemetry collector
 * on every route change. Safe to call before `startSession` resolves; the
 * collector silently drops events when no session is active. Also captures a
 * route-render perf mark (mount → next paint) and a `route` replay frame so
 * the replay player can mark route transitions on its timeline.
 */
export function usePageViewTelemetry(): void {
  const { pathname, search } = useLocation();
  const startRef = useRef<number>(0);
  useEffect(() => {
    startRef.current = performance.now();
    trackPageView(pathname + search);
    pushReplayFrame("route", { label: pathname });
    const raf = requestAnimationFrame(() => {
      const ms = performance.now() - startRef.current;
      if (ms > 0 && ms < 30_000) {
        trackPerf("route_render", ms, { route: pathname });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, search]);
}
