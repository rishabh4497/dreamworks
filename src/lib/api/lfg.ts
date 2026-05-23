import type { GameId, LfgGroup } from "../types";
import { collection, getDocs, query, where } from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";

/**
 * Listed LFG groups for a game. Distinct from `dw_lfg_posts` (board entries) —
 * groups are stable invite-able rosters, posts are transient session requests.
 */
export async function listLfgGroups(gameId: GameId): Promise<LfgGroup[]> {
  if (!gameId) return [];
  const q = query(
    collection(getDb(), COLLECTIONS.lfgGroups),
    where("gameId", "==", gameId),
  );
  const snap = await getDocs(q);
  const out: LfgGroup[] = [];
  snap.forEach((d) => out.push(d.data() as LfgGroup));
  return out;
}
