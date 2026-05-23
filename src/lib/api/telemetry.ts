// Read-side aggregations for the admin Console. v1 reads raw docs from the
// dw_telemetry_* collections (cap 5000/range) and folds them client-side.
// Larger windows can be moved to a Cloud Function rollup later — out of
// scope for now.

import {
  collection,
  getCountFromServer,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import type {
  ConsoleActiveSession,
  ConsoleDeviceBreakdown,
  ConsoleErrorFeed,
  ConsoleFeatureUsage,
  ConsoleMultiSeriesPoint,
  ConsoleNamedCount,
  ConsoleOverviewSummary,
  ConsolePerformanceBreakdown,
  ConsolePublisherKpis,
  ConsoleRange,
  ConsoleStudioKpis,
  ConsoleTimePoint,
  ConsoleUserKpis,
  TelemetryError,
} from "@/lib/types";

// ── Range helpers ───────────────────────────────────────────────────────────

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
  if (range === "24h") return 60 * 60 * 1000; // 1h
  return 24 * 60 * 60 * 1000; // 1d
}

function bucketKey(ts: number, bucket: number): string {
  return new Date(Math.floor(ts / bucket) * bucket).toISOString();
}

function emptyBuckets(range: ConsoleRange): ConsoleTimePoint[] {
  const bucket = bucketMs(range);
  const span = RANGE_MS[range];
  const buckets = Math.ceil(span / bucket);
  const points: ConsoleTimePoint[] = [];
  const start = Math.floor((Date.now() - span) / bucket) * bucket;
  for (let i = 0; i < buckets; i++) {
    points.push({
      bucket: new Date(start + i * bucket).toISOString(),
      value: 0,
    });
  }
  return points;
}

function tallyIntoBuckets(
  range: ConsoleRange,
  items: { ts: string }[],
): ConsoleTimePoint[] {
  const points = emptyBuckets(range);
  const bucket = bucketMs(range);
  const byKey = new Map(points.map((p) => [p.bucket, p]));
  for (const item of items) {
    const t = new Date(item.ts).getTime();
    if (!Number.isFinite(t)) continue;
    const key = bucketKey(t, bucket);
    const point = byKey.get(key);
    if (point) point.value += 1;
  }
  return points;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[i];
}

// ── Raw fetchers ────────────────────────────────────────────────────────────

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
  device?: {
    os?: string;
    isDesktop?: boolean;
    cpuCores?: number;
    deviceMemoryGb?: number;
    screenW?: number;
    screenH?: number;
    userAgent?: string;
    cpuModel?: string;
    gpu?: string;
  };
}

interface RawError extends TelemetryError {}

async function fetchEvents(range: ConsoleRange): Promise<RawEvent[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.telemetryEvents),
    where("ts", ">=", startIso(range)),
    orderBy("ts", "desc"),
    fbLimit(READ_CAP),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeRawEvent(d));
}

function normalizeRawEvent(d: QueryDocumentSnapshot): RawEvent {
  const data = d.data();
  return {
    id: String(data.id ?? d.id),
    ts: String(data.ts ?? ""),
    uid: (data.uid as string | null) ?? null,
    sessionId: String(data.sessionId ?? ""),
    route: String(data.route ?? ""),
    type: String(data.type ?? "unknown"),
    payload: (data.payload as Record<string, unknown> | undefined) ?? undefined,
  };
}

async function fetchPerf(range: ConsoleRange): Promise<RawPerf[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.telemetryPerf),
    where("ts", ">=", startIso(range)),
    orderBy("ts", "desc"),
    fbLimit(READ_CAP),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: String(data.id ?? d.id),
      ts: String(data.ts ?? ""),
      uid: (data.uid as string | null) ?? null,
      sessionId: String(data.sessionId ?? ""),
      route: String(data.route ?? ""),
      name: String(data.name ?? "unknown"),
      ms: Number(data.ms ?? 0),
      meta:
        (data.meta as Record<string, unknown> | undefined) ?? undefined,
    } satisfies RawPerf;
  });
}

async function fetchSessions(range: ConsoleRange): Promise<RawSession[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.telemetrySessions),
    where("startedAt", ">=", startIso(range)),
    orderBy("startedAt", "desc"),
    fbLimit(READ_CAP),
  );
  const snap = await getDocs(q);
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
      device: data.device ?? undefined,
    } satisfies RawSession;
  });
}

async function fetchErrors(range: ConsoleRange): Promise<RawError[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.telemetryErrors),
    where("ts", ">=", startIso(range)),
    orderBy("ts", "desc"),
    fbLimit(READ_CAP),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: String(data.id ?? d.id),
      sessionId: String(data.sessionId ?? ""),
      uid: (data.uid as string | null) ?? null,
      ts: String(data.ts ?? ""),
      message: String(data.message ?? "Unknown"),
      stack: typeof data.stack === "string" ? data.stack : undefined,
      source: (data.source as RawError["source"]) ?? "manual",
      route: String(data.route ?? ""),
      device:
        (data.device as RawError["device"]) ?? {
          os: "web",
          isDesktop: false,
          userAgent: "",
        },
      context:
        (data.context as Record<string, unknown> | undefined) ?? undefined,
    } satisfies RawError;
  });
}

// ── Aggregations ────────────────────────────────────────────────────────────

export async function getOverviewSummary(
  range: ConsoleRange,
): Promise<ConsoleOverviewSummary> {
  const [events, sessions, errors, perf] = await Promise.all([
    fetchEvents(range),
    fetchSessions(range),
    fetchErrors(range),
    fetchPerf(range),
  ]);

  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const uniq = (since: number) => {
    const s = new Set<string>();
    for (const e of events) {
      const t = new Date(e.ts).getTime();
      if (t >= since && e.uid) s.add(e.uid);
    }
    return s.size;
  };
  const dau = uniq(now - dayMs);
  const wau = uniq(now - 7 * dayMs);
  const mau = uniq(now - 30 * dayMs);

  const lcpMs = perf.filter((p) => p.name === "lcp").map((p) => p.ms).sort((a, b) => a - b);
  const p95Lcp = quantile(lcpMs, 0.95);

  const routeCounts = new Map<string, number>();
  const fiveMinAgo = now - 5 * 60 * 1000;
  for (const e of events) {
    if (new Date(e.ts).getTime() < fiveMinAgo) continue;
    if (e.type !== "page_view") continue;
    routeCounts.set(e.route, (routeCounts.get(e.route) ?? 0) + 1);
  }
  const topRoutesNow: ConsoleNamedCount[] = [...routeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    dau,
    wau,
    mau,
    sessionsInRange: sessions.length,
    eventsInRange: events.length,
    errorsInRange: errors.length,
    p95LcpMs: Math.round(p95Lcp),
    eventsSeries: tallyIntoBuckets(range, events),
    activeSessionsSeries: tallyIntoBuckets(
      range,
      sessions.map((s) => ({ ts: s.startedAt })),
    ),
    topRoutesNow,
  };
}

export async function getUserKpis(range: ConsoleRange): Promise<ConsoleUserKpis> {
  const [events, sessions, totalUsersCount] = await Promise.all([
    fetchEvents(range),
    fetchSessions(range),
    countCollection(COLLECTIONS.users),
  ]);

  const sevenAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thirtyAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const fourteenAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  const sessionsByUid = new Map<string, RawSession[]>();
  for (const s of sessions) {
    if (!s.uid) continue;
    const list = sessionsByUid.get(s.uid) ?? [];
    list.push(s);
    sessionsByUid.set(s.uid, list);
  }

  // Signups: first-ever session for a uid that falls within window. A real
  // signup field would be ideal, but session-first is a good proxy.
  const firstSeen = new Map<string, number>();
  for (const s of sessions) {
    if (!s.uid) continue;
    const t = new Date(s.startedAt).getTime();
    const prev = firstSeen.get(s.uid);
    if (!prev || t < prev) firstSeen.set(s.uid, t);
  }
  const newUsersInRange = [...firstSeen.values()].filter(
    (t) => t >= Date.now() - RANGE_MS[range],
  ).length;
  const returningUsersInRange = sessionsByUid.size - newUsersInRange;

  // Retention: of users whose first-seen was 7+ days ago, how many returned
  // in the last 7 days?
  const cohort7 = [...firstSeen.entries()].filter(([, t]) => t < sevenAgo);
  const cohort30 = [...firstSeen.entries()].filter(([, t]) => t < thirtyAgo);
  const ret7 =
    cohort7.length === 0
      ? 0
      : cohort7.filter(([uid]) =>
          sessionsByUid
            .get(uid)
            ?.some((s) => new Date(s.startedAt).getTime() >= sevenAgo),
        ).length / cohort7.length;
  const ret30 =
    cohort30.length === 0
      ? 0
      : cohort30.filter(([uid]) =>
          sessionsByUid
            .get(uid)
            ?.some((s) => new Date(s.startedAt).getTime() >= thirtyAgo),
        ).length / cohort30.length;

  const churnRiskCount = [...sessionsByUid.entries()].filter(([, ss]) => {
    const last = Math.max(...ss.map((s) => new Date(s.startedAt).getTime()));
    return last < fourteenAgo;
  }).length;

  // DAU series — distinct uids per day within range.
  const bucket = bucketMs(range);
  const buckets = emptyBuckets(range);
  const byBucket = new Map<string, Set<string>>();
  for (const e of events) {
    if (!e.uid) continue;
    const t = new Date(e.ts).getTime();
    if (!Number.isFinite(t)) continue;
    const k = bucketKey(t, bucket);
    let set = byBucket.get(k);
    if (!set) {
      set = new Set();
      byBucket.set(k, set);
    }
    set.add(e.uid);
  }
  const dauSeries: ConsoleTimePoint[] = buckets.map((b) => ({
    bucket: b.bucket,
    value: byBucket.get(b.bucket)?.size ?? 0,
  }));

  // Signups series — first-seen tally into buckets.
  const firstSeenItems = [...firstSeen.values()].map((t) => ({
    ts: new Date(t).toISOString(),
  }));
  const signupsSeries = tallyIntoBuckets(range, firstSeenItems);

  // Retention cohort (8 cohorts × 8 day-offsets) — toy version for v1.
  const retentionCohort: ConsoleMultiSeriesPoint[] = [];
  const cohortDays = 8;
  for (let i = 0; i < cohortDays; i++) {
    const cohortStart = Date.now() - (cohortDays - i) * 24 * 60 * 60 * 1000;
    const cohortEnd = cohortStart + 24 * 60 * 60 * 1000;
    const cohort = [...firstSeen.entries()]
      .filter(([, t]) => t >= cohortStart && t < cohortEnd)
      .map(([uid]) => uid);
    const row: ConsoleMultiSeriesPoint = {
      bucket: new Date(cohortStart).toISOString(),
    };
    for (let d = 0; d < cohortDays; d++) {
      const dayStart = cohortStart + d * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const active = cohort.filter((uid) =>
        sessionsByUid.get(uid)?.some((s) => {
          const t = new Date(s.startedAt).getTime();
          return t >= dayStart && t < dayEnd;
        }),
      ).length;
      row[`d${d}`] =
        cohort.length === 0 ? 0 : Math.round((active / cohort.length) * 100);
    }
    retentionCohort.push(row);
  }

  // Activity heatmap (dow × hour).
  const heatBuckets = new Map<string, number>();
  for (const e of events) {
    const d = new Date(e.ts);
    const dow = d.getUTCDay();
    const hour = d.getUTCHours();
    const k = `${dow}-${hour}`;
    heatBuckets.set(k, (heatBuckets.get(k) ?? 0) + 1);
  }
  const activityHeatmap = [];
  for (let dow = 0; dow < 7; dow++) {
    for (let hour = 0; hour < 24; hour++) {
      activityHeatmap.push({
        dow,
        hour,
        count: heatBuckets.get(`${dow}-${hour}`) ?? 0,
      });
    }
  }

  // Top active users — count events per uid.
  const eventCounts = new Map<string, number>();
  const sessionCounts = new Map<string, number>();
  const lastSeenMap = new Map<string, number>();
  for (const e of events) {
    if (!e.uid) continue;
    eventCounts.set(e.uid, (eventCounts.get(e.uid) ?? 0) + 1);
    const t = new Date(e.ts).getTime();
    const prev = lastSeenMap.get(e.uid) ?? 0;
    if (t > prev) lastSeenMap.set(e.uid, t);
  }
  for (const s of sessions) {
    if (!s.uid) continue;
    sessionCounts.set(s.uid, (sessionCounts.get(s.uid) ?? 0) + 1);
  }
  const topActiveUsers = [...eventCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([uid, ev]) => ({
      uid,
      displayName: uid.slice(0, 6) + "…",
      sessions: sessionCounts.get(uid) ?? 0,
      events: ev,
      lastSeen: new Date(lastSeenMap.get(uid) ?? 0).toISOString(),
    }));

  // Churn watch list — last-seen older than 14 days.
  const churnWatchList = [...lastSeenMap.entries()]
    .filter(([, t]) => t < fourteenAgo)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 20)
    .map(([uid, t]) => ({
      uid,
      displayName: uid.slice(0, 6) + "…",
      lastSeen: new Date(t).toISOString(),
      daysInactive: Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000)),
    }));

  // Signup → first session → first purchase funnel (event-based).
  const signupSet = new Set(firstSeen.keys());
  const firstSessionSet = new Set(sessionsByUid.keys());
  const purchaseSet = new Set(
    events.filter((e) => e.type === "checkout_complete" && e.uid).map((e) => e.uid!),
  );
  const stage1 = signupSet.size;
  const stage2 = [...signupSet].filter((u) => firstSessionSet.has(u)).length;
  const stage3 = [...signupSet].filter((u) => purchaseSet.has(u)).length;
  const signupToFirstPurchaseFunnel = [
    {
      stage: "Signed up",
      count: stage1,
      pct: 100,
    },
    {
      stage: "First session",
      count: stage2,
      pct: stage1 === 0 ? 0 : Math.round((stage2 / stage1) * 100),
    },
    {
      stage: "First purchase",
      count: stage3,
      pct: stage1 === 0 ? 0 : Math.round((stage3 / stage1) * 100),
    },
  ];

  return {
    totalUsers: totalUsersCount,
    newUsersInRange,
    returningUsersInRange,
    retention7Pct: Math.round(ret7 * 100),
    retention30Pct: Math.round(ret30 * 100),
    churnRiskCount,
    signupsSeries,
    dauSeries,
    retentionCohort,
    activityHeatmap,
    topActiveUsers,
    churnWatchList,
    signupToFirstPurchaseFunnel,
  };
}

export async function getStudioKpis(
  range: ConsoleRange,
): Promise<ConsoleStudioKpis> {
  const db = getDb();
  const [
    totalStudiosCount,
    submissionsSnap,
    appsSnap,
    events,
  ] = await Promise.all([
    countCollection(COLLECTIONS.developers),
    getDocs(
      query(
        collection(db, COLLECTIONS.appSubmissions),
        orderBy("submittedAt", "desc"),
        fbLimit(READ_CAP),
      ),
    ),
    getDocs(
      query(collection(db, COLLECTIONS.apps), fbLimit(READ_CAP)),
    ),
    fetchEvents(range),
  ]);

  const rangeStart = Date.now() - RANGE_MS[range];

  const submissions = submissionsSnap.docs.map((d) => d.data() as {
    submittedAt?: string;
    status?: string;
    decidedAt?: string;
    appId?: string;
    submitterUserId?: string;
  });
  const apps = appsSnap.docs.map((d) => d.data() as {
    id?: string;
    stage?: string;
    gameTitle?: string;
    developerIds?: string[];
  });

  const appsInDraft = apps.filter((a) => a.stage === "draft").length;
  const appsSubmittedInRange = submissions.filter(
    (s) =>
      s.submittedAt &&
      new Date(s.submittedAt).getTime() >= rangeStart,
  ).length;
  const appsPublishedInRange = submissions.filter(
    (s) =>
      s.status === "approved" &&
      s.decidedAt &&
      new Date(s.decidedAt).getTime() >= rangeStart,
  ).length;

  // Time-to-publish: decidedAt - submittedAt for approved submissions in range.
  const ttpDays = submissions
    .filter(
      (s) =>
        s.status === "approved" &&
        s.submittedAt &&
        s.decidedAt &&
        new Date(s.decidedAt).getTime() >= rangeStart,
    )
    .map(
      (s) =>
        (new Date(s.decidedAt!).getTime() -
          new Date(s.submittedAt!).getTime()) /
        (24 * 60 * 60 * 1000),
    )
    .sort((a, b) => a - b);
  const medianTimeToPublishDays =
    ttpDays.length === 0
      ? null
      : Math.round(ttpDays[Math.floor(ttpDays.length / 2)] * 10) / 10;

  const submissionsSeries = tallyIntoBuckets(
    range,
    submissions
      .filter((s) => s.submittedAt)
      .map((s) => ({ ts: s.submittedAt! })),
  );
  const buildsEvents = events
    .filter((e) => e.type === "build_upload")
    .map((e) => ({ ts: e.ts }));
  const buildsSeries = tallyIntoBuckets(range, buildsEvents);

  const outcomeCounts = new Map<string, number>();
  for (const s of submissions) {
    if (!s.status) continue;
    outcomeCounts.set(s.status, (outcomeCounts.get(s.status) ?? 0) + 1);
  }
  const publishOutcomeBreakdown: ConsoleNamedCount[] = [
    ...outcomeCounts.entries(),
  ].map(([name, count]) => ({ name, count }));

  // Studios most active (by apps + builds + events).
  const studioStats = new Map<
    string,
    { name: string; apps: number; builds: number; events: number }
  >();
  for (const a of apps) {
    for (const devId of a.developerIds ?? []) {
      const cur = studioStats.get(devId) ?? {
        name: devId,
        apps: 0,
        builds: 0,
        events: 0,
      };
      cur.apps += 1;
      studioStats.set(devId, cur);
    }
  }
  for (const e of events) {
    if (e.type === "build_upload" || e.type === "studio_submit") {
      const studio = (e.payload?.studioId as string | undefined) ?? null;
      if (!studio) continue;
      const cur = studioStats.get(studio) ?? {
        name: studio,
        apps: 0,
        builds: 0,
        events: 0,
      };
      cur.builds += e.type === "build_upload" ? 1 : 0;
      cur.events += 1;
      studioStats.set(studio, cur);
    }
  }
  const topStudios = [...studioStats.entries()]
    .sort((a, b) => b[1].apps + b[1].builds - (a[1].apps + a[1].builds))
    .slice(0, 10)
    .map(([id, s]) => ({
      id,
      name: s.name,
      appsCount: s.apps,
      buildsCount: s.builds,
      eventsCount: s.events,
    }));

  const stuckInReview = submissions
    .filter(
      (s) =>
        (s.status === "pending" || s.status === "in_review") &&
        s.submittedAt &&
        Date.now() - new Date(s.submittedAt).getTime() >
          7 * 24 * 60 * 60 * 1000,
    )
    .slice(0, 10)
    .map((s, i) => ({
      submissionId: s.appId ?? `unknown-${i}`,
      appTitle: s.appId ?? "Unknown",
      studioName: s.submitterUserId ?? "Unknown",
      submittedAt: s.submittedAt!,
      daysPending: Math.floor(
        (Date.now() - new Date(s.submittedAt!).getTime()) /
          (24 * 60 * 60 * 1000),
      ),
    }));

  const activeStudiosInRange = new Set(
    events
      .filter((e) => e.type === "build_upload" || e.type === "studio_submit")
      .map((e) => (e.payload?.studioId as string | undefined) ?? null)
      .filter((v): v is string => Boolean(v)),
  ).size;

  return {
    totalStudios: totalStudiosCount,
    activeStudiosInRange,
    appsInDraft,
    appsSubmittedInRange,
    appsPublishedInRange,
    medianTimeToPublishDays,
    submissionsSeries,
    buildsSeries,
    publishOutcomeBreakdown,
    topStudios,
    stuckInReview,
  };
}

export async function getPublisherKpis(
  range: ConsoleRange,
): Promise<ConsolePublisherKpis> {
  const db = getDb();
  const [pubsCount, ordersSnap, pubsSnap, appsSnap] = await Promise.all([
    countCollection(COLLECTIONS.publishers),
    getDocs(
      query(
        collection(db, COLLECTIONS.orders),
        orderBy("placedAt", "desc"),
        fbLimit(READ_CAP),
      ),
    ),
    getDocs(query(collection(db, COLLECTIONS.publishers), fbLimit(READ_CAP))),
    getDocs(query(collection(db, COLLECTIONS.apps), fbLimit(READ_CAP))),
  ]);

  const rangeStart = Date.now() - RANGE_MS[range];

  const orders = ordersSnap.docs.map((d) => d.data() as {
    placedAt?: string;
    totalCents?: number;
    refunded?: boolean;
    gameIds?: string[];
  });
  const pubs = pubsSnap.docs.map((d) => d.data() as {
    id?: string;
    name?: string;
    appIds?: string[];
  });
  const apps = appsSnap.docs.map((d) => d.data() as {
    id?: string;
    gameTitle?: string;
    publisherIds?: string[];
  });

  const inRange = orders.filter(
    (o) => o.placedAt && new Date(o.placedAt).getTime() >= rangeStart,
  );
  const revenueCentsInRange = inRange.reduce(
    (sum, o) => sum + (o.totalCents ?? 0),
    0,
  );
  const refundsInRange = inRange.filter((o) => o.refunded).length;
  const avgTicketCents =
    inRange.length === 0
      ? 0
      : Math.round(revenueCentsInRange / inRange.length);

  // Map gameId -> publisher.
  const gameToPub = new Map<string, string>();
  for (const a of apps) {
    if (!a.id) continue;
    for (const pid of a.publisherIds ?? []) {
      gameToPub.set(a.id, pid);
      break;
    }
  }

  // Stacked revenue by top-5 publishers.
  const revenueByPub = new Map<string, number>();
  for (const o of inRange) {
    for (const gid of o.gameIds ?? []) {
      const pid = gameToPub.get(gid);
      if (!pid) continue;
      revenueByPub.set(
        pid,
        (revenueByPub.get(pid) ?? 0) + (o.totalCents ?? 0),
      );
    }
  }
  const top5Pubs = [...revenueByPub.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const buckets = emptyBuckets(range);
  const bucket = bucketMs(range);
  const byBucket = new Map<string, ConsoleMultiSeriesPoint>();
  for (const b of buckets) {
    const row: ConsoleMultiSeriesPoint = { bucket: b.bucket };
    for (const pid of top5Pubs) row[pid] = 0;
    byBucket.set(b.bucket, row);
  }
  for (const o of inRange) {
    if (!o.placedAt) continue;
    const k = bucketKey(new Date(o.placedAt).getTime(), bucket);
    const row = byBucket.get(k);
    if (!row) continue;
    for (const gid of o.gameIds ?? []) {
      const pid = gameToPub.get(gid);
      if (!pid || !top5Pubs.includes(pid)) continue;
      row[pid] = (row[pid] as number) + (o.totalCents ?? 0);
    }
  }
  const revenueByPublisher = [...byBucket.values()];

  const appsPerPub: ConsoleNamedCount[] = pubs
    .map((p) => ({
      name: p.name ?? p.id ?? "Unknown",
      count: (p.appIds ?? []).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const topPublishersByRevenue = [...revenueByPub.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, cents]) => {
      const p = pubs.find((p) => p.id === id);
      return { id, name: p?.name ?? id, revenueCents: cents };
    });

  const topPublishersByCatalog = [...pubs]
    .sort((a, b) => (b.appIds ?? []).length - (a.appIds ?? []).length)
    .slice(0, 10)
    .map((p) => ({
      id: p.id ?? "Unknown",
      name: p.name ?? p.id ?? "Unknown",
      appsCount: (p.appIds ?? []).length,
    }));

  const activePublishersInRange = new Set(
    inRange
      .flatMap((o) => o.gameIds ?? [])
      .map((g) => gameToPub.get(g))
      .filter(Boolean),
  ).size;

  return {
    totalPublishers: pubsCount,
    activePublishersInRange,
    revenueCentsInRange,
    refundsInRange,
    avgTicketCents,
    revenueByPublisher,
    appsPerPublisher: appsPerPub,
    topPublishersByRevenue,
    topPublishersByCatalog,
  };
}

export async function getDeviceBreakdown(
  range: ConsoleRange,
): Promise<ConsoleDeviceBreakdown> {
  const [sessions, errors] = await Promise.all([
    fetchSessions(range),
    fetchErrors(range),
  ]);

  const total = sessions.length || 1;
  const desktopCount = sessions.filter((s) => s.device?.isDesktop).length;
  const webCount = total - desktopCount;

  const tally = <K extends string>(picker: (s: RawSession) => K | null) => {
    const m = new Map<K, number>();
    for (const s of sessions) {
      const v = picker(s);
      if (!v) continue;
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return m;
  };

  const osMap = tally<string>((s) => (s.device?.os as string) ?? null);
  const osBreakdown: ConsoleNamedCount[] = [...osMap.entries()]
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
  const topOs = (osBreakdown[0]?.name as ConsoleDeviceBreakdown["topOs"]) ?? "none";

  const coreBuckets = (cores: number): string => {
    if (cores >= 16) return "16+";
    if (cores >= 12) return "12-15";
    if (cores >= 8) return "8-11";
    if (cores >= 4) return "4-7";
    if (cores >= 2) return "2-3";
    return "1";
  };
  const cpuMap = tally((s) => coreBuckets(s.device?.cpuCores ?? 0));
  const cpuCoreHistogram: ConsoleNamedCount[] = [
    "1",
    "2-3",
    "4-7",
    "8-11",
    "12-15",
    "16+",
  ].map((name) => ({ name, count: cpuMap.get(name) ?? 0 }));

  const memBucket = (gb: number): string => {
    if (gb >= 64) return "64+ GB";
    if (gb >= 32) return "32 GB";
    if (gb >= 16) return "16 GB";
    if (gb >= 8) return "8 GB";
    if (gb >= 4) return "4 GB";
    return "< 4 GB";
  };
  const memMap = tally((s) => memBucket(s.device?.deviceMemoryGb ?? 0));
  const memoryHistogram: ConsoleNamedCount[] = [
    "< 4 GB",
    "4 GB",
    "8 GB",
    "16 GB",
    "32 GB",
    "64+ GB",
  ].map((name) => ({ name, count: memMap.get(name) ?? 0 }));

  const gpuMap = tally((s) => s.device?.gpu ?? null);
  const gpuTop10: ConsoleNamedCount[] = [...gpuMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const resBucket = (w: number, h: number): string => {
    if (!w || !h) return "Unknown";
    if (w >= 3440) return "Ultrawide";
    if (w >= 3840) return "4K";
    if (w >= 2560) return "1440p";
    if (w >= 1920) return "1080p";
    if (w >= 1366) return "768p";
    return "< 768p";
  };
  const resMap = tally((s) =>
    resBucket(s.device?.screenW ?? 0, s.device?.screenH ?? 0),
  );
  const resolutionBreakdown: ConsoleNamedCount[] = [...resMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // OS error rate.
  const sessionsByOs = new Map<string, RawSession[]>();
  for (const s of sessions) {
    const os = s.device?.os ?? "unknown";
    const list = sessionsByOs.get(os) ?? [];
    list.push(s);
    sessionsByOs.set(os, list);
  }
  const errorsBySession = new Map<string, number>();
  for (const e of errors) {
    errorsBySession.set(
      e.sessionId,
      (errorsBySession.get(e.sessionId) ?? 0) + 1,
    );
  }
  const osErrorRate = [...sessionsByOs.entries()].map(([os, ss]) => {
    const errs = ss.reduce(
      (sum, s) => sum + (errorsBySession.get(s.id) ?? 0),
      0,
    );
    return {
      os,
      sessions: ss.length,
      errors: errs,
      ratePer1k: ss.length === 0 ? 0 : Math.round((errs / ss.length) * 1000),
    };
  });

  // Users with the most errors + their device.
  const errorsByUid = new Map<string, number>();
  const deviceByUid = new Map<string, RawSession["device"]>();
  for (const e of errors) {
    if (!e.uid) continue;
    errorsByUid.set(e.uid, (errorsByUid.get(e.uid) ?? 0) + 1);
  }
  for (const s of sessions) {
    if (s.uid && s.device) deviceByUid.set(s.uid, s.device);
  }
  const highErrorUsers = [...errorsByUid.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([uid, count]) => ({
      uid,
      displayName: uid.slice(0, 6) + "…",
      errors: count,
      device: {
        os:
          (deviceByUid.get(uid)?.os as ConsoleDeviceBreakdown["highErrorUsers"][number]["device"]["os"]) ??
          "web",
        isDesktop: deviceByUid.get(uid)?.isDesktop ?? false,
        cpuCores: deviceByUid.get(uid)?.cpuCores ?? 0,
        deviceMemoryGb: deviceByUid.get(uid)?.deviceMemoryGb ?? 0,
      },
    }));

  const modalCpuCores =
    cpuCoreHistogram.sort((a, b) => b.count - a.count)[0]?.name === "16+"
      ? 16
      : Number(
          (cpuCoreHistogram.sort((a, b) => b.count - a.count)[0]?.name ?? "0")
            .split("-")[0],
        ) || 0;

  return {
    desktopPct: Math.round((desktopCount / total) * 100),
    webPct: Math.round((webCount / total) * 100),
    topOs,
    modalCpuCores,
    osBreakdown,
    cpuCoreHistogram,
    memoryHistogram,
    gpuTop10,
    resolutionBreakdown,
    osErrorRate,
    highErrorUsers,
  };
}

export async function getPerformanceBreakdown(
  range: ConsoleRange,
): Promise<ConsolePerformanceBreakdown> {
  const [perf, sessions, errors] = await Promise.all([
    fetchPerf(range),
    fetchSessions(range),
    fetchErrors(range),
  ]);

  const ms = (name: string) =>
    perf
      .filter((p) => p.name === name)
      .map((p) => p.ms)
      .sort((a, b) => a - b);

  const lcpAll = ms("lcp");
  const fcpAll = ms("fcp");
  const clsAll = ms("cls");

  const summary = (arr: number[]) => ({
    p50: Math.round(quantile(arr, 0.5)),
    p75: Math.round(quantile(arr, 0.75)),
    p95: Math.round(quantile(arr, 0.95)),
    p99: Math.round(quantile(arr, 0.99)),
  });

  const errorsPerSession =
    sessions.length === 0 ? 0 : errors.length / sessions.length;
  const apiSamples = perf.filter((p) => p.name === "api");
  const avgApiLatencyMs =
    apiSamples.length === 0
      ? 0
      : Math.round(
          apiSamples.reduce((s, p) => s + p.ms, 0) / apiSamples.length,
        );

  // LCP series — p50/p95 per bucket.
  const bucket = bucketMs(range);
  const lcpByBucket = new Map<string, number[]>();
  for (const p of perf.filter((p) => p.name === "lcp")) {
    const t = new Date(p.ts).getTime();
    const k = bucketKey(t, bucket);
    const arr = lcpByBucket.get(k) ?? [];
    arr.push(p.ms);
    lcpByBucket.set(k, arr);
  }
  const lcpSeries: ConsoleMultiSeriesPoint[] = emptyBuckets(range).map((b) => {
    const arr = (lcpByBucket.get(b.bucket) ?? []).sort((a, b) => a - b);
    return {
      bucket: b.bucket,
      p50: Math.round(quantile(arr, 0.5)),
      p95: Math.round(quantile(arr, 0.95)),
    };
  });

  // API by endpoint (endpoint name read from meta.endpoint).
  const byEndpoint = new Map<string, number[]>();
  for (const p of apiSamples) {
    const endpoint = (p.meta?.endpoint as string | undefined) ?? "unknown";
    const arr = byEndpoint.get(endpoint) ?? [];
    arr.push(p.ms);
    byEndpoint.set(endpoint, arr);
  }
  const apiByEndpoint = [...byEndpoint.entries()].map(([endpoint, arr]) => {
    const sorted = arr.sort((a, b) => a - b);
    return {
      endpoint,
      p50: Math.round(quantile(sorted, 0.5)),
      p95: Math.round(quantile(sorted, 0.95)),
      samples: sorted.length,
    };
  });

  // Long tasks by route.
  const longTasksByRouteMap = new Map<string, number>();
  for (const p of perf.filter((p) => p.name === "longtask")) {
    longTasksByRouteMap.set(p.route, (longTasksByRouteMap.get(p.route) ?? 0) + 1);
  }
  const longTasksByRoute: ConsoleNamedCount[] = [...longTasksByRouteMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Slowest routes by p95 LCP per route.
  const lcpByRoute = new Map<string, number[]>();
  for (const p of perf.filter((p) => p.name === "lcp")) {
    const arr = lcpByRoute.get(p.route) ?? [];
    arr.push(p.ms);
    lcpByRoute.set(p.route, arr);
  }
  const slowestRoutes = [...lcpByRoute.entries()]
    .map(([route, arr]) => ({
      route,
      p95Ms: Math.round(quantile(arr.sort((a, b) => a - b), 0.95)),
      samples: arr.length,
    }))
    .sort((a, b) => b.p95Ms - a.p95Ms)
    .slice(0, 10);

  const worstApis = [...apiByEndpoint]
    .sort((a, b) => b.p95 - a.p95)
    .slice(0, 10)
    .map((a) => ({ endpoint: a.endpoint, p95Ms: a.p95, samples: a.samples }));

  return {
    lcpMs: summary(lcpAll),
    fcpMs: summary(fcpAll),
    cls: summary(clsAll.map((v) => v * 1000)),
    errorsPerSession: Math.round(errorsPerSession * 100) / 100,
    avgApiLatencyMs,
    lcpSeries,
    apiByEndpoint,
    longTasksByRoute,
    slowestRoutes,
    worstApis,
  };
}

export async function getFeatureUsage(
  range: ConsoleRange,
): Promise<ConsoleFeatureUsage> {
  const events = await fetchEvents(range);

  // Top events.
  const eventCounts = new Map<string, { count: number; users: Set<string> }>();
  const routeCounts = new Map<string, Map<string, number>>(); // event -> route -> count
  for (const e of events) {
    const cur = eventCounts.get(e.type) ?? { count: 0, users: new Set() };
    cur.count += 1;
    if (e.uid) cur.users.add(e.uid);
    eventCounts.set(e.type, cur);
    const rmap = routeCounts.get(e.type) ?? new Map();
    rmap.set(e.route, (rmap.get(e.route) ?? 0) + 1);
    routeCounts.set(e.type, rmap);
  }
  const topEvents: ConsoleNamedCount[] = [...eventCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([name, v]) => ({
      name,
      count: v.count,
      uniqueUsers: v.users.size,
      pct: events.length === 0 ? 0 : Math.round((v.count / events.length) * 100),
    }));

  // Events per route (stacked area: top 5 event types over time).
  const top5Events = topEvents.slice(0, 5).map((e) => e.name);
  const bucket = bucketMs(range);
  const byBucket = new Map<string, ConsoleMultiSeriesPoint>();
  for (const b of emptyBuckets(range)) {
    const row: ConsoleMultiSeriesPoint = { bucket: b.bucket };
    for (const name of top5Events) row[name] = 0;
    byBucket.set(b.bucket, row);
  }
  for (const e of events) {
    if (!top5Events.includes(e.type)) continue;
    const k = bucketKey(new Date(e.ts).getTime(), bucket);
    const row = byBucket.get(k);
    if (!row) continue;
    row[e.type] = (row[e.type] as number) + 1;
  }
  const eventsByRoute = [...byBucket.values()];

  // Top search queries.
  const queryCounts = new Map<
    string,
    { count: number; zero: number }
  >();
  for (const e of events) {
    if (e.type !== "search_query") continue;
    const term = String(e.payload?.term ?? "").trim().toLowerCase();
    if (!term) continue;
    const zero = Boolean(e.payload?.zeroResults);
    const cur = queryCounts.get(term) ?? { count: 0, zero: 0 };
    cur.count += 1;
    if (zero) cur.zero += 1;
    queryCounts.set(term, cur);
  }
  const topSearchQueries = [...queryCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 25)
    .map(([term, v]) => ({
      term,
      count: v.count,
      zeroResultsPct: v.count === 0 ? 0 : Math.round((v.zero / v.count) * 100),
    }));

  // Funnels — generic % drop-off.
  const uniqUsersOfType = (t: string): Set<string> => {
    const s = new Set<string>();
    for (const e of events) if (e.type === t && e.uid) s.add(e.uid);
    return s;
  };
  const stagePct = (size: number, base: number): number =>
    base === 0 ? 0 : Math.round((size / base) * 100);

  const browseToBuy = (() => {
    const browsed = new Set<string>();
    for (const e of events) if (e.type === "game_view" && e.uid) browsed.add(e.uid);
    const wished = uniqUsersOfType("wishlist_add");
    const carted = uniqUsersOfType("cart_add");
    const checkout = uniqUsersOfType("checkout_start");
    const purchased = uniqUsersOfType("checkout_complete");
    const base = browsed.size || 1;
    return [
      { stage: "Browsed game", count: browsed.size, pct: 100 },
      { stage: "Wishlisted", count: wished.size, pct: stagePct(wished.size, base) },
      { stage: "Added to cart", count: carted.size, pct: stagePct(carted.size, base) },
      { stage: "Started checkout", count: checkout.size, pct: stagePct(checkout.size, base) },
      { stage: "Purchased", count: purchased.size, pct: stagePct(purchased.size, base) },
    ];
  })();

  const signupToPurchase = (() => {
    const sessionStart = uniqUsersOfType("session_start");
    const firstView = uniqUsersOfType("page_view");
    const purchased = uniqUsersOfType("checkout_complete");
    const base = sessionStart.size || 1;
    return [
      { stage: "Started session", count: sessionStart.size, pct: 100 },
      {
        stage: "Viewed a page",
        count: firstView.size,
        pct: stagePct(firstView.size, base),
      },
      {
        stage: "Purchased",
        count: purchased.size,
        pct: stagePct(purchased.size, base),
      },
    ];
  })();

  const studioOnboarding = (() => {
    const submitted = uniqUsersOfType("studio_submit");
    const builds = uniqUsersOfType("build_upload");
    const published = uniqUsersOfType("publish_action");
    const base = submitted.size || 1;
    return [
      { stage: "Profile submitted", count: submitted.size, pct: 100 },
      {
        stage: "Uploaded a build",
        count: builds.size,
        pct: stagePct(builds.size, base),
      },
      {
        stage: "Published",
        count: published.size,
        pct: stagePct(published.size, base),
      },
    ];
  })();

  return {
    totalEventsInRange: events.length,
    uniqueEventTypes: eventCounts.size,
    topEvents,
    eventsByRoute,
    topSearchQueries,
    browseToBuyFunnel: browseToBuy,
    signupToPurchaseFunnel: signupToPurchase,
    studioOnboardingFunnel: studioOnboarding,
  };
}

export async function getErrorFeed(
  range: ConsoleRange,
): Promise<ConsoleErrorFeed> {
  const [errors, sessions] = await Promise.all([
    fetchErrors(range),
    fetchSessions(range),
  ]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const todays = errors.filter((e) => new Date(e.ts).getTime() >= todayMs);

  // Fingerprint = first line of stack (or message).
  const fingerprint = (e: TelemetryError): string => {
    const stackLine = (e.stack ?? "").split("\n")[0]?.trim();
    return (stackLine || e.message).slice(0, 200);
  };
  const todayFingerprints = new Set(todays.map(fingerprint));

  const clusters = new Map<
    string,
    {
      message: string;
      count: number;
      sessions: Set<string>;
      sampleStack?: string;
      first: number;
      last: number;
    }
  >();
  for (const e of errors) {
    const fp = fingerprint(e);
    const t = new Date(e.ts).getTime();
    const cur = clusters.get(fp) ?? {
      message: e.message,
      count: 0,
      sessions: new Set<string>(),
      sampleStack: e.stack,
      first: t,
      last: t,
    };
    cur.count += 1;
    cur.sessions.add(e.sessionId);
    if (t < cur.first) cur.first = t;
    if (t > cur.last) cur.last = t;
    if (!cur.sampleStack && e.stack) cur.sampleStack = e.stack;
    clusters.set(fp, cur);
  }
  const topErrorClusters = [...clusters.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([fp, v]) => ({
      fingerprint: fp,
      message: v.message,
      count: v.count,
      sessions: v.sessions.size,
      sampleStack: v.sampleStack,
      firstSeen: new Date(v.first).toISOString(),
      lastSeen: new Date(v.last).toISOString(),
    }));

  const sessionsImpacted = new Set(errors.map((e) => e.sessionId)).size;

  return {
    errorsToday: todays.length,
    uniqueErrorsToday: todayFingerprints.size,
    sessionsImpacted,
    pctSessionsErrored:
      sessions.length === 0
        ? 0
        : Math.round((sessionsImpacted / sessions.length) * 100),
    errorsSeries: tallyIntoBuckets(range, errors),
    topErrorClusters,
    recentErrors: errors.slice(0, 50),
  };
}

/**
 * Subscribe to active sessions (started in last 5min, no endedAt). Returns
 * an unsubscribe function. The Sessions strip on the Overview/Live tab
 * uses this — admins only via Firestore rules.
 */
export function subscribeActiveSessions(
  cb: (sessions: ConsoleActiveSession[]) => void,
): () => void {
  // Lazy-import onSnapshot to keep the read path tree-shakeable.
  let unsub: (() => void) | null = null;
  let cancelled = false;
  void (async () => {
    const { onSnapshot } = await import("firebase/firestore");
    if (cancelled) return;
    const db = getDb();
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const q = query(
      collection(db, COLLECTIONS.telemetrySessions),
      where("startedAt", ">=", since),
      orderBy("startedAt", "desc"),
      fbLimit(50),
    );
    unsub = onSnapshot(q, (snap) => {
      const out: ConsoleActiveSession[] = [];
      for (const d of snap.docs) {
        const data = d.data() as RawSession;
        if (data.endedAt) continue;
        out.push({
          id: data.id ?? d.id,
          uid: data.uid ?? null,
          startedAt: data.startedAt,
          lastRoute: data.lastRoute,
          device: {
            os: (data.device?.os as ConsoleActiveSession["device"]["os"]) ?? "web",
            isDesktop: Boolean(data.device?.isDesktop),
          },
        });
      }
      cb(out);
    });
  })();
  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function countCollection(name: string): Promise<number> {
  try {
    const snap = await getCountFromServer(collection(getDb(), name));
    return snap.data().count;
  } catch {
    return 0;
  }
}
