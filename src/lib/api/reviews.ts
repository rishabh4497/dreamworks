import type { GameId, Review } from "../types";
import { buildReviewsForGame } from "../mock";
import { wait } from "./_delay";

export async function listReviews(gameId: GameId): Promise<Review[]> {
  await wait();
  return buildReviewsForGame(gameId);
}
