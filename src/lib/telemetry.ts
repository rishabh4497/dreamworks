// In-house telemetry collector. Captures page views, custom events, errors,
// and performance marks from the client and writes them to dw_telemetry_*
// Firestore collections in small batches. Fail-soft — never throws out into
// the UI. Read side lives in `src/lib/api/telemetry.ts`.

import {
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
  type FieldValue,
} from "firebase/firestore";
import { getDb, COLLECTIONS } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { isDesktop, invokeDesktop } from "@/lib/platform";
import type {
  DeviceSnapshot,
  TelemetryEventType,
  TelemetryError,
  TelemetryOS,
} from "@/lib/types";

// ── Internal state ─────────────────────────────────────────────────────────

interface QueuedEvent {
  kind: "event" | "perf";
  id: string;
  ts: string;
  sessionId: string;
  uid: string | null;
  route: string;
  payload: Record<string, unknown>;
}

interface SessionState {
  id: string;
  startedAt: string;
  entryRoute: string;
  lastRoute: string;
  pageViews: number;
  eventCount: number;
  errorCount: number;
  device: DeviceSnapshot;
}

const QUEUE_CAP = 200;
const FLUSH_INTERVAL_MS = 5000;
const FLUSH_THRESHOLD = 20;
const SESSION_HEARTBEAT_MS = 30_000;

let queue: QueuedEvent[] = [];
let session: SessionState | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let flushing = false;
let initialized = false;

function safeNow(): string {
  return new Date().toISOString();
}

function randomId(): string {
  // 11-char base36 id is plenty here — Firestore handles collisions and the
  // birthday-paradox math at our volumes is comfortable.
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  );
}

function currentRoute(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname + window.location.search;
}

function currentUid(): string | null {
  try {
    const state = useAuthStore.getState().authState;
    return state.type === "Authenticated" ? state.user.uid : null;
  } catch {
    return null;
  }
}

// ── Device snapshot ─────────────────────────────────────────────────────────

function detectOs(): TelemetryOS {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent;
  if (!isDesktop()) {
    if (ua.includes("Mac")) return "web";
    if (ua.includes("Win")) return "web";
    return "web";
  }
  if (ua.includes("Mac")) return "mac";
  if (ua.includes("Win")) return "windows";
  return "linux";
}

function lightweightSnapshot(): DeviceSnapshot {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  const win = typeof window !== "undefined" ? window : null;
  const screen = win?.screen;
  return {
    os: detectOs(),
    isDesktop: isDesktop(),
    cpuCores: nav?.hardwareConcurrency ?? 0,
    deviceMemoryGb: nav?.deviceMemory ?? 0,
    screenW: screen?.width ?? 0,
    screenH: screen?.height ?? 0,
    pixelRatio: win?.devicePixelRatio ?? 1,
    userAgent: nav?.userAgent ?? "unknown",
    language: nav?.language ?? "en",
    timezone:
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC",
  };
}

async function deepDesktopSnapshot(
  base: DeviceSnapshot,
): Promise<DeviceSnapshot> {
  if (!isDesktop()) return base;
  try {
    const res = await invokeDesktop<{
      ok: boolean;
      data?: {
        cpu?: string;
        ram?: string;
        storage?: string;
        gpu?: string;
        os_version?: string;
      };
    }>("read_hardware_info");
    if (res?.ok && res.data) {
      const ramMatch = /([\d.]+)\s*GB/i.exec(res.data.ram ?? "");
      const ramBytes = ramMatch ? Number(ramMatch[1]) * 1024 ** 3 : undefined;
      return {
        ...base,
        cpuModel: res.data.cpu,
        gpu: res.data.gpu,
        totalMemoryBytes: ramBytes,
      };
    }
  } catch {
    // Non-fatal: the command may not be available in every Tauri build.
  }
  return base;
}

// ── Sanitization ────────────────────────────────────────────────────────────
//
// Strip values that may contain PII before writing to Firestore. We make a
// shallow copy so callers can keep using their objects.

const PII_KEY_RE = /(email|token|secret|password|authorization)/i;

function sanitizePayload(
  input: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!input) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (PII_KEY_RE.test(key)) continue;
    if (value === undefined) continue;
    if (typeof value === "string" && value.length > 500) {
      out[key] = value.slice(0, 500);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function sanitizeStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  // Collapse absolute paths like `file:///Users/foo/.../src/...` back to `src/...`
  // so we never leak the user's local filesystem layout in the dashboard.
  const normalized = stack
    .replace(/file:\/\/[^\s)]*\/src\//g, "src/")
    .replace(/https?:\/\/[^\s)/]+/g, "")
    .slice(0, 4000);
  return normalized;
}

// ── Queue + flush ───────────────────────────────────────────────────────────

function enqueue(item: QueuedEvent) {
  if (queue.length >= QUEUE_CAP) queue.shift();
  queue.push(item);
  if (session) session.eventCount += 1;
  if (queue.length >= FLUSH_THRESHOLD) void flush();
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0 || !session) return;
  flushing = true;
  const drained = queue;
  queue = [];
  try {
    const db = getDb();
    const batch = writeBatch(db);
    for (const item of drained) {
      const collection =
        item.kind === "perf"
          ? COLLECTIONS.telemetryPerf
          : COLLECTIONS.telemetryEvents;
      batch.set(doc(db, collection, item.id), {
        ...item.payload,
        id: item.id,
        ts: item.ts,
        sessionId: item.sessionId,
        uid: item.uid,
        route: item.route,
      });
    }
    // Heartbeat the session doc so the live-sessions feed stays warm.
    if (session) {
      batch.set(
        doc(db, COLLECTIONS.telemetrySessions, session.id),
        {
          id: session.id,
          uid: currentUid(),
          startedAt: session.startedAt,
          entryRoute: session.entryRoute,
          lastRoute: session.lastRoute,
          device: session.device,
          pageViews: session.pageViews,
          eventCount: session.eventCount,
          errorCount: session.errorCount,
          updatedAt: safeNow(),
        },
        { merge: true },
      );
    }
    await batch.commit();
  } catch {
    // Fail-soft. If a single batch fails we drop those events to avoid
    // amplifying problems; the dashboard already tolerates gaps.
  } finally {
    flushing = false;
  }
}

async function heartbeat(): Promise<void> {
  if (!session) return;
  try {
    const db = getDb();
    await setDoc(
      doc(db, COLLECTIONS.telemetrySessions, session.id),
      {
        lastRoute: session.lastRoute,
        pageViews: session.pageViews,
        eventCount: session.eventCount,
        errorCount: session.errorCount,
        updatedAt: safeNow(),
        uid: currentUid(),
      },
      { merge: true },
    );
  } catch {
    // Non-fatal.
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Boot the session document and start the periodic flush timer. */
export async function startSession(): Promise<void> {
  if (session) return;
  const id = randomId();
  const route = currentRoute();
  const startedAt = safeNow();
  const device = await deepDesktopSnapshot(lightweightSnapshot());
  session = {
    id,
    startedAt,
    entryRoute: route,
    lastRoute: route,
    pageViews: 0,
    eventCount: 0,
    errorCount: 0,
    device,
  };

  // Best-effort initial session doc + device upsert.
  const uid = currentUid();
  try {
    const db = getDb();
    const initial: Record<string, unknown> & { createdAt: FieldValue } = {
      id,
      uid,
      startedAt,
      entryRoute: route,
      lastRoute: route,
      device,
      pageViews: 0,
      eventCount: 0,
      errorCount: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, COLLECTIONS.telemetrySessions, id), initial, {
      merge: true,
    });
    if (uid) {
      await setDoc(
        doc(db, COLLECTIONS.telemetryDevices, uid),
        {
          uid,
          latest: device,
          updatedAt: startedAt,
          sessionsObserved: 1,
        },
        { merge: true },
      );
    }
    track("session_start");
  } catch {
    // Fail-soft.
  }

  if (!flushTimer) {
    flushTimer = setInterval(() => void flush(), FLUSH_INTERVAL_MS);
  }
  if (!heartbeatTimer) {
    heartbeatTimer = setInterval(
      () => void heartbeat(),
      SESSION_HEARTBEAT_MS,
    );
  }
}

/** Finalize the session and force-flush the remaining queue. */
export function endSession(): void {
  if (!session) return;
  track("session_end");
  const finalSession = session;
  void (async () => {
    await flush();
    try {
      const db = getDb();
      await setDoc(
        doc(db, COLLECTIONS.telemetrySessions, finalSession.id),
        {
          endedAt: safeNow(),
          lastRoute: finalSession.lastRoute,
          pageViews: finalSession.pageViews,
          eventCount: finalSession.eventCount,
          errorCount: finalSession.errorCount,
        },
        { merge: true },
      );
    } catch {
      // Fail-soft.
    }
  })();
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  session = null;
}

function usageEnabled(): boolean {
  try {
    return useUiStore.getState().settings.usageDiagnosticsEnabled !== false;
  } catch {
    return true;
  }
}

function crashEnabled(): boolean {
  try {
    return useUiStore.getState().settings.crashReportsEnabled !== false;
  } catch {
    return true;
  }
}

export function trackPageView(path: string, title?: string): void {
  if (!session) return;
  if (!usageEnabled()) return;
  session.lastRoute = path;
  session.pageViews += 1;
  enqueue({
    kind: "event",
    id: randomId(),
    ts: safeNow(),
    sessionId: session.id,
    uid: currentUid(),
    route: path,
    payload: {
      type: "page_view",
      payload: sanitizePayload({ title }),
    },
  });
}

export function track(
  event: TelemetryEventType | (string & {}),
  payload?: Record<string, unknown>,
): void {
  if (!session) return;
  if (!usageEnabled()) return;
  enqueue({
    kind: "event",
    id: randomId(),
    ts: safeNow(),
    sessionId: session.id,
    uid: currentUid(),
    route: session.lastRoute || currentRoute(),
    payload: {
      type: event,
      payload: sanitizePayload(payload),
    },
  });
}

export function trackError(
  err: unknown,
  options?: {
    source?: TelemetryError["source"];
    context?: Record<string, unknown>;
  },
): void {
  if (!session) return;
  if (!crashEnabled()) return;
  const error = normalizeError(err);
  session.errorCount += 1;
  const errorId = randomId();
  const route = session.lastRoute || currentRoute();
  const sessionId = session.id;
  const device: TelemetryError["device"] = {
    os: session.device.os,
    isDesktop: session.device.isDesktop,
    userAgent: session.device.userAgent,
  };
  const doc_: Omit<TelemetryError, "id"> & { id: string } = {
    id: errorId,
    sessionId,
    uid: currentUid(),
    ts: safeNow(),
    message: error.message,
    stack: sanitizeStack(error.stack),
    source: options?.source ?? "manual",
    route,
    device,
    context: sanitizePayload(options?.context),
  };
  // Errors write immediately into their dedicated collection AND echo into the
  // event stream so the Errors tab and the generic event feed both see them.
  void (async () => {
    try {
      const db = getDb();
      await setDoc(doc(db, COLLECTIONS.telemetryErrors, errorId), doc_);
    } catch {
      // Fail-soft.
    }
  })();
  enqueue({
    kind: "event",
    id: randomId(),
    ts: doc_.ts,
    sessionId,
    uid: doc_.uid,
    route,
    payload: {
      type: "error",
      payload: { message: doc_.message, source: doc_.source },
    },
  });
}

export function trackPerf(
  name: string,
  ms: number,
  meta?: Record<string, unknown>,
): void {
  if (!session) return;
  if (!Number.isFinite(ms)) return;
  if (!usageEnabled()) return;
  enqueue({
    kind: "perf",
    id: randomId(),
    ts: safeNow(),
    sessionId: session.id,
    uid: currentUid(),
    route: session.lastRoute || currentRoute(),
    payload: {
      name,
      ms,
      meta: sanitizePayload(meta),
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalizeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack };
  }
  if (typeof err === "string") return { message: err };
  if (err && typeof err === "object") {
    try {
      return { message: JSON.stringify(err).slice(0, 500) };
    } catch {
      return { message: "Unknown error" };
    }
  }
  return { message: "Unknown error" };
}

/** True after `initTelemetry()` has been called. Avoids double-wiring. */
export function isTelemetryInitialized(): boolean {
  return initialized;
}

/** Mark telemetry as initialized — called by `telemetry-init.ts`. */
export function markTelemetryInitialized(): void {
  initialized = true;
}
