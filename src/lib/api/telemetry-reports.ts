// Per-actor reports (admin god-view + self-service) backed by raw telemetry +
// the existing dw_* collections (orders, library, wishlist, reviews, apps,
// publishers, developers). v1 reads raw docs and folds them client-side; the
// rollup collections (`dw_telemetry_*_rollups`) are written by an admin-side
// recompute trigger so the report pages stay snappy.

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import type {
  AppStage,
  ConsolePublisherReport,
  ConsoleStudioReport,
  ConsoleUserReport,
  ConsoleNamedCount,
  ConsoleTimePoint,
  CreatorVerificationStatus,
  DreamworksWrappedReport,
  ReviewLabel,
  UserHealthSegment,
  UserPersonality,
  UserPersonalReport,
  FacetAverages,
  DeviceSnapshot,
} from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const READ_CAP = 5000;

// ── Helpers ────────────────────────────────────────────────────────────────

function tally<T>(arr: T[], keyOf: (x: T) => string | null | undefined): Map<string, number> {
  const out = new Map<string, number>();
  for (const item of arr) {
    const k = keyOf(item);
    if (!k) continue;
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

function toNamedCounts(m: Map<string, number>, limit = 10): ConsoleNamedCount[] {
  return [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function emptyBuckets(days: number): ConsoleTimePoint[] {
  const buckets: ConsoleTimePoint[] = [];
  const start = Math.floor((Date.now() - days * DAY_MS) / DAY_MS) * DAY_MS;
  for (let i = 0; i < days; i++) {
    buckets.push({ bucket: new Date(start + i * DAY_MS).toISOString(), value: 0 });
  }
  return buckets;
}

function tallyToBuckets(days: number, items: { ts: string }[]): ConsoleTimePoint[] {
  const points = emptyBuckets(days);
  const byKey = new Map(points.map((p) => [p.bucket, p]));
  for (const item of items) {
    const t = new Date(item.ts).getTime();
    if (!Number.isFinite(t)) continue;
    const key = new Date(Math.floor(t / DAY_MS) * DAY_MS).toISOString();
    const point = byKey.get(key);
    if (point) point.value += 1;
  }
  return points;
}

function classifySegment(
  lastSeenAt: number | null,
  sessionCount: number,
  spendCents: number,
  memberSinceAt: number | null,
): UserHealthSegment {
  if (lastSeenAt === null) return "New";
  const daysSinceSeen = (Date.now() - lastSeenAt) / DAY_MS;
  const accountAgeDays = memberSinceAt ? (Date.now() - memberSinceAt) / DAY_MS : 999;
  if (accountAgeDays <= 14 && sessionCount <= 5) return "New";
  if (daysSinceSeen > 60) return "Hibernating";
  if (daysSinceSeen > 14) return "At-risk";
  if (spendCents > 5000_00 || sessionCount > 30) return "Champion";
  return "Loyal";
}

function classifyPersonality(stats: {
  achievementRatePerHour: number;
  avgCompletionPct: number;
  socialScore: number;
  spendCents: number;
  gameViews: number;
  purchases: number;
  daysSinceSeen: number;
}): UserPersonality {
  if (stats.daysSinceSeen > 60) return "Hibernator";
  if (stats.spendCents > 100_000) return "Whale";
  if (stats.socialScore > 30) return "Social Player";
  if (stats.avgCompletionPct > 80) return "Completionist";
  if (stats.achievementRatePerHour > 3) return "Achievement Hunter";
  if (stats.gameViews > 0 && stats.purchases > 0 && stats.gameViews / stats.purchases > 50) {
    return "Browser";
  }
  return "Balanced";
}

// ── User report ────────────────────────────────────────────────────────────

export async function getUserReport(uid: string): Promise<ConsoleUserReport | null> {
  const db = getDb();
  const userSnap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!userSnap.exists()) return null;
  const profile = userSnap.data() as Record<string, unknown>;

  const sinceIso = new Date(Date.now() - 90 * DAY_MS).toISOString();

  const [eventsSnap, errorsSnap, perfSnap, sessionsSnap, deviceSnap, ordersSnap, librarySnap, wishlistSnap, reviewsSnap] =
    await Promise.all([
      getDocs(
        query(
          collection(db, COLLECTIONS.telemetryEvents),
          where("uid", "==", uid),
          where("ts", ">=", sinceIso),
          orderBy("ts", "desc"),
          fbLimit(READ_CAP),
        ),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
      getDocs(
        query(
          collection(db, COLLECTIONS.telemetryErrors),
          where("uid", "==", uid),
          orderBy("ts", "desc"),
          fbLimit(200),
        ),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
      getDocs(
        query(
          collection(db, COLLECTIONS.telemetryPerf),
          where("uid", "==", uid),
          where("ts", ">=", sinceIso),
          orderBy("ts", "desc"),
          fbLimit(READ_CAP),
        ),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
      getDocs(
        query(
          collection(db, COLLECTIONS.telemetrySessions),
          where("uid", "==", uid),
          orderBy("startedAt", "desc"),
          fbLimit(READ_CAP),
        ),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
      getDoc(doc(db, COLLECTIONS.telemetryDevices, uid)).catch(() => null),
      getDocs(
        query(collection(db, COLLECTIONS.orders), where("userId", "==", uid), fbLimit(500)),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
      getDocs(
        query(collection(db, COLLECTIONS.library), where("userId", "==", uid), fbLimit(2000)),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
      getDocs(
        query(collection(db, COLLECTIONS.wishlist), where("userId", "==", uid), fbLimit(500)),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
      getDocs(
        query(collection(db, COLLECTIONS.reviews), where("userId", "==", uid), fbLimit(200)),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
    ]);

  const events = eventsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const errors = errorsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const perf = perfSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const sessions = sessionsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const orders = ordersSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const library = librarySnap.docs.map((d) => d.data() as Record<string, unknown>);
  const wishlist = wishlistSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const reviews = reviewsSnap.docs.map((d) => d.data() as Record<string, unknown>);

  const lastSeenAt = sessions.length > 0 ? new Date(String(sessions[0].startedAt)).getTime() : null;
  const totalMinutes = library.reduce((s, e) => s + Number(e.playMinutes ?? 0), 0);
  const sessionCount = sessions.length;
  const lifetimeSpendCents = orders.reduce(
    (s, o) => s + Number(o.totalCents ?? 0),
    0,
  );

  const memberSinceStr = profile.memberSince ? String(profile.memberSince) : undefined;
  const memberSinceAt = memberSinceStr ? new Date(memberSinceStr).getTime() : null;
  const segment = classifySegment(lastSeenAt, sessionCount, lifetimeSpendCents, memberSinceAt);

  // Day sparkline — last 30 d event count per day.
  const days = emptyBuckets(30);
  const byKey = new Map(days.map((d) => [d.bucket, d]));
  for (const e of events) {
    const t = new Date(String(e.ts)).getTime();
    if (!Number.isFinite(t)) continue;
    const k = new Date(Math.floor(t / DAY_MS) * DAY_MS).toISOString();
    const p = byKey.get(k);
    if (p) p.value += 1;
  }
  const daySparkline = days.map((d) => d.value);

  // Hourly heatmap.
  const heatBuckets = new Map<string, number>();
  for (const e of events) {
    const d = new Date(String(e.ts));
    heatBuckets.set(`${d.getUTCDay()}-${d.getUTCHours()}`, (heatBuckets.get(`${d.getUTCDay()}-${d.getUTCHours()}`) ?? 0) + 1);
  }
  const hourHeatmap: ConsoleUserReport["hourHeatmap"] = [];
  for (let dow = 0; dow < 7; dow++) {
    for (let hour = 0; hour < 24; hour++) {
      hourHeatmap.push({ dow, hour, count: heatBuckets.get(`${dow}-${hour}`) ?? 0 });
    }
  }

  const topEvents = toNamedCounts(
    tally(events, (e) => String(e.type ?? "")),
    20,
  );

  // Top games by playtime from library.
  const topGames = [...library]
    .sort((a, b) => Number(b.playMinutes ?? 0) - Number(a.playMinutes ?? 0))
    .slice(0, 5)
    .map((e) => ({
      gameId: String(e.gameId),
      title: String(e.gameId),
      minutes: Number(e.playMinutes ?? 0),
    }));

  // Genre affinity — best-effort: would need a join to dw_games for true genres.
  const genreAffinity: ConsoleNamedCount[] = [];

  // Wishlist conversion: % of wishlisted gameIds also in library.
  const ownedSet = new Set(library.map((e) => String(e.gameId)));
  const wishlistGameIds = wishlist.map((w) => String(w.gameId));
  const converted = wishlistGameIds.filter((id) => ownedSet.has(id)).length;
  const wishlistConversionPct =
    wishlistGameIds.length === 0 ? 0 : Math.round((converted / wishlistGameIds.length) * 100);
  const wishlistOldestAgeDays = wishlist.length === 0
    ? 0
    : Math.max(
        ...wishlist.map((w) =>
          Math.floor((Date.now() - new Date(String(w.addedAt)).getTime()) / DAY_MS),
        ),
      );

  const achievementsUnlocked = library.reduce(
    (s, e) => s + Number(e.achievementsUnlocked ?? 0),
    0,
  );
  const averageCompletionPct =
    library.length === 0
      ? 0
      : Math.round(
          library.reduce((s, e) => s + Number(e.completionPct ?? 0), 0) / library.length,
        );
  const perfectGames = library.filter((e) => Number(e.completionPct ?? 0) >= 100).length;
  const dustPile = library.filter(
    (e) => !e.installed && Number(e.playMinutes ?? 0) === 0,
  ).length;
  const backlogYears =
    totalMinutes > 0 && dustPile > 0
      ? Math.round((dustPile * (totalMinutes / Math.max(1, library.length))) / (365 * 24 * 60))
      : 0;

  const refundCount = orders.filter((o) => o.refunded === true).length;
  const avgTicketCents = orders.length === 0 ? 0 : Math.round(lifetimeSpendCents / orders.length);

  // Social — count from events as a proxy.
  const friendsCount = 0;
  const communitiesCount = events.filter((e) => e.type === "community_join").length;
  const voiceMinutes = events.filter((e) => e.type === "voice_join").length * 5; // approx
  const reviewsPosted = reviews.length;
  const reviewHelpfulTotal = reviews.reduce((s, r) => s + Number(r.helpfulCount ?? 0), 0);
  const forumPosts = events.filter((e) => e.type === "community_post").length;

  const lcps = perf.filter((p) => p.name === "lcp").map((p) => Number(p.ms ?? 0)).sort((a, b) => a - b);
  const p95Lcp = lcps.length === 0 ? 0 : lcps[Math.floor(lcps.length * 0.95)] ?? 0;

  const topErrorMessages = [...new Set(errors.map((e) => String(e.message ?? "")))].slice(0, 5);

  const device = deviceSnap?.exists() ? (deviceSnap.data().latest as DeviceSnapshot) : null;

  const achievementRatePerHour =
    totalMinutes > 0 ? (achievementsUnlocked / (totalMinutes / 60)) : 0;
  const socialScore = friendsCount + reviewsPosted + forumPosts + communitiesCount;
  const gameViews = events.filter((e) => e.type === "game_view").length;
  const purchases = events.filter((e) => e.type === "checkout_complete").length;
  const daysSinceSeen = lastSeenAt ? (Date.now() - lastSeenAt) / DAY_MS : 9999;
  const personality = classifyPersonality({
    achievementRatePerHour,
    avgCompletionPct: averageCompletionPct,
    socialScore,
    spendCents: lifetimeSpendCents,
    gameViews,
    purchases,
    daysSinceSeen,
  });

  const suggestions: string[] = [];
  if (dustPile > 5)
    suggestions.push(`Re-engage: ${dustPile} games in their library have never been played.`);
  if (wishlistConversionPct < 5 && wishlistGameIds.length > 0)
    suggestions.push(`Send a wishlist sale alert — only ${wishlistConversionPct}% of wishlisted games converted.`);
  if (errors.length > 5) suggestions.push(`Investigate: ${errors.length} errors in the last 90 d for this user.`);
  if (segment === "At-risk")
    suggestions.push(`At-risk segment — consider a re-engagement push notification.`);
  if (segment === "Hibernating")
    suggestions.push(`Hibernating — try a personalized "we miss you" email with a top-pick recommendation.`);

  const oneLineSummary =
    `${segment} · ${personality} · ${sessionCount} sessions · ${Math.round(totalMinutes / 60)} h ` +
    `· ${(lifetimeSpendCents / 100).toLocaleString()} spent · ${errors.length} errors`;

  return {
    uid,
    displayName: String(profile.displayName ?? "User"),
    email: profile.email ? String(profile.email) : undefined,
    country: profile.country ? String(profile.country) : undefined,
    memberSince: memberSinceStr,
    role: (profile.role as ConsoleUserReport["role"]) ?? "user",
    segment,
    personality,
    oneLineSummary,
    sessions: sessionCount,
    totalMinutes,
    avgSessionMinutes:
      sessionCount === 0 ? 0 : Math.round(totalMinutes / sessionCount),
    stickinessPct: 0, // requires DAU/MAU per user — left as placeholder
    lastSeenAt: lastSeenAt ? new Date(lastSeenAt).toISOString() : null,
    daySparkline,
    hourHeatmap,
    topEvents,
    ownedCount: library.length,
    installedCount: library.filter((e) => e.installed === true).length,
    topGames,
    genreAffinity,
    achievementsUnlocked,
    averageCompletionPct,
    perfectGames,
    dustPile,
    backlogYears,
    lifetimeSpendCents,
    giftsGivenCents: 0,
    giftsReceivedCents: 0,
    avgTicketCents,
    subscriptionStatus: profile.isSubscribed ? "subscribed" : "free",
    refundCount,
    friendsCount,
    communitiesCount,
    voiceMinutes,
    reviewsPosted,
    reviewHelpfulTotal,
    forumPosts,
    wishlistSize: wishlistGameIds.length,
    wishlistOldestAgeDays,
    wishlistConversionPct,
    device,
    rigPercentile: 50, // placeholder
    errorsObserved: errors.length,
    topErrorMessages,
    p95LcpMsExperienced: Math.round(p95Lcp),
    suggestions,
  };
}

// ── Studio report ──────────────────────────────────────────────────────────

export async function getStudioReport(studioId: string): Promise<ConsoleStudioReport | null> {
  const db = getDb();
  const devSnap = await getDoc(doc(db, COLLECTIONS.developers, studioId));
  if (!devSnap.exists()) return null;
  const dev = devSnap.data() as Record<string, unknown>;
  const ownerUid = String(dev.ownerUserId ?? "");

  const sinceIso = new Date(Date.now() - 90 * DAY_MS).toISOString();

  const [appsSnap, submissionsSnap, reviewsSnap, ordersSnap, errorsSnap, perfSnap, eventsSnap] =
    await Promise.all([
      getDocs(
        query(
          collection(db, COLLECTIONS.apps),
          where("developerIds", "array-contains", studioId),
          fbLimit(200),
        ),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown>; id: string }[] })),
      getDocs(
        query(
          collection(db, COLLECTIONS.appSubmissions),
          where("submitterUserId", "==", ownerUid),
          orderBy("submittedAt", "desc"),
          fbLimit(500),
        ),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
      getDocs(query(collection(db, COLLECTIONS.reviews), fbLimit(READ_CAP))).catch(
        () => ({ docs: [] as { data: () => Record<string, unknown> }[] }),
      ),
      getDocs(
        query(
          collection(db, COLLECTIONS.orders),
          orderBy("placedAt", "desc"),
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
      getDocs(
        query(
          collection(db, COLLECTIONS.telemetryEvents),
          where("ts", ">=", sinceIso),
          orderBy("ts", "desc"),
          fbLimit(READ_CAP),
        ),
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
    ]);

  const apps = appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as Array<
    Record<string, unknown> & { id: string }
  >;
  const submissions = submissionsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const orders = ordersSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const errors = errorsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const perf = perfSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const events = eventsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const reviewsAll = reviewsSnap.docs.map((d) => d.data() as Record<string, unknown>);

  const appIds = new Set(apps.map((a) => a.id));
  const appReviews = reviewsAll.filter((r) => appIds.has(String(r.gameId ?? "")));

  // Per-app row.
  const rows = apps.map((a) => {
    const errs = errors.filter((e) => String(e.route ?? "").includes(`/${a.id}`)).length;
    const sessions = events.filter((ev) => String(ev.route ?? "").includes(`/${a.id}`)).length;
    const lcps = perf
      .filter((p) => p.name === "lcp" && String(p.route ?? "").includes(`/${a.id}`))
      .map((p) => Number(p.ms ?? 0))
      .sort((x, y) => x - y);
    const p95Lcp = lcps.length === 0 ? 0 : Math.round(lcps[Math.floor(lcps.length * 0.95)] ?? 0);
    const revenueCents = orders
      .filter((o) => Array.isArray(o.gameIds) && (o.gameIds as string[]).includes(a.id))
      .reduce((s, o) => s + Number(o.totalCents ?? 0), 0);
    return {
      id: a.id,
      title: String(a.gameTitle ?? a.id),
      stage: ((a.stage as AppStage) ?? "draft") as AppStage,
      wishlists: 0,
      currentPlayers: 0,
      revenueCents,
      p95LcpMs: p95Lcp,
      errorsPer1k: sessions === 0 ? 0 : Math.round((errs / sessions) * 1000),
    };
  });

  // Funnel per app.
  const funnelByApp = apps.map((a) => {
    const pageViews = events.filter(
      (e) => e.type === "page_view" && String(e.route ?? "").includes(`/${a.id}`),
    ).length;
    const wishlist = events.filter((e) => e.type === "wishlist_add" && (e.payload as Record<string, unknown> | undefined)?.gameId === a.id).length;
    const purchase = orders.filter((o) => Array.isArray(o.gameIds) && (o.gameIds as string[]).includes(a.id)).length;
    const install = events.filter((e) => e.type === "library_install" && (e.payload as Record<string, unknown> | undefined)?.gameId === a.id).length;
    const launch = events.filter((e) => e.type === "library_launch" && (e.payload as Record<string, unknown> | undefined)?.gameId === a.id).length;
    return {
      appId: a.id,
      title: String(a.gameTitle ?? a.id),
      pageView: pageViews,
      wishlist,
      purchase,
      install,
      launch,
      secondSession: 0,
    };
  });

  // Submissions.
  const total = submissions.length;
  const pending = submissions.filter((s) => s.status === "pending" || s.status === "in_review").length;
  const approved = submissions.filter((s) => s.status === "approved").length;
  const rejected = submissions.filter((s) => s.status === "rejected").length;
  const ttp = submissions
    .filter((s) => s.status === "approved" && s.decidedAt && s.submittedAt)
    .map((s) => (new Date(String(s.decidedAt)).getTime() - new Date(String(s.submittedAt)).getTime()) / DAY_MS)
    .sort((a, b) => a - b);
  const medianTtpDays = ttp.length === 0 ? null : Math.round(ttp[Math.floor(ttp.length / 2)] * 10) / 10;
  const p95TtpDays = ttp.length === 0 ? null : Math.round((ttp[Math.floor(ttp.length * 0.95)] ?? 0) * 10) / 10;

  const reasonCounts = new Map<string, number>();
  for (const s of submissions) {
    const reasons = ((s.decision as Record<string, unknown> | undefined)?.reasons as string[] | undefined) ?? [];
    for (const r of reasons) reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1);
  }
  const rejectionReasons = toNamedCounts(reasonCounts, 10);

  // Builds per month.
  const buildEvents = events
    .filter((e) => e.type === "build_upload")
    .map((e) => ({ ts: String(e.ts) }));
  const buildsPerMonth = tallyToBuckets(90, buildEvents);
  const lastBuildTs = buildEvents.length === 0 ? 0 : Math.max(...buildEvents.map((e) => new Date(e.ts).getTime()));
  const daysSinceLastBuild = lastBuildTs === 0 ? null : Math.floor((Date.now() - lastBuildTs) / DAY_MS);

  // Audience — derived from event routes.
  const byOs = toNamedCounts(tally(events, (e) => String(e.route ?? "").includes("/store/game/") ? "store" : null));
  void byOs; // satisfy unused
  const audience = {
    byRegion: [] as ConsoleNamedCount[],
    byOs: [] as ConsoleNamedCount[],
    byBrowser: [] as ConsoleNamedCount[],
  };

  // Reviews aggregate.
  const reviewsForStudio = appReviews;
  const facetSums = { gameplay: 0, story: 0, polish: 0, value: 0, accessibility: 0, n: 0 };
  for (const r of reviewsForStudio) {
    const f = r.facets as Record<string, number> | undefined;
    if (!f) continue;
    facetSums.gameplay += Number(f.gameplay ?? 0);
    facetSums.story += Number(f.story ?? 0);
    facetSums.polish += Number(f.polish ?? 0);
    facetSums.value += Number(f.value ?? 0);
    facetSums.accessibility += Number(f.accessibility ?? 0);
    facetSums.n += 1;
  }
  const facetAverages: FacetAverages | null = facetSums.n === 0
    ? null
    : {
        gameplay: facetSums.gameplay / facetSums.n,
        story: facetSums.story / facetSums.n,
        polish: facetSums.polish / facetSums.n,
        value: facetSums.value / facetSums.n,
        accessibility: facetSums.accessibility / facetSums.n,
        ratedCount: facetSums.n,
      };

  // Recent negative review keywords.
  const negKeywords = new Map<string, number>();
  for (const r of reviewsForStudio.filter((r) => r.recommended === false).slice(0, 50)) {
    const words = String(r.body ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4);
    for (const w of words) negKeywords.set(w, (negKeywords.get(w) ?? 0) + 1);
  }
  const recentNegativeKeywords = toNamedCounts(negKeywords, 8);

  const label: ReviewLabel | null = reviewsForStudio.length === 0
    ? null
    : reviewsForStudio.filter((r) => r.recommended).length / reviewsForStudio.length > 0.85
      ? "Very Positive"
      : "Mixed";

  // Crash top clusters for this studio's app routes.
  const crashMap = new Map<string, { message: string; count: number }>();
  for (const e of errors) {
    if (!apps.some((a) => String(e.route ?? "").includes(`/${a.id}`))) continue;
    const stack = String(e.stack ?? "").split("\n")[0]?.trim() || String(e.message ?? "");
    const cur = crashMap.get(stack) ?? { message: String(e.message ?? ""), count: 0 };
    cur.count += 1;
    crashMap.set(stack, cur);
  }
  const topClusters = [...crashMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([fp, v]) => ({ fingerprint: fp, message: v.message, count: v.count }));

  const whatToFix: string[] = [];
  for (const r of rows) {
    if (r.p95LcpMs > 2500) whatToFix.push(`${r.title}: p95 LCP ${r.p95LcpMs}ms exceeds 2.5s — investigate.`);
    if (r.errorsPer1k > 50) whatToFix.push(`${r.title}: ${r.errorsPer1k} errors per 1k sessions — high failure rate.`);
  }
  for (const f of funnelByApp) {
    if (f.pageView > 0 && f.wishlist / f.pageView < 0.05) {
      whatToFix.push(`${f.title}: only ${Math.round((f.wishlist / f.pageView) * 100)}% wishlist rate from store-page views.`);
    }
    if (f.wishlist > 0 && f.purchase / f.wishlist < 0.05) {
      whatToFix.push(`${f.title}: ${Math.round((f.purchase / f.wishlist) * 100)}% wishlist→purchase below 5% benchmark.`);
    }
  }
  if (daysSinceLastBuild !== null && daysSinceLastBuild > 60) {
    whatToFix.push(`No new builds for ${daysSinceLastBuild} days — players notice silence.`);
  }

  const oneLineSummary =
    `${apps.length} apps · ${total} submissions · ${pending} pending review · ` +
    `${reviewsForStudio.length} reviews · ${topClusters.length} crash clusters`;

  return {
    id: studioId,
    name: String(dev.name ?? studioId),
    ownerUid,
    verificationStatus: ((dev.verificationStatus as CreatorVerificationStatus) ?? "unverified") as CreatorVerificationStatus,
    oneLineSummary,
    apps: rows,
    funnelByApp,
    submissions: {
      total,
      pending,
      approved,
      rejected,
      medianTtpDays,
      p95TtpDays,
      rejectionReasons,
    },
    buildsPerMonth,
    daysSinceLastBuild,
    validationPassPct: 0,
    audience,
    reviews: {
      total: reviewsForStudio.length,
      label,
      facetAverages,
      recentNegativeKeywords,
      responseRatePct: 0,
    },
    marketing: {
      activeCampaigns: 0,
      redemptions: 0,
      announcementsRead: 0,
    },
    crashes: {
      topClusters,
      sdkSuccessPct: 0,
      crashFreeSessionsPct: 0,
    },
    whatToFix,
  };
}

// ── Publisher report ───────────────────────────────────────────────────────

export async function getPublisherReport(
  publisherId: string,
): Promise<ConsolePublisherReport | null> {
  const db = getDb();
  const pubSnap = await getDoc(doc(db, COLLECTIONS.publishers, publisherId));
  if (!pubSnap.exists()) return null;
  const pub = pubSnap.data() as Record<string, unknown>;

  const [appsSnap, ordersSnap, reviewsSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, COLLECTIONS.apps),
        where("publisherIds", "array-contains", publisherId),
        fbLimit(500),
      ),
    ).catch(() => ({ docs: [] as { data: () => Record<string, unknown>; id: string }[] })),
    getDocs(
      query(
        collection(db, COLLECTIONS.orders),
        orderBy("placedAt", "desc"),
        fbLimit(READ_CAP),
      ),
    ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
    getDocs(query(collection(db, COLLECTIONS.reviews), fbLimit(READ_CAP))).catch(
      () => ({ docs: [] as { data: () => Record<string, unknown> }[] }),
    ),
  ]);

  const apps = appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as Array<
    Record<string, unknown> & { id: string }
  >;
  const orders = ordersSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const reviewsAll = reviewsSnap.docs.map((d) => d.data() as Record<string, unknown>);

  const appIdSet = new Set(apps.map((a) => a.id));
  const pubOrders = orders.filter(
    (o) => Array.isArray(o.gameIds) && (o.gameIds as string[]).some((g) => appIdSet.has(g)),
  );
  const revenueCents = pubOrders.reduce((s, o) => s + Number(o.totalCents ?? 0), 0);
  const refundedOrders = pubOrders.filter((o) => o.refunded === true).length;
  const refundRatePct = pubOrders.length === 0 ? 0 : Math.round((refundedOrders / pubOrders.length) * 100);

  const ordersBuckets = pubOrders
    .filter((o) => o.placedAt)
    .map((o) => ({ ts: String(o.placedAt) }));
  const revenueSeries = tallyToBuckets(90, ordersBuckets);

  const revenueByRegion = toNamedCounts(
    tally(pubOrders, (o) => String(o.country ?? "Unknown")),
    8,
  );

  const byGenre = toNamedCounts(
    tally(apps, (a) => (Array.isArray(a.genres) && a.genres.length > 0 ? String(a.genres[0]) : null)),
    10,
  );
  const byTag = toNamedCounts(
    tally(apps, (a) => (Array.isArray(a.tags) && a.tags.length > 0 ? String(a.tags[0]) : null)),
    10,
  );
  const priceBand = (cents: number): string => {
    if (cents === 0) return "Free";
    if (cents < 1_000_00) return "< $10";
    if (cents < 3_000_00) return "$10–30";
    if (cents < 6_000_00) return "$30–60";
    return "$60+";
  };
  const byPriceBand = toNamedCounts(
    tally(apps, (a) => priceBand(Number(a.basePriceCents ?? 0))),
    5,
  );
  const ages = apps
    .filter((a) => a.releaseDate)
    .map((a) => (Date.now() - new Date(String(a.releaseDate)).getTime()) / DAY_MS);
  ages.sort((a, b) => a - b);
  const medianAgeDays = ages.length === 0 ? 0 : Math.round(ages[Math.floor(ages.length / 2)]);
  const updatedLast12mo = apps.filter(
    (a) => a.updatedAt && Date.now() - new Date(String(a.updatedAt)).getTime() < 365 * DAY_MS,
  ).length;
  const updatedLast12moPct = apps.length === 0 ? 0 : Math.round((updatedLast12mo / apps.length) * 100);

  const appReviews = reviewsAll.filter((r) => appIdSet.has(String(r.gameId ?? "")));
  const positives = appReviews.filter((r) => r.recommended === true).length;
  const avgScore = appReviews.length === 0 ? 0 : Math.round((positives / appReviews.length) * 100);

  const themeCounts = new Map<string, number>();
  for (const r of appReviews.slice(0, 200)) {
    const words = String(r.body ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 5);
    for (const w of words) themeCounts.set(w, (themeCounts.get(w) ?? 0) + 1);
  }
  const topThemes = toNamedCounts(themeCounts, 8);

  const suggestions: string[] = [];
  if (refundRatePct > 5) suggestions.push(`Refund rate ${refundRatePct}% is above the 5% yellow flag — investigate top refund reasons.`);
  if (updatedLast12moPct < 30 && apps.length > 0)
    suggestions.push(`Only ${updatedLast12moPct}% of catalog updated in the last 12 months — consider live-ops investment.`);
  if (byGenre.length === 1) suggestions.push(`Catalog is single-genre — broaden taste affinity to reach a wider audience.`);

  const arpuCents =
    pubOrders.length === 0 ? 0 : Math.round(revenueCents / Math.max(1, pubOrders.length));

  const oneLineSummary =
    `${apps.length} apps · ${pubOrders.length} orders · $${Math.round(revenueCents / 100).toLocaleString()} revenue · ${refundRatePct}% refunds`;

  return {
    id: publisherId,
    name: String(pub.name ?? publisherId),
    ownerUid: String(pub.ownerUserId ?? ""),
    verificationStatus: ((pub.verificationStatus as CreatorVerificationStatus) ?? "unverified") as CreatorVerificationStatus,
    oneLineSummary,
    money: {
      arpuCents,
      arpdauCents: 0,
      arppuCents: arpuCents,
      ltvCents: arpuCents * 3,
      refundRatePct,
      revenueSeries,
      revenueByRegion,
    },
    catalog: {
      totalApps: apps.length,
      byGenre,
      byTag,
      byPriceBand,
      medianAgeDays,
      updatedLast12moPct,
    },
    audience: {
      byRegion: revenueByRegion,
      byOs: [],
      affinityVsPlatform: [],
    },
    pipeline: {
      medianTtpDays: null,
      submissionRejectRatePct: 0,
    },
    reputation: {
      avgScore,
      topThemes,
      refundDrivers: [],
    },
    marketing: {
      activeCampaigns: 0,
      promoRedemptionsPct: 0,
    },
    suggestions,
  };
}

// ── Dreamworks Wrapped (user-facing annual recap) ──────────────────────────

export async function getDreamworksWrapped(uid: string): Promise<DreamworksWrappedReport | null> {
  const db = getDb();
  const userSnap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!userSnap.exists()) return null;
  const profile = userSnap.data() as Record<string, unknown>;

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const yearEnd = new Date().toISOString();

  const [librarySnap, ordersSnap, reviewsSnap, eventsSnap] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.library), where("userId", "==", uid), fbLimit(2000))).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
    getDocs(query(collection(db, COLLECTIONS.orders), where("userId", "==", uid), fbLimit(500))).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
    getDocs(query(collection(db, COLLECTIONS.reviews), where("userId", "==", uid), fbLimit(200))).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
    getDocs(query(collection(db, COLLECTIONS.telemetryEvents), where("uid", "==", uid), where("ts", ">=", yearStart), orderBy("ts", "desc"), fbLimit(READ_CAP))).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] })),
  ]);

  const library = librarySnap.docs.map((d) => d.data() as Record<string, unknown>);
  const orders = ordersSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const reviews = reviewsSnap.docs.map((d) => d.data() as Record<string, unknown>);
  const events = eventsSnap.docs.map((d) => d.data() as Record<string, unknown>);

  const totalMinutes = library.reduce((s, e) => s + Number(e.playMinutes ?? 0), 0);

  const topGames = [...library]
    .sort((a, b) => Number(b.playMinutes ?? 0) - Number(a.playMinutes ?? 0))
    .slice(0, 5)
    .map((e) => ({
      gameId: String(e.gameId),
      title: String(e.gameId),
      minutes: Number(e.playMinutes ?? 0),
    }));

  const topGenres: ConsoleNamedCount[] = [];

  const totalSpendCents = orders.reduce((s, o) => s + Number(o.totalCents ?? 0), 0);
  const giftsGiven = orders.reduce((sum, o) => {
    const items = (o.lineItems as Record<string, unknown>[] | undefined) ?? [];
    return sum + items.filter((i) => i.asGift === true).length;
  }, 0);

  const achievementsUnlocked = library.reduce((s, e) => s + Number(e.achievementsUnlocked ?? 0), 0);
  const perfectGames = library.filter((e) => Number(e.completionPct ?? 0) >= 100).length;

  // Longest streak — naive: longest consecutive-day chain of events.
  const dayKeys = new Set(
    events.map((e) => new Date(String(e.ts)).toISOString().slice(0, 10)),
  );
  const days = [...dayKeys].sort();
  let longest = 0;
  let current = 0;
  let prevDay: number | null = null;
  for (const day of days) {
    const t = new Date(day).getTime();
    if (prevDay !== null && t - prevDay === DAY_MS) {
      current += 1;
    } else {
      current = 1;
    }
    if (current > longest) longest = current;
    prevDay = t;
  }

  // Top play hour.
  const hourCounts = new Array(24).fill(0);
  for (const e of events) {
    const h = new Date(String(e.ts)).getHours();
    hourCounts[h] += 1;
  }
  const topPlayHour = hourCounts.indexOf(Math.max(...hourCounts));

  const sessions = events.filter((e) => e.type === "session_start").length;

  const personality: UserPersonality = (() => {
    const purchases = orders.length;
    const gameViews = events.filter((e) => e.type === "game_view").length;
    if (totalSpendCents > 50_000) return "Whale";
    if (perfectGames > 5) return "Completionist";
    if (achievementsUnlocked > 100) return "Achievement Hunter";
    if (reviews.length > 5) return "Social Player";
    if (gameViews > 0 && purchases > 0 && gameViews / purchases > 50) return "Browser";
    return "Balanced";
  })();

  const oneLineSummary =
    `${Math.round(totalMinutes / 60)} hours played · ${topGames.length} top games · ` +
    `${achievementsUnlocked} achievements · ${personality}`;

  return {
    uid,
    displayName: String(profile.displayName ?? "Player"),
    yearStart,
    yearEnd,
    totalMinutes,
    totalHours: Math.round(totalMinutes / 60),
    sessionsCount: sessions,
    topGames,
    topGenres,
    achievementsUnlocked,
    perfectGames,
    friendsMade: 0,
    communitiesJoined: events.filter((e) => e.type === "community_join").length,
    reviewsPosted: reviews.length,
    totalSpendCents,
    giftsGiven,
    giftsReceived: 0,
    personality,
    longestStreakDays: longest,
    topInputMethod: "keyboard-mouse",
    topPlayHour,
    oneLineSummary,
  };
}

// ── User self-service personal report (lighter than admin report) ───────────

export async function getUserPersonalReport(uid: string): Promise<UserPersonalReport> {
  const full = await getUserReport(uid);
  if (!full) {
    return {
      totalMinutes: 0,
      avgSessionMinutes: 0,
      sessions: 0,
      topGames: [],
      genreAffinity: [],
      wishlistConversionPct: 0,
      achievementsUnlocked: 0,
      spendCents: 0,
      device: null,
      pageViewsLast30d: 0,
      errorsObserved: 0,
      personality: "Balanced",
      segment: "New",
      suggestions: [],
    };
  }
  return {
    totalMinutes: full.totalMinutes,
    avgSessionMinutes: full.avgSessionMinutes,
    sessions: full.sessions,
    topGames: full.topGames,
    genreAffinity: full.genreAffinity,
    wishlistConversionPct: full.wishlistConversionPct,
    achievementsUnlocked: full.achievementsUnlocked,
    spendCents: full.lifetimeSpendCents,
    device: full.device,
    pageViewsLast30d: full.daySparkline.reduce((s, v) => s + v, 0),
    errorsObserved: full.errorsObserved,
    personality: full.personality,
    segment: full.segment,
    suggestions: full.suggestions,
  };
}

// ── Rollup writer (best-effort) ────────────────────────────────────────────
// Admin can trigger this from any per-actor page to cache the result.

export async function cacheUserRollup(uid: string): Promise<void> {
  try {
    const report = await getUserReport(uid);
    if (!report) return;
    const db = getDb();
    await setDoc(doc(db, COLLECTIONS.telemetryUserRollups, uid), {
      uid,
      lifetimeSessions: report.sessions,
      lifetimeMinutes: report.totalMinutes,
      lifetimeEvents: report.daySparkline.reduce((s, v) => s + v, 0),
      lifetimeErrors: report.errorsObserved,
      lifetimeSpendCents: report.lifetimeSpendCents,
      lastSeenAt: report.lastSeenAt,
      segment: report.segment,
      personality: report.personality,
      daySparkline: report.daySparkline,
      updatedAt: new Date().toISOString(),
      cachedAt: serverTimestamp(),
    });
  } catch {
    /* best-effort */
  }
}

// keep typescript happy with the unused collectionGroup import
void collectionGroup;
