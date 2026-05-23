import { useQuery } from "@tanstack/react-query";
import { listSpeedrunRuns, type SpeedrunCategory } from "@/lib/api/speedrun";
import type { GameId } from "@/lib/types";

export const speedrunKeys = {
  all: ["speedrun-runs"] as const,
  list: (gameId?: GameId, category?: SpeedrunCategory) =>
    [...speedrunKeys.all, gameId ?? "global", category ?? "any"] as const,
};

export function useSpeedrunRuns(gameId?: GameId, category?: SpeedrunCategory) {
  return useQuery({
    queryKey: speedrunKeys.list(gameId, category),
    queryFn: () => listSpeedrunRuns({ gameId, category }),
  });
}
