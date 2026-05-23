import type { GameId, LfgGroup } from "../types";
import { LFG_GROUPS } from "../mock/lfg-groups";
import { wait } from "./_delay";

export async function listLfgGroups(_gameId: GameId): Promise<LfgGroup[]> {
  await wait();
  return LFG_GROUPS;
}
