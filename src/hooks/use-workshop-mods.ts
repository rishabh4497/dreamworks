import { useQuery } from "@tanstack/react-query";
import { listWorkshopMods } from "@/lib/api/workshop";
import type { GameId } from "@/lib/types";

export const workshopModKeys = {
  all: ["workshop-mods"] as const,
  list: (gameId?: GameId) => [...workshopModKeys.all, "list", gameId ?? "all"] as const,
};

export function useWorkshopMods(gameId?: GameId) {
  return useQuery({
    queryKey: workshopModKeys.list(gameId),
    queryFn: () => listWorkshopMods(gameId),
  });
}
