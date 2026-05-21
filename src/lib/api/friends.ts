import type { Friend, FriendActivity, FriendStatus, GameId } from "../types";
import { FRIENDS, FRIEND_ACTIVITY } from "../mock";
import { FRIEND_OWNED } from "../mock/friends";
import { wait } from "./_delay";

export async function listFriends(): Promise<Friend[]> {
  await wait();
  return FRIENDS;
}

export async function listFriendActivity(): Promise<FriendActivity[]> {
  await wait();
  return FRIEND_ACTIVITY;
}

// Sort: in-game first, then online, then away, then offline. Friend index
// (stable position in the FRIENDS array) breaks ties for deterministic ordering.
const STATUS_RANK: Record<FriendStatus, number> = {
  "in-game": 0,
  online: 1,
  away: 2,
  offline: 3,
};

export async function listFriendsWhoOwn(gameId: GameId): Promise<Friend[]> {
  await wait();
  const indexByUid = new Map(FRIENDS.map((f, i) => [f.uid, i] as const));
  return FRIENDS
    .filter((f) => (FRIEND_OWNED[f.uid] ?? []).includes(gameId))
    .sort((a, b) => {
      const sd = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (sd !== 0) return sd;
      return (indexByUid.get(a.uid) ?? 0) - (indexByUid.get(b.uid) ?? 0);
    });
}
