// Thin convenience wrappers over the always-on telemetry pipeline in
// `src/lib/telemetry.ts`. The pipeline already gates on the user's privacy
// toggles internally (usageDiagnosticsEnabled / crashReportsEnabled), so
// callers can fire-and-forget without checking flags.

import { track, trackError, trackPerf } from "@/lib/telemetry";

/**
 * Tag a user action for diagnostic-feedback purposes. Silently dropped when
 * the user has turned "Share usage diagnostics" off.
 */
export function trackUsage(
  name: string,
  payload?: Record<string, unknown>,
): void {
  track(name, payload);
}

/**
 * Report a caught/boundary error. Silently dropped when the user has turned
 * "Send crash reports" off.
 */
export function reportCrash(
  err: unknown,
  context?: Record<string, unknown>,
): void {
  trackError(err, { source: "manual", context });
}

/**
 * Wrap an async function with API latency telemetry. Records as a `perf.api`
 * sample with `meta.endpoint`. Errors do not throw out of the wrapper — they
 * are re-thrown after recording so callers see normal failure semantics.
 */
export async function withApiTimer<T>(
  endpoint: string,
  fn: () => Promise<T>,
): Promise<T> {
  const t0 = performance.now();
  try {
    const result = await fn();
    trackPerf("api", performance.now() - t0, { endpoint, status: "ok" });
    return result;
  } catch (err) {
    trackPerf("api", performance.now() - t0, { endpoint, status: "error" });
    throw err;
  }
}
