import { create } from "zustand";
import type { GameId, SocialPost } from "@/lib/types";
import { useAuthStore } from "./auth-store";
import {
  addReply as apiAddReply,
  composePost,
  listFeedEntries,
  toggleLikePost,
  toggleRepostPost,
} from "@/lib/api/feed";

interface FeedStore {
  posts: SocialPost[];
  loading: boolean;
  loaded: boolean;
  hydrate: () => Promise<void>;
  createPost: (content: string, gameId?: GameId, imageUrl?: string) => Promise<void>;
  toggleLikePost: (postId: string) => Promise<void>;
  toggleRepostPost: (postId: string) => Promise<void>;
  addReply: (postId: string, content: string) => Promise<void>;
}

function currentAuthor() {
  const profile = useAuthStore.getState().profile;
  if (profile) {
    return {
      uid: profile.uid,
      name: profile.displayName,
      handle: `@${profile.displayName.toLowerCase().replace(/\s+/g, "")}`,
      avatarUrl: profile.avatarUrl,
      avatarOptions: profile.avatarOptions,
    };
  }
  return {
    uid: "anonymous",
    name: "Guest",
    handle: "@guest",
    avatarUrl: "https://picsum.photos/seed/anonymous/96/96",
    avatarOptions: undefined,
  };
}

export const useFeedStore = create<FeedStore>()((set, get) => ({
  posts: [],
  loading: false,
  loaded: false,
  hydrate: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const viewerUid = useAuthStore.getState().profile?.uid ?? null;
      const posts = await listFeedEntries(viewerUid);
      set({ posts, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  createPost: async (content, gameId, imageUrl) => {
    const author = currentAuthor();
    const newPost = await composePost({
      authorUid: author.uid,
      authorName: author.name,
      authorHandle: author.handle,
      authorAvatarUrl: author.avatarUrl,
      authorAvatarOptions: author.avatarOptions,
      content,
      gameId,
      imageUrl,
    });
    set((s) => ({ posts: [newPost, ...s.posts] }));
  },
  toggleLikePost: async (postId) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
          : p,
      ),
    }));
    try {
      await toggleLikePost(postId, profile.uid);
    } catch {
      // Roll back optimistic update on failure
      set((s) => ({
        posts: s.posts.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
            : p,
        ),
      }));
    }
  },
  toggleRepostPost: async (postId) => {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              repostedByMe: !p.repostedByMe,
              reposts: p.reposts + (p.repostedByMe ? -1 : 1),
            }
          : p,
      ),
    }));
    try {
      await toggleRepostPost(postId, profile.uid);
    } catch {
      set((s) => ({
        posts: s.posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                repostedByMe: !p.repostedByMe,
                reposts: p.reposts + (p.repostedByMe ? -1 : 1),
              }
            : p,
        ),
      }));
    }
  },
  addReply: async (postId, content) => {
    const author = currentAuthor();
    const reply = await apiAddReply({
      postId,
      authorUid: author.uid,
      authorName: author.name,
      authorHandle: author.handle,
      authorAvatarUrl: author.avatarUrl,
      authorAvatarOptions: author.avatarOptions,
      content,
    });
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId ? { ...p, replies: [...p.replies, reply] } : p,
      ),
    }));
  },
}));
