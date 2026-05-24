// Additional aggregations for the new Console tabs (Money, Quality, Live
// Ops) plus anomaly detection that the headline tabs surface as badges.

import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  setDoc,
  where,
  serverTimestamp,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";
import type {
  ConsoleAnnotation,
  ConsoleAnomaly,
  ConsoleErrorIssue,
  ConsoleInsight,
  ConsoleLiveSnapshot,
  ConsoleMoneyKpis,
  ConsoleNamedCount,
  ConsoleQualityReport,
  ConsoleRange,
  ConsoleSavedView,
  ConsoleTimePoint,
  ErrorIssueStatus,
} from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const READ_CAP = 5000;

const RANGE_MS: Record<ConsoleRange, number> = {
  "24h": DAY_MS,
  "7d": 7 * DAY_MS,
  "30d": 30 * DAY_MS,
  "90d": 90 * DAY_MS,
};

function startIso(range: ConsoleRange): string {
  return new Date(Date.now() - RANGE_MS[range]).toISOString();
}

function bucketMs(range: ConsoleRange): number {
  if (range === "24h") return 60 * 60 * 1000;
  return DAY_MS;
}

function emptyBuckets(range: ConsoleRange): ConsoleTimePoint[] {
  const bucket = bucketMs(range);
  const span = RANGE_MS[range];
  const buckets = Math.ceil(span / bucket);
  const points: ConsoleTimePoint[] = [];
  const start = Math.floor((Date.now() - span) / bucket) * bucket;
  for (let i = 0; i < buckets; i++) {
    points.push({ bucket: new Date(start + i * bucket).toISOString(), value: 0 });
  }
  return points;
}

function tallyIntoBuckets(range: ConsoleRange, items: { ts: string }[]): ConsoleTimePoint[] {
  const points = emptyBuckets(range);
  const bucket = bucketMs(range);
  const byKey = new Map(points.map((p) => [p.bucket, p]));
  for (const item of items) {
    const t = new Date(item.ts).getTime();
    if (!Number.isFinite(t)) continue;
    const k = new Date(Math.floor(t / bucket) * bucket).toISOString();
    const p = byKey.get(k);
    if (p) p.value += 1;
  }
  return points;
}

// ── Money tab ──────────────────────────────────────────────────────────────

export async function getMoneyKpis(range: ConsoleRange): Promise<ConsoleMoneyKpis> {
  const db = getDb();
  const sinceIso = startIso(range);
  const [ordersSnap, billingSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, COLLECTIONS.orders),
        orderBy("placedAt", "desc"),
        fbLimit(READ_CAP),
      ),
    ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
    getDocs(query(collection(db, COLLECTIONS.userBilling), fbLimit(READ_CAP))).catch(
      () => ({ docs: [] as { data: () => Record<string, unknown> }[] }),
    ),
  ]);

  const orders = ordersSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const billing = billingSnap.docs.map((d) => d.data() as Record<string, unknown>);

  const inRange = orders.filter(
    (o) => o.placedAt && new Date(String(o.placedAt)).getTime() >= new Date(sinceIso).getTime(),
  );
  const revenueCentsInRange = inRange.reduce((s, o) => s + Number(o.totalCents ?? 0), 0);
  const refundedInRange = inRange.filter((o) => o.refunded === true).length;
  const refundRatePct = inRange.length === 0 ? 0 : Math.round((refundedInRange / inRange.length) * 100);

  const payingUsers = new Set(orders.map((o) => String(o.userId ?? ""))).size;
  const newPayingInRange = new Set(
    inRange.map((o) => String(o.userId ?? "")),
  ).size;

  const subscribers = billing.filter((b) => {
    const sub = b.subscription as Record<string, unknown> | undefined;
    return sub && sub.tier && sub.tier !== "free";
  });
  const subscriberCount = subscribers.length;
  // Assume $9.99 / mo Plus tier as default — placeholder until we read the
  // real per-tier price from dw_config.
  const monthlyTierCents: Record<string, number> = { plus: 999, ultimate: 1999 };
  const mrrCents = subscribers.reduce((sum, b) => {
    const tier = String((b.subscription as Record<string, unknown>).tier ?? "plus");
    return sum + (monthlyTierCents[tier] ?? 999);
  }, 0);
  const arrCents = mrrCents * 12;

  const arpuCents = payingUsers === 0 ? 0 : Math.round(revenueCentsInRange / Math.max(1, payingUsers));
  const arpdauCents = 0; // requires DAU intersection — placeholder
  const arppuCents = arpuCents;
  const ltvCents = arpuCents * 3;

  const trialConversionPct = subscriberCount === 0 ? 0 : 100; // placeholder

  // Revenue series.
  const revenueSeries: ConsoleTimePoint[] = emptyBuckets(range);
  const bucket = bucketMs(range);
  const byKey = new Map(revenueSeries.map((p) => [p.bucket, p]));
  for (const o of inRange) {
    if (!o.placedAt) continue;
    const t = new Date(String(o.placedAt)).getTime();
    const k = new Date(Math.floor(t / bucket) * bucket).toISOString();
    const p = byKey.get(k);
    if (p) p.value += Number(o.totalCents ?? 0);
  }

  // Waterfall (placeholder — new / expansion / reactivation / churn would
  // need a proper subscription state machine).
  const revenueWaterfall = revenueSeries.map((p) => ({
    bucket: p.bucket,
    new: p.value,
    expansion: 0,
    reactivation: 0,
    churn: 0,
  }));

  const revenueByRegion: ConsoleNamedCount[] = (() => {
    const m = new Map<string, number>();
    for (const o of inRange) {
      const k = String(o.country ?? "Unknown");
      m.set(k, (m.get(k) ?? 0) + Number(o.totalCents ?? 0));
    }
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  })();

  const revenueByCurrency: ConsoleNamedCount[] = (() => {
    const m = new Map<string, number>();
    for (const o of inRange) {
      const k = String(o.currency ?? "USD");
      m.set(k, (m.get(k) ?? 0) + Number(o.totalCents ?? 0));
    }
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const promoIds = new Set<string>();
  for (const o of inRange) {
    const promoId = (o.metadata as Record<string, unknown> | undefined)?.promoId as string | undefined;
    if (promoId) promoIds.add(promoId);
  }
  const topPromos: ConsoleMoneyKpis["topPromos"] = [];

  const priceBandRevenue: ConsoleNamedCount[] = (() => {
    const bands = new Map<string, number>();
    for (const o of inRange) {
      const cents = Number(o.totalCents ?? 0);
      const band = cents === 0 ? "Free" : cents < 1_000 * 100 ? "< $10" : cents < 3_000 * 100 ? "$10–30" : cents < 6_000 * 100 ? "$30–60" : "$60+";
      bands.set(band, (bands.get(band) ?? 0) + cents);
    }
    return [...bands.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  })();

  return {
    mrrCents,
    arrCents,
    arpuCents,
    arpdauCents,
    arppuCents,
    ltvCents,
    refundRatePct,
    payingUsers,
    newPayingInRange,
    trialConversionPct,
    revenueSeries,
    revenueWaterfall,
    revenueByRegion,
    revenueByCurrency,
    topPromos,
    priceBandRevenue,
  };
}

// ── Quality tab ────────────────────────────────────────────────────────────

export async function getQualityReport(range: ConsoleRange): Promise<ConsoleQualityReport> {
  const db = getDb();
  const sinceIso = startIso(range);
  const [eventsSnap, errorsSnap, perfSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, COLLECTIONS.telemetryEvents),
        where("ts", ">=", sinceIso),
        orderBy("ts", "desc"),
        fbLimit(READ_CAP),
      ),
    ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
    getDocs(
      query(
        collection(db, COLLECTIONS.telemetryErrors),
        where("ts", ">=", sinceIso),
        orderBy("ts", "desc"),
        fbLimit(READ_CAP),
      ),
    ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
    getDocs(
      query(
        collection(db, COLLECTIONS.telemetryPerf),
        where("ts", ">=", sinceIso),
        orderBy("ts", "desc"),
        fbLimit(READ_CAP),
      ),
    ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
  ]);
  const events = eventsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const errors = errorsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const perf = perfSnap.docs.map((d) => d.data() as Record<string, unknown>);

  const rageByRoute = new Map<string, number>();
  const deadByRoute = new Map<string, number>();
  const errByRoute = new Map<string, number>();
  for (const e of events) {
    const route = String(e.route ?? "");
    if (e.type === "rage_click") rageByRoute.set(route, (rageByRoute.get(route) ?? 0) + 1);
    if (e.type === "dead_click") deadByRoute.set(route, (deadByRoute.get(route) ?? 0) + 1);
  }
  for (const e of errors) {
    const route = String(e.route ?? "");
    errByRoute.set(route, (errByRoute.get(route) ?? 0) + 1);
  }
  const routes = new Set([...rageByRoute.keys(), ...deadByRoute.keys(), ...errByRoute.keys()]);
  const frustrationByRoute = [...routes]
    .map((route) => {
      const rageClicks = rageByRoute.get(route) ?? 0;
      const deadClicks = deadByRoute.get(route) ?? 0;
      const errs = errByRoute.get(route) ?? 0;
      const score = rageClicks * 3 + deadClicks + errs * 2;
      return { route, rageClicks, deadClicks, errors: errs, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  // Top issues — pick the worst route and the loudest error cluster.
  const errorClusters = new Map<string, number>();
  for (const e of errors) {
    const fp = String(e.stack ?? "").split("\n")[0]?.trim() || String(e.message ?? "");
    errorClusters.set(fp, (errorClusters.get(fp) ?? 0) + 1);
  }
  const topErrors = [...errorClusters.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const topIssues: ConsoleQualityReport["topIssues"] = [];
  for (const r of frustrationByRoute.slice(0, 5)) {
    topIssues.push({
      id: `friction-${r.route}`,
      kind: "friction",
      title: `Friction on ${r.route}`,
      details: `${r.rageClicks} rage clicks, ${r.deadClicks} dead clicks, ${r.errors} errors`,
      impact: Math.min(100, r.score),
      affectedSessions: r.score,
      affectedUsers: r.score,
      suggestedFix:
        r.rageClicks > 0
          ? "Investigate the most-clicked element — likely broken or unresponsive."
          : "Add visible affordances on clickable elements.",
      href: r.route,
    });
  }
  for (const [fp, count] of topErrors) {
    topIssues.push({
      id: `error-${fp.slice(0, 40)}`,
      kind: "error",
      title: fp.slice(0, 80),
      details: `${count} occurrences`,
      impact: Math.min(100, count),
      affectedSessions: count,
      affectedUsers: count,
      suggestedFix: "Symbolicate the stack and add a regression test for the throwing call site.",
    });
  }

  // API perf correlations.
  const apiByEndpoint = new Map<string, { times: number[]; errors: number }>();
  for (const p of perf.filter((x) => x.name === "api")) {
    const endpoint = String((p.meta as Record<string, unknown> | undefined)?.endpoint ?? "unknown");
    const cur = apiByEndpoint.get(endpoint) ?? { times: [], errors: 0 };
    cur.times.push(Number(p.ms ?? 0));
    apiByEndpoint.set(endpoint, cur);
  }
  for (const e of errors) {
    const endpoint = String((e.context as Record<string, unknown> | undefined)?.endpoint ?? "");
    if (apiByEndpoint.has(endpoint)) apiByEndpoint.get(endpoint)!.errors += 1;
  }
  const apiErrorCorrelations = [...apiByEndpoint.entries()]
    .filter(([, v]) => v.errors > 0)
    .map(([endpoint, v]) => {
      const sorted = v.times.sort((x, y) => x - y);
      const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
      return { endpoint, ms: Math.round(p95), errors: v.errors };
    })
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 10);

  // Browser × OS error rate.
  const errBucket = new Map<string, { errors: number; sessions: number }>();
  for (const e of errors) {
    const device = (e.device as Record<string, unknown> | undefined) ?? {};
    const browser = parseBrowser(String(device.userAgent ?? ""));
    const key = `${browser}__${String(device.os ?? "web")}`;
    const cur = errBucket.get(key) ?? { errors: 0, sessions: 0 };
    cur.errors += 1;
    errBucket.set(key, cur);
  }
  // Sessions count — approximate with unique session ids.
  const sessionSeenByBucket = new Map<string, Set<string>>();
  for (const e of errors) {
    const device = (e.device as Record<string, unknown> | undefined) ?? {};
    const browser = parseBrowser(String(device.userAgent ?? ""));
    const key = `${browser}__${String(device.os ?? "web")}`;
    const set = sessionSeenByBucket.get(key) ?? new Set<string>();
    set.add(String(e.sessionId ?? ""));
    sessionSeenByBucket.set(key, set);
  }
  for (const [key, set] of sessionSeenByBucket) {
    const cur = errBucket.get(key);
    if (cur) cur.sessions = set.size;
  }
  const browserOsErrorRate = [...errBucket.entries()]
    .map(([key, v]) => {
      const [browser, os] = key.split("__");
      return {
        browser,
        os,
        sessions: v.sessions,
        ratePer1k: v.sessions === 0 ? 0 : Math.round((v.errors / v.sessions) * 1000),
      };
    })
    .sort((a, b) => b.ratePer1k - a.ratePer1k)
    .slice(0, 10);

  return {
    topIssues,
    frustrationByRoute,
    browserOsErrorRate,
    apiErrorCorrelations,
  };
}

function parseBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Tauri/.test(ua)) return "Tauri";
  return "Other";
}

// ── Live Ops tab ───────────────────────────────────────────────────────────

export async function getLiveSnapshot(): Promise<ConsoleLiveSnapshot> {
  const db = getDb();
  const since5m = new Date(Date.now() - 5 * 60_000).toISOString();
  const [sessionsSnap, errorsSnap, downloadsCount, voiceCount] = await Promise.all([
    getDocs(
      query(
        collection(db, COLLECTIONS.telemetrySessions),
        where("startedAt", ">=", since5m),
        orderBy("startedAt", "desc"),
        fbLimit(100),
      ),
    ).catch(() => ({ docs: [] as { data: () => Record<string, unknown>; id: string }[] })),
    getDocs(
      query(
        collection(db, COLLECTIONS.telemetryErrors),
        orderBy("ts", "desc"),
        fbLimit(50),
      ),
    ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
    getCountFromServer(collection(db, "dw_downloads")).then((r) => r.data().count).catch(() => 0),
    getCountFromServer(collection(db, COLLECTIONS.voiceSessions)).then((r) => r.data().count).catch(() => 0),
  ]);

  const sessions = sessionsSnap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: String(data.id ?? d.id),
      uid: (data.uid as string | null) ?? null,
      startedAt: String(data.startedAt ?? ""),
      lastRoute: String(data.lastRoute ?? ""),
      device: {
        os: ((data.device as Record<string, unknown>)?.os as "windows" | "mac" | "linux" | "web") ?? "web",
        isDesktop: Boolean((data.device as Record<string, unknown>)?.isDesktop),
      },
    };
  });

  const routeCounts = new Map<string, number>();
  for (const s of sessions) {
    if (!s.lastRoute) continue;
    routeCounts.set(s.lastRoute, (routeCounts.get(s.lastRoute) ?? 0) + 1);
  }
  const topActiveRoutes = [...routeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const recentErrors = errorsSnap.docs.map((d) => d.data() as unknown as ConsoleLiveSnapshot["recentErrors"][number]);

  return {
    liveSessions: sessions,
    topActiveRoutes,
    activeDownloads: downloadsCount as number,
    activeVoiceChannels: voiceCount as number,
    recentErrors,
    cloudFunctionMetrics: [],
  };
}

// ── Anomaly + compare-to-previous ──────────────────────────────────────────

interface CompareSummary {
  current: number;
  previous: number;
  deltaPct: number;
}

async function countEventsBetween(start: number, end: number): Promise<number> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.telemetryEvents),
    where("ts", ">=", new Date(start).toISOString()),
    where("ts", "<", new Date(end).toISOString()),
    fbLimit(READ_CAP),
  );
  const snap = await getDocs(q).catch(() => null);
  return snap?.size ?? 0;
}

async function countCollectionFiltered(
  name: string,
  field: string,
  start: number,
  end: number,
): Promise<number> {
  const db = getDb();
  const q = query(
    collection(db, name),
    where(field, ">=", new Date(start).toISOString()),
    where(field, "<", new Date(end).toISOString()),
    fbLimit(READ_CAP),
  );
  const snap = await getDocs(q).catch(() => null);
  return snap?.size ?? 0;
}

export async function compareRange(range: ConsoleRange): Promise<{
  events: CompareSummary;
  errors: CompareSummary;
  sessions: CompareSummary;
}> {
  const now = Date.now();
  const span = RANGE_MS[range];
  const [eventsNow, eventsPrev, errorsNow, errorsPrev, sessionsNow, sessionsPrev] = await Promise.all([
    countEventsBetween(now - span, now),
    countEventsBetween(now - 2 * span, now - span),
    countCollectionFiltered(COLLECTIONS.telemetryErrors, "ts", now - span, now),
    countCollectionFiltered(COLLECTIONS.telemetryErrors, "ts", now - 2 * span, now - span),
    countCollectionFiltered(COLLECTIONS.telemetrySessions, "startedAt", now - span, now),
    countCollectionFiltered(COLLECTIONS.telemetrySessions, "startedAt", now - 2 * span, now - span),
  ]);
  const pct = (cur: number, prev: number) =>
    prev === 0 ? (cur === 0 ? 0 : 100) : Math.round(((cur - prev) / prev) * 100);
  return {
    events: { current: eventsNow, previous: eventsPrev, deltaPct: pct(eventsNow, eventsPrev) },
    errors: { current: errorsNow, previous: errorsPrev, deltaPct: pct(errorsNow, errorsPrev) },
    sessions: { current: sessionsNow, previous: sessionsPrev, deltaPct: pct(sessionsNow, sessionsPrev) },
  };
}

export function summaryToAnomaly(
  metric: string,
  worseDirection: "up" | "down",
  summary: CompareSummary,
): ConsoleAnomaly {
  const abs = Math.abs(summary.deltaPct);
  const isWorse =
    (worseDirection === "up" && summary.deltaPct > 0) ||
    (worseDirection === "down" && summary.deltaPct < 0);
  const severity: ConsoleAnomaly["severity"] = !isWorse
    ? "info"
    : abs > 50
      ? "critical"
      : abs > 20
        ? "warn"
        : "info";
  const direction = summary.deltaPct >= 0 ? "+" : "";
  const message = `${metric}: ${summary.current.toLocaleString()} (${direction}${summary.deltaPct}% vs previous)`;
  return {
    metric,
    current: summary.current,
    previous: summary.previous,
    deltaPct: summary.deltaPct,
    worseDirection,
    severity,
    message,
  };
}

// ── Annotations CRUD ───────────────────────────────────────────────────────

export async function listAnnotations(): Promise<ConsoleAnnotation[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.consoleAnnotations), orderBy("at", "desc"), fbLimit(200)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ConsoleAnnotation, "id">) }));
}

export async function createAnnotation(
  input: Omit<ConsoleAnnotation, "id" | "createdAt" | "authorUid">,
): Promise<void> {
  const auth = useAuthStore.getState();
  if (auth.authState.type !== "Authenticated") return;
  const uid = auth.authState.user.uid;
  const id = "ann_" + Math.random().toString(36).slice(2, 10);
  const db = getDb();
  await setDoc(doc(db, COLLECTIONS.consoleAnnotations, id), {
    id,
    ...input,
    authorUid: uid,
    authorName: auth.profile?.displayName ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteAnnotation(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.consoleAnnotations, id));
}

// ── Error issue status ─────────────────────────────────────────────────────

export async function getErrorIssue(fingerprint: string): Promise<ConsoleErrorIssue | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.consoleErrorIssues, fingerprint));
  return snap.exists() ? (snap.data() as ConsoleErrorIssue) : null;
}

export async function setErrorIssueStatus(
  fingerprint: string,
  status: ErrorIssueStatus,
  note?: string,
): Promise<void> {
  const db = getDb();
  const auth = useAuthStore.getState();
  const existing = await getErrorIssue(fingerprint);
  const now = new Date().toISOString();
  await setDoc(doc(db, COLLECTIONS.consoleErrorIssues, fingerprint), {
    fingerprint,
    status,
    assigneeUid: auth.authState.type === "Authenticated" ? auth.authState.user.uid : undefined,
    assigneeName: auth.profile?.displayName,
    note,
    firstSeen: existing?.firstSeen ?? now,
    lastSeen: now,
    updatedAt: now,
  });
}

// ── Saved views ────────────────────────────────────────────────────────────

export async function listSavedViews(): Promise<ConsoleSavedView[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.consoleSavedViews),
      orderBy("createdAt", "desc"),
      fbLimit(100),
    ),
  );
  return snap.docs.map((d) => d.data() as ConsoleSavedView);
}

export async function createSavedView(name: string, queryString: string): Promise<void> {
  const auth = useAuthStore.getState();
  if (auth.authState.type !== "Authenticated") return;
  const uid = auth.authState.user.uid;
  const id = "view_" + Math.random().toString(36).slice(2, 10);
  const db = getDb();
  await setDoc(doc(db, COLLECTIONS.consoleSavedViews, id), {
    id,
    ownerUid: uid,
    name,
    query: queryString,
    createdAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  });
}

export async function deleteSavedView(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.consoleSavedViews, id));
}

// ── Insights feed ──────────────────────────────────────────────────────────

export function subscribeInsights(cb: (rows: ConsoleInsight[]) => void): () => void {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.consoleInsights),
    orderBy("ts", "desc"),
    fbLimit(50),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as ConsoleInsight));
  });
}

export async function regenerateInsights(range: ConsoleRange): Promise<void> {
  // Walk a few cheap aggregations and emit Insight docs.
  const compare = await compareRange(range);
  const out: ConsoleInsight[] = [];
  if (Math.abs(compare.events.deltaPct) > 20) {
    out.push({
      id: `events-delta-${Date.now()}`,
      kind: compare.events.deltaPct > 0 ? "celebration" : "regression",
      text: `Total events ${compare.events.deltaPct > 0 ? "rose" : "dropped"} ${Math.abs(compare.events.deltaPct)}% vs previous ${range}.`,
      ts: new Date().toISOString(),
    });
  }
  if (compare.errors.deltaPct > 50) {
    out.push({
      id: `errors-spike-${Date.now()}`,
      kind: "regression",
      text: `Errors spiked ${compare.errors.deltaPct}% — inspect Errors tab.`,
      href: "/console?tab=errors",
      ts: new Date().toISOString(),
    });
  }
  const db = getDb();
  for (const insight of out) {
    await setDoc(doc(db, COLLECTIONS.consoleInsights, insight.id), insight);
  }
}

// Tally and bucket helpers are also re-exported so the tabs can reuse them.
export { tallyIntoBuckets };
