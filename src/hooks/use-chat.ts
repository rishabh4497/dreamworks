import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
  chatIdFor,
  getOrCreateChat,
  markRead,
  sendMessage,
  subscribeMessages,
} from "@/lib/api/chat";
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "@/lib/api/friend-graph";
import { useAuthStore } from "@/stores/auth-store";
import type { ChatMessage } from "@/lib/types";

const EMPTY_MESSAGES: ChatMessage[] = [];

/**
 * Lazily materialize (and subscribe to) the 1:1 chat between the current user
 * and `otherUid`. Returns the chat id once it exists. The chat doc is created
 * on first call so messages can be written immediately.
 */
export function useChat(otherUid: string | undefined) {
  const meUid = useAuthStore((s) => s.profile?.uid);
  return useQuery({
    queryKey: ["chat", meUid ?? "anon", otherUid ?? "none"],
    queryFn: async () => {
      const chat = await getOrCreateChat(meUid!, otherUid!);
      return chat;
    },
    enabled: !!meUid && !!otherUid && meUid !== otherUid,
    staleTime: Infinity,
  });
}

/**
 * Live message stream for a chat. Uses onSnapshot under the hood — every
 * send by either side appears in O(network RTT).
 */
export function useChatMessages(chatId: string | undefined) {
  const qc = useQueryClient();
  const key = useMemo(() => ["chat-messages", chatId ?? "none"] as const, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeMessages(chatId, (msgs) => {
      qc.setQueryData(key, msgs);
    });
    return unsub;
  }, [chatId, qc, key]);

  return useQuery({
    queryKey: key,
    queryFn: async () => EMPTY_MESSAGES,
    enabled: !!chatId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/** Mutation hook for sending a message in a chat. */
export function useSendMessage(chatId: string | undefined) {
  const meUid = useAuthStore((s) => s.profile?.uid);
  return useMutation({
    mutationFn: async (text: string) => {
      if (!chatId || !meUid) return;
      await sendMessage(chatId, meUid, text);
    },
  });
}

/** Mutation hook for marking a list of messages as read. */
export function useMarkRead(chatId: string | undefined) {
  const meUid = useAuthStore((s) => s.profile?.uid);
  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (!chatId || !meUid) return;
      await markRead(chatId, meUid, messageIds);
    },
  });
}

/**
 * Convenience hooks for friend-graph mutations. These intentionally don't
 * invalidate queries — the subscribeFriendGraph listener picks up the change
 * via onSnapshot and updates the cache directly.
 */
export function useSendFriendRequest() {
  const meUid = useAuthStore((s) => s.profile?.uid);
  return useMutation({
    mutationFn: async (toUid: string) => {
      if (!meUid) return;
      await sendFriendRequest(meUid, toUid);
    },
  });
}

export function useAcceptFriendRequest() {
  const meUid = useAuthStore((s) => s.profile?.uid);
  return useMutation({
    mutationFn: async (requesterUid: string) => {
      if (!meUid) return;
      await acceptFriendRequest(meUid, requesterUid);
    },
  });
}

export function useDeclineFriendRequest() {
  const meUid = useAuthStore((s) => s.profile?.uid);
  return useMutation({
    mutationFn: async (otherUid: string) => {
      if (!meUid) return;
      await declineFriendRequest(meUid, otherUid);
    },
  });
}

export function useRemoveFriend() {
  const meUid = useAuthStore((s) => s.profile?.uid);
  return useMutation({
    mutationFn: async (otherUid: string) => {
      if (!meUid) return;
      await removeFriend(meUid, otherUid);
    },
  });
}

/** Re-export for callers that just need to derive a chatId without a query. */
export { chatIdFor };
