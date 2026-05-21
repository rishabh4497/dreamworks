import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCloudSaveSlots,
  resolveCloudSaveConflict,
} from "@/lib/api/cloud-saves";
import type { CloudSaveResolution, GameId } from "@/lib/types";

export const cloudSaveKeys = {
  all: ["cloud-saves"] as const,
  user: (userId: string) => [...cloudSaveKeys.all, userId] as const,
  slots: (userId: string, gameId?: GameId) =>
    [...cloudSaveKeys.user(userId), "slots", gameId ?? "all"] as const,
};

export function useCloudSaveSlots(userId: string | undefined, gameId?: GameId) {
  return useQuery({
    queryKey: userId ? cloudSaveKeys.slots(userId, gameId) : ["disabled"],
    queryFn: () => listCloudSaveSlots({ userId: userId!, gameId }),
    enabled: !!userId,
  });
}

export function useResolveCloudSaveConflict(userId: string | undefined, gameId?: GameId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { slotId: string; resolution: CloudSaveResolution }) =>
      resolveCloudSaveConflict(input),
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: cloudSaveKeys.slots(userId, gameId) });
      queryClient.invalidateQueries({ queryKey: cloudSaveKeys.slots(userId) });
    },
  });
}
