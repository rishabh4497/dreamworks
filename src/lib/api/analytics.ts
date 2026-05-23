import { collection, getDocs, query, where } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type {
  AchievementCompletionRow,
  App,
  GameDetail,
  Order,
  PortfolioKpis,
  ReviewLabelBreakdown,
  ReviewSummary,
  RevenuePoint,
  WishlistTrendPoint,
} from "../types";

// ── Firestore reads (small surface; keep cheap) ────────────────────────────

export async function countWishlistsForApp(appId: string): Promise<number> {
  if (!appId) return 0;
  const q = query(collection(getDb(), COLLECTIONS.wishlist), where("gameId", "==", appId));
  const snap = await getDocs(q);
  return snap.size;
}

export async function getWishlistEntriesForApp(appId: string): Promise<{ addedAt: string }[]> {
  if (!appId) return [];
  const q = query(collection(getDb(), COLLECTIONS.wishlist), where("gameId", "==", appId));
  const snap = await getDocs(q);
  const out: { addedAt: string }[] = [];
  snap.forEach((d) => {
    const v = d.data() as { addedAt?: string };
    if (v.addedAt) out.push({ addedAt: v.addedAt });
  });
  return out;
}

export async function getOrdersForApp(appId: string): Promise<Order[]> {
  if (!appId) return [];
  const q = query(
    collection(getDb(), COLLECTIONS.orders),
    where("gameIds", "array-contains", appId),
  );
  const snap = await getDocs(q);
  const out: Order[] = [];
  snap.forEach((d) => out.push(d.data() as Order));
  return out;
}

// ── Pure derivation (no Firestore) ─────────────────────────────────────────

export function computePortfolioKpis(args: {
  apps: App[];
  details: (GameDetail | null | undefined)[];
  wishlistsByApp: Record<string, number>;
  revenueByApp: Record<string, number>;
}): PortfolioKpis {
  const { apps, details, wishlistsByApp, revenueByApp } = args;
  const totalApps = apps.length;
  const totalWishlists = Object.values(wishlistsByApp).reduce((s, n) => s + n, 0);
  const totalRevenueCents = Object.values(revenueByApp).reduce((s, n) => s + n, 0);

  let totalCurrentPlayers = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  for (const d of details) {
    if (!d) continue;
    totalCurrentPlayers += d.currentPlayers ?? 0;
    if (d.reviewSummary?.scorePct != null) {
      scoreSum += d.reviewSummary.scorePct;
      scoreCount += 1;
    }
  }
  const avgReviewScore = scoreCount ? Math.round(scoreSum / scoreCount) : 0;
  return {
    totalApps,
    totalWishlists,
    totalRevenueCents,
    totalCurrentPlayers,
    avgReviewScore,
  };
}

export function wishlistTrend(entries: { addedAt: string }[]): WishlistTrendPoint[] {
  if (!entries.length) return [];
  // Bucket by week (ISO week start = Monday). Cumulative count.
  const buckets = new Map<number, number>();
  for (const e of entries) {
    const d = new Date(e.addedAt);
    if (Number.isNaN(d.getTime())) continue;
    const day = d.getUTCDay(); // 0=Sun..6=Sat
    const diff = (day + 6) % 7; // days back to Monday
    const weekStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff);
    buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + 1);
  }
  const sorted = Array.from(buckets.keys()).sort((a, b) => a - b);
  let running = 0;
  const out: WishlistTrendPoint[] = [];
  for (const k of sorted) {
    running += buckets.get(k)!;
    out.push({ date: new Date(k).toISOString(), count: running });
  }
  return out;
}

export function revenueTrend(orders: Order[], appId: string): RevenuePoint[] {
  if (!orders.length) return [];
  const buckets = new Map<number, number>();
  for (const o of orders) {
    if (!o.gameIds?.includes(appId)) continue;
    if (o.refunded) continue;
    const share = (o.totalCents ?? 0) / Math.max(1, o.gameIds.length);
    const d = new Date(o.placedAt);
    if (Number.isNaN(d.getTime())) continue;
    const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    buckets.set(monthStart, (buckets.get(monthStart) ?? 0) + share);
  }
  const sorted = Array.from(buckets.keys()).sort((a, b) => a - b);
  return sorted.map((k) => ({
    date: new Date(k).toISOString(),
    cents: Math.round(buckets.get(k)!),
  }));
}

export function revenueForAppCents(orders: Order[], appId: string): number {
  let total = 0;
  for (const o of orders) {
    if (!o.gameIds?.includes(appId)) continue;
    if (o.refunded) continue;
    total += (o.totalCents ?? 0) / Math.max(1, o.gameIds.length);
  }
  return Math.round(total);
}

export function reviewLabelBreakdown(summary: ReviewSummary | undefined): ReviewLabelBreakdown[] {
  if (!summary) return [];
  const total = summary.totalReviews || 1;
  // ReviewSummary only carries aggregate label/score, not per-label counts.
  // Synthesize a plausible 4-bucket distribution from scorePct so the bar chart
  // is informative; real telemetry would replace this with per-label counts.
  const positive = Math.round((summary.scorePct / 100) * total);
  const negative = total - positive;
  const recentPositive = Math.round((summary.recentScorePct / 100) * (summary.recentTotal || 0));
  const recentNegative = (summary.recentTotal || 0) - recentPositive;
  const rows: ReviewLabelBreakdown[] = [
    { label: "Very Positive", count: positive - recentPositive, pct: 0 },
    { label: "Positive", count: recentPositive, pct: 0 },
    { label: "Mixed", count: Math.max(0, Math.round(total * 0.05)), pct: 0 },
    { label: "Negative", count: Math.max(0, negative - recentNegative), pct: 0 },
    { label: "Very Negative", count: recentNegative, pct: 0 },
  ];
  const sum = rows.reduce((s, r) => s + r.count, 0) || 1;
  return rows.map((r) => ({ ...r, pct: Math.round((r.count / sum) * 100) }));
}

export function achievementCompletionRows(
  detail: GameDetail | null | undefined,
): AchievementCompletionRow[] {
  if (!detail?.achievements) return [];
  return detail.achievements.map((a) => ({
    id: a.id,
    name: a.name,
    iconUrl: a.iconUrl,
    hidden: a.hidden,
    unlockedPct: typeof a.globalUnlockPct === "number" ? a.globalUnlockPct : null,
  }));
}

export function wishlistToPurchaseConversion(
  wishlistCount: number,
  ordersCount: number,
): { pct: number; ratio: string } {
  if (wishlistCount === 0) return { pct: 0, ratio: "—" };
  const pct = Math.round((ordersCount / wishlistCount) * 100);
  return { pct, ratio: `${ordersCount} / ${wishlistCount}` };
}
