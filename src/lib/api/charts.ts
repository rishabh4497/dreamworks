import type { ChartEntry, ChartType, Game, SalesEntry } from "../types";
import { GAMES } from "../mock";
import { wait } from "./_delay";

function rank(games: Game[], metric: (g: Game) => number): ChartEntry[] {
  return [...games]
    .map((g) => ({ g, metric: metric(g) }))
    .sort((a, b) => b.metric - a.metric)
    .map((x, i) => ({
      rank: i + 1,
      gameId: x.g.id,
      metric: x.metric,
      deltaFromYesterday: Math.round((Math.random() - 0.45) * 200),
    }));
}

export async function getChart(type: ChartType, limit = 50): Promise<ChartEntry[]> {
  await wait();
  let entries: ChartEntry[];
  switch (type) {
    case "top-played":
      entries = rank(GAMES, (g) => g.salesRank * -1 + 1000);
      // Use approximate currentPlayers from rank for visual variety
      entries = rank(GAMES, (g) => Math.round(220000 / Math.max(1, g.salesRank)));
      break;
    case "top-wishlisted":
      entries = rank(GAMES, (g) => Math.round(50000 / Math.max(1, g.salesRank)) + (g.comingSoon ? 30000 : 0));
      break;
    case "trending":
      entries = rank(GAMES, (g) =>
        Math.round((g.reviewSummary.scorePct - 70) * 100 + (g.isOnSale ? 5000 : 0) + Math.random() * 1000),
      );
      break;
    case "recently-updated":
      entries = rank(GAMES, (g) => Date.now() - new Date(g.releaseDate).getTime() * -1);
      break;
    case "free":
      entries = rank(
        GAMES.filter((g) => g.price.isFree || g.price.discountPct >= 75),
        (g) => g.price.discountPct,
      );
      break;
  }
  return entries.slice(0, limit);
}

export async function getCurrentDiscounts(sort: "discount" | "ending" = "discount"): Promise<SalesEntry[]> {
  await wait();
  const list = GAMES.filter((g) => g.isOnSale).map((g) => ({
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
