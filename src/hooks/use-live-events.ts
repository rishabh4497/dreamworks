import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteLiveEvent,
  type LiveEventInput,
  listLiveEventsByApp,
  listLiveEventsByApps,
  saveLiveEvent,
} from "@/lib/api/live-events";

export const liveEventKeys = {
  all: ["live-events"] as const,
  byApp: (appId: string) => [...liveEventKeys.all, "app", appId] as const,
  byApps: (appIds: string[]) =>
    [...liveEventKeys.all, "apps", [...appIds].sort().join(",")] as const,
};

export function useLiveEventsByApp(appId: string | undefined) {
  return useQuery({
    queryKey: appId ? liveEventKeys.byApp(appId) : ["disabled"],
    queryFn: () => listLiveEventsByApp(appId!),
    enabled: !!appId,
  });
}

export function useLiveEventsByApps(appIds: string[]) {
  return useQuery({
    queryKey: liveEventKeys.byApps(appIds),
    queryFn: () => listLiveEventsByApps(appIds),
    enabled: appIds.length > 0,
  });
}

export function useSaveLiveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LiveEventInput) => saveLiveEvent(input),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: liveEventKeys.byApp(saved.appId) });
      qc.invalidateQueries({ queryKey: liveEventKeys.all });
    },
  });
}

export function useDeleteLiveEvent(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLiveEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: liveEventKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: liveEventKeys.all });
    },
  });
}
