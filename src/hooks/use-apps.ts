import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createApp,
  type CreateAppInput,
  deleteApp,
  getApp,
  listMyApps,
  listAppsByDeveloper,
  listAppsByPublisher,
  publishApp,
  saveApp,
  submitAppForReview,
  type AppPatch,
} from "@/lib/api/apps";
import { invalidateCatalogCache } from "@/lib/api/games";

export const appKeys = {
  all: ["apps"] as const,
  mine: () => [...appKeys.all, "mine"] as const,
  byId: (id: string) => [...appKeys.all, "id", id] as const,
  byDeveloper: (slug: string) => [...appKeys.all, "developer", slug] as const,
  byPublisher: (slug: string) => [...appKeys.all, "publisher", slug] as const,
};

export function useMyApps() {
  return useQuery({ queryKey: appKeys.mine(), queryFn: listMyApps });
}

export function useApp(id: string | undefined) {
  return useQuery({
    queryKey: id ? appKeys.byId(id) : ["disabled"],
    queryFn: () => getApp(id!),
    enabled: !!id,
  });
}

export function useAppsByDeveloper(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? appKeys.byDeveloper(slug) : ["disabled"],
    queryFn: () => listAppsByDeveloper(slug!),
    enabled: !!slug,
  });
}

export function useAppsByPublisher(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? appKeys.byPublisher(slug) : ["disabled"],
    queryFn: () => listAppsByPublisher(slug!),
    enabled: !!slug,
  });
}

export function useCreateApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAppInput) => createApp(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: appKeys.mine() }),
  });
}

export function useSaveApp(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: AppPatch) => saveApp(id!, patch),
    onSuccess: () => {
      if (!id) return;
      qc.invalidateQueries({ queryKey: appKeys.byId(id) });
      qc.invalidateQueries({ queryKey: appKeys.mine() });
    },
  });
}

export function useSubmitApp(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => submitAppForReview(id!),
    onSuccess: () => {
      if (!id) return;
      qc.invalidateQueries({ queryKey: appKeys.byId(id) });
      qc.invalidateQueries({ queryKey: appKeys.mine() });
    },
  });
}

export function usePublishApp(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => publishApp(id!),
    onSuccess: () => {
      if (!id) return;
      qc.invalidateQueries({ queryKey: appKeys.byId(id) });
      qc.invalidateQueries({ queryKey: appKeys.mine() });
      invalidateCatalogCache();
      qc.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export function useDeleteApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteApp(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: appKeys.mine() }),
  });
}
