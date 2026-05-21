import type { CompletionStats, HeatmapCell, LibraryValueBreakdown } from "../types";
import { GAMES, MOCK_LIBRARY } from "../mock";
import { wait } from "./_delay";

export async function getLibraryValue(): Promise<LibraryValueBreakdown> {
  await wait();
  const owned = MOCK_LIBRARY;
  let totalSpent = 0;
  let currentRetail = 0;
  let unplayed = 0;
  let unplayedValue = 0;
  for (const entry of owned) {
    const game = GAMES.find((g) => g.id === entry.gameId);
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
  await wait();
  const cells: HeatmapCell[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const day = d.getDay();
    const isWeekend = day === 0 || day === 6;
    const base = Math.random();
    const minutes =
      base < 0.5 ? 0 : Math.round((isWeekend ? 60 : 30) * (0.3 + Math.random() * 1.4));
    cells.push({ date: d.toISOString().slice(0, 10), minutesPlayed: minutes });
  }
  return cells;
}

export async function getCompletionStats(): Promise<CompletionStats> {
  await wait();
  const total = MOCK_LIBRARY.reduce((acc) => acc + 30, 0);
  const unlocked = MOCK_LIBRARY.reduce((acc, e) => acc + e.achievementsUnlocked, 0);
  return {
    achievementsUnlocked: unlocked,
    achievementsTotal: total,
    perfectGames: 1,
    averageCompletionPct: Math.round(
      MOCK_LIBRARY.reduce((a, e) => a + e.completionPct, 0) / Math.max(1, MOCK_LIBRARY.length),
    ),
  };
}
