import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCompatibility,
  updateCompatibilityPreference,
} from "@/lib/api/compatibility";
import type { GameId } from "@/lib/types";

export const compatibilityKeys = {
  all: ["compatibility"] as const,
  game: (gameId: GameId) => [...compatibilityKeys.all, gameId] as const,
};

export function useCompatibility(gameId: GameId | undefined) {
  return useQuery({
    queryKey: gameId ? compatibilityKeys.game(gameId) : ["disabled"],
    queryFn: () => getCompatibility(gameId!),
    enabled: !!gameId,
  });
}

export function useUpdateCompatibilityPreference(gameId: GameId | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: { selectedRuntime?: string; launchOptions?: string }) =>
      updateCompatibilityPreference({ gameId: gameId!, ...updates }),
    onSuccess: () => {
      if (!gameId) return;
      queryClient.invalidateQueries({ queryKey: compatibilityKeys.game(gameId) });
    },
  });
}
