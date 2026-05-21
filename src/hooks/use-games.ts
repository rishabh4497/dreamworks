import { useQuery } from "@tanstack/react-query";
import {
  getGame,
  getGameDetail,
  listComingSoon,
  listFeatured,
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
import type { GameId } from "@/lib/types";

export const gameKeys = {
  all: ["games"] as const,
  list: () => [...gameKeys.all, "list"] as const,
  detail: (id: GameId) => [...gameKeys.all, "detail", id] as const,
  summary: (id: GameId) => [...gameKeys.all, "summary", id] as const,
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

export function useGames() {
  return useQuery({ queryKey: gameKeys.list(), queryFn: listGames });
}

export function useGame(id: GameId | undefined) {
  return useQuery({
    queryKey: id ? gameKeys.summary(id) : ["disabled"],
    queryFn: () => getGame(id!),
    enabled: !!id,
  });
}

export function useGameDetail(id: GameId | undefined) {
  return useQuery({
    queryKey: id ? gameKeys.detail(id) : ["disabled"],
    queryFn: () => getGameDetail(id!),
    enabled: !!id,
  });
}

export function useFeatured() {
  return useQuery({ queryKey: gameKeys.featured(), queryFn: listFeatured });
}

export function useTopSellers() {
  return useQuery({ queryKey: gameKeys.topSellers(), queryFn: () => listTopSellers() });
}

export function useNewReleases() {
  return useQuery({ queryKey: gameKeys.newReleases(), queryFn: () => listNewReleases() });
}

export function useSpecials() {
  return useQuery({ queryKey: gameKeys.specials(), queryFn: listSpecials });
}

export function useComingSoon() {
  return useQuery({ queryKey: gameKeys.comingSoon(), queryFn: listComingSoon });
}

export function useRecommended(tags: string[]) {
  return useQuery({ queryKey: gameKeys.recommended(tags), queryFn: () => listRecommended(tags) });
}

export function useHiddenGems() {
  return useQuery({ queryKey: gameKeys.hiddenGems(), queryFn: () => listHiddenGems() });
}

export function useDemos() {
  return useQuery({ queryKey: gameKeys.demos(), queryFn: () => listGamesWithDemos() });
}

export function useHomeShelves(tagPool: string[]) {
  return useQuery({
    queryKey: gameKeys.homeShelves(tagPool),
    queryFn: () => listShelvesForHome(tagPool),
  });
}

export function useSearch(filters: SearchFilters) {
  return useQuery({ queryKey: gameKeys.search(filters), queryFn: () => searchGames(filters) });
}

export function useCategoryGames(slug: string) {
  return useQuery({
    queryKey: gameKeys.category(slug),
    queryFn: () => listGamesByCategory(slug),
    enabled: !!slug,
  });
}

export function useGamesByTag(slug: string) {
  return useQuery({
    queryKey: gameKeys.tag(slug),
    queryFn: () => listGamesByTag(slug),
    enabled: !!slug,
  });
}

export function useGamesByDeveloper(slug: string) {
  return useQuery({
    queryKey: gameKeys.developer(slug),
    queryFn: () => listGamesByDeveloper(slug),
    enabled: !!slug,
  });
}

export function useGamesByPublisher(slug: string) {
  return useQuery({
    queryKey: gameKeys.publisher(slug),
    queryFn: () => listGamesByPublisher(slug),
    enabled: !!slug,
  });
}
