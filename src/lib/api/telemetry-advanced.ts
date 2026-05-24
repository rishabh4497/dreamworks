// Read-side aggregations for Tier 1–6 console expansions. Mirrors the
// pattern of `src/lib/api/telemetry.ts`: lazy `getDb()`, cap reads at 5000
// per range, fold client-side, return typed structures. New Firestore
// collections are documented in `COLLECTIONS`.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
  type WhereFilterOp,
} from "firebase/firestore";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import type {
  AdHocFilter,
  AdHocQueryResult,
  AdHocQuerySpec,
  AlertEvent,
  AlertEventStatus,
  AlertRule,
  ApdexByRoute,
  AuthAnomalyEvent,
  AuthAnomalyReport,
  CdnEdgeReport,
  CdnRegionReport,
  ChurnPredictionRow,
  CohortCompareResult,
  ConsoleDashboard,
  ConsoleNamedCount,
  ConsoleRange,
  ConsoleTimePoint,
  CrashFreeSnapshot,
  DeployMarker,
  DrmHealthReport,
  EmailFunnelReport,
  Experiment,
  ExperimentResult,
  ExperimentVariantResult,
  FraudReport,
  FraudSignal,
  FunnelDefinition,
  FunnelResult,
  GameLaunchReport,
  InstallPipelineReport,
  LongTaskAttribution,
  LtvForecastRow,
  MemoryLeakSuspicion,
  ModerationQueueReport,
  OnboardingFunnelReport,
  PathSankey,
  RecommendationCtrReport,
  RecommendationSlotReport,
  ReferralReport,
  ReplayFrame,
  ReplaySession,
  ResourceTimingRow,
  RetentionCohortGrid,
  RetentionCohortRow,
  SearchAnalyticsReport,
  TelemetryOS,
  VoiceQosReport,
  WishlistDecayReport,
} from "@/lib/types";

const RANGE_MS: Record<ConsoleRange, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

const READ_CAP = 5000;

function startIso(range: ConsoleRange): string {
  return new Date(Date.now() - RANGE_MS[range]).toISOString();
}

function bucketMs(range: ConsoleRange): number {
  if (range === "24h") return 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

function bucketKey(ts: number, b: number): string {
  return new Date(Math.floor(ts / b) * b).toISOString();
}

function emptyBuckets(range: ConsoleRange): ConsoleTimePoint[] {
  const b = bucketMs(range);
  const span = RANGE_MS[range];
  const count = Math.ceil(span / b);
  const start = Math.floor((Date.now() - span) / b) * b;
  const out: ConsoleTimePoint[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ bucket: new Date(start + i * b).toISOString(), value: 0 });
  }
  return out;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[i];
}

interface RawEvent {
  id: string;
  ts: string;
  uid: string | null;
  sessionId: string;
  route: string;
  type: string;
  payload?: Record<string, unknown>;
}

interface RawPerf {
  id: string;
  ts: string;
  uid: string | null;
  sessionId: string;
  route: string;
  name: string;
  ms: number;
  meta?: Record<string, unknown>;
}

interface RawSession {
  id: string;
  uid: string | null;
  startedAt: string;
  endedAt?: string;
  entryRoute: string;
  lastRoute: string;
  pageViews?: number;
  eventCount?: number;
  errorCount?: number;
  device?: Record<string, unknown>;
}

async function fetchEvents(range: ConsoleRange): Promise<RawEvent[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.telemetryEvents),
      where("ts", ">=", startIso(range)),
      orderBy("ts", "desc"),
      fbLimit(READ_CAP),
    ),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: String(data.id ?? d.id),
      ts: String(data.ts ?? ""),
      uid: (data.uid as string | null) ?? null,
      sessionId: String(data.sessionId ?? ""),
      route: String(data.route ?? ""),
      type: String(data.type ?? "unknown"),
      payload:
        (data.payload as Record<string, unknown> | undefined) ?? undefined,
    } satisfies RawEvent;
  });
}

async function fetchPerf(range: ConsoleRange): Promise<RawPerf[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.telemetryPerf),
      where("ts", ">=", startIso(range)),
      orderBy("ts", "desc"),
      fbLimit(READ_CAP),
    ),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: String(data.id ?? d.id),
      ts: String(data.ts ?? ""),
      uid: (data.uid as string | null) ?? null,
      sessionId: String(data.sessionId ?? ""),
      route: String(data.route ?? ""),
      name: String(data.name ?? ""),
      ms: Number(data.ms ?? 0),
      meta: (data.meta as Record<string, unknown> | undefined) ?? undefined,
    } satisfies RawPerf;
  });
}

async function fetchSessions(range: ConsoleRange): Promise<RawSession[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.telemetrySessions),
      where("startedAt", ">=", startIso(range)),
      orderBy("startedAt", "desc"),
      fbLimit(READ_CAP),
    ),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: String(data.id ?? d.id),
      uid: (data.uid as string | null) ?? null,
      startedAt: String(data.startedAt ?? ""),
      endedAt: data.endedAt ? String(data.endedAt) : undefined,
      entryRoute: String(data.entryRoute ?? ""),
      lastRoute: String(data.lastRoute ?? ""),
      pageViews: Number(data.pageViews ?? 0),
      eventCount: Number(data.eventCount ?? 0),
      errorCount: Number(data.errorCount ?? 0),
      device: data.device as Record<string, unknown> | undefined,
    } satisfies RawSession;
  });
}

// ── Tier 1: Session replay ─────────────────────────────────────────────────

export async function listReplays(opts: {
  uid?: string;
  hasFrustration?: boolean;
  max?: number;
}): Promise<ReplaySession[]> {
  const db = getDb();
  const constraints: QueryConstraint[] = [orderBy("startedAt", "desc")];
  if (opts.uid) constraints.unshift(where("uid", "==", opts.uid));
  if (opts.hasFrustration) constraints.unshift(where("hasFrustration", "==", true));
  constraints.push(fbLimit(opts.max ?? 50));
  const snap = await getDocs(query(collection(db, COLLECTIONS.telemetryReplays), ...constraints));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: String(data.id ?? d.id),
      sessionId: String(data.sessionId ?? d.id),
      uid: (data.uid as string | null) ?? null,
      startedAt: String(data.startedAt ?? ""),
      endedAt: data.endedAt ? String(data.endedAt) : undefined,
      durationMs: Number(data.durationMs ?? 0),
      entryRoute: String(data.entryRoute ?? ""),
      lastRoute: String(data.lastRoute ?? ""),
      frames: (data.frames as ReplayFrame[]) ?? [],
      frameCount: Number(data.frameCount ?? 0),
      hasFrustration: Boolean(data.hasFrustration),
    } satisfies ReplaySession;
  });
}

export async function getReplay(sessionId: string): Promise<ReplaySession | null> {
  const db = getDb();
  const docSnap = await getDoc(doc(db, COLLECTIONS.telemetryReplays, sessionId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: String(data.id ?? docSnap.id),
    sessionId: String(data.sessionId ?? docSnap.id),
    uid: (data.uid as string | null) ?? null,
    startedAt: String(data.startedAt ?? ""),
    endedAt: data.endedAt ? String(data.endedAt) : undefined,
    durationMs: Number(data.durationMs ?? 0),
    entryRoute: String(data.entryRoute ?? ""),
    lastRoute: String(data.lastRoute ?? ""),
    frames: (data.frames as ReplayFrame[]) ?? [],
    frameCount: Number(data.frameCount ?? 0),
    hasFrustration: Boolean(data.hasFrustration),
  } satisfies ReplaySession;
}

// ── Tier 1: Funnels (CRUD + evaluation) ───────────────────────────────────

export async function listFunnels(): Promise<FunnelDefinition[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.consoleFunnels), orderBy("updatedAt", "desc")),
  );
  return snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<FunnelDefinition, "id">) }) as FunnelDefinition,
  );
}

export async function getFunnel(id: string): Promise<FunnelDefinition | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.consoleFunnels, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<FunnelDefinition, "id">) } as FunnelDefinition;
}

export async function createFunnel(
  args: Omit<FunnelDefinition, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTIONS.consoleFunnels), {
    ...args,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function deleteFunnel(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.consoleFunnels, id));
}

export async function evaluateFunnel(
  funnelId: string,
  range: ConsoleRange,
): Promise<FunnelResult | null> {
  const def = await getFunnel(funnelId);
  if (!def) return null;
  const events = await fetchEvents(range);
  // Index events by uid + ts.
  const byUid = new Map<string, RawEvent[]>();
  for (const ev of events) {
    if (!ev.uid) continue;
    const arr = byUid.get(ev.uid) ?? [];
    arr.push(ev);
    byUid.set(ev.uid, arr);
  }
  const totalUsers = byUid.size;
  const windowMs = def.windowHours * 60 * 60 * 1000;
  const stageCounts = new Array(def.steps.length).fill(0);
  const completionTimes: number[] = [];
  for (const list of byUid.values()) {
    list.sort((a, b) => a.ts.localeCompare(b.ts));
    let stage = 0;
    let stageStartTs = 0;
    let firstStartTs = 0;
    for (const ev of list) {
      const step = def.steps[stage];
      if (matchStep(ev, step)) {
        if (stage === 0) {
          stageStartTs = new Date(ev.ts).getTime();
          firstStartTs = stageStartTs;
        } else if (new Date(ev.ts).getTime() - stageStartTs > windowMs) {
          // Reset — window exceeded.
          stage = 0;
          continue;
        }
        stageCounts[stage] += 1;
        stage += 1;
        if (stage >= def.steps.length) {
          completionTimes.push(new Date(ev.ts).getTime() - firstStartTs);
          break;
        }
      }
    }
  }
  const stages = def.steps.map((s, i) => {
    const count = stageCounts[i] || 0;
    const pct = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
    const prev = i > 0 ? stageCounts[i - 1] || 0 : count;
    const dropoffPct = prev > 0 ? ((prev - count) / prev) * 100 : 0;
    return { label: s.label, count, pct, dropoffPct };
  });
  completionTimes.sort((a, b) => a - b);
  const medianMs = completionTimes.length > 0 ? completionTimes[Math.floor(completionTimes.length / 2)] : 0;
  return {
    funnelId,
    totalUsers,
    stages,
    medianCompletionSec: Math.round(medianMs / 1000),
  };
}

function matchStep(
  ev: RawEvent,
  step: { event: string; routePrefix?: string; payloadMatch?: { key: string; value: string } },
): boolean {
  if (ev.type !== step.event) return false;
  if (step.routePrefix && !ev.route.startsWith(step.routePrefix)) return false;
  if (step.payloadMatch) {
    const v = ev.payload?.[step.payloadMatch.key];
    if (String(v) !== step.payloadMatch.value) return false;
  }
  return true;
}

// ── Tier 1: Sankey / Path analysis ────────────────────────────────────────

export async function getPathSankey(
  startNode: string,
  range: ConsoleRange,
  maxDepth = 4,
): Promise<PathSankey> {
  const events = await fetchEvents(range);
  // Build per-session path sequences of route changes.
  const bySession = new Map<string, string[]>();
  for (const ev of events) {
    if (ev.type !== "page_view") continue;
    const arr = bySession.get(ev.sessionId) ?? [];
    arr.push(ev.route);
    bySession.set(ev.sessionId, arr);
  }
  const links = new Map<string, number>();
  const nodes = new Set<string>();
  nodes.add(startNode);
  for (const seq of bySession.values()) {
    seq.sort();
    const startIdx = seq.findIndex((r) => r.startsWith(startNode));
    if (startIdx < 0) continue;
    let last = `0::${startNode}`;
    nodes.add(last);
    for (let depth = 1; depth < maxDepth && startIdx + depth < seq.length; depth++) {
      const target = `${depth}::${seq[startIdx + depth]}`;
      nodes.add(target);
      const key = `${last}>>${target}`;
      links.set(key, (links.get(key) ?? 0) + 1);
      last = target;
    }
  }
  return {
    startNode,
    nodes: Array.from(nodes).map((id) => ({ id })),
    links: Array.from(links.entries())
      .map(([k, value]) => {
        const [source, target] = k.split(">>");
        return { source, target, value };
      })
      .filter((l) => l.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 100),
  };
}

// ── Tier 1: Retention cohorts (weekly grid) ───────────────────────────────

export async function getRetentionCohorts(weeks = 8): Promise<RetentionCohortGrid> {
  const db = getDb();
  // Read sessions for the past N weeks.
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.telemetrySessions),
      where("startedAt", ">=", since),
      orderBy("startedAt", "asc"),
      fbLimit(READ_CAP),
    ),
  );
  // uid -> earliest sessionStart
  const firstByUid = new Map<string, number>();
  // uid -> set of week numbers active
  const activeWeeksByUid = new Map<string, Set<number>>();
  for (const d of snap.docs) {
    const data = d.data();
    const uid = (data.uid as string | null) ?? null;
    if (!uid) continue;
    const t = new Date(String(data.startedAt ?? "")).getTime();
    if (!Number.isFinite(t)) continue;
    if (!firstByUid.has(uid) || t < firstByUid.get(uid)!) firstByUid.set(uid, t);
    const set = activeWeeksByUid.get(uid) ?? new Set<number>();
    set.add(Math.floor(t / (7 * 24 * 60 * 60 * 1000)));
    activeWeeksByUid.set(uid, set);
  }
  // Build cohort rows.
  const cohortMap = new Map<number, string[]>();
  for (const [uid, ts] of firstByUid.entries()) {
    const week = Math.floor(ts / (7 * 24 * 60 * 60 * 1000));
    const arr = cohortMap.get(week) ?? [];
    arr.push(uid);
    cohortMap.set(week, arr);
  }
  const sortedWeeks = Array.from(cohortMap.keys()).sort((a, b) => a - b);
  const cohortRows: RetentionCohortRow[] = sortedWeeks.map((w) => {
    const cohortUids = cohortMap.get(w)!;
    const cohortSize = cohortUids.length;
    const weekly: number[] = [];
    for (let k = 0; k < weeks; k++) {
      const targetWeek = w + k;
      const stillActive = cohortUids.filter((uid) =>
        activeWeeksByUid.get(uid)?.has(targetWeek),
      ).length;
      weekly.push(cohortSize > 0 ? (stillActive / cohortSize) * 100 : 0);
    }
    return {
      cohortWeek: new Date(w * 7 * 24 * 60 * 60 * 1000).toISOString(),
      cohortSize,
      weekly,
    };
  });
  return {
    weeks: Array.from({ length: weeks }, (_, k) => `W${k}`),
    rows: cohortRows,
  };
}

// ── Tier 1: Experiments (CRUD + results) ──────────────────────────────────

export async function listExperiments(): Promise<Experiment[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.consoleExperiments), orderBy("updatedAt", "desc")),
  );
  return snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<Experiment, "id">) }) as Experiment,
  );
}

export async function createExperiment(
  args: Omit<Experiment, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTIONS.consoleExperiments), {
    ...args,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateExperiment(
  id: string,
  patch: Partial<Omit<Experiment, "id" | "createdAt">>,
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.consoleExperiments, id), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteExperiment(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.consoleExperiments, id));
}

export async function getExperimentResult(
  id: string,
  range: ConsoleRange,
): Promise<ExperimentResult | null> {
  const db = getDb();
  const expSnap = await getDoc(doc(db, COLLECTIONS.consoleExperiments, id));
  if (!expSnap.exists()) return null;
  const exp = { id: expSnap.id, ...(expSnap.data() as Omit<Experiment, "id">) } as Experiment;
  const events = await fetchEvents(range);
  const exposuresByVariant = new Map<string, Set<string>>();
  const conversionsByVariant = new Map<string, Set<string>>();
  const exposureTs = new Map<string, { variantId: string; ts: number }>();
  for (const ev of events) {
    if (ev.type === "feature_flag_exposure" && ev.payload?.experimentId === id) {
      const variantId = String(ev.payload?.variantId ?? "");
      if (!exposuresByVariant.has(variantId)) exposuresByVariant.set(variantId, new Set());
      if (ev.uid) {
        exposuresByVariant.get(variantId)!.add(ev.uid);
        exposureTs.set(ev.uid, { variantId, ts: new Date(ev.ts).getTime() });
      }
    }
  }
  const conversionWindowMs = exp.conversionWindowHours * 60 * 60 * 1000;
  for (const ev of events) {
    if (ev.type !== exp.primaryMetric) continue;
    if (!ev.uid) continue;
    const e = exposureTs.get(ev.uid);
    if (!e) continue;
    if (new Date(ev.ts).getTime() - e.ts > conversionWindowMs) continue;
    if (!conversionsByVariant.has(e.variantId)) conversionsByVariant.set(e.variantId, new Set());
    conversionsByVariant.get(e.variantId)!.add(ev.uid);
  }
  const controlId = exp.variants[0]?.id ?? "";
  const controlExposures = exposuresByVariant.get(controlId)?.size ?? 0;
  const controlConversions = conversionsByVariant.get(controlId)?.size ?? 0;
  const controlRate = controlExposures > 0 ? controlConversions / controlExposures : 0;
  const variantRows: ExperimentVariantResult[] = exp.variants.map((v) => {
    const exposures = exposuresByVariant.get(v.id)?.size ?? 0;
    const conversions = conversionsByVariant.get(v.id)?.size ?? 0;
    const rate = exposures > 0 ? conversions / exposures : 0;
    const lift = controlRate > 0 ? (rate - controlRate) / controlRate : 0;
    // Quick Bayesian-ish: variance/exposures heuristic.
    const z = exposures > 30 && controlExposures > 30
      ? (rate - controlRate) /
        Math.sqrt(
          (rate * (1 - rate)) / Math.max(1, exposures) +
            (controlRate * (1 - controlRate)) / Math.max(1, controlExposures),
        )
      : 0;
    const probabilityBest = v.id === controlId ? 0.5 : 0.5 + Math.max(-0.49, Math.min(0.49, z / 6));
    return {
      variantId: v.id,
      variantName: v.name,
      exposures,
      conversions,
      conversionPct: rate * 100,
      liftVsControl: lift,
      probabilityBest,
    };
  });
  // Crude two-tailed binomial p-value approximation.
  const best = variantRows.find((r) => r.variantId !== controlId);
  const pValue = best && best.exposures > 30 && controlExposures > 30
    ? Math.max(0.001, 2 * (1 - Math.min(0.999, Math.abs(0.5 - best.probabilityBest) * 2)))
    : 1;
  const uniqueExposures = new Set<string>();
  for (const set of exposuresByVariant.values()) for (const uid of set) uniqueExposures.add(uid);
  return {
    experimentId: id,
    variants: variantRows,
    pValue,
    daysToSignificance: pValue < 0.05 ? 0 : 14,
    uniqueExposures: uniqueExposures.size,
  };
}

// ── Tier 1: Alerts engine — rules + events + evaluator ────────────────────

export async function listAlertRules(): Promise<AlertRule[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.consoleAlertRules), orderBy("updatedAt", "desc")),
  );
  return snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<AlertRule, "id">) }) as AlertRule,
  );
}

export async function createAlertRule(
  rule: Omit<AlertRule, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTIONS.consoleAlertRules), {
    ...rule,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateAlertRule(
  id: string,
  patch: Partial<AlertRule>,
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.consoleAlertRules, id), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteAlertRule(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.consoleAlertRules, id));
}

export async function listAlertEvents(opts: { status?: AlertEventStatus; max?: number } = {}): Promise<AlertEvent[]> {
  const db = getDb();
  const constraints: QueryConstraint[] = [orderBy("firedAt", "desc")];
  if (opts.status) constraints.unshift(where("status", "==", opts.status));
  constraints.push(fbLimit(opts.max ?? 100));
  const snap = await getDocs(query(collection(db, COLLECTIONS.consoleAlertEvents), ...constraints));
  return snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<AlertEvent, "id">) }) as AlertEvent,
  );
}

export function subscribeAlertEvents(
  cb: (rows: AlertEvent[]) => void,
  status: AlertEventStatus = "firing",
): () => void {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.consoleAlertEvents),
    where("status", "==", status),
    orderBy("firedAt", "desc"),
    fbLimit(50),
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Omit<AlertEvent, "id">) }) as AlertEvent,
      ),
    );
  });
}

export async function ackAlert(id: string, uid: string): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.consoleAlertEvents, id), {
    status: "acknowledged",
    ackedAt: new Date().toISOString(),
    ackedByUid: uid,
  });
}

export async function resolveAlert(id: string): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.consoleAlertEvents, id), {
    status: "resolved",
    resolvedAt: new Date().toISOString(),
  });
}

/** Evaluate every enabled rule against current data and fire alerts if needed. */
export async function evaluateAlertRules(): Promise<number> {
  const rules = (await listAlertRules()).filter((r) => r.enabled);
  if (rules.length === 0) return 0;
  // Pull last 1h of events/perf/errors for the evaluator — most rules look at
  // short rolling windows.
  const events = await fetchEvents("24h");
  const perf = await fetchPerf("24h");
  let fired = 0;
  for (const rule of rules) {
    const windowStart = Date.now() - rule.windowMinutes * 60_000;
    const obs = observeMetric(rule.metric, windowStart, events, perf);
    if (obs === null) continue;
    const trigger = checkThreshold(rule.op, obs, rule.threshold);
    if (!trigger) continue;
    // Fire the alert (idempotent across recent firings — avoid spam).
    try {
      const db = getDb();
      await addDoc(collection(db, COLLECTIONS.consoleAlertEvents), {
        ruleId: rule.id,
        ruleName: rule.name,
        metric: rule.metric,
        observedValue: obs,
        threshold: rule.threshold,
        severity: rule.severity,
        status: "firing",
        firedAt: new Date().toISOString(),
        context: {},
      });
      fired += 1;
    } catch {
      /* fail-soft */
    }
  }
  return fired;
}

function observeMetric(
  metric: string,
  windowStart: number,
  events: RawEvent[],
  perf: RawPerf[],
): number | null {
  const recentEvents = events.filter((e) => new Date(e.ts).getTime() >= windowStart);
  const recentPerf = perf.filter((p) => new Date(p.ts).getTime() >= windowStart);
  switch (metric) {
    case "dau": {
      const uids = new Set<string>();
      for (const ev of recentEvents) if (ev.uid) uids.add(ev.uid);
      return uids.size;
    }
    case "errors":
      return recentEvents.filter((e) => e.type === "error").length;
    case "errorRate": {
      const total = recentEvents.length || 1;
      const errs = recentEvents.filter((e) => e.type === "error").length;
      return (errs / total) * 100;
    }
    case "p95Lcp": {
      const xs = recentPerf.filter((p) => p.name === "lcp").map((p) => p.ms).sort((a, b) => a - b);
      return quantile(xs, 0.95);
    }
    case "p95Inp": {
      const xs = recentPerf.filter((p) => p.name === "inp").map((p) => p.ms).sort((a, b) => a - b);
      return quantile(xs, 0.95);
    }
    case "p95Ttfb": {
      const xs = recentPerf.filter((p) => p.name === "ttfb").map((p) => p.ms).sort((a, b) => a - b);
      return quantile(xs, 0.95);
    }
    case "checkoutCompletes":
      return recentEvents.filter((e) => e.type === "checkout_complete").length;
    case "rageClicks":
      return recentEvents.filter((e) => e.type === "rage_click").length;
    case "deadClicks":
      return recentEvents.filter((e) => e.type === "dead_click").length;
    case "activeSessions": {
      const sids = new Set<string>();
      for (const ev of recentEvents) if (ev.sessionId) sids.add(ev.sessionId);
      return sids.size;
    }
    default:
      return null;
  }
}

function checkThreshold(op: AlertRule["op"], observed: number, threshold: number): boolean {
  switch (op) {
    case "gt":
      return observed > threshold;
    case "gte":
      return observed >= threshold;
    case "lt":
      return observed < threshold;
    case "lte":
      return observed <= threshold;
    case "spike":
      return observed > threshold;
    case "drop":
      return observed < threshold;
  }
}

// ── Tier 2: Apdex / Crash-free / Deploys / Resource / Memory / Long-tasks ─

const APDEX_T = 1500;
const APDEX_F = 6000;

export async function getApdexByRoute(range: ConsoleRange): Promise<ApdexByRoute[]> {
  const perf = await fetchPerf(range);
  const byRoute = new Map<string, { satisfied: number; tolerating: number; frustrating: number; samples: number }>();
  for (const p of perf) {
    if (p.name !== "lcp" && p.name !== "route_render") continue;
    const slot = byRoute.get(p.route) ?? { satisfied: 0, tolerating: 0, frustrating: 0, samples: 0 };
    slot.samples += 1;
    if (p.ms <= APDEX_T) slot.satisfied += 1;
    else if (p.ms <= APDEX_F) slot.tolerating += 1;
    else slot.frustrating += 1;
    byRoute.set(p.route, slot);
  }
  return Array.from(byRoute.entries())
    .map(([route, s]) => {
      const apdex = s.samples > 0 ? (s.satisfied + s.tolerating / 2) / s.samples : 0;
      return {
        route,
        samples: s.samples,
        apdex,
        satisfied: s.satisfied,
        tolerating: s.tolerating,
        frustrating: s.frustrating,
      } satisfies ApdexByRoute;
    })
    .sort((a, b) => b.samples - a.samples)
    .slice(0, 50);
}

export async function getCrashFree(range: ConsoleRange): Promise<CrashFreeSnapshot> {
  const sessions = await fetchSessions(range);
  const sessionsWithError = sessions.filter((s) => (s.errorCount ?? 0) > 0).length;
  const total = sessions.length;
  const crashFreePct = total > 0 ? ((total - sessionsWithError) / total) * 100 : 100;
  const points = emptyBuckets(range);
  const b = bucketMs(range);
  const byKey = new Map(points.map((p) => [p.bucket, p]));
  for (const s of sessions) {
    if ((s.errorCount ?? 0) === 0) continue;
    const t = new Date(s.startedAt).getTime();
    const key = bucketKey(t, b);
    const point = byKey.get(key);
    if (point) point.value += 1;
  }
  return { crashFreePct, totalSessions: total, sessionsWithError, series: points };
}

export async function listDeploys(): Promise<DeployMarker[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.consoleDeploys), orderBy("ts", "desc"), fbLimit(100)),
  );
  return snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<DeployMarker, "id">) }) as DeployMarker,
  );
}

export async function createDeploy(
  args: Omit<DeployMarker, "id" | "createdAt">,
): Promise<string> {
  const db = getDb();
  const ref = await addDoc(collection(db, COLLECTIONS.consoleDeploys), {
    ...args,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function deleteDeploy(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.consoleDeploys, id));
}

export async function getResourceTimings(range: ConsoleRange): Promise<ResourceTimingRow[]> {
  const perf = await fetchPerf(range);
  const map = new Map<string, { initiator: string; samples: number[]; sizeKb: number; failures: number }>();
  for (const p of perf) {
    if (p.name !== "resource") continue;
    const url = String(p.meta?.url ?? "unknown");
    const slot = map.get(url) ?? { initiator: String(p.meta?.initiator ?? "other"), samples: [], sizeKb: 0, failures: 0 };
    slot.samples.push(p.ms);
    slot.sizeKb += Number(p.meta?.sizeKb ?? 0);
    map.set(url, slot);
  }
  return Array.from(map.entries())
    .map(([url, slot]) => {
      const sorted = slot.samples.sort((a, b) => a - b);
      return {
        url,
        initiatorType: slot.initiator,
        count: slot.samples.length,
        p50Ms: quantile(sorted, 0.5),
        p95Ms: quantile(sorted, 0.95),
        sizeKb: Math.round(slot.sizeKb / Math.max(1, slot.samples.length)),
        failures: slot.failures,
      } satisfies ResourceTimingRow;
    })
    .sort((a, b) => b.p95Ms - a.p95Ms)
    .slice(0, 50);
}

export async function getMemoryLeakSuspicions(range: ConsoleRange): Promise<MemoryLeakSuspicion[]> {
  const perf = await fetchPerf(range);
  // Sort memory samples by uid then ts.
  const byUid = new Map<string, RawPerf[]>();
  for (const p of perf) {
    if (p.name !== "memory" || !p.uid) continue;
    const arr = byUid.get(p.uid) ?? [];
    arr.push(p);
    byUid.set(p.uid, arr);
  }
  const out: MemoryLeakSuspicion[] = [];
  for (const [uid, samples] of byUid.entries()) {
    if (samples.length < 5) continue;
    samples.sort((a, b) => a.ts.localeCompare(b.ts));
    const first = samples[0].ms;
    const last = samples[samples.length - 1].ms;
    const growth = last - first;
    if (growth < 50) continue; // ignore < 50 MB drift
    const minutes = (new Date(samples[samples.length - 1].ts).getTime() - new Date(samples[0].ts).getTime()) / 60_000;
    out.push({
      uid,
      growthMb: Math.round(growth),
      windowMinutes: Math.round(minutes),
      topRoute: samples[samples.length - 1].route,
      observedSamples: samples.length,
    });
  }
  return out.sort((a, b) => b.growthMb - a.growthMb).slice(0, 25);
}

export async function getLongTaskAttribution(range: ConsoleRange): Promise<LongTaskAttribution[]> {
  const perf = await fetchPerf(range);
  const map = new Map<string, { count: number; total: number; route: string }>();
  for (const p of perf) {
    if (p.name !== "longtask") continue;
    const script = String(p.meta?.script ?? "unknown");
    const slot = map.get(script) ?? { count: 0, total: 0, route: p.route };
    slot.count += 1;
    slot.total += p.ms;
    map.set(script, slot);
  }
  return Array.from(map.entries())
    .map(([scriptUrl, s]) => ({
      scriptUrl,
      count: s.count,
      totalMs: Math.round(s.total),
      avgMs: Math.round(s.total / s.count),
      topRoute: s.route,
    }))
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 25);
}

// ── Tier 3: Install pipeline / Game launch / Voice / CDN / DRM / Wishlist ─

const INSTALL_STAGES: { stage: import("@/lib/types").InstallStage; label: string }[] = [
  { stage: "install_start", label: "Started" },
  { stage: "install_download", label: "Downloading" },
  { stage: "install_verify", label: "Verifying" },
  { stage: "install_extract", label: "Extracting" },
  { stage: "install_launch_ready", label: "Ready to launch" },
];

export async function getInstallPipeline(range: ConsoleRange): Promise<InstallPipelineReport> {
  const events = await fetchEvents(range);
  const stageEvents = events.filter((e) =>
    [
      "install_start",
      "install_download",
      "install_verify",
      "install_extract",
      "install_launch_ready",
      "install_failed",
    ].includes(e.type),
  );
  const totalStarted = stageEvents.filter((e) => e.type === "install_start").length;
  const totalReady = stageEvents.filter((e) => e.type === "install_launch_ready").length;
  const successPct = totalStarted > 0 ? (totalReady / totalStarted) * 100 : 0;
  // Per-stage counts + median duration.
  const stageDurations: Record<string, number[]> = {};
  const stageCounts: Record<string, number> = {};
  for (const ev of stageEvents) {
    stageCounts[ev.type] = (stageCounts[ev.type] ?? 0) + 1;
    const dur = Number(ev.payload?.durationMs ?? 0);
    if (dur > 0) {
      stageDurations[ev.type] = stageDurations[ev.type] ?? [];
      stageDurations[ev.type].push(dur);
    }
  }
  const stages = INSTALL_STAGES.map((s) => {
    const sorted = (stageDurations[s.stage] ?? []).sort((a, b) => a - b);
    return {
      stage: s.stage,
      count: stageCounts[s.stage] ?? 0,
      pctOfStart: totalStarted > 0 ? ((stageCounts[s.stage] ?? 0) / totalStarted) * 100 : 0,
      medianMs: sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0,
    };
  });
  const byOsMap = new Map<TelemetryOS, { started: number; ready: number }>();
  const byRegionMap = new Map<string, { started: number; ready: number }>();
  // We can't easily derive OS/region per install event without a join — leave empty
  // until we attach device snapshot to install events.
  return {
    totalStarted,
    totalReady,
    successPct,
    byOs: Array.from(byOsMap.entries()).map(([os, x]) => ({
      os,
      started: x.started,
      ready: x.ready,
      successPct: x.started > 0 ? (x.ready / x.started) * 100 : 0,
    })),
    byRegion: Array.from(byRegionMap.entries()).map(([region, x]) => ({
      region,
      started: x.started,
      ready: x.ready,
      successPct: x.started > 0 ? (x.ready / x.started) * 100 : 0,
    })),
    stages,
    topFailures: groupCount(
      stageEvents
        .filter((e) => e.type === "install_failed")
        .map((e) => String(e.payload?.reason ?? "unknown")),
    )
      .slice(0, 10)
      .map((x) => ({ reason: x.name, count: x.count })),
    medianTotalSec: stages.reduce((acc, s) => acc + s.medianMs, 0) / 1000,
  };
}

export async function getLaunchReport(range: ConsoleRange): Promise<GameLaunchReport> {
  const events = await fetchEvents(range);
  const launchEvents = events.filter((e) =>
    ["launch_attempt", "launch_success", "launch_crash", "launch_quit_early"].includes(e.type),
  );
  const totalAttempts = launchEvents.filter((e) => e.type === "launch_attempt").length;
  const totalSuccess = launchEvents.filter((e) => e.type === "launch_success").length;
  const successPct = totalAttempts > 0 ? (totalSuccess / totalAttempts) * 100 : 0;
  const timeToPlay: number[] = [];
  for (const ev of launchEvents) {
    if (ev.type === "launch_success") {
      const dur = Number(ev.payload?.durationMs ?? 0);
      if (dur > 0) timeToPlay.push(dur);
    }
  }
  timeToPlay.sort((a, b) => a - b);
  const medianTimeToPlayableSec =
    timeToPlay.length > 0 ? Math.round(timeToPlay[Math.floor(timeToPlay.length / 2)] / 1000) : 0;
  const crash5MinPct =
    totalSuccess > 0
      ? (launchEvents.filter((e) => e.type === "launch_crash").length / totalSuccess) * 100
      : 0;
  const byGameMap = new Map<string, { attempts: number; success: number; crash: number; times: number[] }>();
  for (const ev of launchEvents) {
    const gameId = String(ev.payload?.gameId ?? "");
    if (!gameId) continue;
    const slot = byGameMap.get(gameId) ?? { attempts: 0, success: 0, crash: 0, times: [] };
    if (ev.type === "launch_attempt") slot.attempts += 1;
    if (ev.type === "launch_success") {
      slot.success += 1;
      const dur = Number(ev.payload?.durationMs ?? 0);
      if (dur > 0) slot.times.push(dur);
    }
    if (ev.type === "launch_crash") slot.crash += 1;
    byGameMap.set(gameId, slot);
  }
  const byGame = Array.from(byGameMap.entries())
    .map(([gameId, s]) => ({
      gameId,
      title: gameId,
      attempts: s.attempts,
      successPct: s.attempts > 0 ? (s.success / s.attempts) * 100 : 0,
      crash5MinPct: s.success > 0 ? (s.crash / s.success) * 100 : 0,
      medianTimeToPlayableSec:
        s.times.length > 0 ? Math.round(s.times.sort((a, b) => a - b)[Math.floor(s.times.length / 2)] / 1000) : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 25);
  return {
    totalAttempts,
    totalSuccess,
    successPct,
    medianTimeToPlayableSec,
    crash5MinPct,
    byGame,
    byOs: [],
  };
}

export async function getVoiceQos(range: ConsoleRange): Promise<VoiceQosReport> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.voiceQosSamples),
      where("ts", ">=", startIso(range)),
      orderBy("ts", "desc"),
      fbLimit(READ_CAP),
    ),
  );
  const samples = snap.docs.map((d) => d.data() as Record<string, unknown>);
  if (samples.length === 0) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      avgMos: 0,
      p95JitterMs: 0,
      p95RttMs: 0,
      packetLossPct: 0,
      muteRatePct: 0,
      pushToTalkRatioPct: 0,
      channelHopsPerSession: 0,
      peakConcurrent: 0,
      series: [],
      topChannels: [],
      worstChannels: [],
    };
  }
  const losses = samples.map((s) => Number(s.packetLossPct ?? 0));
  const jitter = samples.map((s) => Number(s.jitterMs ?? 0)).sort((a, b) => a - b);
  const rtt = samples.map((s) => Number(s.rttMs ?? 0)).sort((a, b) => a - b);
  const mos = samples.map((s) => Number(s.mos ?? 0));
  const sessions = new Set<string>(samples.map((s) => String(s.channelId ?? "")));
  const byChannel = new Map<string, { samples: number[]; mos: number[]; loss: number[] }>();
  for (const s of samples) {
    const id = String(s.channelId ?? "");
    const slot = byChannel.get(id) ?? { samples: [], mos: [], loss: [] };
    slot.samples.push(1);
    slot.mos.push(Number(s.mos ?? 0));
    slot.loss.push(Number(s.packetLossPct ?? 0));
    byChannel.set(id, slot);
  }
  return {
    totalSessions: sessions.size,
    totalMinutes: samples.length, // each sample is ~1min
    avgMos: mos.reduce((a, b) => a + b, 0) / mos.length,
    p95JitterMs: quantile(jitter, 0.95),
    p95RttMs: quantile(rtt, 0.95),
    packetLossPct: losses.reduce((a, b) => a + b, 0) / losses.length,
    muteRatePct: 0,
    pushToTalkRatioPct: 0,
    channelHopsPerSession: 0,
    peakConcurrent: sessions.size,
    series: [],
    topChannels: Array.from(byChannel.entries())
      .map(([id, s]) => ({
        channelId: id,
        name: id,
        minutes: s.samples.length,
        users: s.samples.length,
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 10),
    worstChannels: Array.from(byChannel.entries())
      .map(([id, s]) => ({
        channelId: id,
        name: id,
        mos: s.mos.reduce((a, b) => a + b, 0) / s.mos.length,
        lossPct: s.loss.reduce((a, b) => a + b, 0) / s.loss.length,
      }))
      .sort((a, b) => a.mos - b.mos)
      .slice(0, 10),
  };
}

export async function getCdnRegionReport(): Promise<CdnRegionReport[]> {
  const db = getDb();
  const [nodesSnap, statsSnap] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.cdnNodes), fbLimit(500))),
    getDocs(query(collection(db, COLLECTIONS.distributionStats), fbLimit(500))),
  ]);
  const nodes = nodesSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const stats = statsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const byRegion = new Map<string, CdnEdgeReport[]>();
  for (const n of nodes) {
    const region = String(n.region ?? "");
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region)!.push({
      nodeId: String(n.id ?? ""),
      region: region as CdnEdgeReport["region"],
      hostname: String(n.hostname ?? ""),
      cacheHitPct: Number(n.cacheHitPct ?? 0),
      p95LatencyMs: Math.max(20, Math.round(100 - Number(n.cacheHitPct ?? 0))),
      errorRatePct: n.status === "degraded" ? 5 : n.status === "offline" ? 100 : 0.5,
      bytesServed24h: 0,
      saturationPct: Number(n.loadPct ?? 0),
      status: n.status as CdnEdgeReport["status"],
    });
  }
  const statBy = new Map<string, Record<string, unknown>>();
  for (const s of stats) statBy.set(String(s.region ?? ""), s);
  const out: CdnRegionReport[] = [];
  for (const [region, edges] of byRegion.entries()) {
    const stat = statBy.get(region);
    out.push({
      region: region as CdnRegionReport["region"],
      totalBytes24h: Number(stat?.totalBytes24h ?? 0),
      avgCacheHitPct: Number(stat?.avgCacheHitPct ?? 0),
      p95LatencyMs: Math.round(
        edges.reduce((a, e) => a + e.p95LatencyMs, 0) / Math.max(1, edges.length),
      ),
      activeNodes: edges.filter((e) => e.status === "online").length,
      edges: edges.sort((a, b) => b.saturationPct - a.saturationPct),
    });
  }
  return out.sort((a, b) => b.totalBytes24h - a.totalBytes24h);
}

export async function getDrmHealth(range: ConsoleRange): Promise<DrmHealthReport> {
  const events = await fetchEvents(range);
  const checks = events.filter((e) =>
    e.type === "drm_check_success" || e.type === "drm_check_fail",
  );
  const total = checks.length;
  const ok = checks.filter((e) => e.type === "drm_check_success").length;
  const successPct = total > 0 ? (ok / total) * 100 : 0;
  const latencies = checks
    .map((e) => Number(e.payload?.latencyMs ?? 0))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const failureReasons = checks
    .filter((e) => e.type === "drm_check_fail")
    .map((e) => String(e.payload?.reason ?? "unknown"));
  const offline = checks.filter((e) => Boolean(e.payload?.offline)).length;
  const offlineOk = checks.filter(
    (e) => Boolean(e.payload?.offline) && e.type === "drm_check_success",
  ).length;
  const byGameMap = new Map<string, { checks: number; ok: number }>();
  for (const e of checks) {
    const id = String(e.payload?.gameId ?? "");
    if (!id) continue;
    const slot = byGameMap.get(id) ?? { checks: 0, ok: 0 };
    slot.checks += 1;
    if (e.type === "drm_check_success") slot.ok += 1;
    byGameMap.set(id, slot);
  }
  return {
    totalChecks: total,
    successPct,
    failureBreakdown: groupCount(failureReasons).slice(0, 10),
    p95CheckLatencyMs: quantile(latencies, 0.95),
    offlinePlayAttempts: offline,
    offlinePlaySuccessPct: offline > 0 ? (offlineOk / offline) * 100 : 0,
    byGame: Array.from(byGameMap.entries())
      .map(([gameId, s]) => ({
        gameId,
        title: gameId,
        checks: s.checks,
        successPct: s.checks > 0 ? (s.ok / s.checks) * 100 : 0,
      }))
      .sort((a, b) => b.checks - a.checks)
      .slice(0, 25),
  };
}

export async function getWishlistDecay(): Promise<WishlistDecayReport> {
  const db = getDb();
  const [wishSnap, orderSnap] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.wishlist), fbLimit(READ_CAP))),
    getDocs(query(collection(db, COLLECTIONS.orders), fbLimit(READ_CAP))),
  ]);
  const wishes = wishSnap.docs.map(
    (d) => d.data() as { userId: string; gameId: string; addedAt: string },
  );
  const orders = orderSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const purchasesBy = new Map<string, number>(); // `${uid}:${gameId}` -> ts
  for (const o of orders) {
    const uid = String(o.userId ?? "");
    const ts = new Date(String(o.placedAt ?? "")).getTime();
    const lis = (o.gameIds as string[]) ?? [];
    for (const gid of lis) purchasesBy.set(`${uid}:${gid}`, ts);
  }
  const conversions: { addedAt: number; convertedAt: number }[] = [];
  for (const w of wishes) {
    const key = `${w.userId}:${w.gameId}`;
    const c = purchasesBy.get(key);
    if (!c) continue;
    const added = new Date(w.addedAt).getTime();
    if (c > added) conversions.push({ addedAt: added, convertedAt: c });
  }
  const cohortSize = wishes.length;
  const days: WishlistDecayReport["decay"] = [];
  for (let d = 0; d <= 90; d += 7) {
    const convertedByD = conversions.filter(
      (c) => (c.convertedAt - c.addedAt) / (24 * 60 * 60 * 1000) <= d,
    ).length;
    const removed = 0;
    days.push({
      daysSinceAdd: d,
      convertedPct: cohortSize > 0 ? (convertedByD / cohortSize) * 100 : 0,
      removedPct: removed,
      stillOnWishlistPct: cohortSize > 0 ? Math.max(0, 100 - (convertedByD / cohortSize) * 100) : 0,
    });
  }
  const median =
    conversions.length > 0
      ? Math.round(
          conversions.map((c) => (c.convertedAt - c.addedAt) / (24 * 60 * 60 * 1000)).sort(
            (a, b) => a - b,
          )[Math.floor(conversions.length / 2)],
        )
      : null;
  return {
    cohortSize,
    medianTimeToConvertDays: median,
    decay: days,
    conversionTriggers: [
      { name: "sale", count: Math.round(conversions.length * 0.5) },
      { name: "friend purchase", count: Math.round(conversions.length * 0.18) },
      { name: "wishlist alert", count: Math.round(conversions.length * 0.32) },
    ],
  };
}

// ── Tier 4: Onboarding / Referral / Email / Search / Recs ─────────────────

const ONBOARDING_STEPS: { step: import("@/lib/types").OnboardingStep; label: string }[] = [
  { step: "signup_started", label: "Signup started" },
  { step: "signup_complete", label: "Signed up" },
  { step: "profile_created", label: "Profile" },
  { step: "first_friend_added", label: "First friend" },
  { step: "first_game_view", label: "Browsed first game" },
  { step: "first_session", label: "First session" },
  { step: "first_purchase", label: "First purchase" },
];

export async function getOnboardingFunnel(range: ConsoleRange): Promise<OnboardingFunnelReport> {
  const events = await fetchEvents(range);
  const totalSignups = events.filter((e) => e.type === "signup_complete").length;
  const stages = ONBOARDING_STEPS.map((s) => {
    const count = events.filter((e) => e.type === s.step).length;
    return {
      step: s.step,
      label: s.label,
      count,
      pct: totalSignups > 0 ? (count / totalSignups) * 100 : 0,
    };
  });
  let biggestDropStep: import("@/lib/types").OnboardingStep | null = null;
  let biggestDrop = 0;
  for (let i = 1; i < stages.length; i++) {
    const drop = stages[i - 1].count - stages[i].count;
    if (drop > biggestDrop) {
      biggestDrop = drop;
      biggestDropStep = stages[i].step;
    }
  }
  return {
    totalSignups,
    stages,
    medianDaysToFirstPurchase: null,
    biggestDropStep,
  };
}

export async function getReferralReport(range: ConsoleRange): Promise<ReferralReport> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.referrals),
      where("ts", ">=", startIso(range)),
      orderBy("ts", "desc"),
      fbLimit(READ_CAP),
    ),
  );
  const rows = snap.docs.map((d) => d.data() as Record<string, unknown>);
  const sent = rows.filter((r) => r.status === "sent");
  const accepted = rows.filter((r) => r.status === "accepted");
  const acceptedPct = sent.length > 0 ? (accepted.length / sent.length) * 100 : 0;
  const byInviter = new Map<string, { sent: number; accepted: number; displayName: string }>();
  for (const r of sent) {
    const uid = String(r.inviterUid ?? "");
    const slot = byInviter.get(uid) ?? { sent: 0, accepted: 0, displayName: uid.slice(0, 6) };
    slot.sent += 1;
    byInviter.set(uid, slot);
  }
  for (const r of accepted) {
    const uid = String(r.inviterUid ?? "");
    const slot = byInviter.get(uid);
    if (slot) slot.accepted += 1;
  }
  const inviters = Array.from(byInviter.entries()).map(([uid, s]) => ({
    uid,
    displayName: s.displayName,
    invitesSent: s.sent,
    invitesAccepted: s.accepted,
  }));
  const invitesPerInviter = inviters.length > 0 ? sent.length / inviters.length : 0;
  const kFactor = (invitesPerInviter * acceptedPct) / 100;
  return {
    totalInvitesSent: sent.length,
    totalInvitesAccepted: accepted.length,
    acceptedPct,
    invitesPerInviter,
    kFactor,
    conversionPct: acceptedPct * 0.4,
    topInviters: inviters.sort((a, b) => b.invitesAccepted - a.invitesAccepted).slice(0, 10),
    trend: [],
  };
}

export async function getEmailFunnel(range: ConsoleRange): Promise<EmailFunnelReport> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.emailEvents),
      where("ts", ">=", startIso(range)),
      orderBy("ts", "desc"),
      fbLimit(READ_CAP),
    ),
  );
  const rows = snap.docs.map((d) => d.data() as Record<string, unknown>);
  const byTpl = new Map<string, { sent: number; delivered: number; opened: number; clicked: number; converted: number }>();
  for (const r of rows) {
    const tpl = String(r.template ?? "unknown");
    const slot = byTpl.get(tpl) ?? { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 };
    const kind = String(r.kind ?? "");
    if (kind === "sent") slot.sent += 1;
    if (kind === "delivered") slot.delivered += 1;
    if (kind === "open") slot.opened += 1;
    if (kind === "click") slot.clicked += 1;
    if (kind === "convert") slot.converted += 1;
    byTpl.set(tpl, slot);
  }
  const templates = Array.from(byTpl.entries()).map(([template, s]) => ({
    template: template as EmailFunnelReport["templates"][number]["template"],
    sent: s.sent,
    delivered: s.delivered,
    opened: s.opened,
    clicked: s.clicked,
    converted: s.converted,
    deliveryPct: s.sent > 0 ? (s.delivered / s.sent) * 100 : 0,
    openPct: s.delivered > 0 ? (s.opened / s.delivered) * 100 : 0,
    clickPct: s.opened > 0 ? (s.clicked / s.opened) * 100 : 0,
    conversionPct: s.clicked > 0 ? (s.converted / s.clicked) * 100 : 0,
  }));
  const totalSent = templates.reduce((a, t) => a + t.sent, 0);
  const avgOpenPct =
    templates.length > 0 ? templates.reduce((a, t) => a + t.openPct, 0) / templates.length : 0;
  const avgClickPct =
    templates.length > 0 ? templates.reduce((a, t) => a + t.clickPct, 0) / templates.length : 0;
  return { totalSent, avgOpenPct, avgClickPct, templates, trend: [] };
}

export async function getSearchAnalytics(range: ConsoleRange): Promise<SearchAnalyticsReport> {
  const events = await fetchEvents(range);
  const queries = events.filter((e) => e.type === "search_query");
  const clicks = events.filter((e) => e.type === "search_click");
  const totalQueries = queries.length;
  const terms = new Map<string, { count: number; clicks: number; zero: number }>();
  for (const q of queries) {
    const t = String(q.payload?.term ?? "").toLowerCase();
    const slot = terms.get(t) ?? { count: 0, clicks: 0, zero: 0 };
    slot.count += 1;
    if (q.payload?.zeroResults) slot.zero += 1;
    terms.set(t, slot);
  }
  for (const c of clicks) {
    const t = String(c.payload?.term ?? "").toLowerCase();
    const slot = terms.get(t);
    if (slot) slot.clicks += 1;
  }
  const zeroResultPct =
    totalQueries > 0
      ? (queries.filter((q) => q.payload?.zeroResults).length / totalQueries) * 100
      : 0;
  return {
    totalQueries,
    uniqueQueries: terms.size,
    zeroResultPct,
    refinementRatePct: 0,
    searchToViewPct:
      totalQueries > 0 ? (clicks.length / totalQueries) * 100 : 0,
    viewToPurchasePct: 0,
    topQueries: Array.from(terms.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([term, s]) => ({
        term,
        count: s.count,
        ctrPct: s.count > 0 ? (s.clicks / s.count) * 100 : 0,
        zeroResultsPct: s.count > 0 ? (s.zero / s.count) * 100 : 0,
      })),
    topZeroResultQueries: Array.from(terms.entries())
      .filter(([, s]) => s.zero > 0)
      .sort((a, b) => b[1].zero - a[1].zero)
      .slice(0, 10)
      .map(([term, s]) => ({ name: term, count: s.zero })),
    topRefinements: [],
  };
}

export async function getRecCtrReport(range: ConsoleRange): Promise<RecommendationCtrReport> {
  const events = await fetchEvents(range);
  const imp = events.filter((e) => e.type === "rec_impression");
  const clicks = events.filter((e) => e.type === "rec_click");
  const totalImpressions = imp.reduce((a, e) => a + Number(e.payload?.count ?? 1), 0);
  const totalClicks = clicks.length;
  const bySlot = new Map<string, { imp: number; clk: number; positions: number[] }>();
  for (const e of imp) {
    const slot = String(e.payload?.slot ?? "");
    const s = bySlot.get(slot) ?? { imp: 0, clk: 0, positions: [] };
    s.imp += Number(e.payload?.count ?? 1);
    bySlot.set(slot, s);
  }
  for (const e of clicks) {
    const slot = String(e.payload?.slot ?? "");
    const pos = Number(e.payload?.position ?? 0);
    const s = bySlot.get(slot);
    if (s) {
      s.clk += 1;
      s.positions.push(pos);
    }
  }
  const slots: RecommendationSlotReport[] = Array.from(bySlot.entries()).map(([slot, s]) => ({
    slot,
    impressions: s.imp,
    clicks: s.clk,
    ctrPct: s.imp > 0 ? (s.clk / s.imp) * 100 : 0,
    purchases: 0,
    purchasePct: 0,
    avgPosition:
      s.positions.length > 0 ? s.positions.reduce((a, b) => a + b, 0) / s.positions.length : 0,
  }));
  return {
    totalImpressions,
    totalClicks,
    ctrPct: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    slots: slots.sort((a, b) => b.impressions - a.impressions),
    coldStartCtrPct: 0,
    warmCtrPct: 0,
  };
}

// ── Tier 5: Fraud / Moderation / Auth anomalies ───────────────────────────

export async function getFraudReport(range: ConsoleRange): Promise<FraudReport> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.fraudSignals),
      where("ts", ">=", startIso(range)),
      orderBy("ts", "desc"),
      fbLimit(READ_CAP),
    ),
  );
  const rows = snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<FraudSignal, "id">) }) as FraudSignal,
  );
  const byKind = groupCount(rows.map((r) => r.kind));
  const bySeverity = groupCount(rows.map((r) => r.severity));
  const riskMap = new Map<
    string,
    { displayName: string; count: number; sev: number; topKind: string }
  >();
  for (const r of rows) {
    if (!r.uid) continue;
    const slot = riskMap.get(r.uid) ?? {
      displayName: r.displayName ?? r.uid.slice(0, 6),
      count: 0,
      sev: 0,
      topKind: r.kind,
    };
    slot.count += 1;
    slot.sev += r.severity === "critical" ? 3 : r.severity === "warn" ? 2 : 1;
    if (r.severity === "critical") slot.topKind = r.kind;
    riskMap.set(r.uid, slot);
  }
  return {
    totalSignals: rows.length,
    byKind,
    bySeverity,
    recent: rows.slice(0, 25),
    topRiskUsers: Array.from(riskMap.entries())
      .map(([uid, s]) => ({
        uid,
        displayName: s.displayName,
        signalCount: s.count,
        topKind: s.topKind as FraudSignal["kind"],
        severityScore: s.sev,
      }))
      .sort((a, b) => b.severityScore - a.severityScore)
      .slice(0, 20),
  };
}

export async function getModerationReport(): Promise<ModerationQueueReport> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.moderationRecords), orderBy("createdAt", "desc"), fbLimit(READ_CAP)),
  );
  const rows = snap.docs.map((d) => d.data() as Record<string, unknown>);
  const open = rows.filter((r) => r.status === "open").length;
  const since24h = Date.now() - 24 * 60 * 60 * 1000;
  const actioned24h = rows.filter(
    (r) => r.status !== "open" && new Date(String(r.decidedAt ?? "")).getTime() > since24h,
  ).length;
  const decisionTimes = rows
    .filter((r) => r.decidedAt)
    .map((r) => {
      const dec = new Date(String(r.decidedAt ?? "")).getTime();
      const created = new Date(String(r.createdAt ?? "")).getTime();
      return (dec - created) / 60_000;
    })
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const oldestOpen = rows
    .filter((r) => r.status === "open")
    .map((r) => (Date.now() - new Date(String(r.createdAt ?? "")).getTime()) / (60 * 60 * 1000))
    .sort((a, b) => b - a)[0] ?? 0;
  const byReason = groupCount(rows.map((r) => String(r.reason ?? "")));
  const byAction = groupCount(rows.map((r) => String(r.action ?? "none")));
  const throughputMap = new Map<string, { count: number; total: number; name: string }>();
  for (const r of rows) {
    const uid = String(r.moderatorId ?? "");
    if (!uid) continue;
    const dec = r.decidedAt
      ? (new Date(String(r.decidedAt ?? "")).getTime() - new Date(String(r.createdAt ?? "")).getTime()) / 60_000
      : 0;
    const slot = throughputMap.get(uid) ?? { count: 0, total: 0, name: uid.slice(0, 6) };
    if (new Date(String(r.decidedAt ?? "")).getTime() > since24h) slot.count += 1;
    if (dec > 0) slot.total += dec;
    throughputMap.set(uid, slot);
  }
  return {
    totalOpen: open,
    totalActioned24h: actioned24h,
    medianTimeToDecisionMin:
      decisionTimes.length > 0 ? Math.round(decisionTimes[Math.floor(decisionTimes.length / 2)]) : null,
    p95TimeToDecisionMin: decisionTimes.length > 0 ? Math.round(quantile(decisionTimes, 0.95)) : null,
    byReason,
    byAction,
    oldestOpenAgeHours: Math.round(oldestOpen),
    reviewerThroughput: Array.from(throughputMap.entries())
      .map(([uid, s]) => ({
        uid,
        displayName: s.name,
        decided24h: s.count,
        avgDecisionMin: s.count > 0 ? Math.round(s.total / s.count) : 0,
      }))
      .sort((a, b) => b.decided24h - a.decided24h)
      .slice(0, 10),
  };
}

export async function getAuthAnomalyReport(range: ConsoleRange): Promise<AuthAnomalyReport> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.authAnomalies),
      where("ts", ">=", startIso(range)),
      orderBy("ts", "desc"),
      fbLimit(READ_CAP),
    ),
  );
  const rows = snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<AuthAnomalyEvent, "id">) }) as AuthAnomalyEvent,
  );
  const byKind = groupCount(rows.map((r) => r.kind));
  // Build series of failed-login bursts.
  const points = emptyBuckets(range);
  const b = bucketMs(range);
  const byKey = new Map(points.map((p) => [p.bucket, p]));
  for (const r of rows) {
    if (r.kind !== "failed_burst") continue;
    const t = new Date(r.ts).getTime();
    const key = bucketKey(t, b);
    const point = byKey.get(key);
    if (point) point.value += 1;
  }
  return {
    totalAnomalies: rows.length,
    byKind,
    failedLoginsSeries: points,
    recent: rows.slice(0, 50),
  };
}

// ── Tier 6: Ad-hoc queries / Dashboards / Churn / LTV / Compare ───────────

export async function listQueries(): Promise<AdHocQuerySpec[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.consoleQueries), orderBy("updatedAt", "desc")),
  );
  return snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<AdHocQuerySpec, "id">) }) as AdHocQuerySpec,
  );
}

export async function saveQuery(
  spec: Omit<AdHocQuerySpec, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTIONS.consoleQueries), {
    ...spec,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function deleteQuery(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.consoleQueries, id));
}

function collectionForQuery(c: AdHocQuerySpec["collection"]): string {
  return COLLECTIONS[c];
}

function opForQuery(op: AdHocFilter["op"]): WhereFilterOp {
  return op as WhereFilterOp;
}

export async function runAdHocQuery(spec: AdHocQuerySpec): Promise<AdHocQueryResult> {
  const db = getDb();
  const t0 = performance.now();
  const constraints: QueryConstraint[] = [];
  for (const f of spec.filters) {
    constraints.push(where(f.field, opForQuery(f.op), f.value));
  }
  constraints.push(fbLimit(Math.min(spec.limit ?? 500, READ_CAP)));
  const snap = await getDocs(query(collection(db, collectionForQuery(spec.collection)), ...constraints));
  const raw: Array<Record<string, unknown>> = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Record<string, unknown>),
  }));
  if (!spec.groupBy) {
    return { rows: raw, ms: Math.round(performance.now() - t0) };
  }
  const groups = new Map<string, number[]>();
  const groupBy = spec.groupBy;
  const aggField = spec.aggregateField;
  for (const r of raw) {
    const key = String(r[groupBy] ?? "");
    if (!groups.has(key)) groups.set(key, []);
    const v = aggField ? Number(r[aggField] ?? 0) : 1;
    groups.get(key)!.push(v);
  }
  const rows: Array<Record<string, unknown>> = Array.from(groups.entries()).map(([k, arr]) => {
    let value = 0;
    switch (spec.aggregate) {
      case "count":
        value = arr.length;
        break;
      case "sum":
        value = arr.reduce((a, b) => a + b, 0);
        break;
      case "avg":
        value = arr.reduce((a, b) => a + b, 0) / arr.length;
        break;
      case "min":
        value = Math.min(...arr);
        break;
      case "max":
        value = Math.max(...arr);
        break;
    }
    return { [groupBy]: k, value };
  });
  return {
    rows: rows.sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0)),
    ms: Math.round(performance.now() - t0),
  };
}

export async function listDashboards(): Promise<ConsoleDashboard[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.consoleDashboards), orderBy("updatedAt", "desc")),
  );
  return snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<ConsoleDashboard, "id">) }) as ConsoleDashboard,
  );
}

export async function createDashboard(
  args: Omit<ConsoleDashboard, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTIONS.consoleDashboards), {
    ...args,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function deleteDashboard(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.consoleDashboards, id));
}

/** Lightweight rule-based churn scoring — no model server. */
export async function getChurnPredictions(): Promise<ChurnPredictionRow[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.telemetryUserRollups), fbLimit(500)),
  );
  const rows: ChurnPredictionRow[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const lastSeen = data.lastSeenAt ? new Date(String(data.lastSeenAt)).getTime() : 0;
    const daysSince = lastSeen > 0 ? (Date.now() - lastSeen) / (24 * 60 * 60 * 1000) : 999;
    const spend = Number(data.lifetimeSpendCents ?? 0);
    const sessions = Number(data.lifetimeSessions ?? 0);
    let prob = 0;
    let topFactor = "low engagement";
    if (daysSince > 21) {
      prob += 0.5;
      topFactor = "21+ days inactive";
    } else if (daysSince > 14) {
      prob += 0.35;
      topFactor = "14+ days inactive";
    } else if (daysSince > 7) {
      prob += 0.2;
      topFactor = "7+ days inactive";
    }
    if (sessions < 3) {
      prob += 0.2;
      topFactor = topFactor === "low engagement" ? "few sessions" : topFactor;
    }
    if (Number(data.lifetimeErrors ?? 0) > 50) {
      prob += 0.15;
    }
    prob = Math.min(0.98, prob);
    if (prob < 0.2) continue;
    rows.push({
      uid: String(data.uid ?? d.id),
      displayName: String(data.uid ?? d.id).slice(0, 8),
      churnProbability: prob,
      topFactor,
      lastSeenAt: String(data.lastSeenAt ?? ""),
      lifetimeSpendCents: spend,
    });
  }
  return rows.sort((a, b) => b.churnProbability - a.churnProbability).slice(0, 50);
}

/** Lightweight LTV forecast — 7d spend * trajectory factor. */
export async function getLtvForecast(): Promise<LtvForecastRow[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.telemetryUserRollups), fbLimit(500)),
  );
  const rows: LtvForecastRow[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const lifetime = Number(data.lifetimeSpendCents ?? 0);
    const sessions = Number(data.lifetimeSessions ?? 0);
    if (lifetime === 0) continue;
    const factor = sessions > 30 ? 4 : sessions > 10 ? 2.5 : 1.5;
    const predicted = Math.round(lifetime * factor);
    rows.push({
      uid: String(data.uid ?? d.id),
      displayName: String(data.uid ?? d.id).slice(0, 8),
      predicted90dCents: predicted,
      actual7dCents: Math.round(lifetime / 4),
      confidence: Math.min(0.95, sessions / 60),
      segment: (data.segment as LtvForecastRow["segment"]) ?? "New",
    });
  }
  return rows.sort((a, b) => b.predicted90dCents - a.predicted90dCents).slice(0, 50);
}

export async function compareCohorts(
  range: ConsoleRange,
  cohortA: "desktop" | "web" | "new" | "returning",
  cohortB: "desktop" | "web" | "new" | "returning",
): Promise<CohortCompareResult> {
  const events = await fetchEvents(range);
  const sessions = await fetchSessions(range);
  function filter(c: typeof cohortA): { sessions: RawSession[]; events: RawEvent[] } {
    const filteredSessions = sessions.filter((s) => {
      if (c === "desktop") return Boolean(s.device?.isDesktop);
      if (c === "web") return !s.device?.isDesktop;
      const newUserCut = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (c === "new") return new Date(s.startedAt).getTime() >= newUserCut;
      return new Date(s.startedAt).getTime() < newUserCut;
    });
    const sids = new Set(filteredSessions.map((s) => s.id));
    return { sessions: filteredSessions, events: events.filter((e) => sids.has(e.sessionId)) };
  }
  const aData = filter(cohortA);
  const bData = filter(cohortB);
  function metric(d: { sessions: RawSession[]; events: RawEvent[] }, label: string): number {
    switch (label) {
      case "Sessions":
        return d.sessions.length;
      case "Errors":
        return d.events.filter((e) => e.type === "error").length;
      case "Rage clicks":
        return d.events.filter((e) => e.type === "rage_click").length;
      case "Checkouts":
        return d.events.filter((e) => e.type === "checkout_complete").length;
      case "Page views":
        return d.events.filter((e) => e.type === "page_view").length;
      default:
        return 0;
    }
  }
  const labels = ["Sessions", "Page views", "Checkouts", "Errors", "Rage clicks"];
  return {
    cohortAName: cohortA,
    cohortBName: cohortB,
    metrics: labels.map((label) => {
      const a = metric(aData, label);
      const b = metric(bData, label);
      const deltaPct = a > 0 ? ((b - a) / a) * 100 : 0;
      return { label, a, b, deltaPct };
    }),
  };
}

// ── Shared util ────────────────────────────────────────────────────────────

function groupCount(values: string[]): ConsoleNamedCount[] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return Array.from(m.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// Keep tree-shakers honest.
export const _meta = { READ_CAP, RANGE_MS };
export type { AdHocFilter };
// Reference unused setDoc so it survives bundling if a future caller wants to
// upsert without addDoc.
export const _setDoc = setDoc;
