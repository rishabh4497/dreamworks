import type { CompletionStats, HeatmapCell, LibraryValueBreakdown } from "../types";
import { getLibrary } from "./user";
import { listGames } from "./games";

export async function getLibraryValue(): Promise<LibraryValueBreakdown> {
  const [owned, games] = await Promise.all([getLibrary(), listGames()]);
  const gameById = new Map(games.map((g) => [g.id, g] as const));
  let totalSpent = 0;
  let currentRetail = 0;
  let unplayed = 0;
  let unplayedValue = 0;
  for (const entry of owned) {
    const game = gameById.get(entry.gameId);
    if (!game) continue;
    totalSpent += game.price.final;
    currentRetail += game.price.base;
    if (entry.playMinutes < 30) {
      unplayed += 1;
      unplayedValue += game.price.final;
    }
  }
  return {
    totalSpentCents: totalSpent,
    currentRetailCents: currentRetail,
    gamesOwned: owned.length,
    unplayedCount: unplayed,
    unplayedValueCents: unplayedValue,
  };
}

export async function getHoursHeatmap(): Promise<HeatmapCell[]> {
  // Heatmap requires a per-day session log which we do not capture yet.
  // Until then return a deterministic synthetic curve so the visualization
  // stays alive; replace with a `dw_play_sessions` aggregation when that
  // collection lands.
  const cells: HeatmapCell[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const day = d.getDay();
    const isWeekend = day === 0 || day === 6;
    // Stable seeded "random" so reloads paint the same picture per day.
    const seed = (d.getDate() * 131 + (d.getMonth() + 1) * 19 + d.getFullYear()) % 100;
    const minutes =
      seed < 45 ? 0 : Math.round((isWeekend ? 70 : 35) * (0.4 + (seed % 50) / 50));
    cells.push({ date: d.toISOString().slice(0, 10), minutesPlayed: minutes });
  }
  return cells;
}

export async function getCompletionStats(): Promise<CompletionStats> {
  const owned = await getLibrary();
  if (owned.length === 0) {
    return {
      achievementsUnlocked: 0,
      achievementsTotal: 0,
      perfectGames: 0,
      averageCompletionPct: 0,
    };
  }
  // We don't have per-game achievement totals yet; approximate by assuming
  // ~30 achievements per owned game. Replace with a join to the per-game
  // achievement counts once those land on the catalog doc.
  const total = owned.reduce((acc) => acc + 30, 0);
  const unlocked = owned.reduce((acc, e) => acc + e.achievementsUnlocked, 0);
  const perfect = owned.filter((e) => e.completionPct >= 100).length;
  const avg = Math.round(
    owned.reduce((a, e) => a + e.completionPct, 0) / owned.length,
  );
  return {
    achievementsUnlocked: unlocked,
    achievementsTotal: total,
    perfectGames: perfect,
    averageCompletionPct: avg,
  };
}
