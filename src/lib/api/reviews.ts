import type { GameId, Review } from "../types";
import { buildReviewsForGame } from "../mock";
import { getDb, COLLECTIONS } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  limit,
} from "firebase/firestore";

let seedingPromises: Record<string, Promise<void> | undefined> = {};

export async function ensureReviewsSeeded(gameId: GameId): Promise<void> {
  if (seedingPromises[gameId]) return seedingPromises[gameId];

  seedingPromises[gameId] = (async () => {
    const colRef = collection(getDb(), COLLECTIONS.reviews);
    const q = query(colRef, where("gameId", "==", gameId), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return;
    }

    console.log(`dw_reviews for game ${gameId} is empty, auto-seeding reviews from mock data...`);
    const seeded = buildReviewsForGame(gameId);
    
    // Write in chunks to support Firestore limits if needed (buildReviewsForGame returns ~6-12 reviews, so it's well below the 500 limit).
    const batch = writeBatch(getDb());
    for (const r of seeded) {
      const docRef = doc(getDb(), COLLECTIONS.reviews, r.id);
      batch.set(docRef, r);
    }
    await batch.commit();
    console.log(`Successfully seeded dw_reviews for game ${gameId}!`);
  })();

  return seedingPromises[gameId];
}

export async function listReviews(gameId: GameId): Promise<Review[]> {
  await ensureReviewsSeeded(gameId);
  const q = query(
    collection(getDb(), COLLECTIONS.reviews),
    where("gameId", "==", gameId)
  );
  const snap = await getDocs(q);
  const reviews: Review[] = [];
  snap.forEach((d) => {
    reviews.push(d.data() as Review);
  });
  return reviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
}
