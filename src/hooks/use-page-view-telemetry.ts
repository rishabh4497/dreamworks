import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/telemetry";

/**
 * Mount once in `AppLayout` — fires `page_view` to the telemetry collector
 * on every route change. Safe to call before `startSession` resolves; the
 * collector silently drops events when no session is active.
 */
export function usePageViewTelemetry(): void {
  const { pathname, search } = useLocation();
  useEffect(() => {
    trackPageView(pathname + search);
  }, [pathname, search]);
}
