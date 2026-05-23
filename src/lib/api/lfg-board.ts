import type { GameId, LfgGuide, LfgPost } from "../types";
import { LFG_BOARD_SEED_GUIDES, LFG_BOARD_SEED_POSTS } from "../mock/lfg-board";
import { COLLECTIONS, getDb } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

let postsSeedingPromise: Promise<void> | null = null;

async function ensureLfgPostsSeeded(): Promise<void> {
  if (postsSeedingPromise) return postsSeedingPromise;
  postsSeedingPromise = (async () => {
    const snap = await getDocs(collection(getDb(), COLLECTIONS.lfgPosts));
    if (!snap.empty) return;
    const batch = writeBatch(getDb());
    for (const post of LFG_BOARD_SEED_POSTS) {
      batch.set(doc(getDb(), COLLECTIONS.lfgPosts, post.id), post);
    }
    await batch.commit();
  })();
  return postsSeedingPromise;
}

let guidesSeedingPromise: Promise<void> | null = null;

async function ensureLfgGuidesSeeded(): Promise<void> {
  if (guidesSeedingPromise) return guidesSeedingPromise;
  guidesSeedingPromise = (async () => {
    const snap = await getDocs(collection(getDb(), COLLECTIONS.lfgGuides));
    if (!snap.empty) return;
    const batch = writeBatch(getDb());
    for (const guide of LFG_BOARD_SEED_GUIDES) {
      batch.set(doc(getDb(), COLLECTIONS.lfgGuides, guide.id), guide);
    }
    await batch.commit();
  })();
  return guidesSeedingPromise;
}

export async function listLfgPosts(limit = 50): Promise<LfgPost[]> {
  await ensureLfgPostsSeeded();
  const q = query(
    collection(getDb(), COLLECTIONS.lfgPosts),
    orderBy("createdAt", "desc"),
    fsLimit(limit),
  );
  const snap = await getDocs(q);
  const out: LfgPost[] = [];
  snap.forEach((d) => out.push(d.data() as LfgPost));
  return out;
}

export interface CreateLfgPostInput {
  gameId: GameId;
  game: string;
  author: string;
  type: string;
  desc: string;
  friend: string;
  tags: string[];
}

export async function createLfgPost(input: CreateLfgPostInput): Promise<LfgPost> {
  await ensureLfgPostsSeeded();
  const post: LfgPost = {
    id: newId("lfg"),
    ...input,
    createdAt: new Date().toISOString(),
  };
  const batch = writeBatch(getDb());
  batch.set(doc(getDb(), COLLECTIONS.lfgPosts, post.id), post);
  await batch.commit();
  return post;
}

export async function listLfgGuides(): Promise<LfgGuide[]> {
  await ensureLfgGuidesSeeded();
  const snap = await getDocs(collection(getDb(), COLLECTIONS.lfgGuides));
  const out: LfgGuide[] = [];
  snap.forEach((d) => out.push(d.data() as LfgGuide));
  return out.sort((a, b) => b.votes - a.votes);
}

export interface CreateLfgGuideInput {
  game: string;
  title: string;
  author: string;
  kind: LfgGuide["kind"];
}

export async function createLfgGuide(input: CreateLfgGuideInput): Promise<LfgGuide> {
  await ensureLfgGuidesSeeded();
  const guide: LfgGuide = {
    id: newId("guide"),
    ...input,
    votes: 0,
  };
  const batch = writeBatch(getDb());
  batch.set(doc(getDb(), COLLECTIONS.lfgGuides, guide.id), guide);
  await batch.commit();
  return guide;
}
