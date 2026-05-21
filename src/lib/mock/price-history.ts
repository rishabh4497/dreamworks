import type { GameId, HistoricalLows, PriceHistoryPoint } from "../types";
import { randomFromSeed } from "./_seed";
import { getSeedById } from "./games";

const DAYS = 365;

export function buildPriceHistory(gameId: GameId): PriceHistoryPoint[] {
  const seed = getSeedById(gameId);
  if (!seed) return [];
  const rand = randomFromSeed(`price-${gameId}`);
  const base = seed.baseCents;
  const today = new Date();

  const points: PriceHistoryPoint[] = [];

  let runDiscount = 0;
  let runRemaining = 0;

  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    if (runRemaining <= 0) {
      // Roll for a new sale every day
      if (rand() < 0.04) {
        const variants = [10, 20, 25, 33, 40, 50, 60, 75];
        runDiscount = variants[Math.floor(rand() * variants.length)];
        runRemaining = 3 + Math.floor(rand() * 10);
      } else {
        runDiscount = 0;
      }
    }

    const final = runDiscount > 0 ? Math.round(base * (1 - runDiscount / 100) / 100) * 100 : base;
    points.push({
      date: d.toISOString(),
      cents: final,
      discountPct: runDiscount,
    });

    if (runRemaining > 0) runRemaining--;
  }

  // Final point reflects the seed's current discount, if any.
  if (seed.finalCents && seed.finalCents < base) {
    const tail = points[points.length - 1];
    tail.cents = seed.finalCents;
    tail.discountPct = Math.round(((base - seed.finalCents) / base) * 100);
  }

  return points;
}

export function buildHistoricalLows(gameId: GameId): HistoricalLows {
  const history = buildPriceHistory(gameId);
  const seed = getSeedById(gameId);
  const current = history[history.length - 1]?.cents ?? seed?.baseCents ?? 0;
  const allTimeLow = history.reduce((acc, p) => Math.min(acc, p.cents), Number.POSITIVE_INFINITY);

  const oneYear = history;
  const lastYearLow = oneYear.reduce((acc, p) => Math.min(acc, p.cents), Number.POSITIVE_INFINITY);

  const oneMonth = history.slice(-30);
  const lastMonthLow = oneMonth.reduce((acc, p) => Math.min(acc, p.cents), Number.POSITIVE_INFINITY);

  return {
    allTimeLow,
    lastYearLow,
    lastMonthLow,
    currentPrice: current,
  };
}
