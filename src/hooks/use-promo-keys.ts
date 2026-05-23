import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteKey,
  type IssueKeysInput,
  issueKeys,
  listPromoKeysByApp,
  listPromoKeysByApps,
  revokeKey,
} from "@/lib/api/promo-keys";

export const promoKeyKeys = {
  all: ["promo-keys"] as const,
  byApp: (appId: string) => [...promoKeyKeys.all, "app", appId] as const,
  byApps: (appIds: string[]) =>
    [...promoKeyKeys.all, "apps", [...appIds].sort().join(",")] as const,
};

export function usePromoKeysByApp(appId: string | undefined) {
  return useQuery({
    queryKey: appId ? promoKeyKeys.byApp(appId) : ["disabled"],
    queryFn: () => listPromoKeysByApp(appId!),
    enabled: !!appId,
  });
}

export function usePromoKeysByApps(appIds: string[]) {
  return useQuery({
    queryKey: promoKeyKeys.byApps(appIds),
    queryFn: () => listPromoKeysByApps(appIds),
    enabled: appIds.length > 0,
  });
}

export function useIssueKeys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IssueKeysInput) => issueKeys(input),
    onSuccess: (_keys, vars) => {
      qc.invalidateQueries({ queryKey: promoKeyKeys.byApp(vars.appId) });
      qc.invalidateQueries({ queryKey: promoKeyKeys.all });
    },
  });
}

export function useRevokeKey(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promoKeyKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: promoKeyKeys.all });
    },
  });
}

export function useDeleteKey(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promoKeyKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: promoKeyKeys.all });
    },
  });
}
