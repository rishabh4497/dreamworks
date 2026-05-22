import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPublisherProfile,
  savePublisherProfile,
  type PublisherProfile,
} from "@/lib/api/developer-portal";

export const publisherKeys = {
  all: ["publishers"] as const,
  profile: (name: string) => [...publisherKeys.all, "profile", name] as const,
};

export function usePublisherProfile(name: string | undefined) {
  return useQuery({
    queryKey: name ? publisherKeys.profile(name) : ["disabled"],
    queryFn: () => getPublisherProfile(name!),
    enabled: !!name,
  });
}

export function useSavePublisherProfile(name: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Omit<PublisherProfile, "updatedAt">) =>
      savePublisherProfile(profile),
    onSuccess: () => {
      if (!name) return;
      queryClient.invalidateQueries({ queryKey: publisherKeys.profile(name) });
    },
  });
}
