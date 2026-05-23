import type { GameId, SaveHistoryEntry } from "../types";
import { SAVE_HISTORY } from "../mock/save-history";
import { wait } from "./_delay";

// Per-game cloud-save Time Machine slot list. V1 returns the mock seed; when
// cloud-save history is migrated to Firestore, swap the implementation here
// without touching the consuming components.
export async function listSaveHistory(_gameId: GameId): Promise<SaveHistoryEntry[]> {
  await wait();
  return SAVE_HISTORY;
}
