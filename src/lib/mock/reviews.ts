import type { GameId, Review, ReviewFacets } from "../types";
import { randomFromSeed } from "./_seed";
import { avatarUrl } from "./images";
import { getSeedById } from "./games";

const AUTHORS = [
  "Aster",
  "Bree",
  "Calder",
  "Daphne",
  "Eshe",
  "Finn",
  "Goga",
  "Halle",
  "Ines",
  "Jude",
  "Kazu",
  "Lior",
  "Mira",
  "Nima",
  "Orla",
  "Pavel",
  "Quincey",
  "Riya",
  "Saoirse",
  "Tomas",
];

const PRO_BODIES = [
  "Genuinely struggling to put it down. The pacing is unreasonable, in the best way.",
  "Plays like the developers had a very specific feeling in mind and refused to compromise on it.",
  "The soundtrack alone is worth the price of admission. Everything else is gravy.",
  "I keep telling myself I'll stop at the next checkpoint. I have not stopped.",
  "Took me a while to click with it. Once it did, I was annoyed at every other game I'd played this year.",
  "Beautiful, sad, small. The kind of thing you press into someone's hand and don't explain.",
];
const CON_BODIES = [
  "Started strong but ran out of ideas about ten hours in. Wish there was more variety.",
  "Performance is rough on mid-range hardware. The patches help but it's not great.",
  "The combat is fine, the world is great, the menus are from another century.",
  "Feels like it needed another six months in the oven. I'll come back to it later.",
];

/**
 * Build a deterministic facet rating around a center value.
 * Reviewers on the negative path skew below 5; positive above 6.
 */
function buildFacets(rand: () => number, center: number): ReviewFacets {
  const jitter = () => Math.max(0, Math.min(10, center + (rand() - 0.5) * 4));
  return {
    gameplay: Math.round(jitter() * 10) / 10,
    story: Math.round(jitter() * 10) / 10,
    polish: Math.round(jitter() * 10) / 10,
    value: Math.round(jitter() * 10) / 10,
    accessibility: Math.round(jitter() * 10) / 10,
  };
}

export function buildReviewsForGame(gameId: GameId): Review[] {
  const rand = randomFromSeed(`reviews-${gameId}`);
  const count = 6 + Math.floor(rand() * 6);
  const reviews: Review[] = [];
  const today = new Date();
  const seed = getSeedById(gameId);
  const positiveCenter = seed ? Math.max(5, Math.min(9, seed.scorePct / 11)) : 7.5;
  for (let i = 0; i < count; i++) {
    const author = AUTHORS[Math.floor(rand() * AUTHORS.length)] + " " + String.fromCharCode(65 + Math.floor(rand() * 26));
    const recommended = rand() < 0.78;
    const pool = recommended ? PRO_BODIES : CON_BODIES;
    const body = pool[Math.floor(rand() * pool.length)];
    const daysAgoN = Math.floor(rand() * 240);
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgoN);
    // ~70% of reviewers also rate facets — the rest stay thumbs-only.
    const facets = rand() < 0.7
      ? buildFacets(rand, recommended ? positiveCenter : 3.5)
      : undefined;
    reviews.push({
      id: `${gameId}-rev-${i + 1}`,
      gameId,
      authorName: author,
      authorAvatarUrl: avatarUrl(author),
      authorHoursOnRecord: Math.round(2 + rand() * 120 * 10) / 10,
      recommended,
      postedAt: d.toISOString(),
      body,
      helpfulCount: Math.floor(rand() * 220),
      funnyCount: Math.floor(rand() * 90),
      facets,
    });
  }
  return reviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
}
