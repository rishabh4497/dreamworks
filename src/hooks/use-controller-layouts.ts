import { useQuery } from "@tanstack/react-query";
import { listControllerLayouts } from "@/lib/api/controller-layouts";
import type { GameId } from "@/lib/types";

export const controllerLayoutKeys = {
  all: ["controller-layouts"] as const,
  list: (gameId?: GameId) =>
    [...controllerLayoutKeys.all, gameId ?? "global"] as const,
};

export function useControllerLayouts(gameId?: GameId) {
  return useQuery({
    queryKey: controllerLayoutKeys.list(gameId),
    queryFn: () => listControllerLayouts(gameId),
    staleTime: 5 * 60 * 1000,
  });
}
