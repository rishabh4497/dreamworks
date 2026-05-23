import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deletePromoCampaign,
  listPromoCampaignsByApp,
  listPromoCampaignsByApps,
  type PromoCampaignInput,
  savePromoCampaign,
} from "@/lib/api/promo-campaigns";

export const promoCampaignKeys = {
  all: ["promo-campaigns"] as const,
  byApp: (appId: string) => [...promoCampaignKeys.all, "app", appId] as const,
  byApps: (appIds: string[]) =>
    [...promoCampaignKeys.all, "apps", [...appIds].sort().join(",")] as const,
};

export function usePromoCampaignsByApp(appId: string | undefined) {
  return useQuery({
    queryKey: appId ? promoCampaignKeys.byApp(appId) : ["disabled"],
    queryFn: () => listPromoCampaignsByApp(appId!),
    enabled: !!appId,
  });
}

export function usePromoCampaignsByApps(appIds: string[]) {
  return useQuery({
    queryKey: promoCampaignKeys.byApps(appIds),
    queryFn: () => listPromoCampaignsByApps(appIds),
    enabled: appIds.length > 0,
  });
}

export function useSavePromoCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PromoCampaignInput) => savePromoCampaign(input),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: promoCampaignKeys.byApp(saved.appId) });
      qc.invalidateQueries({ queryKey: promoCampaignKeys.all });
    },
  });
}

export function useDeletePromoCampaign(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePromoCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promoCampaignKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: promoCampaignKeys.all });
    },
  });
}
