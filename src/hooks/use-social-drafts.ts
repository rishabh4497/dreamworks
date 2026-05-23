import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteSocialDraft,
  listSocialDraftsByApp,
  type SocialDraftInput,
  saveSocialDraft,
} from "@/lib/api/social-drafts";

export const socialDraftKeys = {
  all: ["social-drafts"] as const,
  byApp: (appId: string) => [...socialDraftKeys.all, "app", appId] as const,
};

export function useSocialDraftsByApp(appId: string | undefined) {
  return useQuery({
    queryKey: appId ? socialDraftKeys.byApp(appId) : ["disabled"],
    queryFn: () => listSocialDraftsByApp(appId!),
    enabled: !!appId,
  });
}

export function useSaveSocialDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SocialDraftInput) => saveSocialDraft(input),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: socialDraftKeys.byApp(saved.appId) });
    },
  });
}

export function useDeleteSocialDraft(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSocialDraft(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialDraftKeys.byApp(appId) });
    },
  });
}
