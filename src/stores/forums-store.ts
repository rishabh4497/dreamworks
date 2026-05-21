import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ForumReply, ForumThread, GameId } from "@/lib/types";
import { useAuthStore } from "./auth-store";

interface ForumsStore {
  userThreads: ForumThread[];
  userReplies: ForumReply[];
  createThread: (gameId: GameId, title: string, body: string) => ForumThread;
  addReply: (threadId: string, body: string) => ForumReply;
  toggleHelpfulThread: (threadId: string) => void;
  toggleHelpfulReply: (replyId: string) => void;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function currentAuthor() {
  const profile = useAuthStore.getState().profile;
  if (profile) {
    return {
      uid: profile.uid,
      name: profile.displayName,
      avatarUrl: profile.avatarUrl,
    };
  }
  // Should not happen: forum routes live behind AuthGuard. Fall back gracefully.
  return {
    uid: "anonymous",
    name: "Guest",
    avatarUrl: "https://picsum.photos/seed/anonymous/96/96",
  };
}

export const useForumsStore = create<ForumsStore>()(
  persist(
    (set) => ({
      userThreads: [],
      userReplies: [],
      createThread: (gameId, title, body) => {
        const author = currentAuthor();
        const now = new Date().toISOString();
        const thread: ForumThread = {
          id: newId("user-thread"),
          gameId,
          authorUid: author.uid,
          authorName: author.name,
          authorAvatarUrl: author.avatarUrl,
          title,
          body,
          createdAt: now,
          lastActivityAt: now,
          replyCount: 0,
          sticky: false,
          locked: false,
          helpfulCount: 0,
        };
        set((s) => ({ userThreads: [...s.userThreads, thread] }));
        return thread;
      },
      addReply: (threadId, body) => {
        const author = currentAuthor();
        const now = new Date().toISOString();
        const reply: ForumReply = {
          id: newId("user-reply"),
          threadId,
          authorUid: author.uid,
          authorName: author.name,
          authorAvatarUrl: author.avatarUrl,
          body,
          createdAt: now,
          helpfulCount: 0,
        };
        set((s) => {
          // Bump the parent thread's lastActivityAt + replyCount if it's a
          // user-created thread. (Seed threads are read-only and recompute
          // their counts at the API layer.)
          const userThreads = s.userThreads.map((t) =>
            t.id === threadId
              ? { ...t, lastActivityAt: now, replyCount: t.replyCount + 1 }
              : t,
          );
          return {
            userThreads,
            userReplies: [...s.userReplies, reply],
          };
        });
        return reply;
      },
      toggleHelpfulThread: (threadId) =>
        set((s) => ({
          userThreads: s.userThreads.map((t) =>
            t.id === threadId ? { ...t, helpfulCount: t.helpfulCount + 1 } : t,
          ),
        })),
      toggleHelpfulReply: (replyId) =>
        set((s) => ({
          userReplies: s.userReplies.map((r) =>
            r.id === replyId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r,
          ),
        })),
    }),
    { name: "dreamworks-forums" },
  ),
);
