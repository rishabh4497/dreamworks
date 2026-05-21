import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getThread,
  listRecentThreadsCrossGame,
  listReplies,
  listThreads,
} from "@/lib/api/forums";
import { useForumsStore } from "@/stores/forums-store";
import type { GameId } from "@/lib/types";

export const forumKeys = {
  all: ["forums"] as const,
  gameThreads: (gameId: GameId) => [...forumKeys.all, "game-threads", gameId] as const,
  thread: (threadId: string) => [...forumKeys.all, "thread", threadId] as const,
  replies: (threadId: string) => [...forumKeys.all, "replies", threadId] as const,
  recent: () => [...forumKeys.all, "recent"] as const,
};

/**
 * Subscribe to store changes so a `createThread` / `addReply` write triggers
 * an immediate refetch in any active forum query. (The API merges seed +
 * persisted user content, but React Query doesn't know the store changed.)
 */
function useForumsStoreInvalidation() {
  const qc = useQueryClient();
  useEffect(() => {
    return useForumsStore.subscribe(() => {
      qc.invalidateQueries({ queryKey: forumKeys.all });
    });
  }, [qc]);
}

export function useGameThreads(gameId: GameId | undefined) {
  useForumsStoreInvalidation();
  return useQuery({
    queryKey: gameId ? forumKeys.gameThreads(gameId) : ["disabled"],
    queryFn: () => listThreads(gameId!),
    enabled: !!gameId,
  });
}

export function useThread(threadId: string | undefined) {
  useForumsStoreInvalidation();
  return useQuery({
    queryKey: threadId ? forumKeys.thread(threadId) : ["disabled"],
    queryFn: () => getThread(threadId!),
    enabled: !!threadId,
  });
}

export function useThreadReplies(threadId: string | undefined) {
  useForumsStoreInvalidation();
  return useQuery({
    queryKey: threadId ? forumKeys.replies(threadId) : ["disabled"],
    queryFn: () => listReplies(threadId!),
    enabled: !!threadId,
  });
}

export function useRecentThreads() {
  useForumsStoreInvalidation();
  return useQuery({
    queryKey: forumKeys.recent(),
    queryFn: () => listRecentThreadsCrossGame(20),
  });
}
