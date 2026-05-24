import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
  getFriendLibraryMap,
  listFriendsWhoOwn,
  searchUsersByHandle,
  subscribeFriendGraph,
  type FriendGraphSnapshot,
} from "@/lib/api/friend-graph";
import { useAuthStore } from "@/stores/auth-store";
import type { Friend, FriendRequest, GameId, UserProfile } from "@/lib/types";

const EMPTY_GRAPH: FriendGraphSnapshot = {
  friends: [],
  pendingIn: [],
  pendingOut: [],
};

/**
 * Live subscription to the current user's friend graph. The query data is
 * pushed by an onSnapshot listener so accepts / declines / new requests show
 * up immediately on every open tab.
 */
function useFriendGraph() {
  const uid = useAuthStore((s) => s.profile?.uid);
  const qc = useQueryClient();
  const key = useMemo(() => ["friend-graph", uid ?? "anon"] as const, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeFriendGraph(uid, (snap) => {
      qc.setQueryData(key, snap);
    });
    return unsub;
  }, [uid, qc, key]);

  return useQuery({
    queryKey: key,
    queryFn: async () => EMPTY_GRAPH,
    enabled: !!uid,
    staleTime: Infinity,
    // We get fresh data via the snapshot above; never refetch on focus.
    refetchOnWindowFocus: false,
  });
}

/** Accepted friends only (joined with profile + presence). */
export function useFriends() {
  const graph = useFriendGraph();
  return {
    ...graph,
    data: graph.data?.friends ?? ([] as Friend[]),
  };
}

/** Incoming friend requests awaiting accept/decline by the current user. */
export function usePendingFriendRequests() {
  const graph = useFriendGraph();
  return {
    ...graph,
    data: graph.data?.pendingIn ?? ([] as FriendRequest[]),
  };
}

/** Outgoing friend requests the current user has sent but not yet been accepted. */
export function useOutgoingFriendRequests() {
  const graph = useFriendGraph();
  return {
    ...graph,
    data: graph.data?.pendingOut ?? ([] as FriendRequest[]),
  };
}

/**
 * Friends who own a given game. Reads through `dw_library` so it's based on
 * real ownership rather than seeded mock data.
 */
export function useFriendsWhoOwn(gameId: GameId | undefined) {
  const uid = useAuthStore((s) => s.profile?.uid);
  return useQuery({
    queryKey: ["friends", "owns", uid ?? "anon", gameId ?? "none"],
    queryFn: () => listFriendsWhoOwn(uid!, gameId!),
    enabled: !!uid && !!gameId,
  });
}

/**
 * Map of friendUid → owned gameIds, derived from `dw_library`. Used by the
 * recommendation scorer to weight "friends play this" signal.
 */
export function useFriendOwnership() {
  const uid = useAuthStore((s) => s.profile?.uid);
  return useQuery({
    queryKey: ["friends", "ownership", uid ?? "anon"],
    queryFn: () => getFriendLibraryMap(uid!),
    enabled: !!uid,
  });
}

/**
 * Live search for users by display-name prefix or exact email. Returns up
 * to 10 matches and filters out the current user.
 */
export function useUserSearch(term: string) {
  const uid = useAuthStore((s) => s.profile?.uid);
  return useQuery({
    queryKey: ["users", "search", term],
    queryFn: async (): Promise<UserProfile[]> => {
      const results = await searchUsersByHandle(term);
      return results.filter((u) => u.uid !== uid);
    },
    enabled: term.trim().length > 0,
    staleTime: 30_000,
  });
}
