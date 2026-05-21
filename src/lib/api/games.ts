import type {
  Game,
  GameDetail,
  GameId,
  RecommendationReason,
  ShelfGame,
} from "../types";
import { GAMES, buildGameDetail } from "../mock";
import { GAME_SEEDS } from "../mock/games";
import { slugify } from "../utils";
import { wait } from "./_delay";

/**
 * Catalog entry used by the launcher scanner — pairs the in-app `GameId` with
 * each external launcher's primary identifier so we can resolve a detected
 * game to our catalog without leaking the mock-data layout to consumers.
 *
 * Today we only persist a `steamAppId`; we'll add more as the v2/v3 scanner
 * modules ship.
 */
export interface ScannerCatalogEntry {
  id: GameId;
  name: string;
  steamAppId: string;
}

export function getScannerCatalog(): ScannerCatalogEntry[] {
  return GAME_SEEDS.map((s) => ({
    id: s.id,
    name: s.name,
    steamAppId: String(s.steamAppId),
  }));
}

export async function listGames(): Promise<Game[]> {
  await wait();
  return GAMES;
}

export async function getGame(id: GameId): Promise<Game | undefined> {
  await wait();
  return GAMES.find((g) => g.id === id);
}

export async function getGameDetail(id: GameId): Promise<GameDetail | undefined> {
  await wait(180);
  return buildGameDetail(id);
}

export async function listFeatured(): Promise<Game[]> {
  await wait();
  return GAMES.filter((g) => g.isFeatured);
}

export async function listTopSellers(limit = 12): Promise<Game[]> {
  await wait();
  return [...GAMES].sort((a, b) => a.salesRank - b.salesRank).slice(0, limit);
}

export async function listNewReleases(days = 90): Promise<Game[]> {
  await wait();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return GAMES.filter((g) => !g.comingSoon && new Date(g.releaseDate).getTime() >= cutoff);
}

export async function listSpecials(): Promise<Game[]> {
  await wait();
  return [...GAMES].filter((g) => g.isOnSale).sort((a, b) => b.price.discountPct - a.price.discountPct);
}

export async function listComingSoon(): Promise<Game[]> {
  await wait();
  return GAMES.filter((g) => g.comingSoon);
}

export async function listRecommended(tagSlugs: string[], limit = 12): Promise<Game[]> {
  await wait();
  if (tagSlugs.length === 0) {
    return [...GAMES].sort(() => Math.random() - 0.5).slice(0, limit);
  }
  return [...GAMES]
    .map((g) => ({
      g,
      score: g.tags.filter((t) => tagSlugs.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.g);
}

/**
 * Hidden Gems — promising titles flagged by their first ~50 reviewers but not
 * yet swamped by review volume. firstReviewersScore ≥ 80 and totalReviews
 * < 100k. Sorted by quality signal (desc).
 */
export async function listHiddenGems(limit = 12): Promise<Game[]> {
  await wait();
  return [...GAMES]
    .filter(
      (g) =>
        typeof g.firstReviewersScore === "number" &&
        g.firstReviewersScore >= 80 &&
        g.reviewSummary.totalReviews < 100_000,
    )
    .sort((a, b) => (b.firstReviewersScore ?? 0) - (a.firstReviewersScore ?? 0))
    .slice(0, limit);
}

/**
 * Games offering a free downloadable demo. Sorted by sales rank so the
 * highest-profile demos surface first.
 */
export async function listGamesWithDemos(limit = 12): Promise<Game[]> {
  await wait();
  return [...GAMES]
    .filter((g) => g.hasDemo)
    .sort((a, b) => a.salesRank - b.salesRank)
    .slice(0, limit);
}

// ── Home-page shelf composition (one-shot) ──────────────────────────────────

export interface HomeShelf {
  id:
    | "specials"
    | "new-trending"
    | "top-sellers"
    | "hidden-gems"
    | "demos"
    | "recommended";
  title: string;
  subtitle: string;
  entries: ShelfGame[];
}

function reasonForSpecial(game: Game): RecommendationReason {
  return {
    kind: "on-sale",
    label: `On sale — ${game.price.discountPct}% off`,
    detail:
      game.price.discountEndsAt != null
        ? `Discount ends ${new Date(game.price.discountEndsAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}`
        : undefined,
  };
}

function reasonForNewRelease(game: Game): RecommendationReason {
  return {
    kind: "new-release",
    label: "Released recently",
    detail: `Launched ${new Date(game.releaseDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`,
  };
}

function reasonForTopSeller(game: Game): RecommendationReason {
  return {
    kind: "top-seller",
    label: `Top seller (#${game.salesRank})`,
    detail: "Among today's best-selling titles",
  };
}

function reasonForHiddenGem(game: Game): RecommendationReason {
  return {
    kind: "hidden-gem",
    label: "Hidden gem",
    detail:
      typeof game.firstReviewersScore === "number"
        ? `${game.firstReviewersScore}% positive from the first ~50 reviewers`
        : "Promising early reviews",
  };
}

function reasonForDemo(_game: Game): RecommendationReason {
  return {
    kind: "free-promo",
    label: "Free demo available",
    detail: "Download and play a sampler before buying",
  };
}

function reasonForRecommended(
  game: Game,
  tagPool: string[],
): RecommendationReason {
  if (tagPool.length === 0) {
    return {
      kind: "tag-match",
      label: "A small sample of the catalog",
      detail: "Browse a few games to personalize this shelf",
    };
  }
  // Mirror the intersection logic used in listRecommended.
  const matched = game.tags.filter((t) => tagPool.includes(t));
  if (matched.length === 0) {
    return {
      kind: "tag-match",
      label: "Picked for variety",
      detail: "No direct tag matches — surfaced to broaden your feed",
    };
  }
  const tag = matched[0];
  const sharedCount = tagPool.filter((t) => t === tag).length || 1;
  // Use a friendly phrasing: count of recently-viewed pool entries that contribute that tag.
  const noun = sharedCount === 1 ? "one of your recently-viewed games" : `${sharedCount} of your recently-viewed games`;
  return {
    kind: "recently-viewed-similar",
    label: `Recommended because ${noun} ${
      sharedCount === 1 ? "is" : "are"
    } tagged ${tag}`,
    detail:
      matched.length > 1
        ? `Also matches: ${matched.slice(1, 3).join(", ")}`
        : undefined,
  };
}

/**
 * Composes the entire home-page shelf list in one shot. Each shelf entry is
 * paired with a per-game RecommendationReason so the UI can surface "why am I
 * seeing this?" transparency without re-deriving the logic.
 */
export async function listShelvesForHome(
  recentlyViewedTagPool: string[],
): Promise<{ shelves: HomeShelf[] }> {
  const [specials, newReleases, topSellers, hiddenGems, demos, recommended] =
    await Promise.all([
      listSpecials(),
      listNewReleases(),
      listTopSellers(),
      listHiddenGems(),
      listGamesWithDemos(),
      listRecommended(recentlyViewedTagPool),
    ]);

  const personalized = recentlyViewedTagPool.length > 0;

  const shelves: HomeShelf[] = [
    {
      id: "specials",
      title: "Specials",
      subtitle: "Discounts ending soon",
      entries: specials.map((g) => ({ game: g, reason: reasonForSpecial(g) })),
    },
    {
      id: "new-trending",
      title: "New & Trending",
      subtitle: "Released in the last 90 days",
      entries: newReleases.map((g) => ({
        game: g,
        reason: reasonForNewRelease(g),
      })),
    },
    {
      id: "top-sellers",
      title: "Top Sellers",
      subtitle: "What's moving today",
      entries: topSellers.map((g) => ({
        game: g,
        reason: reasonForTopSeller(g),
      })),
    },
    {
      id: "hidden-gems",
      title: "Hidden Gems",
      subtitle: "Promising indies before the crowd",
      entries: hiddenGems.map((g) => ({
        game: g,
        reason: reasonForHiddenGem(g),
      })),
    },
    {
      id: "demos",
      title: "Free demos available",
      subtitle: "Try before you buy",
      entries: demos.map((g) => ({ game: g, reason: reasonForDemo(g) })),
    },
    {
      id: "recommended",
      title: personalized ? "Recommended For You" : "You Might Like",
      subtitle: personalized
        ? "Based on what you've been looking at"
        : "A small sample of the catalog",
      entries: recommended.map((g) => ({
        game: g,
        reason: reasonForRecommended(g, recentlyViewedTagPool),
      })),
    },
  ];

  return { shelves };
}

export interface SearchFilters {
  q?: string;
  genres?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  platforms?: string[];
  onSaleOnly?: boolean;
  freeOnly?: boolean;
  minReviewPct?: number;
}

export async function searchGames(filters: SearchFilters): Promise<Game[]> {
  await wait();
  const q = filters.q?.toLowerCase().trim() ?? "";
  return GAMES.filter((g) => {
    if (q && !(g.name.toLowerCase().includes(q) || g.tags.some((t) => t.includes(q)))) return false;
    if (filters.genres?.length && !g.genres.some((x) => filters.genres!.includes(x))) return false;
    if (filters.tags?.length && !g.tags.some((x) => filters.tags!.includes(x))) return false;
    if (filters.platforms?.length && !g.platforms.some((x) => filters.platforms!.includes(x))) return false;
    if (filters.onSaleOnly && !g.isOnSale) return false;
    if (filters.freeOnly && !g.price.isFree) return false;
    if (filters.minPrice !== undefined && g.price.final < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && g.price.final > filters.maxPrice) return false;
    if (filters.minReviewPct !== undefined && g.reviewSummary.scorePct < filters.minReviewPct) return false;
    return true;
  });
}

export async function listGamesByCategory(slug: string): Promise<Game[]> {
  await wait();
  return GAMES.filter((g) => g.genres.includes(slug));
}

export async function listGamesByTag(slug: string): Promise<Game[]> {
  await wait();
  return GAMES.filter((g) => g.tags.includes(slug));
}

export async function listGamesByDeveloper(slug: string): Promise<Game[]> {
  await wait();
  return GAMES.filter((g) => slugify(g.developer) === slug);
}

export async function listGamesByPublisher(slug: string): Promise<Game[]> {
  await wait();
  return GAMES.filter((g) => slugify(g.publisher) === slug);
}
