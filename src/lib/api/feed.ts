import type { GameId, PostImagePreset, SocialPost, SocialReply } from "../types";
import { PRESET_POST_IMAGES, SEED_POSTS } from "../mock/feed";
import { wait } from "./_delay";
import { getDb } from "../firebase";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as fsLimit,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

const FEED_COL = "dw_feed";

let seedingPromise: Promise<void> | null = null;

async function ensureFeedSeeded(): Promise<void> {
  if (seedingPromise) return seedingPromise;
  seedingPromise = (async () => {
    const snap = await getDocs(collection(getDb(), FEED_COL));
    if (!snap.empty) return;
    const batch = writeBatch(getDb());
    for (const post of SEED_POSTS) {
      batch.set(doc(getDb(), FEED_COL, post.id), normalizePostForWrite(post));
    }
    await batch.commit();
  })();
  return seedingPromise;
}

function normalizePostForWrite(post: SocialPost): Record<string, unknown> {
  return {
    ...post,
    likedBy: [] as string[],
    repostedBy: [] as string[],
    replies: post.replies ?? [],
  };
}

interface RawPost extends SocialPost {
  likedBy?: string[];
  repostedBy?: string[];
}

function applyViewerView(raw: RawPost, viewerUid: string | null): SocialPost {
  const likedBy = raw.likedBy ?? [];
  const repostedBy = raw.repostedBy ?? [];
  return {
    ...raw,
    likedByMe: viewerUid ? likedBy.includes(viewerUid) : false,
    repostedByMe: viewerUid ? repostedBy.includes(viewerUid) : false,
    replies: raw.replies ?? [],
  };
}

export async function listFeedEntries(
  viewerUid: string | null,
  limit = 50,
): Promise<SocialPost[]> {
  await ensureFeedSeeded();
  const q = query(
    collection(getDb(), FEED_COL),
    orderBy("createdAt", "desc"),
    fsLimit(limit),
  );
  const snap = await getDocs(q);
  const out: SocialPost[] = [];
  snap.forEach((d) => out.push(applyViewerView(d.data() as RawPost, viewerUid)));
  return out;
}

export interface ComposePostInput {
  authorUid: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string;
  authorAvatarOptions?: SocialPost["authorAvatarOptions"];
  content: string;
  gameId?: GameId;
  imageUrl?: string;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function composePost(input: ComposePostInput): Promise<SocialPost> {
  await ensureFeedSeeded();
  const post: SocialPost = {
    id: newId("post"),
    authorUid: input.authorUid,
    authorName: input.authorName,
    authorHandle: input.authorHandle,
    authorAvatarUrl: input.authorAvatarUrl,
    authorAvatarOptions: input.authorAvatarOptions,
    content: input.content,
    imageUrl: input.imageUrl,
    gameId: input.gameId,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedByMe: false,
    reposts: 0,
    repostedByMe: false,
    replies: [],
  };
  const batch = writeBatch(getDb());
  batch.set(doc(getDb(), FEED_COL, post.id), normalizePostForWrite(post));
  await batch.commit();
  return post;
}

export async function toggleLikePost(postId: string, userId: string): Promise<boolean> {
  const ref = doc(getDb(), FEED_COL, postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data() as RawPost;
  const alreadyLiked = (data.likedBy ?? []).includes(userId);
  await updateDoc(ref, {
    likedBy: alreadyLiked ? arrayRemove(userId) : arrayUnion(userId),
    likes: increment(alreadyLiked ? -1 : 1),
  });
  return !alreadyLiked;
}

export async function toggleRepostPost(postId: string, userId: string): Promise<boolean> {
  const ref = doc(getDb(), FEED_COL, postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data() as RawPost;
  const alreadyReposted = (data.repostedBy ?? []).includes(userId);
  await updateDoc(ref, {
    repostedBy: alreadyReposted ? arrayRemove(userId) : arrayUnion(userId),
    reposts: increment(alreadyReposted ? -1 : 1),
  });
  return !alreadyReposted;
}

export interface AddReplyInput {
  postId: string;
  authorUid: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string;
  authorAvatarOptions?: SocialReply["authorAvatarOptions"];
  content: string;
}

export async function addReply(input: AddReplyInput): Promise<SocialReply> {
  const reply: SocialReply = {
    id: newId("reply"),
    authorUid: input.authorUid,
    authorName: input.authorName,
    authorHandle: input.authorHandle,
    authorAvatarUrl: input.authorAvatarUrl,
    authorAvatarOptions: input.authorAvatarOptions,
    content: input.content,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedByMe: false,
  };
  const ref = doc(getDb(), FEED_COL, input.postId);
  await updateDoc(ref, { replies: arrayUnion(reply) });
  return reply;
}

export async function listPostImagePresets(): Promise<PostImagePreset[]> {
  await wait();
  return PRESET_POST_IMAGES;
}
