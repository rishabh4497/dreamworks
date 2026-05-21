import type { Friend, FriendActivity, FriendActivityKind, GameId } from "../types";
import { avatarUrl } from "./images";
import { GAMES } from "./games";
import { randomFromSeed } from "./_seed";

const NAMES = [
  "kira_w",
  "low.tide",
  "bytecount",
  "ferris",
  "annika.io",
  "porter",
  "magna",
  "h.ward",
  "obsidian",
  "saoirse",
];

export const FRIENDS: Friend[] = NAMES.map((n, i) => {
  const inGame = i % 3 === 0;
  const offline = i % 4 === 1;
  return {
    uid: `friend-${i + 1}`,
    displayName: n,
    avatarUrl: avatarUrl(n),
    status: inGame ? "in-game" : offline ? "offline" : i % 5 === 0 ? "away" : "online",
    currentGameId: inGame ? GAMES[i % GAMES.length].id : null,
    lastSeen: new Date(Date.now() - i * 1000 * 60 * 47).toISOString(),
  };
});

const KINDS: FriendActivityKind[] = [
  "achievement-unlocked",
  "added-to-library",
  "review-posted",
  "now-playing",
];

export const FRIEND_ACTIVITY: FriendActivity[] = FRIENDS.flatMap((f, i) => {
  const kind = KINDS[i % KINDS.length];
  const game = GAMES[(i * 3) % GAMES.length];
  const at = new Date(Date.now() - i * 1000 * 60 * 90).toISOString();
  const payload =
    kind === "achievement-unlocked"
      ? "Unlocked First Light"
      : kind === "added-to-library"
      ? "Added to library"
      : kind === "review-posted"
      ? "Posted a review"
      : "Started playing";
  return [{ uid: f.uid, kind, gameId: game.id, payload, at }];
});

/**
 * Deterministic "which friends own which games" map keyed by friend uid.
 * Built at module load using a seeded RNG per friend so reloads are stable.
 *
 * After the random pass we explicitly ensure the top-three "discovery" titles
 * (Elden Ring, Cyberpunk 2077, Black Myth: Wukong) each have at least three
 * owners, so the GameDetailPage "Friends who own this" card is always
 * populated for the canonical demo titles.
 */
function buildFriendOwned(): Record<string, GameId[]> {
  const out: Record<string, GameId[]> = {};
  const allIds = GAMES.map((g) => g.id);
  for (const f of FRIENDS) {
    const rand = randomFromSeed(`friend-lib-${f.uid}`);
    // 3–6 games per friend.
    const count = 3 + Math.floor(rand() * 4);
    const picked = new Set<GameId>();
    let guard = 0;
    while (picked.size < count && guard < 100) {
      const idx = Math.floor(rand() * allIds.length);
      picked.add(allIds[idx]);
      guard++;
    }
    out[f.uid] = Array.from(picked);
  }

  // Deterministic injection: each of the three guarantee games must have at
  // least 3 owners among the friends list.
  const GUARANTEE: GameId[] = ["elden-ring", "cyberpunk-2077", "black-myth-wukong"];
  for (const gameId of GUARANTEE) {
    const owners = FRIENDS.filter((f) => out[f.uid].includes(gameId));
    if (owners.length >= 3) continue;
    const needed = 3 - owners.length;
    // Add to the first N friends that don't already own it, stable by index.
    let added = 0;
    for (const f of FRIENDS) {
      if (added >= needed) break;
      if (out[f.uid].includes(gameId)) continue;
      out[f.uid] = [...out[f.uid], gameId];
      added++;
    }
  }

  return out;
}

export const FRIEND_OWNED: Record<string, GameId[]> = buildFriendOwned();
