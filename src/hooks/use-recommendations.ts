import { useMemo } from "react";
import { useGames } from "@/hooks/use-games";
import { useLibraryStore } from "@/stores/library-store";
import { useFriends } from "@/hooks/use-friends";
// OK to import from mock here — it's data the friends API already exposes
// (mirrors what `listFriendsWhoOwn` does in `src/lib/api/friends.ts`).
import { FRIEND_OWNED } from "@/lib/mock/friends";
import type { Game, RecommendationReason } from "@/lib/types";

export interface RecRow {
  game: Game;
  reason: RecommendationReason;
}

/**
 * Behavior-based recommendations. Weights every catalog game by how much its
 * genres + tags overlap the genres/tags the user has actually played, then
 * boosts by the game's review score. Excludes games already owned.
 */
export function useBehaviorRecs(limit = 6): RecRow[] {
  const { data: games } = useGames();
  const entries = useLibraryStore((s) => s.entries);

  return useMemo(() => {
    if (!games || entries.length === 0) return [];

    const ownedIds = new Set(entries.map((e) => e.gameId));
    const gamesById = new Map(games.map((g) => [g.id, g] as const));

    const genreWeights = new Map<string, number>();
    const tagWeights = new Map<string, number>();
    for (const entry of entries) {
      const g = gamesById.get(entry.gameId);
      if (!g) continue;
      const weight = Math.max(entry.playMinutes, 1);
      for (const genre of g.genres) {
        genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + weight);
      }
      for (const tag of g.tags) {
        tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + weight);
      }
    }

    const topGenre = [...genreWeights.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    const scored = games
      .filter((g) => !ownedIds.has(g.id))
      .map((g) => {
        const genreOverlap = g.genres.reduce((s, x) => s + (genreWeights.get(x) ?? 0), 0);
        const tagOverlap = g.tags.reduce((s, x) => s + (tagWeights.get(x) ?? 0), 0);
        return {
          game: g,
          score: (genreOverlap * 2 + tagOverlap) * g.reviewSummary.scorePct,
        };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ game }) => ({
      game,
      reason: {
        kind: "tag-match" as const,
        label: topGenre
          ? `Because you play ${topGenre.toLowerCase()} games`
          : "Matches your taste",
      },
    }));
  }, [games, entries, limit]);
}

/**
 * Friend-based recommendations. Counts how many of the user's friends own each
 * game (skipping anything the user already owns), then ranks by friend count
 * weighted by the game's review score.
 */
export function useFriendRecs(limit = 6): RecRow[] {
  const { data: games } = useGames();
  const { data: friends } = useFriends();
  const entries = useLibraryStore((s) => s.entries);

  return useMemo(() => {
    if (!games || !friends || friends.length === 0) return [];

    const ownedIds = new Set(entries.map((e) => e.gameId));
    const gamesById = new Map(games.map((g) => [g.id, g] as const));

    // gameId → set of friend uids who own it.
    const ownersByGame = new Map<string, Set<string>>();
    for (const friend of friends) {
      const ownedList = FRIEND_OWNED[friend.uid] ?? [];
      for (const gameId of ownedList) {
        if (ownedIds.has(gameId)) continue;
        if (!ownersByGame.has(gameId)) ownersByGame.set(gameId, new Set());
        ownersByGame.get(gameId)!.add(friend.uid);
      }
    }

    const candidates = [...ownersByGame.entries()]
      .map(([gameId, owners]) => ({ game: gamesById.get(gameId), count: owners.size }))
      .filter((c): c is { game: Game; count: number } => !!c.game && c.count >= 1)
      .sort(
        (a, b) =>
          b.count * (b.game.reviewSummary.scorePct / 100) -
          a.count * (a.game.reviewSummary.scorePct / 100),
      )
      .slice(0, limit);

    return candidates.map(({ game, count }) => ({
      game,
      reason: {
        kind: "tag-match" as const,
        label: `${count} of your friends play this`,
      },
    }));
  }, [games, friends, entries, limit]);
}
