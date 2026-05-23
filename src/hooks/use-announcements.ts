import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AnnouncementInput,
  deleteAnnouncement,
  listAnnouncementsByApp,
  listAnnouncementsByApps,
  saveAnnouncement,
} from "@/lib/api/announcements";

export const announcementKeys = {
  all: ["announcements"] as const,
  byApp: (appId: string) => [...announcementKeys.all, "app", appId] as const,
  byApps: (appIds: string[]) =>
    [...announcementKeys.all, "apps", [...appIds].sort().join(",")] as const,
};

export function useAnnouncementsByApp(appId: string | undefined) {
  return useQuery({
    queryKey: appId ? announcementKeys.byApp(appId) : ["disabled"],
    queryFn: () => listAnnouncementsByApp(appId!),
    enabled: !!appId,
  });
}

export function useAnnouncementsByApps(appIds: string[]) {
  return useQuery({
    queryKey: announcementKeys.byApps(appIds),
    queryFn: () => listAnnouncementsByApps(appIds),
    enabled: appIds.length > 0,
  });
}

export function useSaveAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnnouncementInput) => saveAnnouncement(input),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: announcementKeys.byApp(saved.appId) });
      qc.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

export function useDeleteAnnouncement(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.byApp(appId) });
      qc.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}
