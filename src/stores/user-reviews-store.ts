import { create } from "zustand";
import type { GameId, Review, ReviewFacets } from "@/lib/types";
import { useAuthStore } from "./auth-store";
import { getDb, COLLECTIONS } from "@/lib/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { attachUserQuerySync } from "@/lib/store-factory";
import { track } from "@/lib/telemetry";

interface UserReviewPayload {
  recommended: boolean;
  body: string;
  facets?: ReviewFacets;
}

interface UserReviewsStore {
  byGame: Record<GameId, Review>;
  upsert: (
    gameId: GameId,
    author: { uid: string; name: string; avatarUrl: string; hoursPlayed: number },
    payload: UserReviewPayload,
  ) => Promise<Review>;
  remove: (gameId: GameId) => Promise<void>;
  get: (gameId: GameId) => Review | undefined;
}

export const useUserReviewsStore = create<UserReviewsStore>((_set, get) => ({
  byGame: {},

  upsert: async (gameId, author, payload) => {
    const existing = get().byGame[gameId];
    const docId = `${author.uid}_${gameId}`;
    const docRef = doc(getDb(), COLLECTIONS.reviews, docId);

    const review: Review = {
      id: docId,
      gameId,
      authorName: author.name,
      authorAvatarUrl: author.avatarUrl,
      authorHoursOnRecord: author.hoursPlayed,
      recommended: payload.recommended,
      postedAt: existing?.postedAt || new Date().toISOString(),
      body: payload.body,
      helpfulCount: existing?.helpfulCount || 0,
      funnyCount: existing?.funnyCount || 0,
      facets: payload.facets,
      // Store reference to filter/find
      userId: author.uid,
    } as any; // Cast as any because of possible extra userId field in type definitions

    await setDoc(docRef, review);
    track("review_submit", {
      gameId,
      recommended: payload.recommended,
      hasFacets: Boolean(payload.facets),
      isEdit: Boolean(existing),
    });
    return review;
  },

  remove: async (gameId) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    const docId = `${profile.uid}_${gameId}`;
    const docRef = doc(getDb(), COLLECTIONS.reviews, docId);
    await deleteDoc(docRef);
  },

  get: (gameId) => get().byGame[gameId],
}));

attachUserQuerySync<UserReviewsStore, Review>(useUserReviewsStore, {
  collectionKey: "reviews",
  field: "userId",
  mapDocs: (rows) => {
    const byGame: Record<GameId, Review> = {};
    for (const data of rows) byGame[data.gameId] = data;
    return { byGame };
  },
  empty: { byGame: {} },
});
