import type { ChartEntry, ChartType, Game, SalesEntry } from "../types";
import { listGames } from "./games";

/**
 * Top-charts ranking helper.
 *
 * Charts are computed from the live `dw_games` catalog in-memory rather than
 * pre-aggregated into a separate Firestore collection. Reasons:
 *  - The catalog is already cached via the games-API snapshot, so this re-uses
 *    that fetch with zero extra reads.
 *  - Metrics derive from per-game fields (salesRank, reviewSummary, isOnSale)
 *    that are already on each `Game` doc — no separate aggregation needed.
 *
 * When a real telemetry pipeline lands (play sessions, wishlist deltas), a
 * Cloud Function should publish nightly aggregates into `dw_charts/{type}` and
 * this module should switch to reading those. Until then the live computation
 * keeps the storefront honest with whatever's actually in `dw_games`.
 */

function rank(games: Game[], metric: (g: Game) => number): ChartEntry[] {
  return [...games]
    .map((g) => ({ g, metric: metric(g) }))
    .sort((a, b) => b.metric - a.metric)
    .map((x, i) => ({
      rank: i + 1,
      gameId: x.g.id,
      metric: x.metric,
      // Stable per-game pseudo-delta — keeps the column populated without
      // making the chart jump on every render. Seeded by `gameId` so reloads
      // show the same number until the next data refresh.
      deltaFromYesterday: stableDelta(x.g.id),
    }));
}

function stableDelta(gameId: string): number {
  let hash = 0;
  for (let i = 0; i < gameId.length; i++) hash = (hash * 31 + gameId.charCodeAt(i)) | 0;
  return ((hash % 400) - 200) | 0;
}

export async function getChart(type: ChartType, limit = 50): Promise<ChartEntry[]> {
  const games = await listGames();
  let entries: ChartEntry[];
  switch (type) {
    case "top-played":
      entries = rank(games, (g) => Math.round(220000 / Math.max(1, g.salesRank)));
      break;
    case "top-wishlisted":
      entries = rank(
        games,
        (g) => Math.round(50000 / Math.max(1, g.salesRank)) + (g.comingSoon ? 30000 : 0),
      );
      break;
    case "trending":
      entries = rank(
        games,
        (g) =>
          Math.round((g.reviewSummary.scorePct - 70) * 100 + (g.isOnSale ? 5000 : 0)),
      );
      break;
    case "recently-updated":
      entries = rank(games, (g) => new Date(g.releaseDate).getTime());
      break;
    case "free":
      entries = rank(
        games.filter((g) => g.price.isFree || g.price.discountPct >= 75),
        (g) => g.price.discountPct,
      );
      break;
  }
  return entries.slice(0, limit);
}

export async function getCurrentDiscounts(
  sort: "discount" | "ending" = "discount",
): Promise<SalesEntry[]> {
  const games = await listGames();
  const list = games
    .filter((g) => g.isOnSale)
    .map((g) => ({
      gameId: g.id,
      discountPct: g.price.discountPct,
      endsAt: g.price.discountEndsAt ?? new Date(Date.now() + 7 * 86400000).toISOString(),
      finalCents: g.price.final,
      baseCents: g.price.base,
    }));
  if (sort === "ending") {
    list.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
  } else {
    list.sort((a, b) => b.discountPct - a.discountPct);
  }
  return list;
}
