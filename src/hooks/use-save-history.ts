import { useQuery } from "@tanstack/react-query";
import { listSaveHistory } from "@/lib/api/save-history";
import type { GameId } from "@/lib/types";

export const saveHistoryKeys = {
  all: ["save-history"] as const,
  game: (gameId: GameId) => [...saveHistoryKeys.all, gameId] as const,
};

export function useSaveHistory(gameId: GameId | undefined) {
  return useQuery({
    queryKey: gameId ? saveHistoryKeys.game(gameId) : ["disabled"],
    queryFn: () => listSaveHistory(gameId!),
    enabled: !!gameId,
  });
}
