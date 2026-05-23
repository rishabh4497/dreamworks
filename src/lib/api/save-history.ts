import type { GameId, SaveHistoryEntry } from "../types";
import { collection, getDocs } from "firebase/firestore";
import { COLLECTIONS, USER_SUBCOLLECTIONS, getDb, getFirebaseAuth } from "../firebase";

/**
 * Per-game cloud-save Time Machine entries. Stored as a sub-doc under the
 * signed-in user, so each user sees their own restore points. Returns an
 * empty list when there's no auth — anonymous viewers don't have saves.
 */
export async function listSaveHistory(gameId: GameId): Promise<SaveHistoryEntry[]> {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid || !gameId) return [];
  const ref = collection(
    getDb(),
    COLLECTIONS.users,
    uid,
    USER_SUBCOLLECTIONS.saveHistory,
    gameId,
    "entries",
  );
  const snap = await getDocs(ref);
  const out: SaveHistoryEntry[] = [];
  snap.forEach((d) => out.push(d.data() as SaveHistoryEntry));
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}
