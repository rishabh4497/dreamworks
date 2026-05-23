import { useQuery } from "@tanstack/react-query";
import {
  getGameDetail,
  listComingSoon,
  listGames,
  listGamesByCategory,
  listGamesByDeveloper,
  listGamesByPublisher,
  listGamesByTag,
  listGamesWithDemos,
  listHiddenGems,
  listNewReleases,
  listRecommended,
  listShelvesForHome,
  listSpecials,
  listTopSellers,
  searchGames,
  type SearchFilters,
} from "@/lib/api/games";
import type { Game, GameDetail, GameId } from "@/lib/types";
import { slugify } from "@/lib/utils";

// ── Cache strategy ────────────────────────────────────────────────────────
//
// The catalog rarely changes once seeded. Every storefront / shelf / filter
// hook below shares the same root query key `gameKeys.list()` so React Query
// runs the underlying fetch ONCE per stale interval no matter how many hooks
// are mounted on a page. The per-hook variants use `select` to slice the
// shared snapshot in memory (essentially free) instead of re-fetching.

const CATALOG_STALE_MS = 10 * 60 * 1000; // 10 min
const CATALOG_GC_MS = 30 * 60 * 1000; // keep evicted entries in cache 30 min

export const gameKeys = {
  all: ["games"] as const,
  list: () => [...gameKeys.all, "list"] as const,
  detail: (id: GameId) => [...gameKeys.all, "detail", id] as const,
  summary: (id: GameId) => [...gameKeys.all, "summary", id] as const,
  // The keys below are preserved for any external callers / cache
  // invalidation patterns, but the underlying queries reuse `list()` so they
  // share the cache.
  featured: () => [...gameKeys.all, "featured"] as const,
  topSellers: () => [...gameKeys.all, "top-sellers"] as const,
  newReleases: () => [...gameKeys.all, "new-releases"] as const,
  specials: () => [...gameKeys.all, "specials"] as const,
  comingSoon: () => [...gameKeys.all, "coming-soon"] as const,
  hiddenGems: () => [...gameKeys.all, "hidden-gems"] as const,
  demos: () => [...gameKeys.all, "demos"] as const,
  recommended: (tags: string[]) => [...gameKeys.all, "recommended", tags] as const,
  homeShelves: (tags: string[]) => [...gameKeys.all, "home-shelves", tags] as const,
  search: (filters: SearchFilters) => [...gameKeys.all, "search", filters] as const,
  category: (slug: string) => [...gameKeys.all, "category", slug] as const,
  tag: (slug: string) => [...gameKeys.all, "tag", slug] as const,
  developer: (slug: string) => [...gameKeys.all, "developer", slug] as const,
  publisher: (slug: string) => [...gameKeys.all, "publisher", slug] as const,
};

const CATALOG_OPTS = {
  queryKey: gameKeys.list(),
  queryFn: listGames,
  staleTime: CATALOG_STALE_MS,
  gcTime: CATALOG_GC_MS,
} as const;

// ── Root query: every other list hook below reuses this cache entry ──────
export function useGames() {
  return useQuery({ ...CATALOG_OPTS });
}

// `useCatalogSelect` runs against the shared root cache and slices in memory.
// React Query keeps a single underlying fetch per stale interval; `select`
// runs cheaply on the cached snapshot.
function useCatalogSelect<T>(select: (games: Game[]) => T) {
  return useQuery({
    ...CATALOG_OPTS,
    select,
  });
}

export function useGame(id: GameId | undefined) {
  return useQuery({
    ...CATALOG_OPTS,
    select: (games) => (id ? games.find((g) => g.id === id) : undefined),
    enabled: !!id,
  });
}

// Full GameDetail per id. Backed by the same shared catalog when possible,
// otherwise falls back to a direct doc fetch (useful when a deep link arrives
// before the catalog has been loaded).
export function useGameDetail(id: GameId | undefined) {
  const catalog = useGames();
  return useQuery({
    queryKey: id ? gameKeys.detail(id) : ["disabled"],
    queryFn: () => getGameDetail(id!),
    enabled: !!id && !catalog.isLoading,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
    initialData: () => {
      if (!id || !catalog.data) return undefined;
      return catalog.data.find((g) => g.id === id) as GameDetail | undefined;
    },
  });
}

export function useFeatured() {
  return useCatalogSelect((games) => games.filter((g) => g.isFeatured));
}

export function useTopSellers(limit = 12) {
  return useCatalogSelect((games) =>
    [...games].sort((a, b) => a.salesRank - b.salesRank).slice(0, limit),
  );
}

export function useNewReleases(days = 90) {
  return useCatalogSelect((games) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return games.filter((g) => !g.comingSoon && new Date(g.releaseDate).getTime() >= cutoff);
  });
}

export function useSpecials() {
  return useCatalogSelect((games) =>
    [...games]
      .filter((g) => g.isOnSale)
      .sort((a, b) => b.price.discountPct - a.price.discountPct),
  );
}

export function useComingSoon() {
  return useCatalogSelect((games) => games.filter((g) => g.comingSoon));
}

export function useRecommended(tags: string[]) {
  return useCatalogSelect((games) => {
    if (tags.length === 0) return [...games].sort(() => Math.random() - 0.5).slice(0, 12);
    return [...games]
      .map((g) => ({ g, score: g.tags.filter((t) => tags.includes(t)).length }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.g);
  });
}

export function useHiddenGems(limit = 12) {
  return useCatalogSelect((games) =>
    [...games]
      .filter(
        (g) =>
          typeof g.firstReviewersScore === "number" &&
          g.firstReviewersScore >= 80 &&
          g.reviewSummary.totalReviews < 100_000,
      )
      .sort((a, b) => (b.firstReviewersScore ?? 0) - (a.firstReviewersScore ?? 0))
      .slice(0, limit),
  );
}

export function useDemos(limit = 12) {
  return useCatalogSelect((games) =>
    [...games]
      .filter((g) => g.hasDemo)
      .sort((a, b) => a.salesRank - b.salesRank)
      .slice(0, limit),
  );
}

// Shelves: we keep the dedicated key because the result depends on tagPool
// (computes reasons + shape). But it ALSO hangs off the shared catalog via
// useGames so it stays warm without re-fetching.
export function useHomeShelves(tagPool: string[]) {
  const catalog = useGames();
  return useQuery({
    queryKey: gameKeys.homeShelves(tagPool),
    queryFn: () => listShelvesForHome(tagPool),
    enabled: !catalog.isLoading,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  });
}

export function useSearch(filters: SearchFilters) {
  // Cheap in-memory filter — runs on the cached snapshot.
  return useCatalogSelect((games) => searchByFilters(games, filters));
}

function searchByFilters(games: Game[], filters: SearchFilters): Game[] {
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

export function useCategoryGames(slug: string) {
  return useQuery({
    ...CATALOG_OPTS,
    select: (games) => games.filter((g) => g.genres.includes(slug)),
    enabled: !!slug,
  });
}

export function useGamesByTag(slug: string) {
  return useQuery({
    ...CATALOG_OPTS,
    select: (games) => games.filter((g) => g.tags.includes(slug)),
    enabled: !!slug,
  });
}

export function useGamesByDeveloper(slug: string) {
  return useQuery({
    ...CATALOG_OPTS,
    select: (games) => games.filter((g) => slugify(g.developer) === slug),
    enabled: !!slug,
  });
}

export function useGamesByPublisher(slug: string) {
  return useQuery({
    ...CATALOG_OPTS,
    select: (games) => games.filter((g) => slugify(g.publisher) === slug),
    enabled: !!slug,
  });
}

