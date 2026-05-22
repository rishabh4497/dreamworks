import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDeveloperReleaseDrafts,
  saveDeveloperReleaseDraft,
  submitDeveloperReleaseDraft,
} from "@/lib/api/developer-portal";

export const draftKeys = {
  all: ["developerDrafts"] as const,
  list: () => [...draftKeys.all, "list"] as const,
};

export function useDeveloperDrafts() {
  return useQuery({
    queryKey: draftKeys.list(),
    queryFn: listDeveloperReleaseDrafts,
  });
}

export function useSaveDeveloperDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveDeveloperReleaseDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.list() });
    },
  });
}

export function useSubmitDeveloperDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitDeveloperReleaseDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.list() });
    },
  });
}
