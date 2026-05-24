import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  getFriendLibraryMap,
  listFriendsWhoOwn,
  searchUsersByHandle,
  subscribeFriendGraph,
  type FriendGraphSnapshot,
} from "@/lib/api/friend-graph";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";
import type {
  Friend,
  FriendActivity,
  FriendRequest,
  GameId,
  UserProfile,
} from "@/lib/types";

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
 * Real friend activity derived from `dw_library` (recent adds) and `dw_reviews`
 * (recent posts by friends). Returns a unified, recency-sorted list.
 */
const RECENT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function useFriendActivity() {
  const uid = useAuthStore((s) => s.profile?.uid);
  const friends = useFriends();
  const friendUids = useMemo(
    () => (friends.data ?? []).map((f) => f.uid),
    [friends.data],
  );

  return useQuery({
    queryKey: ["friends", "activity", uid ?? "anon", friendUids.join(",")],
    queryFn: async (): Promise<FriendActivity[]> => {
      if (friendUids.length === 0) return [];
      const cutoffIso = new Date(Date.now() - RECENT_WINDOW_MS).toISOString();
      const db = getDb();
      const out: FriendActivity[] = [];

      // dw_library — friends who recently added a game.
      for (let i = 0; i < friendUids.length; i += 10) {
        const chunk = friendUids.slice(i, i + 10);
        const snap = await getDocs(
          query(collection(db, COLLECTIONS.library), where("userId", "in", chunk)),
        );
        snap.forEach((d) => {
          const data = d.data() as {
            userId?: string;
            gameId?: GameId;
            ownedSince?: string;
          };
          if (!data.userId || !data.gameId || !data.ownedSince) return;
          if (data.ownedSince < cutoffIso) return;
          out.push({
            uid: data.userId,
            kind: "added-to-library",
            gameId: data.gameId,
            payload: "Added to library",
            at: data.ownedSince,
          });
        });
      }

      // dw_reviews — friends who recently posted a review.
      for (let i = 0; i < friendUids.length; i += 10) {
        const chunk = friendUids.slice(i, i + 10);
        const snap = await getDocs(
          query(collection(db, COLLECTIONS.reviews), where("authorUid", "in", chunk)),
        );
        snap.forEach((d) => {
          const data = d.data() as {
            authorUid?: string;
            gameId?: GameId;
            postedAt?: string;
            body?: string;
          };
          if (!data.authorUid || !data.gameId || !data.postedAt) return;
          if (data.postedAt < cutoffIso) return;
          out.push({
            uid: data.authorUid,
            kind: "review-posted",
            gameId: data.gameId,
            payload: "Posted a review",
            at: data.postedAt,
          });
        });
      }

      return out.sort((a, b) => (a.at < b.at ? 1 : -1));
    },
    enabled: !!uid,
    staleTime: 60_000,
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
