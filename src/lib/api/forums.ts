import type { ForumReply, ForumThread, GameId } from "../types";
import { SEED_REPLIES, SEED_THREADS } from "../mock/forums";
import { getDb, COLLECTIONS } from "../firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  writeBatch,
  query,
  where,
  limit,
  orderBy,
} from "firebase/firestore";
import { listGames } from "./games";

let seedingPromise: Promise<void> | null = null;

export async function ensureForumsSeeded(): Promise<void> {
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    const colRef = collection(getDb(), COLLECTIONS.forumThreads);
    const snap = await getDocs(query(colRef, limit(1)));
    if (!snap.empty) {
      return;
    }

    console.log("dw_forum_threads is empty, auto-seeding forums...");

    // Seed threads
    const threadsBatch = writeBatch(getDb());
    for (const t of SEED_THREADS) {
      const docRef = doc(getDb(), COLLECTIONS.forumThreads, t.id);
      threadsBatch.set(docRef, t);
    }
    await threadsBatch.commit();

    // Seed replies
    // Write in chunks to respect Firestore 500-limit per batch
    const replyChunks: ForumReply[][] = [];
    const chunkSize = 300;
    for (let i = 0; i < SEED_REPLIES.length; i += chunkSize) {
      replyChunks.push(SEED_REPLIES.slice(i, i + chunkSize));
    }

    for (const chunk of replyChunks) {
      const batch = writeBatch(getDb());
      for (const r of chunk) {
        const docRef = doc(getDb(), COLLECTIONS.forumReplies, r.id);
        batch.set(docRef, r);
      }
      await batch.commit();
    }

    console.log("Successfully seeded forum threads and replies!");
  })();

  return seedingPromise;
}

export async function listThreads(gameId: GameId): Promise<ForumThread[]> {
  await ensureForumsSeeded();
  const q = query(
    collection(getDb(), COLLECTIONS.forumThreads),
    where("gameId", "==", gameId)
  );
  const snap = await getDocs(q);
  const threads: ForumThread[] = [];
  snap.forEach((d) => {
    threads.push(d.data() as ForumThread);
  });

  // Sort: sticky first, then lastActivityAt desc.
  return threads.sort((a, b) => {
    if (a.sticky && !b.sticky) return -1;
    if (!a.sticky && b.sticky) return 1;
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
  });
}

export async function getThread(threadId: string): Promise<ForumThread | undefined> {
  await ensureForumsSeeded();
  const docRef = doc(getDb(), COLLECTIONS.forumThreads, threadId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return undefined;
  return snap.data() as ForumThread;
}

export async function listReplies(threadId: string): Promise<ForumReply[]> {
  await ensureForumsSeeded();
  const q = query(
    collection(getDb(), COLLECTIONS.forumReplies),
    where("threadId", "==", threadId)
  );
  const snap = await getDocs(q);
  const replies: ForumReply[] = [];
  snap.forEach((d) => {
    replies.push(d.data() as ForumReply);
  });

  return replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function listRecentThreadsCrossGame(limitNum = 20): Promise<ForumThread[]> {
  await ensureForumsSeeded();
  const games = await listGames();
  const liveGameIds = new Set(games.filter((g) => !g.comingSoon).map((g) => g.id));

  // Query recent threads
  const q = query(
    collection(getDb(), COLLECTIONS.forumThreads),
    orderBy("lastActivityAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  const threads: ForumThread[] = [];
  snap.forEach((d) => {
    threads.push(d.data() as ForumThread);
  });

  return threads
    .filter((t) => liveGameIds.has(t.gameId))
    .slice(0, limitNum);
}
