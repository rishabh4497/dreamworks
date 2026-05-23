import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPublisher,
  getMyPrimaryPublisher,
  savePublisher,
  type PublisherInput,
} from "@/lib/api/publishers";

export const publisherKeys = {
  all: ["publishers"] as const,
  byId: (slug: string) => [...publisherKeys.all, "id", slug] as const,
  mine: () => [...publisherKeys.all, "mine"] as const,
};

export function usePublisher(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? publisherKeys.byId(slug) : ["disabled"],
    queryFn: () => getPublisher(slug!),
    enabled: !!slug,
  });
}

export function useMyPublisher() {
  return useQuery({ queryKey: publisherKeys.mine(), queryFn: getMyPrimaryPublisher });
}

export function useSavePublisher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PublisherInput) => savePublisher(input),
    onSuccess: (pub) => {
      qc.invalidateQueries({ queryKey: publisherKeys.mine() });
      if (pub?.id) qc.invalidateQueries({ queryKey: publisherKeys.byId(pub.id) });
    },
  });
}
