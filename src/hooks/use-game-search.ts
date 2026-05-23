import { useMemo } from "react";
import { useGames } from "@/hooks/use-games";
import { buildGameIndex, searchGames } from "@/lib/game-search";

export function useGameSearch(query: string, limit = 8) {
  const { data: games } = useGames();

  const index = useMemo(
    () => (games ? buildGameIndex(games) : null),
    [games],
  );

  return useMemo(() => {
    if (!index) return [];
    return searchGames(index, query, limit);
  }, [index, query, limit]);
}
