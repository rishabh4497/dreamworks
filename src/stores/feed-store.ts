import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SocialPost, SocialReply, GameId } from "@/lib/types";
import { useAuthStore } from "./auth-store";
import { SEED_POSTS } from "@/lib/mock/feed";

interface FeedStore {
  posts: SocialPost[];
  createPost: (content: string, gameId?: GameId, imageUrl?: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleRepostPost: (postId: string) => void;
  addReply: (postId: string, content: string) => void;
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

export const useFeedStore = create<FeedStore>()(
  persist(
    (set) => ({
      posts: SEED_POSTS,
      createPost: (content, gameId, imageUrl) => {
        const author = currentAuthor();
        const now = new Date().toISOString();
        const newPost: SocialPost = {
          id: newId("post"),
          authorUid: author.uid,
          authorName: author.name,
          authorHandle: author.handle,
          authorAvatarUrl: author.avatarUrl,
          authorAvatarOptions: author.avatarOptions,
          content,
          imageUrl,
          gameId,
          createdAt: now,
          likes: 0,
          likedByMe: false,
          reposts: 0,
          repostedByMe: false,
          replies: [],
        };
        set((s) => ({ posts: [newPost, ...s.posts] }));
      },
      toggleLikePost: (postId) => {
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id === postId) {
              const liked = !p.likedByMe;
              return {
                ...p,
                likedByMe: liked,
                likes: p.likes + (liked ? 1 : -1),
              };
            }
            return p;
          }),
        }));
      },
      toggleRepostPost: (postId) => {
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id === postId) {
              const reposted = !p.repostedByMe;
              return {
                ...p,
                repostedByMe: reposted,
                reposts: p.reposts + (reposted ? 1 : -1),
              };
            }
            return p;
          }),
        }));
      },
      addReply: (postId, content) => {
        const author = currentAuthor();
        const now = new Date().toISOString();
        const newReply: SocialReply = {
          id: newId("reply"),
          authorUid: author.uid,
          authorName: author.name,
          authorHandle: author.handle,
          authorAvatarUrl: author.avatarUrl,
          authorAvatarOptions: author.avatarOptions,
          content,
          createdAt: now,
          likes: 0,
          likedByMe: false,
        };
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                replies: [...p.replies, newReply],
              };
            }
            return p;
          }),
        }));
      },
    }),
    {
      name: "dreamworks-social-feed",
    },
  ),
);
