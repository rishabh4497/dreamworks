// Wires global listeners (window errors, unhandled rejections, performance
// observers, beforeunload, friction signals) to the telemetry collector.
// Called once from `main.tsx` after the auth store is initialized.

import { useAuthStore } from "@/stores/auth-store";
import {
  endSession,
  isTelemetryInitialized,
  markTelemetryInitialized,
  pushReplayFrame,
  startSession,
  track,
  trackError,
  trackPerf,
} from "@/lib/telemetry";

function describeTarget(el: Element | null): string | undefined {
  if (!el) return undefined;
  const tag = el.tagName.toLowerCase();
  const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : "";
  const cls =
    typeof (el as HTMLElement).className === "string"
      ? ((el as HTMLElement).className as string)
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((c) => `.${c}`)
          .join("")
      : "";
  return `${tag}${id}${cls}`.slice(0, 200);
}

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
    pushReplayFrame("error", {
      label: String(event.message ?? "").slice(0, 80),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    trackError(event.reason ?? "Unhandled rejection", {
      source: "unhandledrejection",
    });
    pushReplayFrame("error", {
      label: "unhandled rejection",
    });
  });

  window.addEventListener("beforeunload", () => {
    endSession();
  });

  // ── Performance observers ─────────────────────────────────────────────────

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
            if (entry.duration < 50) continue;
            // Long-task attribution: report the first script URL that the
            // task can be attributed to, when the browser exposes it.
            const attribution = (entry as PerformanceEntry & {
              attribution?: Array<{ containerSrc?: string; name?: string }>;
            }).attribution;
            const scriptUrl =
              attribution?.[0]?.containerSrc || attribution?.[0]?.name || "unknown";
            trackPerf("longtask", entry.duration, { script: scriptUrl });
          }
        });
        ltObs.observe({ type: "longtask", buffered: true });
      } catch {
        /* not supported */
      }

      // ── Resource timing (sampled) ────────────────────────────────────
      // Capture only slow or large resources so we don't blow the queue.
      try {
        const resObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const r = entry as PerformanceResourceTiming;
            const slow = r.duration > 500;
            const big = (r.transferSize ?? 0) > 100_000;
            if (!slow && !big) continue;
            trackPerf("resource", r.duration, {
              url: r.name.slice(0, 200),
              initiator: r.initiatorType,
              sizeKb: Math.round((r.transferSize ?? 0) / 1024),
            });
          }
        });
        resObs.observe({ type: "resource", buffered: true });
      } catch {
        /* not supported */
      }

      // INP — Interaction to Next Paint (now a Core Web Vital). We capture
      // each event-timing entry's duration and let the dashboard compute the
      // p75/p98 over the population.
      try {
        const inpObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const ev = entry as PerformanceEntry & {
              interactionId?: number;
              name?: string;
            };
            if (!ev.interactionId) continue;
            if (entry.duration < 16) continue; // ignore sub-frame interactions
            trackPerf("inp", entry.duration, { name: ev.name });
          }
        });
        inpObs.observe({
          type: "event",
          buffered: true,
          // @ts-expect-error — durationThreshold is in the spec but not in lib.dom.d.ts yet
          durationThreshold: 40,
        });
      } catch {
        /* not supported */
      }

      // TTFB — navigation timing.
      try {
        const navObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const nav = entry as PerformanceNavigationTiming;
            const ttfb = nav.responseStart - nav.requestStart;
            if (Number.isFinite(ttfb) && ttfb >= 0) {
              trackPerf("ttfb", ttfb);
            }
          }
        });
        navObs.observe({ type: "navigation", buffered: true });
      } catch {
        /* not supported */
      }
    }
  } catch {
    /* defensive */
  }

  // Periodic memory pressure sample (every 30 s) — Chromium only.
  try {
    const perfWithMem = performance as Performance & {
      memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
    };
    if (perfWithMem.memory) {
      setInterval(() => {
        const m = perfWithMem.memory!;
        const usedMb = Math.round(m.usedJSHeapSize / 1024 / 1024);
        trackPerf("memory", usedMb, {
          limitMb: Math.round(m.jsHeapSizeLimit / 1024 / 1024),
        });
      }, 30_000);
    }
  } catch {
    /* not supported */
  }

  // ── Friction signals (rage clicks + dead clicks) ──────────────────────────

  const recent: { el: EventTarget | null; t: number }[] = [];
  document.addEventListener(
    "click",
    (event) => {
      const now = Date.now();
      // Drop entries older than 1 s.
      while (recent.length > 0 && now - recent[0].t > 1_000) recent.shift();
      recent.push({ el: event.target, t: now });

      // Replay frame for every click.
      const el = event.target as HTMLElement | null;
      pushReplayFrame("click", {
        target: describeTarget(el),
        label: el?.innerText ? el.innerText.slice(0, 80) : undefined,
        extra: { x: event.clientX, y: event.clientY },
      });

      // Rage click: 3+ clicks on the same element within 1 s.
      const sameTarget = recent.filter((r) => r.el === event.target);
      if (sameTarget.length >= 3) {
        track("rage_click", {
          tag: (event.target as Element | null)?.tagName,
          id: (event.target as Element | null)?.id || undefined,
          className:
            typeof (event.target as Element | null)?.className === "string"
              ? ((event.target as Element).className as string).slice(0, 80)
              : undefined,
        });
        pushReplayFrame("rage", { target: describeTarget(el) });
        recent.length = 0;
        return;
      }

      // Dead click: clicked element has no handler and isn't a link/button/input.
      if (!el) return;
      const interactiveTag = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY)$/i.test(el.tagName);
      const hasRole = el.getAttribute("role");
      const cursorPointer = window.getComputedStyle(el).cursor === "pointer";
      if (!interactiveTag && !hasRole && !cursorPointer) {
        // Bubble up two levels — many handlers attach to a parent.
        let p: HTMLElement | null = el.parentElement;
        let bubbled = false;
        for (let i = 0; i < 3 && p; i++, p = p.parentElement) {
          if (/^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY)$/i.test(p.tagName)) {
            bubbled = true;
            break;
          }
          if (p.getAttribute("role")) {
            bubbled = true;
            break;
          }
        }
        if (!bubbled) {
          track("dead_click", {
            tag: el.tagName,
            text: el.innerText ? el.innerText.slice(0, 80) : undefined,
          });
          pushReplayFrame("dead", { target: describeTarget(el) });
        }
      }
    },
    { capture: true, passive: true },
  );

  // ── Input blur (no values — just target + length) ─────────────────────────
  document.addEventListener(
    "blur",
    (event) => {
      const el = event.target as HTMLInputElement | null;
      if (!el) return;
      if (!/^(INPUT|TEXTAREA|SELECT)$/i.test(el.tagName)) return;
      // Skip password & sensitive types entirely.
      if (el instanceof HTMLInputElement && /password|email|tel|hidden/i.test(el.type)) {
        return;
      }
      pushReplayFrame("input", {
        target: describeTarget(el),
        extra: {
          length: (el.value || "").length,
          type: (el as HTMLInputElement).type || el.tagName.toLowerCase(),
        },
      });
    },
    { capture: true, passive: true },
  );

  // ── Scroll depth (per route) ──────────────────────────────────────────────

  const scrollMilestones = [25, 50, 75, 100] as const;
  let firedThisRoute = new Set<number>();
  let scrollRoute = window.location.pathname;
  let lastReplayScrollAt = 0;
  const onScroll = () => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    if (total <= 0) return;
    const pct = Math.round((doc.scrollTop / total) * 100);
    for (const m of scrollMilestones) {
      if (pct >= m && !firedThisRoute.has(m)) {
        firedThisRoute.add(m);
        track("scroll_depth", { pct: m });
      }
    }
    // Throttled replay frame so we don't blow the buffer on long scrolls.
    const now = Date.now();
    if (now - lastReplayScrollAt > 350) {
      lastReplayScrollAt = now;
      pushReplayFrame("scroll", {
        extra: { x: window.scrollX, y: window.scrollY, pct },
      });
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Initial viewport baseline so the player can render a representative frame.
  pushReplayFrame("viewport", {
    extra: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
  });
  pushReplayFrame("route", { label: window.location.pathname });

  // Reset scroll milestones on route change (popstate + history patch).
  const resetScroll = () => {
    if (window.location.pathname !== scrollRoute) {
      scrollRoute = window.location.pathname;
      firedThisRoute = new Set<number>();
    }
  };
  const originalPush = history.pushState;
  history.pushState = function (...args: Parameters<History["pushState"]>) {
    originalPush.apply(this, args);
    resetScroll();
  };
  window.addEventListener("popstate", resetScroll);

  // ── Time on page (fired when tab is hidden) ───────────────────────────────

  let routeEnteredAt = Date.now();
  let timeOnPageRoute = window.location.pathname;
  const flushTimeOnPage = () => {
    const ms = Date.now() - routeEnteredAt;
    if (ms > 1000) {
      track("time_on_page", { ms, route: timeOnPageRoute });
    }
    routeEnteredAt = Date.now();
    timeOnPageRoute = window.location.pathname;
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushTimeOnPage();
  });
  // Also fire on route change.
  const originalPush2 = history.pushState;
  history.pushState = function (...args: Parameters<History["pushState"]>) {
    flushTimeOnPage();
    originalPush2.apply(this, args);
  };
  window.addEventListener("popstate", flushTimeOnPage);
  window.addEventListener("beforeunload", flushTimeOnPage);
}
