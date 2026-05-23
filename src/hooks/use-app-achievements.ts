import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Achievement } from "@/lib/types";
import {
  listAchievements,
  upsertAchievement,
  deleteAchievement,
} from "@/lib/api/app-achievements";
import { appKeys } from "./use-apps";

export const achievementKeys = {
  all: ["app-achievements"] as const,
  byApp: (appId: string) => [...achievementKeys.all, appId] as const,
};

export function useAchievements(appId: string | undefined) {
  return useQuery({
    queryKey: appId ? achievementKeys.byApp(appId) : ["disabled"],
    queryFn: () => listAchievements(appId!),
    enabled: !!appId,
  });
}

export function useUpsertAchievement(appId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Achievement, "id"> & { id?: string }) =>
      upsertAchievement(appId!, input),
    onSuccess: () => {
      if (!appId) return;
      qc.invalidateQueries({ queryKey: achievementKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: appKeys.byId(appId) });
    },
  });
}

export function useDeleteAchievement(appId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAchievement(appId!, id),
    onSuccess: () => {
      if (!appId) return;
      qc.invalidateQueries({ queryKey: achievementKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: appKeys.byId(appId) });
    },
  });
}
