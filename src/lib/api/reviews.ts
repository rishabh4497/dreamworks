import type { GameId, Review } from "../types";
import { getDb, COLLECTIONS } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function listReviews(gameId: GameId): Promise<Review[]> {
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
