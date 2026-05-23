import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAppAdmin,
  getAdminKpis,
  getAdminUser,
  listAdminUsers,
  listAllApps,
  listCreatorSubmissionQueue,
  reviewPublisherProfile,
  reviewStudioProfile,
  setUserRole,
} from "@/lib/api/admin";
import { appKeys } from "@/hooks/use-apps";
import { invalidateCatalogCache } from "@/lib/api/games";
import type {
  AppStage,
  CreatorSubmissionType,
  SubmissionStatus,
  UserRole,
} from "@/lib/types";

export const adminKeys = {
  all: ["admin"] as const,
  kpis: () => [...adminKeys.all, "kpis"] as const,
  users: (filter: { search?: string; role?: UserRole | "all" }) =>
    [...adminKeys.all, "users", filter] as const,
  user: (uid: string) => [...adminKeys.all, "user", uid] as const,
  creatorQueue: (type: CreatorSubmissionType, status?: SubmissionStatus | "all") =>
    [...adminKeys.all, "creator", type, status ?? "all"] as const,
  apps: (filter: { stage?: AppStage | "all"; search?: string }) =>
    [...adminKeys.all, "apps", filter] as const,
};

export function useAllApps(filter: { stage?: AppStage | "all"; search?: string } = {}) {
  return useQuery({
    queryKey: adminKeys.apps(filter),
    queryFn: () => listAllApps(filter),
  });
}

export function useDeleteAppAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAppAdmin,
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
      qc.invalidateQueries({ queryKey: appKeys.all });
      qc.invalidateQueries({ queryKey: appKeys.byId(input.appId) });
      qc.invalidateQueries({ queryKey: ["games"] });
      invalidateCatalogCache();
    },
  });
}

export function useAdminKpis() {
  return useQuery({ queryKey: adminKeys.kpis(), queryFn: getAdminKpis });
}

export function useAdminUsers(filter: { search?: string; role?: UserRole | "all" } = {}) {
  return useQuery({
    queryKey: adminKeys.users(filter),
    queryFn: () => listAdminUsers(filter),
  });
}

export function useAdminUser(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? adminKeys.user(uid) : ["disabled"],
    queryFn: () => getAdminUser(uid!),
    enabled: !!uid,
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setUserRole,
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: adminKeys.user(input.targetUid) });
      qc.invalidateQueries({ queryKey: adminKeys.users({}) });
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useCreatorSubmissionQueue(
  type: CreatorSubmissionType,
  status?: SubmissionStatus | "all",
) {
  return useQuery({
    queryKey: adminKeys.creatorQueue(type, status),
    queryFn: () =>
      listCreatorSubmissionQueue(type, status && status !== "all" ? status : undefined),
  });
}

export function useReviewPublisher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewPublisherProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useReviewStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewStudioProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
