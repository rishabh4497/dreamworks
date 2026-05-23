import type { GameId, SpeedrunRun } from "../types";
import { collection, getDocs, query, where } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";

export type SpeedrunCategory = "Any% Unrestricted" | "All Bosses" | "Glitchless";

/**
 * Leaderboard runs for a game and optional category. Reads from
 * `dw_speedrun_runs` — until a real submission flow exists, the seed script
 * populates a handful of representative runs per game.
 */
export async function listSpeedrunRuns(input: {
  gameId?: GameId;
  category?: SpeedrunCategory;
}): Promise<SpeedrunRun[]> {
  const colRef = collection(getDb(), COLLECTIONS.speedrunRuns);
  const filters = [] as ReturnType<typeof where>[];
  if (input.gameId) filters.push(where("gameId", "==", input.gameId));
  if (input.category) filters.push(where("category", "==", input.category));
  const q = filters.length > 0 ? query(colRef, ...filters) : query(colRef);
  const snap = await getDocs(q);
  const out: SpeedrunRun[] = [];
  snap.forEach((d) => out.push(d.data() as SpeedrunRun));
  return out.sort((a, b) => a.rank - b.rank);
}
