import type { Depot, GameId, OSPlatform } from "../types";
import { randomFromSeed } from "./_seed";
import { getSeedById } from "./games";

export function buildDepots(gameId: GameId): Depot[] {
  const seed = getSeedById(gameId);
  if (!seed) return [];
  const rand = randomFromSeed(`depots-${gameId}`);
  const today = new Date();

  const depots: Depot[] = [];
  const platforms: (OSPlatform | "common")[] = ["common", ...seed.platforms];

  for (const platform of platforms) {
    const isCommon = platform === "common";
    const fraction = isCommon ? 0.25 : 0.75 / seed.platforms.length;
    const size = Math.round(seed.estimatedSizeBytes * fraction);
    const daysOld = Math.floor(rand() * 60);
    const updated = new Date(today);
    updated.setDate(updated.getDate() - daysOld);

    const platformLabel =
      platform === "common"
        ? "Common"
        : platform === "windows"
        ? "Windows 64-bit"
        : platform === "mac"
        ? "macOS"
        : "Linux 64-bit";

    const buildId = Math.floor(rand() * 9_000_000 + 1_000_000).toString();
    depots.push({
      id: `${gameId}-${platform}`,
      name: `${seed.name} — ${platformLabel}`,
      platform,
      sizeBytes: size,
      lastUpdated: updated.toISOString(),
      buildId,
    });
  }

  return depots;
}
