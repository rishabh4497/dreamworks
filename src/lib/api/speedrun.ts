import type { GameId, SpeedrunRun } from "../types";
import { SPEEDRUN_RUNS } from "../mock/speedrun-runs";
import { wait } from "./_delay";

export type SpeedrunCategory = "Any% Unrestricted" | "All Bosses" | "Glitchless";

export async function listSpeedrunRuns(input: {
  gameId?: GameId;
  category?: SpeedrunCategory;
}): Promise<SpeedrunRun[]> {
  await wait();
  void input;
  return SPEEDRUN_RUNS;
}
