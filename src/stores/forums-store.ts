import { create } from "zustand";
import type { ForumReply, ForumThread, GameId } from "@/lib/types";
import { useAuthStore } from "./auth-store";
import { getDb, COLLECTIONS } from "@/lib/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  increment,
} from "firebase/firestore";

interface ForumsStore {
  updateTrigger: number;
  userThreads: ForumThread[]; // Kept for TS type compatibility
  userReplies: ForumReply[];  // Kept for TS type compatibility
  createThread: (gameId: GameId, title: string, body: string) => Promise<ForumThread>;
  addReply: (threadId: string, body: string) => Promise<ForumReply>;
  toggleHelpfulThread: (threadId: string) => Promise<void>;
  toggleHelpfulReply: (replyId: string) => Promise<void>;
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

export const useForumsStore = create<ForumsStore>((set) => ({
  updateTrigger: 0,
  userThreads: [],
  userReplies: [],

  createThread: async (gameId, title, body) => {
    const author = currentAuthor();
    const now = new Date().toISOString();
    const threadRef = doc(collection(getDb(), COLLECTIONS.forumThreads));
    const threadId = threadRef.id;

    const thread: ForumThread = {
      id: threadId,
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

    await setDoc(threadRef, thread);
    set((s) => ({ updateTrigger: s.updateTrigger + 1 }));
    return thread;
  },

  addReply: async (threadId, body) => {
    const author = currentAuthor();
    const now = new Date().toISOString();
    const replyRef = doc(collection(getDb(), COLLECTIONS.forumReplies));
    const replyId = replyRef.id;

    const reply: ForumReply = {
      id: replyId,
      threadId,
      authorUid: author.uid,
      authorName: author.name,
      authorAvatarUrl: author.avatarUrl,
      body,
      createdAt: now,
      helpfulCount: 0,
    };

    // Write the reply doc
    await setDoc(replyRef, reply);

    // Update parent thread's lastActivityAt and replyCount
    const threadRef = doc(getDb(), COLLECTIONS.forumThreads, threadId);
    await updateDoc(threadRef, {
      lastActivityAt: now,
      replyCount: increment(1),
    });

    set((s) => ({ updateTrigger: s.updateTrigger + 1 }));
    return reply;
  },

  toggleHelpfulThread: async (threadId) => {
    const threadRef = doc(getDb(), COLLECTIONS.forumThreads, threadId);
    await updateDoc(threadRef, {
      helpfulCount: increment(1),
    });
    set((s) => ({ updateTrigger: s.updateTrigger + 1 }));
  },

  toggleHelpfulReply: async (replyId) => {
    const replyRef = doc(getDb(), COLLECTIONS.forumReplies, replyId);
    await updateDoc(replyRef, {
      helpfulCount: increment(1),
    });
    set((s) => ({ updateTrigger: s.updateTrigger + 1 }));
  },
}));

