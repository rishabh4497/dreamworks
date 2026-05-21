import type { GameId, PlayerCountPoint } from "../types";
import { randomFromSeed } from "./_seed";
import { getSeedById } from "./games";

const DAYS = 365;

export function buildPlayerCountHistory(gameId: GameId): PlayerCountPoint[] {
  const seed = getSeedById(gameId);
  if (!seed) return [];
  const rand = randomFromSeed(`players-${gameId}`);

  const baseline = Math.max(seed.currentPlayers, 50);
  const today = new Date();

  const points: PlayerCountPoint[] = [];

  // Build a slow trend with weekly oscillation + sale spikes
  let trend = baseline * (0.6 + rand() * 0.6);

  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    // Slow drift
    trend = trend * (0.997 + rand() * 0.012);

    // Weekly bump on weekends
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6 ? 1.18 : 1.0;

    // Occasional spikes (sale / patch)
    const spike = rand() < 0.02 ? 1.5 + rand() : 1.0;

    const peak = Math.max(
      0,
      Math.round(trend * weekend * spike * (0.9 + rand() * 0.2)),
    );
    const avg = Math.round(peak * (0.55 + rand() * 0.15));
    points.push({ date: d.toISOString(), peak, avg });
  }

  // Force final point to match current snapshot from seed.
  const tail = points[points.length - 1];
  tail.peak = seed.peakPlayers24h;
  tail.avg = Math.round(seed.currentPlayers * 0.6);
  return points;
}
