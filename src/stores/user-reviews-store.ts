import { create } from "zustand";
import type { GameId, Review, ReviewFacets } from "@/lib/types";
import { useAuthStore } from "./auth-store";
import { getDb, COLLECTIONS } from "@/lib/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

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

let lastUid: string | undefined = undefined;
let unsubscribeReviews: (() => void) | null = null;

useAuthStore.subscribe((state) => {
  const uid = state.profile?.uid;
  if (uid === lastUid) return;
  lastUid = uid;

  if (unsubscribeReviews) {
    unsubscribeReviews();
    unsubscribeReviews = null;
  }

  if (!uid) {
    useUserReviewsStore.setState({ byGame: {} });
    return;
  }

  const q = query(
    collection(getDb(), COLLECTIONS.reviews),
    where("userId", "==", uid)
  );

  unsubscribeReviews = onSnapshot(q, (snap) => {
    const byGame: Record<GameId, Review> = {};
    snap.forEach((d) => {
      const data = d.data() as Review;
      byGame[data.gameId] = data;
    });
    useUserReviewsStore.setState({ byGame });
  });
});
