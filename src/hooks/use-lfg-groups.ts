import { useQuery } from "@tanstack/react-query";
import { listLfgGroups } from "@/lib/api/lfg";
import type { GameId } from "@/lib/types";

export const lfgKeys = {
  all: ["lfg-groups"] as const,
  game: (gameId: GameId) => [...lfgKeys.all, gameId] as const,
};

export function useLfgGroups(gameId: GameId | undefined) {
  return useQuery({
    queryKey: gameId ? lfgKeys.game(gameId) : ["disabled"],
    queryFn: () => listLfgGroups(gameId!),
    enabled: !!gameId,
  });
}
