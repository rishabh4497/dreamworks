import type { Friend, FriendActivity, FriendStatus, GameId } from "../types";
import { FRIENDS, FRIEND_ACTIVITY } from "../mock";
import { FRIEND_OWNED } from "../mock/friends";
import { getDb } from "../firebase";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";

const FRIENDS_COL = "dw_friends";
const ACTIVITY_COL = "dw_friend_activity";
const OWNED_COL = "dw_friend_owned";

let seedingPromise: Promise<void> | null = null;

export async function ensureFriendsSeeded(): Promise<void> {
  if (seedingPromise) return seedingPromise;
  seedingPromise = (async () => {
    const snap = await getDocs(collection(getDb(), FRIENDS_COL));
    if (!snap.empty) return;

    const batch = writeBatch(getDb());
    for (const f of FRIENDS) {
      batch.set(doc(getDb(), FRIENDS_COL, f.uid), f);
    }
    for (const a of FRIEND_ACTIVITY) {
      const id = `${a.uid}_${a.at}`;
      batch.set(doc(getDb(), ACTIVITY_COL, id), a);
    }
    for (const [uid, gameIds] of Object.entries(FRIEND_OWNED)) {
      batch.set(doc(getDb(), OWNED_COL, uid), { uid, gameIds });
    }
    await batch.commit();
  })();
  return seedingPromise;
}

export async function listFriends(): Promise<Friend[]> {
  await ensureFriendsSeeded();
  const snap = await getDocs(collection(getDb(), FRIENDS_COL));
  const out: Friend[] = [];
  snap.forEach((d) => out.push(d.data() as Friend));
  return out;
}

export async function listFriendActivity(): Promise<FriendActivity[]> {
  await ensureFriendsSeeded();
  const snap = await getDocs(collection(getDb(), ACTIVITY_COL));
  const out: FriendActivity[] = [];
  snap.forEach((d) => out.push(d.data() as FriendActivity));
  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
}

// Sort: in-game first, then online, then away, then offline. Friend index
// (stable position in the FRIENDS array) breaks ties for deterministic ordering.
const STATUS_RANK: Record<FriendStatus, number> = {
  "in-game": 0,
  online: 1,
  away: 2,
  offline: 3,
};

/**
 * Returns the full friend → owned-game-ids map. Used by recommendation hooks
 * to score "your friends play this" suggestions across the catalog.
 */
export async function listFriendOwnership(): Promise<Record<string, GameId[]>> {
  await ensureFriendsSeeded();
  const snap = await getDocs(collection(getDb(), OWNED_COL));
  const out: Record<string, GameId[]> = {};
  snap.forEach((d) => {
    const data = d.data() as { uid: string; gameIds: GameId[] };
    out[data.uid] = data.gameIds;
  });
  return out;
}

export async function listFriendsWhoOwn(gameId: GameId): Promise<Friend[]> {
  await ensureFriendsSeeded();
  const [friendsSnap, ownedSnap] = await Promise.all([
    getDocs(collection(getDb(), FRIENDS_COL)),
    getDocs(collection(getDb(), OWNED_COL)),
  ]);
  const ownedMap = new Map<string, GameId[]>();
  ownedSnap.forEach((d) => {
    const data = d.data() as { uid: string; gameIds: GameId[] };
    ownedMap.set(data.uid, data.gameIds);
  });
  const friends: Friend[] = [];
  friendsSnap.forEach((d) => friends.push(d.data() as Friend));
  const indexByUid = new Map(friends.map((f, i) => [f.uid, i] as const));
  return friends
    .filter((f) => (ownedMap.get(f.uid) ?? []).includes(gameId))
    .sort((a, b) => {
      const sd = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (sd !== 0) return sd;
      return (indexByUid.get(a.uid) ?? 0) - (indexByUid.get(b.uid) ?? 0);
    });
}
