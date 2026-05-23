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
import { getDb, COLLECTIONS } from "../firebase";
import { collection, getDocs, writeBatch, doc, getDoc } from "firebase/firestore";

/**
 * Catalog entry used by the launcher scanner — pairs the in-app `GameId` with
 * each external launcher's primary identifier so we can resolve a detected
 * game to our catalog without leaking the mock-data layout to consumers.
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

let seedingPromise: Promise<void> | null = null;

export async function ensureGamesSeeded(): Promise<void> {
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    const colRef = collection(getDb(), COLLECTIONS.games);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return;
    }

    console.log("dw_games collection is empty, auto-seeding games from mock data...");
    const batch = writeBatch(getDb());
    
    for (const g of GAMES) {
      const detail = buildGameDetail(g.id);
      if (!detail) continue;
      const docRef = doc(getDb(), COLLECTIONS.games, g.id);
      batch.set(docRef, detail);
    }
    await batch.commit();
    console.log("Successfully seeded dw_games!");
  })();

  return seedingPromise;
}

// ── Catalog snapshot cache ────────────────────────────────────────────────
//
// Every storefront screen needs the games catalog and most need it sliced
// many different ways. Without this layer a single Store Home visit fires
// 8+ full-collection reads against Firestore (one per shelf/list hook).
//
// Strategy:
//   1. One in-memory snapshot, refreshed at most every CATALOG_TTL_MS.
//   2. Concurrent callers share the same in-flight promise.
//   3. Successful loads are mirrored into sessionStorage so a tab reload
//      (or a new tab in the same session) skips Firestore entirely.
//   4. A tiny `dw_meta/catalog.version` doc (bumped by the seed script and
//      by mutations like publishApp) is checked on cache hit; if the
//      version drifted, the snapshot is busted in the background and the
//      next call returns fresh data. Stale-while-revalidate — the current
//      render still uses cache so the UX isn't blocked on the metadata
//      round trip.

const CATALOG_TTL_MS = 30 * 60 * 1000;
// Bumped from v1 → v2 so any browser still holding the pre-versioning
// snapshot is automatically migrated on first load.
const CATALOG_STORAGE_KEY = "dw_catalog_v2";

interface CatalogSnapshot {
  data: GameDetail[];
  cachedAt: number;
  /** Version stamp from `dw_meta/catalog`; null if metadata wasn't reachable. */
  version: number | null;
}

let catalogCache: GameDetail[] | null = null;
let catalogCachedAt = 0;
let catalogVersion: number | null = null;
let catalogInflight: Promise<GameDetail[]> | null = null;
let hydrationAttempted = false;
let revalidateInflight: Promise<void> | null = null;

function hydrateFromStorage(): void {
  if (hydrationAttempted) return;
  hydrationAttempted = true;
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return;
    const parsed: CatalogSnapshot = JSON.parse(raw);
    if (!parsed?.data || typeof parsed.cachedAt !== "number") return;
    if (Date.now() - parsed.cachedAt >= CATALOG_TTL_MS) return;
    catalogCache = parsed.data;
    catalogCachedAt = parsed.cachedAt;
    catalogVersion = typeof parsed.version === "number" ? parsed.version : null;
  } catch {
    // Corrupt entry or quota issue — ignore and re-fetch.
  }
}

function persistToStorage(data: GameDetail[], cachedAt: number, version: number | null): void {
  if (typeof window === "undefined") return;
  try {
    const snap: CatalogSnapshot = { data, cachedAt, version };
    window.sessionStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // QuotaExceededError or private-mode browser — non-fatal, we just lose
    // the cross-reload optimization.
  }
}

async function fetchCatalogVersion(): Promise<number | null> {
  try {
    const ref = doc(getDb(), COLLECTIONS.meta, "catalog");
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const v = (snap.data() as { version?: number }).version;
    return typeof v === "number" ? v : null;
  } catch {
    return null;
  }
}

async function loadCatalog(): Promise<{ data: GameDetail[]; version: number | null }> {
  await ensureGamesSeeded();
  const [snap, version] = await Promise.all([
    getDocs(collection(getDb(), COLLECTIONS.games)),
    fetchCatalogVersion(),
  ]);
  const results: GameDetail[] = [];
  snap.forEach((d) => results.push(d.data() as GameDetail));
  return { data: results, version };
}

/**
 * Stale-while-revalidate: returns immediately (no extra round trip) but if
 * the server's catalog version drifted from what we cached, busts the local
 * cache so the *next* `fetchAllFromDb` call re-fetches fresh data. Single
 * in-flight at a time so concurrent callers share the check.
 */
function revalidateInBackground(): void {
  if (revalidateInflight) return;
  if (typeof window === "undefined") return;
  revalidateInflight = (async () => {
    try {
      const serverVersion = await fetchCatalogVersion();
      if (serverVersion !== null && serverVersion !== catalogVersion) {
        invalidateCatalogCache();
      }
    } catch {
      /* swallow — best-effort */
    } finally {
      revalidateInflight = null;
    }
  })();
}

async function fetchAllFromDb(force = false): Promise<GameDetail[]> {
  if (!force) hydrateFromStorage();
  const now = Date.now();
  if (!force && catalogCache && now - catalogCachedAt < CATALOG_TTL_MS) {
    // Cache hit — fire a non-blocking version check so the next render sees
    // fresh data if the seed script or a mutation bumped `dw_meta/catalog`.
    revalidateInBackground();
    return catalogCache;
  }
  if (catalogInflight) return catalogInflight;
  catalogInflight = (async () => {
    try {
      const { data, version } = await loadCatalog();
      const cachedAt = Date.now();
      catalogCache = data;
      catalogCachedAt = cachedAt;
      catalogVersion = version;
      persistToStorage(data, cachedAt, version);
      return data;
    } finally {
      catalogInflight = null;
    }
  })();
  return catalogInflight;
}

/** Invalidate the in-memory catalog cache (call after publishing a new game). */
export function invalidateCatalogCache(): void {
  catalogCache = null;
  catalogCachedAt = 0;
  catalogVersion = null;
  hydrationAttempted = false;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(CATALOG_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}

export async function listGames(): Promise<Game[]> {
  return fetchAllFromDb();
}

export async function getGame(id: GameId): Promise<Game | undefined> {
  // Prefer the shared snapshot — avoids a per-card extra round trip when the
  // catalog is already loaded.
  if (catalogCache) {
    const hit = catalogCache.find((g) => g.id === id);
    if (hit) return hit;
  }
  await ensureGamesSeeded();
  const docRef = doc(getDb(), COLLECTIONS.games, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return undefined;
  return snap.data() as Game;
}

export async function getGameDetail(id: GameId): Promise<GameDetail | undefined> {
  if (catalogCache) {
    const hit = catalogCache.find((g) => g.id === id);
    if (hit) return hit;
  }
  await ensureGamesSeeded();
  const docRef = doc(getDb(), COLLECTIONS.games, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return undefined;
  return snap.data() as GameDetail;
}

export async function listFeatured(): Promise<Game[]> {
  const games = await fetchAllFromDb();
  return games.filter((g) => g.isFeatured);
}

export async function listTopSellers(limit = 12): Promise<Game[]> {
  const games = await fetchAllFromDb();
  return [...games].sort((a, b) => a.salesRank - b.salesRank).slice(0, limit);
}

export async function listNewReleases(days = 90): Promise<Game[]> {
  const games = await fetchAllFromDb();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return games.filter((g) => !g.comingSoon && new Date(g.releaseDate).getTime() >= cutoff);
}

export async function listSpecials(): Promise<Game[]> {
  const games = await fetchAllFromDb();
  return [...games].filter((g) => g.isOnSale).sort((a, b) => b.price.discountPct - a.price.discountPct);
}

export async function listComingSoon(): Promise<Game[]> {
  const games = await fetchAllFromDb();
  return games.filter((g) => g.comingSoon);
}

export async function listRecommended(tagSlugs: string[], limit = 12): Promise<Game[]> {
  const games = await fetchAllFromDb();
  if (tagSlugs.length === 0) {
    return [...games].sort(() => Math.random() - 0.5).slice(0, limit);
  }
  return [...games]
    .map((g) => ({
      g,
      score: g.tags.filter((t) => tagSlugs.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.g);
}

export async function listHiddenGems(limit = 12): Promise<Game[]> {
  const games = await fetchAllFromDb();
  return [...games]
    .filter(
      (g) =>
        typeof g.firstReviewersScore === "number" &&
        g.firstReviewersScore >= 80 &&
        g.reviewSummary.totalReviews < 100_000,
    )
    .sort((a, b) => (b.firstReviewersScore ?? 0) - (a.firstReviewersScore ?? 0))
    .slice(0, limit);
}

export async function listGamesWithDemos(limit = 12): Promise<Game[]> {
  const games = await fetchAllFromDb();
  return [...games]
    .filter((g) => g.hasDemo)
    .sort((a, b) => a.salesRank - b.salesRank)
    .slice(0, limit);
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
  const games = await fetchAllFromDb();
  const q = filters.q?.toLowerCase().trim() ?? "";
  return games.filter((g) => {
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
  const games = await fetchAllFromDb();
  return games.filter((g) => g.genres.includes(slug));
}

export async function listGamesByTag(slug: string): Promise<Game[]> {
  const games = await fetchAllFromDb();
  return games.filter((g) => g.tags.includes(slug));
}

export async function listGamesByDeveloper(slug: string): Promise<Game[]> {
  const games = await fetchAllFromDb();
  return games.filter((g) => slugify(g.developer) === slug);
}

export async function listGamesByPublisher(slug: string): Promise<Game[]> {
  const games = await fetchAllFromDb();
  return games.filter((g) => slugify(g.publisher) === slug);
}

