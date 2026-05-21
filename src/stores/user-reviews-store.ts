import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameId, Review, ReviewFacets } from "@/lib/types";

interface UserReviewPayload {
  recommended: boolean;
  body: string;
  facets?: ReviewFacets;
}

interface UserReviewsStore {
  /** One review per gameId — Steam-style "your review for {game}". */
  byGame: Record<GameId, Review>;
  upsert: (
    gameId: GameId,
    author: { uid: string; name: string; avatarUrl: string; hoursPlayed: number },
    payload: UserReviewPayload,
  ) => Review;
  remove: (gameId: GameId) => void;
  get: (gameId: GameId) => Review | undefined;
}

export const useUserReviewsStore = create<UserReviewsStore>()(
  persist(
    (set, get) => ({
      byGame: {},

      upsert: (gameId, author, payload) => {
        const existing = get().byGame[gameId];
        const review: Review = {
          id: existing?.id ?? `user-${author.uid}-${gameId}`,
          gameId,
          authorName: author.name,
          authorAvatarUrl: author.avatarUrl,
          authorHoursOnRecord: author.hoursPlayed,
          recommended: payload.recommended,
          postedAt: existing?.postedAt ?? new Date().toISOString(),
          body: payload.body,
          helpfulCount: existing?.helpfulCount ?? 0,
          funnyCount: existing?.funnyCount ?? 0,
          facets: payload.facets,
        };
        set((s) => ({ byGame: { ...s.byGame, [gameId]: review } }));
        return review;
      },

      remove: (gameId) => {
        set((s) => {
          const next = { ...s.byGame };
          delete next[gameId];
          return { byGame: next };
        });
      },

      get: (gameId) => get().byGame[gameId],
    }),
    { name: "dreamworks-user-reviews" },
  ),
);
