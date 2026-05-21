import type { Achievement, GameId } from "../types";
import { randomFromSeed } from "./_seed";
import { getSeedById } from "./games";
import { achievementIconUrl } from "./images";

const NAMES = [
  ["First Light", "The smallest beginning"],
  ["Threshold", "Cross the first line"],
  ["Patient", "Wait when waiting hurts"],
  ["Open Hand", "Choose to give"],
  ["Cartographer", "Map the unmapped"],
  ["Witness", "See what others miss"],
  ["Sleepless", "Stay until morning"],
  ["Pilgrim", "Walk the whole road"],
  ["Companion", "Travel together"],
  ["Mender", "Repair what isn't yours"],
  ["Echo", "Hear it twice"],
  ["Stone Skipper", "Try again, lightly"],
  ["Gardener", "Grow something slow"],
  ["Bell-Ringer", "Mark a moment"],
  ["Ledger Keeper", "Settle a debt"],
  ["Lanternbearer", "Carry the small fire"],
  ["Quiet Mile", "Travel without speaking"],
  ["Salt Carrier", "Bring it home"],
  ["First Snow", "Stop and notice"],
  ["Sundown", "Finish on time"],
  ["Hand Over Hand", "Climb the long way"],
  ["Cardinal", "Find your bearings"],
  ["Foundling", "Carry what was left"],
  ["Long Letter", "Write the whole thing"],
  ["Open Window", "Let the season in"],
  ["First Star", "See it appear"],
  ["Last Word", "Say it properly"],
  ["Cinder", "Keep one ember alive"],
  ["Hollow", "Stand in the silence"],
  ["Coda", "End where you began"],
];

export function buildAchievements(gameId: GameId): Achievement[] {
  const seed = getSeedById(gameId);
  if (!seed) return [];
  const rand = randomFromSeed(`ach-${gameId}`);
  const count = Math.min(seed.achievementCount, NAMES.length);
  const list: Achievement[] = [];
  // Pareto-ish distribution: a few very common, many very rare.
  for (let i = 0; i < count; i++) {
    const [name, description] = NAMES[i % NAMES.length];
    const pct = Math.round((1 - Math.pow(rand(), 0.4)) * 100);
    list.push({
      id: `${gameId}-ach-${i + 1}`,
      name,
      description,
      iconUrl: achievementIconUrl(`${gameId}-${i}`),
      globalUnlockPct: Math.max(1, Math.min(99, pct)),
      hidden: rand() < 0.08,
    });
  }
  return list.sort((a, b) => b.globalUnlockPct - a.globalUnlockPct);
}
