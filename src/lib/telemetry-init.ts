// Wires global listeners (window errors, unhandled rejections, performance
// observers, beforeunload) to the telemetry collector. Called once from
// `main.tsx` after the auth store is initialized.

import { useAuthStore } from "@/stores/auth-store";
import {
  endSession,
  isTelemetryInitialized,
  markTelemetryInitialized,
  startSession,
  trackError,
  trackPerf,
} from "@/lib/telemetry";

export function initTelemetry(): void {
  if (isTelemetryInitialized()) return;
  if (typeof window === "undefined") return;
  markTelemetryInitialized();

  // Defer session boot until auth resolves — admin gating reads on uid, so
  // events emitted before sign-in would be orphaned. We still capture the
  // first session_start once auth lands (or, if the user is already signed
  // in at boot, immediately).
  const auth = useAuthStore.getState();
  if (auth.authState.type === "Authenticated") {
    void startSession();
  } else {
    const unsub = useAuthStore.subscribe((s) => {
      if (s.authState.type === "Authenticated") {
        unsub();
        void startSession();
      }
    });
  }

  window.addEventListener("error", (event) => {
    trackError(event.error ?? event.message, { source: "window" });
  });

  window.addEventListener("unhandledrejection", (event) => {
    trackError(event.reason ?? "Unhandled rejection", {
      source: "unhandledrejection",
    });
  });

  window.addEventListener("beforeunload", () => {
    endSession();
  });

  // Performance observers — silently skip APIs the browser doesn't expose.
  try {
    if (typeof PerformanceObserver !== "undefined") {
      try {
        const lcpObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            trackPerf("lcp", entry.startTime, {
              element: (entry as PerformanceEntry & { element?: { tagName?: string } })
                .element?.tagName,
            });
          }
        });
        lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        /* not supported */
      }

      try {
        const fcpObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === "first-contentful-paint") {
              trackPerf("fcp", entry.startTime);
            }
          }
        });
        fcpObs.observe({ type: "paint", buffered: true });
      } catch {
        /* not supported */
      }

      try {
        let clsValue = 0;
        const clsObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const ls = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };
            if (!ls.hadRecentInput && typeof ls.value === "number") {
              clsValue += ls.value;
              trackPerf("cls", clsValue);
            }
          }
        });
        clsObs.observe({ type: "layout-shift", buffered: true });
      } catch {
        /* not supported */
      }

      try {
        const ltObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Drop the noisiest noise (< 50ms aren't long tasks).
            if (entry.duration < 50) continue;
            trackPerf("longtask", entry.duration);
          }
        });
        ltObs.observe({ type: "longtask", buffered: true });
      } catch {
        /* not supported */
      }
    }
  } catch {
    /* defensive */
  }
}
