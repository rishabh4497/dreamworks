import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listBuilds,
  createBuild,
  setBranchLive,
  deleteBuild,
  type CreateBuildInput,
} from "@/lib/api/app-builds";
import { appKeys } from "./use-apps";

export const buildKeys = {
  all: ["app-builds"] as const,
  byApp: (appId: string) => [...buildKeys.all, appId] as const,
};

export function useAppBuilds(appId: string | undefined) {
  return useQuery({
    queryKey: appId ? buildKeys.byApp(appId) : ["disabled"],
    queryFn: () => listBuilds(appId!),
    enabled: !!appId,
  });
}

export function useCreateBuild(appId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateBuildInput, "appId">) =>
      createBuild({ ...input, appId: appId! }),
    onSuccess: () => {
      if (!appId) return;
      qc.invalidateQueries({ queryKey: buildKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: appKeys.byId(appId) });
    },
  });
}

export function useSetBranchLive(appId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { branch: string; buildId?: string }) =>
      setBranchLive(appId!, vars.branch, vars.buildId),
    onSuccess: () => {
      if (!appId) return;
      qc.invalidateQueries({ queryKey: appKeys.byId(appId) });
    },
  });
}

export function useDeleteBuild(appId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (buildId: string) => deleteBuild(appId!, buildId),
    onSuccess: () => {
      if (!appId) return;
      qc.invalidateQueries({ queryKey: buildKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: appKeys.byId(appId) });
    },
  });
}
