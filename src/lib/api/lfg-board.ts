import type { GameId, LfgGuide, LfgPost } from "../types";
import { COLLECTIONS, getDb } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listLfgPosts(limit = 50): Promise<LfgPost[]> {
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
  const post: LfgPost = {
    id: newId("lfg"),
    ...input,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(getDb(), COLLECTIONS.lfgPosts, post.id), post);
  return post;
}

export async function listLfgGuides(): Promise<LfgGuide[]> {
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
  const guide: LfgGuide = {
    id: newId("guide"),
    ...input,
    votes: 0,
  };
  await setDoc(doc(getDb(), COLLECTIONS.lfgGuides, guide.id), guide);
  return guide;
}
