import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommunityPost,
  getCommunityBySlug,
  getSocialGraphCounters,
  joinCommunity,
  leaveCommunity,
  listCommunities,
  listCommunityPosts,
  listUserCommunityIds,
} from "@/lib/api/communities";
import type { CommunityPost } from "@/lib/types";

export const communitiesKeys = {
  all: ["communities"] as const,
  list: ["communities", "list"] as const,
  bySlug: (slug: string) => ["communities", "slug", slug] as const,
  posts: (communityId: string) => ["communities", "posts", communityId] as const,
  userIds: (uid: string) => ["communities", "user", uid] as const,
  counters: (uid: string) => ["social-graph", "counters", uid] as const,
};

export function useCommunities() {
  return useQuery({ queryKey: communitiesKeys.list, queryFn: listCommunities });
}

export function useCommunityBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: communitiesKeys.bySlug(slug ?? ""),
    queryFn: () => getCommunityBySlug(slug ?? ""),
    enabled: Boolean(slug),
  });
}

export function useCommunityPosts(communityId: string | undefined) {
  return useQuery({
    queryKey: communitiesKeys.posts(communityId ?? ""),
    queryFn: () => listCommunityPosts(communityId ?? ""),
    enabled: Boolean(communityId),
  });
}

export function useUserCommunityIds(userId: string | undefined) {
  return useQuery({
    queryKey: communitiesKeys.userIds(userId ?? ""),
    queryFn: () => listUserCommunityIds(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useSocialGraphCounters(userId: string | undefined) {
  return useQuery({
    queryKey: communitiesKeys.counters(userId ?? ""),
    queryFn: () => getSocialGraphCounters(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useJoinCommunity(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (communityId: string) =>
      joinCommunity({ communityId, userId: userId ?? "" }),
    onSuccess: (_, communityId) => {
      qc.invalidateQueries({ queryKey: communitiesKeys.list });
      qc.invalidateQueries({ queryKey: communitiesKeys.bySlug.length ? communitiesKeys.all : [] });
      if (userId) {
        qc.invalidateQueries({ queryKey: communitiesKeys.userIds(userId) });
        qc.invalidateQueries({ queryKey: communitiesKeys.counters(userId) });
      }
      qc.invalidateQueries({ queryKey: ["communities", "posts", communityId] });
    },
  });
}

export function useLeaveCommunity(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (communityId: string) =>
      leaveCommunity({ communityId, userId: userId ?? "" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communitiesKeys.list });
      if (userId) {
        qc.invalidateQueries({ queryKey: communitiesKeys.userIds(userId) });
        qc.invalidateQueries({ queryKey: communitiesKeys.counters(userId) });
      }
    },
  });
}

export function useCreateCommunityPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<CommunityPost, "id" | "likeCount" | "commentCount" | "createdAt">,
    ) => createCommunityPost(input),
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: communitiesKeys.posts(post.communityId) });
      qc.invalidateQueries({ queryKey: communitiesKeys.list });
    },
  });
}
